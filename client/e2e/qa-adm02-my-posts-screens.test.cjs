'use strict';
// Genuine Chromium screenshots of merged-in-CI PRs #89 + #90 + #91.
// NEVER execute against production/shared TiDB; screenshot proof is disposable CI only.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');

if (process.env.GITHUB_ACTIONS !== 'true' || !process.env.RUNNER_TEMP ||
    process.env.REPORT_UI_DISPOSABLE !== 'true' ||
    process.env.E2E_DISPOSABLE_DB !== 'true' ||
    process.env.DB_HOST !== '127.0.0.1' ||
    process.env.DB_PORT !== '3306' ||
    process.env.DB_NAME !== 'mini_study_network' ||
    process.env.DB_AUTO_SYNC !== 'false' ||
    process.env.NODE_ENV !== 'test') {
  throw new Error('REFUSED: screenshots are for disposable localhost GitHub MySQL8 CI only');
}

const cr = createRequire(path.resolve(__dirname, '../../client/package.json'));
const sr = createRequire(path.resolve(__dirname, '../../server/package.json'));
const { chromium } = cr('playwright');
const bcrypt = sr('bcryptjs');
const { Op } = sr('sequelize');
const {
  sequelize, User, Post, RefreshToken, AccountModerationAuditLog,
} = require('../../server/src/models');
const root = process.env.REPORT_UI_SCREENSHOT_DIR || path.join(process.env.RUNNER_TEMP, 'adm02-be11-ui');
const UI = 'http://127.0.0.1:5173';
const API = 'http://127.0.0.1:5000';
fs.mkdirSync(root, { recursive: true });
const results = [];
async function shot(page, id, title) {
  await page.screenshot({ path: path.join(root, id + '.png'), fullPage: false,
    animations: 'disabled' });
  const filename = path.join(root, id + '.png');
  assert.ok(fs.statSync(filename).size > 9000, 'screenshot not blank: ' + id);
  results.push({ image: id + '.png', title, url: page.url() });
  console.log('SCREENSHOT ' + id + ' ' + title);
}
async function registerViaUI(page, name, email, password) {
  await page.goto(UI + '/register');
  await page.locator('#full_name').fill(name);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/auth/register');
  await page.getByRole('button', { name: 'Đăng ký ngay' }).click();
  const r = await response;
  assert.equal(r.status(), 201, await r.text());
  await page.waitForURL(u => u.pathname === '/');
  return (await r.json()).data;
}
async function loginViaUI(page, email, password) {
  await page.goto(UI + '/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/auth/login');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  const r = await response;
  assert.equal(r.status(), 200, await r.text());
  await page.waitForURL(u => u.pathname === '/');
  return (await r.json()).data;
}

