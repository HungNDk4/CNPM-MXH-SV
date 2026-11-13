'use strict';
/**
 * Stage 3 & 4 Automated Comprehensive Verification Test Suite
 * Covers:
 * 1. Post Images Upload (Max 4 images, type validation, secure storage, post_images table)
 * 2. Optimized GET /api/posts (Single query returns like_count, comment_count, is_liked, is_bookmarked, images)
 * 3. Like & Bookmark Idempotency and Count Consistency
 * 4. Comments & Replies 1-level Hierarchy
 * 5. Role-based Access Control (Guest vs Student vs Admin)
 * 6. Private PDF Document Download & SEC-01 Static Exposure Protection
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
require('../node_modules/dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('../node_modules/jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

// Generate test tokens
const studentToken = jwt.sign({ id: 2, role: 'student' }, JWT_ACCESS_SECRET, { expiresIn: '1h' });
const adminToken = jwt.sign({ id: 1, role: 'admin' }, JWT_ACCESS_SECRET, { expiresIn: '1h' });

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING STAGE 3 & 4 VERIFICATION TEST SUITE');
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

  // ── TEST 1: Optimized GET /api/posts contract & N+1 elimination ──
  await test('GET /api/posts returns like_count, comment_count, is_liked, is_bookmarked, images', async () => {
    const res = await fetch(`${BASE_URL}/posts?limit=3`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 200, 'Status should be 200');
    const data = await res.json();
    assert.strictEqual(data.success, true, 'API success must be true');
    assert.ok(Array.isArray(data.data), 'data must be an array');
    assert.ok(data.data.length > 0, 'Feed should have posts');

    const first = data.data[0];
    assert.strictEqual(typeof first.like_count, 'number', 'like_count must be number');
    assert.strictEqual(typeof first.comment_count, 'number', 'comment_count must be number');
    assert.strictEqual(typeof first.is_liked, 'boolean', 'is_liked must be boolean');
    assert.strictEqual(typeof first.is_bookmarked, 'boolean', 'is_bookmarked must be boolean');
    assert.ok(Array.isArray(first.images), 'images must be an array');
  });

  // ── TEST 2: Guest Access Boundaries (ADR-002) ──
  await test('Guest cannot view general posts but can view free documents', async () => {
    // Guest accessing all posts without type=document should be 401
    const resGuestAll = await fetch(`${BASE_URL}/posts?limit=2`);
    assert.strictEqual(resGuestAll.status, 401, 'Guest should get 401 on general feed');

    // Guest accessing type=document should be 200
    const resGuestDocs = await fetch(`${BASE_URL}/posts?type=document&limit=2`);
    assert.strictEqual(resGuestDocs.status, 200, 'Guest should view free document posts');
  });

  // ── TEST 3: Image Upload & Post Creation (Up to 4 images) ──
  let createdPostId = null;
  await test('POST /api/posts with image attachments (Max 4 images, PNG/JPG/WebP)', async () => {
    // Generate 2 sample valid PNG images (1x1 transparent PNG buffer)
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const formData = new FormData();
    formData.append('title', 'Bài viết kiểm thử tự động có đính kèm ảnh minh họa');
    formData.append('content', 'Nội dung kiểm thử upload ảnh bài viết tối đa 4 ảnh.');
    formData.append('post_type', 'discussion');
    formData.append('subject', 'Công nghệ phần mềm');
    formData.append('tags', JSON.stringify(['test', 'images', 'automation']));

    const blob1 = new Blob([pngBuffer], { type: 'image/png' });
    const blob2 = new Blob([pngBuffer], { type: 'image/png' });
    formData.append('images', blob1, 'test-diagram-1.png');
    formData.append('images', blob2, 'test-diagram-2.png');

    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formData,
    });

    assert.strictEqual(res.status, 201, `Status should be 201, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.id, 'Post ID must be returned');
    createdPostId = data.data.id;

    assert.ok(Array.isArray(data.data.images), 'data.images must be array');
    assert.strictEqual(data.data.images.length, 2, 'Should have exactly 2 image URLs');
    assert.ok(data.data.images[0].startsWith('/uploads/post-images/'), 'Image URL must start with /uploads/post-images/');
  });

  // ── TEST 4: Fetch Created Post With Images ──
  await test('GET /api/posts/:id returns image attachments correctly', async () => {
    assert.ok(createdPostId, 'Post ID required');
    const res = await fetch(`${BASE_URL}/posts/${createdPostId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.id, createdPostId);
    assert.strictEqual(data.data.images.length, 2);
  });

  // ── TEST 5: Image Upload Validation Rejections ──
  await test('POST /api/posts rejects invalid image types (e.g. text/plain or exe)', async () => {
    const invalidBuffer = Buffer.from('console.log("not an image")', 'utf8');
    const formData = new FormData();
    formData.append('title', 'Bài viết với file giả mạo');
    formData.append('post_type', 'discussion');
    const fakeBlob = new Blob([invalidBuffer], { type: 'text/plain' });
    formData.append('images', fakeBlob, 'malicious.js');

    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formData,
    });

    assert.strictEqual(res.status, 415, `Should reject with 415 Unsupported Media Type, got ${res.status}`);
  });

  // ── TEST 6: Like & Bookmark Idempotency ──
  await test('Like and Bookmark toggle works idempotently', async () => {
    assert.ok(createdPostId, 'Post ID required');

    // 1. Like the post
    const resLike1 = await fetch(`${BASE_URL}/likes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ target_type: 'post', target_id: createdPostId }),
    });
    assert.strictEqual(resLike1.status, 200);
    const dataLike1 = await resLike1.json();
    assert.strictEqual(dataLike1.liked, true, 'First like should return liked: true');

    // 2. Bookmark the post
    const resBm = await fetch(`${BASE_URL}/posts/${createdPostId}/bookmark`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(resBm.status, 200);

    // 3. Verify GET /api/posts/:id reflects is_liked: true and is_bookmarked: true
    const resCheck = await fetch(`${BASE_URL}/posts/${createdPostId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const dataCheck = await resCheck.json();
    assert.strictEqual(dataCheck.data.is_liked, true, 'is_liked should be true');
    assert.strictEqual(dataCheck.data.is_bookmarked, true, 'is_bookmarked should be true');
    assert.strictEqual(dataCheck.data.like_count, 1, 'like_count should be 1');

    // 4. Unlike
    const resLike2 = await fetch(`${BASE_URL}/likes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ target_type: 'post', target_id: createdPostId }),
    });
    const dataLike2 = await resLike2.json();
    assert.strictEqual(dataLike2.liked, false, 'Second like should toggle to false');
  });

  // ── TEST 7: Comments & Downward Reply Nesting ──
  let rootCommentId = null;
  await test('POST /api/comments creates root comment and reply with parent_id', async () => {
    assert.ok(createdPostId, 'Post ID required');

    // Create root comment
    const resRoot = await fetch(`${BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        post_id: createdPostId,
        content: 'Bình luận gốc kiểm thử tự động.',
        parent_id: null,
      }),
    });
    assert.strictEqual(resRoot.status, 201);
    const dataRoot = await resRoot.json();
    rootCommentId = dataRoot.data.id;
    assert.ok(rootCommentId);

    // Create reply to root comment
    const resReply = await fetch(`${BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        post_id: createdPostId,
        content: '@Thành viên Phản hồi bình luận trong luồng.',
        parent_id: rootCommentId,
      }),
    });
    assert.strictEqual(resReply.status, 201);
    const dataReply = await resReply.json();
    assert.strictEqual(dataReply.data.parent_id, rootCommentId, 'Reply parent_id must match root comment ID');

    // Verify GET /api/comments returns hierarchical thread
    const resGetComments = await fetch(`${BASE_URL}/comments?post_id=${createdPostId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(resGetComments.status, 200);
    const commentsData = await resGetComments.json();
    assert.ok(commentsData.data.length >= 1);
    const foundRoot = commentsData.data.find(c => c.id === rootCommentId);
    assert.ok(foundRoot, 'Root comment must be in list');
    assert.ok(Array.isArray(foundRoot.replies), 'Root comment must have replies array');
    assert.strictEqual(foundRoot.replies.length, 1, 'Should have exactly 1 reply');
    assert.strictEqual(foundRoot.replies[0].id, dataReply.data.id);
  });

  // ── TEST 8: Nested Reply Boundary (Max 1 level) ──
  await test('POST /api/comments rejects nesting beyond 1 level (parent cannot be a reply)', async () => {
    assert.ok(createdPostId && rootCommentId);

    // Fetch reply ID
    const resComments = await fetch(`${BASE_URL}/comments?post_id=${createdPostId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const commentsData = await resComments.json();
    const foundRoot = commentsData.data.find(c => c.id === rootCommentId);
    const replyId = foundRoot.replies[0].id;

    // Try to reply to the reply (level 2 nesting)
    const resDeep = await fetch(`${BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        post_id: createdPostId,
        content: 'Nỗ lực trả lời vào reply con.',
        parent_id: replyId,
      }),
    });
    assert.strictEqual(resDeep.status, 422, 'Backend must reject nesting beyond 1 level with 422');
  });

  // ── TEST 9: SEC-01 PDF Document Protection ──
  await test('Protected PDF files are NOT accessible via static public URL (SEC-01)', async () => {
    // Attempt to access private document via static URL
    const resStatic = await fetch('http://localhost:5000/uploads/private-documents/fake.pdf');
    assert.strictEqual(resStatic.status, 404, 'Private document must return 404 on public static URL');

    const resStaticDocs = await fetch('http://localhost:5000/private-documents/fake.pdf');
    assert.strictEqual(resStaticDocs.status, 404, 'Private documents directory must not be served publicly');
  });

  // ── TEST 10: Admin Role Authorization ──
  await test('Admin audit logs endpoint is accessible to Admin and forbidden to Student', async () => {
    const resStudent = await fetch(`${BASE_URL}/posts/moderation/audit-logs`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(resStudent.status, 403, 'Student must receive 403 Forbidden');

    const resAdmin = await fetch(`${BASE_URL}/posts/moderation/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(resAdmin.status, 200, 'Admin must receive 200 OK');
  });

  // ── Cleanup Test Post Safely ──
  if (createdPostId) {
    await fetch(`${BASE_URL}/posts/${createdPostId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`[CLEANUP] Soft-deleted test post ID: ${createdPostId}`);
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
