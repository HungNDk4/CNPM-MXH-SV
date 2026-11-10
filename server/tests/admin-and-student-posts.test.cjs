'use strict';

const path = require('path');
const assert = require('assert');
require('../node_modules/dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('../node_modules/jsonwebtoken');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-minimum-32-chars-long';
const adminToken = jwt.sign({ id: 1, role: 'admin' }, JWT_ACCESS_SECRET, { expiresIn: '1h' });
const studentToken = jwt.sign({ id: 2, role: 'student' }, JWT_ACCESS_SECRET, { expiresIn: '1h' });

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING ADMIN & STUDENT POSTS VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Student personal stats endpoint security
  await test('GET /api/posts/my-stats requires authentication (401 for guests)', async () => {
    const res = await fetch(`${BASE_URL}/posts/my-stats`);
    assert.strictEqual(res.status, 401, 'Guest must receive 401 Unauthorized');
  });

  // 2. Student personal stats returns correct structure and non-negative numbers
  await test('GET /api/posts/my-stats returns real scoped counts for authenticated student', async () => {
    const res = await fetch(`${BASE_URL}/posts/my-stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 200, 'Student must receive 200 OK');
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(typeof json.data.total_posts, 'number');
    assert.strictEqual(typeof json.data.total_likes, 'number');
    assert.strictEqual(typeof json.data.total_comments, 'number');
    assert.strictEqual(typeof json.data.total_views, 'number');
    assert.ok(json.data.total_posts >= 0);
    assert.ok(json.data.total_likes >= 0);
  });

  // 3. Admin Overview is forbidden for students
  await test('GET /api/posts/admin/overview returns 403 Forbidden for students', async () => {
    const res = await fetch(`${BASE_URL}/posts/admin/overview`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 403, 'Student must receive 403 Forbidden');
  });

  // 4. Admin Overview returns real metrics for admin
  await test('GET /api/posts/admin/overview returns complete system metrics for admin', async () => {
    const res = await fetch(`${BASE_URL}/posts/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200, 'Admin must receive 200 OK');
    const json = await res.json();
    assert.strictEqual(json.success, true);
    const { metrics, posts_by_type, daily_trends } = json.data;
    assert.ok(metrics.total_posts >= metrics.active_posts, 'Total posts >= active posts');
    assert.strictEqual(typeof metrics.total_likes, 'number');
    assert.strictEqual(typeof metrics.total_comments, 'number');
    assert.strictEqual(typeof metrics.total_views, 'number');
    assert.strictEqual(metrics.engagement, metrics.total_likes + metrics.total_comments);
    assert.ok(Array.isArray(daily_trends));
  });

  // 5. Admin Analytics is forbidden for students
  await test('GET /api/posts/admin/analytics returns 403 Forbidden for students', async () => {
    const res = await fetch(`${BASE_URL}/posts/admin/analytics`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 403, 'Student must receive 403 Forbidden');
  });

  // 6. Admin Analytics returns top-ranked posts and engagement by type
  await test('GET /api/posts/admin/analytics returns top liked, commented, viewed posts for admin', async () => {
    const res = await fetch(`${BASE_URL}/posts/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200, 'Admin must receive 200 OK');
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(Array.isArray(json.data.top_liked), 'top_liked is an array');
    assert.ok(Array.isArray(json.data.top_commented), 'top_commented is an array');
    assert.ok(Array.isArray(json.data.top_viewed), 'top_viewed is an array');
    assert.ok(Array.isArray(json.data.by_type), 'by_type is an array');
  });

  // 7. Admin Manage Posts is forbidden for students
  await test('GET /api/posts/admin/manage returns 403 Forbidden for students', async () => {
    const res = await fetch(`${BASE_URL}/posts/admin/manage`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.strictEqual(res.status, 403, 'Student must receive 403 Forbidden');
  });

  // 8. Admin Manage Posts returns paginated posts with status filter
  await test('GET /api/posts/admin/manage allows filtering by status (active, hidden, deleted)', async () => {
    const res = await fetch(`${BASE_URL}/posts/admin/manage?status=active&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200, 'Admin must receive 200 OK');
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.length > 0, 'Active posts returned');
    json.data.forEach((p) => {
      assert.strictEqual(p.status, 'active', 'Post status must be active');
      assert.ok(p.author && p.author.full_name, 'Author info present');
    });
  });

  // 9. Admin Moderation Transition & Audit Log
  await test('Admin can moderate a post (hidden/deleted) and audit log is recorded', async () => {
    // 1. Create a dummy post by student
    const createRes = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Post For Moderation ' + Date.now(),
        content: 'Nội dung bài viết thử nghiệm kiểm duyệt admin.',
        post_type: 'discussion',
        subject: 'Kỹ thuật phần mềm',
        tags: ['test', 'mod'],
      }),
    });
    assert.strictEqual(createRes.status, 201, 'Student post creation must succeed');
    const createJson = await createRes.json();
    const postId = createJson.data.id;

    // 2. Admin moderates to 'hidden'
    const hideRes = await fetch(`${BASE_URL}/posts/${postId}/moderation`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'hidden' }),
    });
    assert.strictEqual(hideRes.status, 200, 'Admin hide must succeed');

    // 3. Verify audit log was recorded
    const auditRes = await fetch(`${BASE_URL}/posts/moderation/audit-logs?post_id=${postId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(auditRes.status, 200);
    const auditJson = await auditRes.json();
    assert.ok(auditJson.data.length >= 1, 'Audit log entry must exist for hidden action');
    assert.strictEqual(auditJson.data[0].new_status, 'hidden');

    // 4. Admin transitions to 'deleted'
    const deleteRes = await fetch(`${BASE_URL}/posts/${postId}/moderation`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'deleted' }),
    });
    assert.strictEqual(deleteRes.status, 200, 'Admin delete must succeed');
  });

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
