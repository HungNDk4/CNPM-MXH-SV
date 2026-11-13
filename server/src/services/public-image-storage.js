'use strict';
// Public avatars/images and private PDF files require SEPARATE Blob stores.
const crypto = require('node:crypto');
function isCloud() {
  const driver = process.env.PUBLIC_IMAGE_STORAGE_DRIVER || 'filesystem';
  if (!['filesystem', 'vercel-blob'].includes(driver)) throw new Error('Unsupported PUBLIC_IMAGE_STORAGE_DRIVER');
  return driver === 'vercel-blob';
}
function validateConfig() {
  if (isCloud()) {
    if (!process.env.PUBLIC_IMAGE_BLOB_READ_WRITE_TOKEN) throw new Error('Public image Blob token missing');
    require('@vercel/blob');
  } else if (process.env.NODE_ENV === 'production' &&
             process.env.PUBLIC_IMAGES_PERSISTENT !== 'true') {
    throw new Error('Production images require a public Blob store or genuinely persistent volume');
  }
}
function validPublicUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' &&
      /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(parsed.hostname) &&
      /^\/(?:avatars|post-images)\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/.test(parsed.pathname) &&
      !parsed.search && !parsed.hash;
  } catch { return false; }
}
async function save({ category, buffer, ext, mimeType }) {
  validateConfig();
  if (!isCloud()) throw new Error('Blob image driver not enabled');
  if (!['avatars', 'post-images'].includes(category) ||
      !['.jpg', '.png', '.webp'].includes(ext) ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType) ||
      !Buffer.isBuffer(buffer) || buffer.length < 1 || buffer.length > 5 * 1024 * 1024) {
    throw new Error('Invalid public image payload');
  }
  const token = process.env.PUBLIC_IMAGE_BLOB_READ_WRITE_TOKEN;
  const sdk = require('@vercel/blob');
  const key = category + '/' + crypto.randomUUID() + ext;
  let stored;
  try {
    stored = await sdk.put(key, buffer, {
      access: 'public', token, contentType: mimeType, addRandomSuffix: false,
    });
  } catch {
    await sdk.del(key, { token }).catch(() => {});
    throw new Error('Public image provider unavailable');
  }
  if (stored?.pathname !== key || !validPublicUrl(stored?.url)) {
    await sdk.del(key, { token }).catch(() => {});
    throw new Error('Unexpected public image store response');
  }
  return { url: stored.url, storageKey: key, targetPath: null };
}
async function remove(url) {
  if (!validPublicUrl(url)) return;
  validateConfig();
  if (!isCloud()) throw new Error('Public Blob driver not configured for removal');
  await require('@vercel/blob').del(url, { token: process.env.PUBLIC_IMAGE_BLOB_READ_WRITE_TOKEN });
}
module.exports = { isCloud, validateConfig, validPublicUrl, save, remove };