test('UI evidence: real Chromium + Vite + Express + disposable MySQL8 (#89/#90/#91)', {
  timeout: 240000,
}, async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const userContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const guestContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const userPage = await userContext.newPage();
  const adminPage = await adminContext.newPage();
  const guestPage = await guestContext.newPage();
  const ids = [];
  const marker = randomUUID().slice(0, 9);
  const pass = 'UiqA2026PassSecure';
  const emailA = 'evidence-a-' + marker + '@example.invalid';
  const emailB = 'evidence-b-' + marker + '@example.invalid';
  const emailAdmin = 'evidence-admin-' + marker + '@example.invalid';
  let owner;
  let admin;
  try {
    await sequelize.authenticate();
    const registeredA = await registerViaUI(userPage, 'Minh chứng SV A', emailA, pass);
    owner = registeredA.user;
    ids.push(owner.id);
    const hash = await bcrypt.hash(pass, 10);
    const foreign = await User.create({ full_name: 'Minh chứng SV B', email: emailB,
      password_hash: hash, role: 'student', is_active: true });
    ids.push(foreign.id);
    admin = await User.create({ full_name: 'Minh chứng Admin', email: emailAdmin,
      password_hash: hash, role: 'admin', is_active: true });
    ids.push(admin.id);

    const posts = Array.from({ length: 52 }, (_, i) => ({
      user_id: owner.id, title: 'Minh chứng bài viết ' + (i + 1) + ' — ' + marker,
      content: 'Bài đăng phục vụ kiểm thử trình duyệt thực tế.',
      post_type: i === 0 ? 'document' : 'question',
      status: i === 50 ? 'hidden' : (i === 51 ? 'deleted' : 'active'),
      price: 0, subject: 'Công nghệ phần mềm',
    }));
    await Post.bulkCreate(posts);
    await Post.create({ user_id: foreign.id, title: 'Bài viết riêng tư của SV B ' + marker,
      content: 'Dữ liệu cách ly tài khoản.', post_type: 'question', status: 'active', price: 0 });

    const guestResponse = await guestPage.goto(UI + '/admin/users');
    assert.ok(guestResponse.status() < 400);
    await guestPage.waitForURL(u => u.pathname === '/login');
    await shot(guestPage, '01-admin-guest-guard', 'Guest bị chuyển về trang đăng nhập');

    await userPage.goto(UI + '/my-posts');
    await userPage.getByRole('heading', { name: 'Bài đăng của tôi' }).waitFor();
    await userPage.getByText('Trang 1 / 6').waitFor({ timeout: 20000 });
    assert.equal((await (await userPage.request.get(API + '/api/posts/my', {
      headers: { Authorization: 'Bearer ' + registeredA.accessToken },
    })).json()).pagination.total, 52);
    assert.ok(!await userPage.getByText('Bài viết riêng tư của SV B ' + marker).count());
    await shot(userPage, '02-my-posts-list', 'SV A có 52 bài, giao diện phân trang trang 1/6');

    await userPage.locator('#my-posts-status').selectOption('hidden');
    await userPage.locator('article[aria-label^="Bài không công khai"]').waitFor({timeout: 15000});
    assert.ok(await userPage.getByText('Đã bị Admin ẩn').count());
    await shot(userPage, '03-my-posts-hidden', 'Bài bị ẩn hiện thẻ trạng thái, không có thao tác công khai');
    await userPage.locator('#my-posts-status').selectOption('all');
    await userPage.getByText('Trang 1 / 6').waitFor();
    await userPage.getByRole('button', { name: 'Trang sau' }).click();
    await userPage.getByText('Trang 2 / 6').waitFor();
    await shot(userPage, '04-my-posts-page2', 'Đổi trang lấy danh sách từ Backend');

    await loginViaUI(adminPage, emailAdmin, pass);
    await adminPage.goto(UI + '/admin/users');
    await adminPage.getByRole('heading', { name: 'Quản lý tài khoản người dùng' }).waitFor();
    await adminPage.getByText('Minh chứng SV A').waitFor({ timeout: 15000 });
    await shot(adminPage, '05-admin-users-list', 'Admin xem danh sách tài khoản thực tế');

    await adminPage.getByPlaceholder('Tên hoặc email người dùng').fill(emailA);
    await adminPage.getByRole('button', { name: 'Lọc tài khoản' }).click();
    await adminPage.getByText('Minh chứng SV A').waitFor();
    const ownerCard = adminPage.locator('article').filter({ hasText: emailA });
    await ownerCard.getByRole('button', { name: 'Khóa tài khoản' }).click();
    const dialog = adminPage.getByRole('dialog');
    await dialog.waitFor();
    assert.ok(await dialog.getByRole('button', { name: 'Xác nhận khóa' }).isDisabled());
    await dialog.getByPlaceholder('Nhập lý do cụ thể cho thao tác này').fill('Kiểm tra khóa tài khoản theo QA-UI');
    await shot(adminPage, '06-admin-lock-dialog', 'Hộp thoại khóa tài khoản, bắt buộc lý do');
    await dialog.getByRole('button', { name: 'Xác nhận khóa' }).click();
    await dialog.waitFor({state: 'hidden'});
    await ownerCard.getByText('Đã khóa', {exact:true}).waitFor();
    await adminPage.getByText('Kiểm tra khóa tài khoản theo QA-UI').waitFor();
    await shot(adminPage, '07-admin-locked-audit', 'Khóa thành công và ghi nhật ký');

    // Previously-issued access token must fail after account lock.
    const inactiveResp = await userPage.request.get(API + '/api/posts/my', {
      headers: { Authorization: 'Bearer ' + registeredA.accessToken },
    });
    assert.equal(inactiveResp.status(), 401);
    const freshLogin = await fetch(API + '/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA, password: pass }),
    });
    assert.equal(freshLogin.status, 403);
    await shot(adminPage, '08-admin-after-lock', 'Trạng thái khóa và tài khoản bị từ chối đăng nhập');

    await ownerCard.getByRole('button', { name: 'Mở khóa' }).click();
    await adminPage.getByRole('dialog').getByPlaceholder('Nhập lý do cụ thể cho thao tác này')
      .fill('Hoàn tất nghiệm thu mở khóa tài khoản');
    await adminPage.getByRole('dialog').getByRole('button', { name: 'Xác nhận mở khóa' }).click();
    await adminPage.getByRole('dialog').waitFor({state: 'hidden'});
    await ownerCard.getByText('Đang hoạt động', {exact:true}).waitFor();
    await adminPage.getByText('Hoàn tất nghiệm thu mở khóa tài khoản').waitFor();
    await shot(adminPage, '09-admin-unlocked', 'Mở khóa và lưu sự kiện audit');

    const statusUser = await User.findByPk(owner.id);
    assert.equal(Boolean(statusUser.is_active), true);
    const auditCount = await AccountModerationAuditLog.count({
      where: { target_user_id: owner.id },
    });
    assert.equal(auditCount, 2);
    assert.equal(await Post.count({ where: { user_id: owner.id } }), 52);
    assert.equal(await Post.count({ where: { user_id: foreign.id } }), 1);
    fs.writeFileSync(path.join(root, 'test-results.json'), JSON.stringify({
      environment: 'GitHub Actions / Chromium / React Vite / Express / DISPOSABLE MySQL8',
      base: 'PR91 frontend + ephemeral merges PR89/PR90 (not deployed)',
      tasks: results,
      status: 'PASS',
      screenshots_are: 'genuine browser captures of local isolated CI environment',
      limitations: 'Not TiDB qa-acceptance or Render; cannot be used to claim cloud acceptance',
    }, null, 2));
  } finally {
    try {
      if (ids.length) {
        await AccountModerationAuditLog.destroy({ where: {
          [Op.or]: [
            { target_user_id: { [Op.in]: ids } },
            { actor_admin_id: { [Op.in]: ids } },
          ],
        } });
        await RefreshToken.destroy({ where: { user_id: { [Op.in]: ids } } });
        await Post.destroy({ where: { user_id: { [Op.in]: ids } } });
        await User.destroy({ where: { id: { [Op.in]: ids } } });
      }
    } finally {
      await Promise.all([userContext.close(), adminContext.close(), guestContext.close()]);
      await browser.close();
      await sequelize.close();
    }
  }
});
