'use strict';
const path = require('node:path');
const crypto = require('node:crypto');
const { sequelize, Post, DocumentFile } = require('../models');
const { createError } = require('../middlewares/error.middleware');
const { toSafePost } = require('../utils/post.dto');
const storage = require('../services/private-document-storage');

const MAX_BYTES = 10 * 1024 * 1024;
function originalFilename(value) {
  const clean = String(value || 'document.pdf').split(/[\\/]/).pop()
    .replace(/[\x00-\x1f\x7f<>:"|?*]/g, '_').slice(0, 180);
  return clean && /\.pdf$/i.test(clean) ? clean : 'document.pdf';
}
function validateRequest(req) {
  const file = req.file;
  if (!file) throw createError('Bắt buộc tải lên đúng một file PDF.', 422);
  if (!/\.pdf$/i.test(String(file.originalname || '')) ||
      file.mimetype !== 'application/pdf' ||
      !file.buffer || file.buffer.length < 1 ||
      file.buffer.length > MAX_BYTES ||
      !file.buffer.subarray(0, 5).equals(Buffer.from('%PDF-')) ||
      !file.buffer.subarray(-1024).includes(Buffer.from('%%EOF'))) {
    throw createError('File không phải PDF hợp lệ.', 415);
  }
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  if (!title || title.length > 300) throw createError('Tiêu đề không hợp lệ.', 422);
  const description = req.body.description;
  if (description !== undefined &&
      (typeof description !== 'string' || description.length > 5000)) {
    throw createError('Mô tả không hợp lệ.', 422);
  }
  const subject = req.body.subject;
  if (subject !== undefined &&
      (typeof subject !== 'string' || subject.length > 200)) {
    throw createError('Môn học không hợp lệ.', 422);
  }
  let tags = null;
  if (req.body.tags !== undefined) {
    try { tags = JSON.parse(req.body.tags); } catch { throw createError('Tags phải là JSON array.', 422); }
    if (!Array.isArray(tags) || tags.length > 12 ||
        tags.some(x => typeof x !== 'string' || !x.trim() || x.length > 40)) {
      throw createError('Danh sách tags không hợp lệ.', 422);
    }
  }
  return { title, content: description ?? null, subject: subject ?? null, tags, file };
}

async function uploadDocument(req, res, next) {
  let key;
  try {
    const { title, content, subject, tags, file } = validateRequest(req);
    // Create private bytes first. Database transaction makes Post and metadata
    // visible together; any failure compensates by removing the new object.
    key = await storage.save(file.buffer);
    const post = await sequelize.transaction(async transaction => {
      const row = await Post.create({
        user_id: req.user.id,
        title, content, subject, tags,
        post_type: 'document', price: 0, status: 'active',
      }, { transaction });
      await DocumentFile.create({
        post_id: row.id, storage_key: key,
        original_name: originalFilename(file.originalname),
        mime_type: 'application/pdf',
        size_bytes: file.buffer.length,
        sha256: crypto.createHash('sha256').update(file.buffer).digest('hex'),
      }, { transaction });
      return row;
    });
    key = null; // now owned by persisted private DocumentFile row
    return res.status(201).json({ success: true, message: 'Đăng tài liệu thành công.', data: toSafePost(post) });
  } catch (error) {
    if (key) {
      try { await storage.remove(key); } catch (cleanupError) {
        console.error('Private blob cleanup failed; manual reconciliation needed', cleanupError.message);
      }
    }
    next(error);
  }
}

module.exports = { uploadDocument };
