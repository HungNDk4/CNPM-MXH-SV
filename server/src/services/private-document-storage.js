'use strict';
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Readable } = require('node:stream');

const FILE_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i;
const MAX_BYTES = 10 * 1024 * 1024;
const defaultDir = path.resolve(__dirname, '../../private-documents');

function driver() {
  const value = process.env.DOCUMENT_STORAGE_DRIVER || 'filesystem';
  if (!['filesystem', 'vercel-blob'].includes(value)) {
    throw new Error('Unsupported DOCUMENT_STORAGE_DRIVER');
  }
  return value;
}

function root() {
  const value = process.env.DOCUMENT_PRIVATE_DIR;
  if (process.env.NODE_ENV === 'production' &&
      (!value || !path.isAbsolute(value) || process.env.DOCUMENT_STORAGE_PERSISTENT !== 'true')) {
    throw new Error('Private PDF storage requires a reviewed absolute persistent DOCUMENT_PRIVATE_DIR');
  }
  const directory = path.resolve(value || defaultDir);
  const uploads = path.resolve(__dirname, '../../uploads');
  if (directory === uploads || directory.startsWith(uploads + path.sep)) {
    throw new Error('Private document directory cannot be inside public legacy uploads');
  }
  return directory;
}

function filePath(key) {
  if (typeof key !== 'string' || !FILE_KEY.test(key)) {
    throw new Error('Invalid internal document key');
  }
  return path.join(root(), key);
}

function createBlobAdapter(sdk, token) {
  if (!token || !sdk || !['put', 'get', 'del'].every(name => typeof sdk[name] === 'function')) {
    throw new Error('Private Blob SDK/token missing');
  }
  const assertKey = key => {
    if (typeof key !== 'string' || !FILE_KEY.test(key)) {
      throw new Error('Invalid internal document key');
    }
  };
  return {
    async save(buffer) {
      if (!Buffer.isBuffer(buffer) || buffer.length < 1 || buffer.length > MAX_BYTES) {
        throw new Error('Invalid PDF storage size');
      }
      const key = crypto.randomUUID() + '.pdf';
      let result;
      try {
        result = await sdk.put(key, new Blob([buffer], { type: 'application/pdf' }), {
          access: 'private', token, contentType: 'application/pdf',
          addRandomSuffix: false, cacheControlMaxAge: 60,
        });
      } catch {
        // A timeout may happen after remote persistence. Attempt compensating cleanup.
        await sdk.del(key, { token }).catch(() => {});
        throw new Error('Private Blob upload unavailable');
      }
      // Guard against accidentally connecting a *public* store.
      if (result?.pathname !== key || !result.url?.includes('.private.blob.vercel-storage.com/')) {
        await sdk.del(key, { token }).catch(() => {});
        throw new Error('Blob provider did not confirm private storage');
      }
      return key; // never expose provider URLs or secret tokens to clients
    },
    async remove(key) {
      assertKey(key);
      await sdk.del(key, { token });
    },
    async openRead(key) {
      assertKey(key);
      const result = await sdk.get(key, { access: 'private', token });
      if (!result || result.statusCode !== 200 || !result.stream) {
        const err = new Error('Private PDF missing');
        err.code = 'ENOENT';
        throw err;
      }
      const size = result.blob?.size;
      if (!Number.isSafeInteger(size) || size < 1 || size > MAX_BYTES) {
        if (typeof result.stream.cancel === 'function') {
          await result.stream.cancel().catch(() => {});
        }
        throw new Error('Private Blob size unverifiable');
      }
      return { size, stream: Readable.fromWeb(result.stream) };
    },
  };
}

function validateConfig() {
  if (driver() === 'filesystem') {
    root();
    return;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('Private Blob token missing (server-only)');
  }
  require('@vercel/blob'); // fail before HTTP listen if package is absent
}
function cloud() {
  validateConfig();
  return createBlobAdapter(require('@vercel/blob'), process.env.BLOB_READ_WRITE_TOKEN);
}

async function save(buffer) {
  if (driver() === 'vercel-blob') return cloud().save(buffer);
  if (!Buffer.isBuffer(buffer) || buffer.length < 1 || buffer.length > MAX_BYTES) {
    throw new Error('Invalid PDF storage size');
  }
  const directory = root();
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const key = crypto.randomUUID() + '.pdf';
  await fs.writeFile(filePath(key), buffer, { flag: 'wx', mode: 0o600 });
  return key;
}

async function remove(key) {
  if (driver() === 'vercel-blob') return cloud().remove(key);
  try {
    await fs.unlink(filePath(key));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function openRead(key) {
  if (driver() === 'vercel-blob') return cloud().openRead(key);
  const handle = await fs.open(filePath(key),
    fsSync.constants.O_RDONLY | (fsSync.constants.O_NOFOLLOW || 0));
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) {
      const err = new Error('Not a regular PDF');
      err.code = 'ENOENT';
      throw err;
    }
    return { size: stat.size, stream: handle.createReadStream({ autoClose: true }) };
  } catch (error) {
    await handle.close().catch(() => {});
    throw error;
  }
}

module.exports = { save, remove, filePath, root, openRead, validateConfig, createBlobAdapter };
