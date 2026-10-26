'use strict';

// BE-09: only normal social Post JSON create/edit. Private documents use
// multipart /api/documents; privileged/model fields must not pass through here.
const { createError } = require('../middlewares/error.middleware');

const CREATE_FIELDS = new Set([
  'title', 'content', 'post_type', 'subject', 'tags', 'price',
]);
const EDIT_FIELDS = new Set(['title', 'content', 'subject', 'tags', 'status']);
const MAX_CONTENT = 10000;
const MAX_TAGS = 12;
const MAX_TAG = 40;

const reject = (message) => { throw createError(message, 422); };
function assertFields(payload, allowlist) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
      !Object.keys(payload).length ||
      Object.keys(payload).some(key => !allowlist.has(key))) {
    reject('Trường dữ liệu bài viết không hợp lệ.');
  }
}
function title(value) {
  if (typeof value !== 'string') reject('Tiêu đề không hợp lệ.');
  const result = value.trim();
  if (!result || result.length > 300) reject('Tiêu đề phải có từ 1 đến 300 ký tự.');
  return result;
}
function optionalText(value, field, max) {
  if (value === null) return null;
  if (typeof value !== 'string') reject(field + ' phải là chuỗi hoặc null.');
  const result = value.trim();
  if (result.length > max) reject(field + ' vượt quá giới hạn.');
  return result || null;
}
function tags(value) {
  if (value === null) return null;
  if (!Array.isArray(value) || value.length > MAX_TAGS ||
      value.some(tag => typeof tag !== 'string' ||
        !tag.trim() || tag.trim().length > MAX_TAG)) {
    reject('Tags phải là mảng tối đa 12 chuỗi, mỗi chuỗi 1 đến 40 ký tự.');
  }
  return value.map(tag => tag.trim());
}
function validateFields(payload, allowed) {
  assertFields(payload, allowed);
  const data = {};
  if (Object.hasOwn(payload, 'title')) data.title = title(payload.title);
  if (Object.hasOwn(payload, 'content')) {
    data.content = optionalText(payload.content, 'content', MAX_CONTENT);
  }
  if (Object.hasOwn(payload, 'subject')) {
    data.subject = optionalText(payload.subject, 'subject', 200);
  }
  if (Object.hasOwn(payload, 'tags')) data.tags = tags(payload.tags);
  return data;
}
function validateCreatePost(payload) {
  const data = validateFields(payload, CREATE_FIELDS);
  if (!Object.hasOwn(payload, 'title')) reject('Bắt buộc nhập tiêu đề.');
  // Backwards compatible: missing type defaults to a question, 0 price is
  // tolerated but never persisted from untrusted input.
  const type = payload.post_type === undefined ? 'question' : payload.post_type;
  if (type !== 'question' && type !== 'discussion') {
    reject('Chỉ được tạo bài hỏi đáp hoặc thảo luận qua API này.');
  }
  if (payload.price !== undefined && (typeof payload.price === 'boolean' ||
      ![0, '0', '0.00'].includes(payload.price))) {
    reject('Không hỗ trợ bài viết trả phí.');
  }
  return { ...data, post_type: type, price: 0 };
}
function validateEditPost(payload) {
  const data = validateFields(payload, EDIT_FIELDS);
  if (Object.hasOwn(payload, 'status')) {
    // No role may restore a hidden/deleted Post through the generic edit API.
    // ADR-013 has no approved "unhide" transition (Admin included).
    if (payload.status !== 'hidden' && payload.status !== 'deleted') {
      reject('Trạng thái bài viết không hợp lệ.');
    }
    data.status = payload.status;
  }
  return data;
}
module.exports = { validateCreatePost, validateEditPost };
