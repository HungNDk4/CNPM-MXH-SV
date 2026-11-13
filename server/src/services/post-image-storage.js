'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { createError } = require('../middlewares/error.middleware');
const { PostImage } = require('../models');
const publicImages = require('./public-image-storage');

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB per image
const MAX_IMAGES_PER_POST = 4;
const uploadDir = path.resolve(__dirname, '../../uploads/post-images');

/**
 * Validate image buffer and magic bytes.
 */
function validateImageBuffer(file) {
  if (!file || !file.buffer || !Buffer.isBuffer(file.buffer)) {
    throw createError('File ảnh không hợp lệ.', 422);
  }

  if (file.buffer.length < 8) {
    throw createError('Dữ liệu ảnh không đủ kích thước tối thiểu.', 422);
  }

  if (file.buffer.length > MAX_IMAGE_BYTES) {
    throw createError('Mỗi ảnh không được vượt quá 5 MB.', 413);
  }

  const buf = file.buffer;
  let ext = '';
  let mimeType = '';

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    ext = '.jpg';
    mimeType = 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  else if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    ext = '.png';
    mimeType = 'image/png';
  }
  // WEBP: RIFF .... WEBP
  else if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    ext = '.webp';
    mimeType = 'image/webp';
  } else {
    throw createError('Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận JPG, PNG hoặc WebP.', 415);
  }

  const originalName = String(file.originalname || ('image' + ext))
    .split(/[\\/]/).pop()
    .replace(/[\x00-\x1f\x7f<>:"|?*]/g, '_')
    .slice(0, 255);

  return { ext, mimeType, originalName, sizeBytes: buf.length };
}

/**
 * Save validated post images to storage and database.
 */
async function savePostImages(files, postId, transaction) {
  if (!Array.isArray(files) || files.length === 0) return [];
  if (files.length > MAX_IMAGES_PER_POST) {
    throw createError('Tối đa 4 ảnh cho mỗi bài viết.', 422);
  }

  await fs.mkdir(uploadDir, { recursive: true });

  const writtenFiles = [];
  const records = [];

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { ext, mimeType, originalName, sizeBytes } = validateImageBuffer(file);
      const storageKey = crypto.randomUUID() + ext;
      let stored;
      if (publicImages.isCloud()) {
        stored = await publicImages.save({
          category: 'post-images', buffer: file.buffer, ext, mimeType,
        });
      } else {
        const targetPath = path.join(uploadDir, storageKey);
        await fs.writeFile(targetPath, file.buffer, { flag: 'wx' });
        stored = { url: `/uploads/post-images/${storageKey}`, storageKey, targetPath };
      }
      writtenFiles.push(stored);
      const imageUrl = stored.url;
      const row = await PostImage.create(
        {
          post_id: postId,
          image_url: imageUrl,
          storage_key: stored.storageKey,
          original_name: originalName,
          mime_type: mimeType,
          size_bytes: sizeBytes,
          sort_order: i,
        },
        { transaction }
      );
      records.push(row);
    }
    return records;
  } catch (error) {
    // Compensating rollback: remove any files written to disk
    await Promise.all(
      writtenFiles.map(async ({ targetPath, url }) => {
        try { if (targetPath) await fs.unlink(targetPath); else await publicImages.remove(url); }
        catch { /* best-effort cleanup */ }
      })
    );
    throw error;
  }
}

module.exports = {
  validateImageBuffer,
  savePostImages,
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_POST,
};

