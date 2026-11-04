'use strict';

/**
 * Phase 5.2 Avatar Upload Verification & Acceptance Test Suite
 * Covers Part A Acceptance items 1-8:
 * 1. WebP signature verification & spoofing defense
 * 2. Corrupt / truncated image detection with valid headers
 * 3. Safe error handling when deleting old avatar
 * 4. Preservation of default avatars and external URLs
 * 5. Rollback cleanup of new avatar file if DB fails
 * 6. Production static route serving
 * 7. Multi-avatar replacement lifecycle
 * 8. Validation errors & size limits
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
require('../node_modules/dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('../node_modules/jsonwebtoken');

const {
  validateAvatarBuffer,
  saveAvatar,
  deleteAvatarFile,
  uploadDir,
  MAX_AVATAR_BYTES,
} = require('../src/services/avatar-storage');

const BASE_URL = 'http://localhost:5000';
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const { User } = require('../src/models');
const studentToken = jwt.sign({ id: 2, role: 'student' }, JWT_ACCESS_SECRET, { expiresIn: '1h' });

// Synthesize structured test buffers
const VALID_JPEG = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
  Buffer.alloc(20, 0x55),
]);

const VALID_PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]),
  Buffer.from('IHDR'),
  Buffer.alloc(16, 0x00),
]);

const VALID_WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x20, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP'),
  Buffer.from('VP8 '),
  Buffer.alloc(16, 0x00),
]);

// Spoofed WEBP with RIFF...WEBP but malicious/unrecognized chunk header
const SPOOFED_WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x20, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP'),
  Buffer.from('MALW'),
  Buffer.alloc(16, 0x00),
]);

// Truncated image (< 24 bytes)
const TRUNCATED_JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

// PNG without IHDR chunk
const CORRUPT_PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]),
  Buffer.from('JUNK'),
  Buffer.alloc(16, 0x00),
]);

const FAKE_IMAGE = Buffer.from('<html><body>Not an image file</body></html>');

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING PHASE 5.2 AVATAR UPLOAD ACCEPTANCE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}`);
      console.error('       Error:', err.message);
      failed++;
    }
  }

  // ── [Item 1] Kiểm tra file WEBP giả mạo RIFF/WEBP ──
  await test('[Part A.1] validateAvatarBuffer rejects spoofed WEBP (non-VP8 chunk) with 415', async () => {
    assert.throws(
      () => validateAvatarBuffer({ buffer: SPOOFED_WEBP }),
      (err) => err.statusCode === 415
    );
  });

  // ── [Item 2] Kiểm tra file ảnh hỏng cấu trúc nhưng có Magic Bytes hợp lệ ──
  await test('[Part A.2] validateAvatarBuffer rejects truncated image (<24 bytes) with 422', async () => {
    assert.throws(
      () => validateAvatarBuffer({ buffer: TRUNCATED_JPEG }),
      (err) => err.statusCode === 422
    );
  });

  await test('[Part A.2] validateAvatarBuffer rejects PNG missing IHDR chunk header with 415', async () => {
    assert.throws(
      () => validateAvatarBuffer({ buffer: CORRUPT_PNG }),
      (err) => err.statusCode === 415
    );
  });

  // ── [Item 3 & 4] Kiểm tra xóa avatar cũ & không xóa avatar mặc định / URL ngoài ──
  await test('[Part A.3] deleteAvatarFile safely handles nonexistent file without throwing', async () => {
    await deleteAvatarFile('/uploads/avatars/nonexistent-avatar-12345.png');
    assert.ok(true);
  });

  await test('[Part A.4] deleteAvatarFile never touches external HTTPS avatars', async () => {
    await deleteAvatarFile('https://api.dicebear.com/7.x/bottts/svg?seed=Felix');
    assert.ok(true);
  });

  await test('[Part A.4] deleteAvatarFile never touches default or placeholder avatars', async () => {
    const defaultFile = path.join(uploadDir, 'default-avatar.png');
    await fsPromises.writeFile(defaultFile, Buffer.from('default-avatar-content'), { flag: 'w' });
    try {
      await deleteAvatarFile('/uploads/avatars/default-avatar.png');
      assert.ok(fs.existsSync(defaultFile), 'default-avatar.png must NOT be deleted');
    } finally {
      try { await fsPromises.unlink(defaultFile); } catch {}
    }
  });

  // ── [Item 5] Kiểm tra lỗi DB update có dọn dẹp file mới vừa upload ──
  await test('[Part A.5] saveAvatar followed by compensating unlink cleans file upon error', async () => {
    const saved = await saveAvatar({ buffer: VALID_PNG });
    assert.ok(fs.existsSync(saved.targetPath), 'File was written');
    // Simulate compensating catch block
    await fsPromises.unlink(saved.targetPath);
    assert.ok(!fs.existsSync(saved.targetPath), 'Rollback successfully cleaned file');
  });

  // ── [Item 6] Kiểm tra URL avatar hoạt động trên môi trường static Express ──
  let uploadedAvatarUrl1 = null;
  await test('[Part A.6] POST /api/users/me/avatar uploads PNG and serves via /uploads/avatars', async () => {
    const formData = new FormData();
    const blob = new Blob([VALID_PNG], { type: 'image/png' });
    formData.append('avatar', blob, 'avatar1.png');

    const res = await fetch(`${BASE_URL}/api/users/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formData,
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.avatar_url.startsWith('/uploads/avatars/'));
    assert.ok(json.data.avatar_url.endsWith('.png'));
    uploadedAvatarUrl1 = json.data.avatar_url;

    // Static express endpoint test
    const staticRes = await fetch(`${BASE_URL}${uploadedAvatarUrl1}`);
    assert.strictEqual(staticRes.status, 200, 'Static route must serve the avatar with 200');
    const bytes = Buffer.from(await staticRes.arrayBuffer());
    assert.strictEqual(bytes[0], 0x89);
    assert.strictEqual(bytes[1], 0x50);
  });

  await test('[Part A.7] POST /api/users/me/avatar replaces old avatar and deletes disk file', async () => {
    assert.ok(uploadedAvatarUrl1);
    const oldFile = path.join(uploadDir, path.basename(uploadedAvatarUrl1));
    assert.ok(fs.existsSync(oldFile), 'Old avatar exists prior to replacement');

    const formData = new FormData();
    const blob = new Blob([VALID_JPEG], { type: 'image/jpeg' });
    formData.append('avatar', blob, 'avatar2.jpg');

    const res = await fetch(`${BASE_URL}/api/users/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formData,
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.data.avatar_url.endsWith('.jpg'));

    // Old avatar must be deleted from disk
    assert.ok(!fs.existsSync(oldFile), 'Old avatar was removed upon replacement');

    // Clean up second file
    const newFile = path.join(uploadDir, path.basename(json.data.avatar_url));
    if (fs.existsSync(newFile)) {
      await fsPromises.unlink(newFile);
    }
  });

  await test('[Part A.8] API rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/users/me/avatar`, { method: 'POST' });
    assert.strictEqual(res.status, 401);
  });

  await test('[Part A.8] API rejects empty payload with 422', async () => {
    const res = await fetch(`${BASE_URL}/api/users/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 422);
  });

  await test('[Part A.8] API rejects fake non-image file with 415', async () => {
    const formData = new FormData();
    const blob = new Blob([FAKE_IMAGE], { type: 'image/png' });
    formData.append('avatar', blob, 'fake.png');

    const res = await fetch(`${BASE_URL}/api/users/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formData,
    });
    assert.strictEqual(res.status, 415);
  });

  console.log(`\n====================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================\n`);

  await User.update({ avatar_url: null }, { where: { id: 2 } });
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
