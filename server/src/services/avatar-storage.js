'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');
const { createError } = require('../middlewares/error.middleware');

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
const uploadDir = path.resolve(__dirname, '../../uploads/avatars');

/**
 * Validate avatar buffer and magic bytes.
 */
function validateAvatarBuffer(file) {
  if (!file || !file.buffer || !Buffer.isBuffer(file.buffer)) {
    throw createError('File ảnh đại diện không hợp lệ.', 422);
  }

  if (file.buffer.length < 24) {
    throw createError('Dữ liệu ảnh không đủ kích thước tối thiểu hoặc bị hỏng.', 422);
  }

  if (file.buffer.length > MAX_AVATAR_BYTES) {
    throw createError('Ảnh đại diện không được vượt quá 2 MB.', 413);
  }

  const buf = file.buffer;
  let ext = '';
  let mimeType = '';

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    ext = '.jpg';
    mimeType = 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A + IHDR chunk header at offset 12..16
  else if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a &&
    buf.subarray(12, 16).toString('ascii') === 'IHDR'
  ) {
    ext = '.png';
    mimeType = 'image/png';
  }
  // WEBP: RIFF .... WEBP + VP8 / VP8L / VP8X chunk header at offset 12..16
  else if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP' &&
    ['VP8 ', 'VP8L', 'VP8X'].includes(buf.subarray(12, 16).toString('ascii'))
  ) {
    ext = '.webp';
    mimeType = 'image/webp';
  } else {
    throw createError('Định dạng ảnh không được hỗ trợ hoặc file bị hỏng. Chỉ chấp nhận JPG, PNG hoặc WebP hợp lệ.', 415);
  }

  return { ext, mimeType, sizeBytes: buf.length };
}

/**
 * Save single avatar file to uploads/avatars directory.
 */
async function saveAvatar(file) {
  const { ext } = validateAvatarBuffer(file);
  await fs.mkdir(uploadDir, { recursive: true });

  const storageKey = crypto.randomUUID() + ext;
  const targetPath = path.join(uploadDir, storageKey);

  await fs.writeFile(targetPath, file.buffer, { flag: 'wx' });

  return {
    avatarUrl: `/uploads/avatars/${storageKey}`,
    storageKey,
    targetPath,
  };
}

/**
 * Safely delete an existing avatar file if stored locally in uploads/avatars.
 * Guards against path traversal and external URLs.
 */
async function deleteAvatarFile(avatarUrl) {
  if (!avatarUrl || typeof avatarUrl !== 'string') return;
  if (!avatarUrl.startsWith('/uploads/avatars/')) return;

  const filename = path.basename(avatarUrl);
  // Never delete shared default or placeholder assets
  if (filename.startsWith('default') || filename.startsWith('placeholder')) return;
  // Prevent any weird characters or path traversal
  if (!/^[a-zA-Z0-9_\-.]+\.(jpg|png|webp)$/i.test(filename)) return;

  const resolved = path.resolve(uploadDir, filename);
  // Ensure the resolved path resides strictly within uploadDir
  if (!resolved.startsWith(uploadDir)) return;

  try {
    await fs.unlink(resolved);
  } catch (err) {
    // Silently ignore if file doesn't exist
    if (err.code !== 'ENOENT') {
      console.warn(`[AvatarStorage] Không thể xóa avatar cũ: ${resolved}`, err.message);
    }
  }
}

const uploadAvatarMulter = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AVATAR_BYTES,
    files: 1,
  },
}).single('avatar');

function parseAvatarUpload(req, res, next) {
  uploadAvatarMulter(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(createError('Ảnh đại diện không được vượt quá 2 MB.', 413));
    }
    if (error instanceof multer.MulterError) {
      return next(createError('Lỗi tải tệp ảnh đại diện: ' + error.code, 422));
    }
    return next(error);
  });
}

module.exports = {
  MAX_AVATAR_BYTES,
  uploadDir,
  validateAvatarBuffer,
  saveAvatar,
  deleteAvatarFile,
  parseAvatarUpload,
};

