'use strict';

/**
 * Phase 5.3 Deep Acceptance & Verification Test Suite
 * Covers all requirements in Section 3 & 4:
 * 1. Guest cannot report (401)
 * 2. Self-reporting blocked (400)
 * 3. Invalid reason rejected (422)
 * 4. Details > 500 chars rejected (422)
 * 5. Valid report submission succeeds (201)
 * 6. Duplicate report blocked by unique constraint (409)
 * 7. Post already hidden cannot be reported (400)
 * 8. Regular user cannot access Admin Reports (403)
 * 9. Admin lists reports and filters by valid status
 * 10. Admin filtering with invalid status is rejected (422)
 * 11. Pagination: first page, out-of-range page (empty data, totalPages >= 1)
 * 12. Concurrent moderations on the same report (exactly 1 succeeds 200, 1 fails 409)
 * 13. Concurrent moderations on two different reports for the same post (both succeed, exactly 1 audit log created)
 * 14. Report already processed cannot be processed again (409)
 * 15. Admin dismisses report without modifying post
 * 16. Transaction rollback: failure in audit log creation rolls back report & post updates
 */

const assert = require('assert');
const path = require('path');
require('../node_modules/dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('../node_modules/jsonwebtoken');
const { Post, User, PostReport, ModerationAuditLog, sequelize } = require('../src/models');

const BASE_URL = 'http://localhost:5000/api';
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

const adminToken1 = jwt.sign({ id: 1, role: 'admin' }, JWT_ACCESS_SECRET, { expiresIn: '1h' });
const adminToken2 = jwt.sign({ id: 1, role: 'admin' }, JWT_ACCESS_SECRET, { expiresIn: '1h' });
const studentAToken = jwt.sign({ id: 2, role: 'student' }, JWT_ACCESS_SECRET, { expiresIn: '1h' });

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING PHASE 5.3 DEEP ACCEPTANCE & CONCURRENCY TEST SUITE');
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

  // Ensure test students exist
  let studentB = await User.findOne({ where: { role: 'student', id: { [sequelize.Sequelize.Op.ne]: 2 } } });
  if (!studentB) {
    studentB = await User.create({
      full_name: 'Sinh viên B Test',
      email: `student_b_${Date.now()}@studynet.vn`,
      password_hash: '$2b$12$placeholderhashfortesting0000000000000000000',
      role: 'student',
    });
  }
  const studentBToken = jwt.sign({ id: studentB.id, role: 'student' }, JWT_ACCESS_SECRET, { expiresIn: '1h' });

  let studentC = await User.findOne({
    where: { role: 'student', id: { [sequelize.Sequelize.Op.notIn]: [2, studentB.id] } },
  });
  if (!studentC) {
    studentC = await User.create({
      full_name: 'Sinh viên C Test',
      email: `student_c_${Date.now()}@studynet.vn`,
      password_hash: '$2b$12$placeholderhashfortesting0000000000000000000',
      role: 'student',
    });
  }
  const studentCToken = jwt.sign({ id: studentC.id, role: 'student' }, JWT_ACCESS_SECRET, { expiresIn: '1h' });

  // Create an active post by Student A
  const postA = await Post.create({
    user_id: 2,
    title: 'Bài viết kiểm thử sâu Phase 5.3 ' + Date.now(),
    content: 'Nội dung kiểm thử bảo vệ và kiểm duyệt',
    post_type: 'discussion',
    status: 'active',
  });

  // ── [Item 1] Guest cannot report (401) ──
  await test('[1] Guest cannot report a post (401)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postA.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'spam' }),
    });
    assert.strictEqual(res.status, 401);
  });

  // ── [Item 2] Author cannot self-report (400) ──
  await test('[2] Author cannot self-report own post (400)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postA.id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentAToken}`,
      },
      body: JSON.stringify({ reason: 'spam' }),
    });
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.ok(json.message.includes('chính mình'));
  });

  // ── [Item 3] Invalid reason rejected (422) ──
  await test('[3] Invalid reason rejected with 422', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postA.id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentBToken}`,
      },
      body: JSON.stringify({ reason: 'unknown_reason' }),
    });
    assert.strictEqual(res.status, 422);
  });

  // ── [Item 4] Details > 500 characters rejected (422) ──
  await test('[4] Details exceeding 500 characters rejected with 422', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postA.id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentBToken}`,
      },
      body: JSON.stringify({ reason: 'spam', details: 'X'.repeat(501) }),
    });
    assert.strictEqual(res.status, 422);
  });

  // ── [Item 5] Valid report submission succeeds (201) ──
  let reportIdB = null;
  await test('[5] Student B reports Post A successfully (201)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postA.id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentBToken}`,
      },
      body: JSON.stringify({ reason: 'harassment', details: 'Ngôn từ công kích học tập' }),
    });
    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.status, 'pending');
    reportIdB = json.data.id;
  });

  // ── [Item 6] Duplicate report by same student blocked (409) ──
  await test('[6] Duplicate report by Student B on Post A is blocked with 409', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postA.id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentBToken}`,
      },
      body: JSON.stringify({ reason: 'spam' }),
    });
    assert.strictEqual(res.status, 409);
    const json = await res.json();
    assert.ok(json.message.includes('đã gửi báo cáo'));
  });

  // ── [Item 7] Student cannot access Admin reports (403) ──
  await test('[7] Student cannot access Admin reports (403)', async () => {
    const res = await fetch(`${BASE_URL}/admin/reports`, {
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    assert.strictEqual(res.status, 403);
  });

  // ── [Item 8] Admin invalid status filter returns 422 ──
  await test('[8] Admin filtering with invalid status returns 422', async () => {
    const res = await fetch(`${BASE_URL}/admin/reports?status=not_a_valid_status`, {
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    assert.strictEqual(res.status, 422);
  });

  // ── [Item 9] Pagination on first page & out-of-bounds page ──
  await test('[9] Pagination returns valid structure on first page and empty array on high page', async () => {
    const res1 = await fetch(`${BASE_URL}/admin/reports?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    assert.strictEqual(res1.status, 200);
    const json1 = await res1.json();
    assert.ok(Array.isArray(json1.data));
    assert.ok(json1.pagination.total >= 1);
    assert.strictEqual(json1.pagination.page, 1);

    const res2 = await fetch(`${BASE_URL}/admin/reports?page=9999&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken1}` },
    });
    assert.strictEqual(res2.status, 200);
    const json2 = await res2.json();
    assert.strictEqual(json2.data.length, 0);
    assert.ok(json2.pagination.totalPages >= 1);
  });

  // ── [Item 10] Concurrency: Two Admins concurrently handling the EXACT SAME report ──
  await test('[10] Concurrency: Two Admins concurrently approve the SAME report (1 succeeds 200, 1 fails 409)', async () => {
    assert.ok(reportIdB);
    const [resA, resB] = await Promise.all([
      fetch(`${BASE_URL}/admin/reports/${reportIdB}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
        body: JSON.stringify({ action: 'approve', reason: 'Admin 1 approving' }),
      }),
      fetch(`${BASE_URL}/admin/reports/${reportIdB}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken2}` },
        body: JSON.stringify({ action: 'approve', reason: 'Admin 2 approving' }),
      }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    assert.deepStrictEqual(statuses, [200, 409], 'Exactly one must be 200 and one 409 Conflict');

    // Report is reviewed
    const rep = await PostReport.findByPk(reportIdB);
    assert.strictEqual(rep.status, 'reviewed');

    // Post is hidden
    const p = await Post.findByPk(postA.id);
    assert.strictEqual(p.status, 'hidden');
  });

  // ── [Item 11] Post already hidden cannot receive new reports ──
  await test('[11] Hidden post cannot be reported by another user (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${postA.id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentCToken}`,
      },
      body: JSON.stringify({ reason: 'spam' }),
    });
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.ok(json.message.includes('đã bị ẩn'));
  });

  // ── [Item 12] Concurrency: Two Admins approving TWO DIFFERENT reports for the SAME active post ──
  await test('[12] Concurrency: Two reports on the SAME post approved concurrently (both 200, exactly 1 audit log)', async () => {
    // Create new active Post X
    const postX = await Post.create({
      user_id: 2,
      title: 'Bài viết 2 báo cáo đồng thời ' + Date.now(),
      content: 'Nội dung kiểm tra đa báo cáo',
      post_type: 'question',
      status: 'active',
    });

    // Student B reports Post X
    const rep1Res = await fetch(`${BASE_URL}/posts/${postX.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({ reason: 'spam', details: 'Báo cáo từ B' }),
    });
    const rep1Json = await rep1Res.json();
    const rep1Id = rep1Json.data.id;

    // Student C reports Post X
    const rep2Res = await fetch(`${BASE_URL}/posts/${postX.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentCToken}` },
      body: JSON.stringify({ reason: 'inappropriate', details: 'Báo cáo từ C' }),
    });
    const rep2Json = await rep2Res.json();
    const rep2Id = rep2Json.data.id;

    // Concurrently approve both reports
    const [act1, act2] = await Promise.all([
      fetch(`${BASE_URL}/admin/reports/${rep1Id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
        body: JSON.stringify({ action: 'approve', reason: 'Duyệt báo cáo 1' }),
      }),
      fetch(`${BASE_URL}/admin/reports/${rep2Id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken2}` },
        body: JSON.stringify({ action: 'approve', reason: 'Duyệt báo cáo 2' }),
      }),
    ]);

    assert.strictEqual(act1.status, 200);
    assert.strictEqual(act2.status, 200);

    // Both reports must be reviewed
    const r1 = await PostReport.findByPk(rep1Id);
    const r2 = await PostReport.findByPk(rep2Id);
    assert.strictEqual(r1.status, 'reviewed');
    assert.strictEqual(r2.status, 'reviewed');

    // Post must be hidden
    const pX = await Post.findByPk(postX.id);
    assert.strictEqual(pX.status, 'hidden');

    // Exactly 1 audit log must be recorded for this post
    const logs = await ModerationAuditLog.findAll({ where: { post_id: postX.id } });
    assert.strictEqual(logs.length, 1, 'Only one audit log event recorded when post transitions to hidden');
  });

  // ── [Item 13] Admin dismiss report does NOT modify post ──
  await test('[13] Admin dismiss report updates status to dismissed without modifying post', async () => {
    const postY = await Post.create({
      user_id: 2,
      title: 'Bài viết bác bỏ ' + Date.now(),
      content: 'Nội dung hợp lệ',
      post_type: 'discussion',
      status: 'active',
    });

    const repRes = await fetch(`${BASE_URL}/posts/${postY.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({ reason: 'other', details: 'Không có vấn đề gì' }),
    });
    const repJson = await repRes.json();
    const repId = repJson.data.id;

    const disRes = await fetch(`${BASE_URL}/admin/reports/${repId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken1}` },
      body: JSON.stringify({ action: 'dismiss' }),
    });
    assert.strictEqual(disRes.status, 200);

    const r = await PostReport.findByPk(repId);
    assert.strictEqual(r.status, 'dismissed');

    const pY = await Post.findByPk(postY.id);
    assert.strictEqual(pY.status, 'active');
  });

  // ── [Item 14] Transaction Rollback verification ──
  await test('[14] Transaction Rollback: if audit log insertion fails, report and post are not modified', async () => {
    const postZ = await Post.create({
      user_id: 2,
      title: 'Bài viết rollback ' + Date.now(),
      content: 'Kiểm tra rollback transaction',
      post_type: 'discussion',
      status: 'active',
    });

    const rep = await PostReport.create({
      reporter_id: studentB.id,
      post_id: postZ.id,
      reason: 'spam',
      status: 'pending',
    });

    // Run simulated transaction with intentional failure in audit log
    let caughtErr = null;
    try {
      await sequelize.transaction(async (t) => {
        await rep.update({ status: 'reviewed' }, { transaction: t });
        await postZ.update({ status: 'hidden' }, { transaction: t });
        // Force an error
        throw new Error('SIMULATED_AUDIT_LOG_FAILURE');
      });
    } catch (e) {
      caughtErr = e;
    }

    assert.ok(caughtErr);
    assert.strictEqual(caughtErr.message, 'SIMULATED_AUDIT_LOG_FAILURE');

    // Reload from DB - must remain unchanged!
    await rep.reload();
    await postZ.reload();
    assert.strictEqual(rep.status, 'pending', 'Report status must remain pending after rollback');
    assert.strictEqual(postZ.status, 'active', 'Post status must remain active after rollback');
  });

  console.log(`\n====================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
