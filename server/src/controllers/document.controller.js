'use strict';
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
    try {
      key = await storage.save(file.buffer);
    } catch (error) {
      console.error('Private PDF upload storage failed');
      throw createError('Không thể lưu tài liệu lúc này.', 503);
    }
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

// Auth middleware already verifies JWT signature, expiry and active DB user.
// Recheck Post state on every request; private files are never served via static URLs.
async function downloadDocument(req, res, next) {
  try {
    const postId = String(req.params.postId || '');
    if (!/^[1-9]\d*$/.test(postId)) throw createError('Tài liệu không tồn tại.', 404);
    const post = await Post.findByPk(Number(postId));
    if (!post || post.post_type !== 'document' ||
        post.status !== 'active' || Number(post.price) !== 0) {
      throw createError('Tài liệu không tồn tại.', 404);
    }
    const entry = await DocumentFile.findOne({ where: { post_id: post.id } });
    if (!entry) throw createError('Tài liệu không tồn tại.', 404);

    // Local filesystem or private Blob; only internal UUID key comes from DB.
    // No provider URL/token is ever returned through the PDF endpoint.
    let attachment;
    try {
      attachment = await storage.openRead(entry.storage_key);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ELOOP') {
        throw createError('Tài liệu không khả dụng.', 404);
      }
      console.error('Private PDF provider unavailable');
      throw createError('Không thể tải tài liệu lúc này.', 503);
    }
    if (attachment.size !== entry.size_bytes) {
      attachment.stream.destroy();
      throw createError('Tài liệu không khả dụng.', 404);
    }

    const filename = String(entry.original_name || 'document.pdf')
      .replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 150);
    const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : 'document.pdf';
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': String(attachment.size),
      'Content-Disposition': 'attachment; filename="' + safeName + '"',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    const stream = attachment.stream;
    stream.on('error', err => {
      if (!res.headersSent) next(err);
      else res.destroy(err);
    });
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
}

module.exports = { uploadDocument, downloadDocument };
