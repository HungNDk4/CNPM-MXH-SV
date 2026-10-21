'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const FILE_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i;
const defaultDir = path.resolve(__dirname, '../../private-documents');

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

async function save(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 1 || buffer.length > 10 * 1024 * 1024) {
    throw new Error('Invalid PDF storage size');
  }
  const directory = root();
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const key = crypto.randomUUID() + '.pdf';
  await fs.writeFile(filePath(key), buffer, { flag: 'wx', mode: 0o600 });
  return key;
}

async function remove(key) {
  try { await fs.unlink(filePath(key)); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

module.exports = { save, remove, filePath, root };
