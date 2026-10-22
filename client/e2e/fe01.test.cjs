'use strict';
// FE-01 Chromium UI E2E using isolated MySQL 8; NEVER point at real Render/TiDB.
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const serverRequire = require('node:module').createRequire(require.resolve('../../server/package.json'))
const { Op } = serverRequire('sequelize');
const { User, Post, Comment, Like, sequelize } = require('../../server/src/models');

const UI = process.env.E2E_UI_URL || 'http://127.0.0.1:5173';
const API = process.env.E2E_API_URL || 'http://127.0.0.1:5000';

async function api(path, { method = 'GET', token, body } = {}) {
  return fetch(API + path, {
    method, headers: {
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test('FE-01 Chrome: post detail, comment, reply, likes, ownership and guest state', { timeout: 180000 }, async () => {
  const ci = process.env.GITHUB_ACTIONS === 'true' &&
    Boolean(process.env.RUNNER_TEMP) && process.env.DB_NAME === 'mini_study_network';
  const isolatedLocal = process.env.GITHUB_ACTIONS !== 'true' &&
    /^e2e01_[a-z0-9_]+$/.test(process.env.DB_NAME || '');
  if (process.env.E2E_DISPOSABLE_DB !== 'true' || process.env.NODE_ENV !== 'test' ||
      !['127.0.0.1', 'localhost'].includes(process.env.DB_HOST) ||
      !(ci || isolatedLocal)) {
    throw new Error('FE-01 refuses non-disposable DB / non-local test runtime.');
  }

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext();
  const anonymousCtx = await browser.newContext();
  const page = await ctx.newPage();
  const guest = await anonymousCtx.newPage();
  const ids = [];
  let postId;
  try {
    const suffix = randomUUID().slice(0, 10);
    const email = 'fe01-a-' + suffix + '@example.invalid';
    const password = 'E2eFE01safe2026';
    const title = 'FE01 browser question ' + suffix;

    await page.goto(UI + '/register');
    await page.locator('#full_name').fill('FE01 Student A');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    const registered = page.waitForResponse(r =>
      r.url().endsWith('/api/auth/register') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Đăng ký ngay' }).click();
    const reg = await registered;
    assert.equal(reg.status(), 201);
    const auth = (await reg.json()).data;
    ids.push(auth.user.id);
    await page.waitForURL(url => url.pathname === '/');
    console.log('FE01 PASS registration via actual React UI');

    const created = await api('/api/posts', {
      method: 'POST', token: auth.accessToken,
      body: { title, content: 'Nội dung thử nghiệm hỏi đáp FE01', post_type: 'question', subject: 'CNPM', tags: ['QA'] },
    });
    assert.equal(created.status, 201);
    postId = (await created.json()).data.id;
    await page.goto(UI + '/posts/' + postId);
    await page.getByRole('heading', { name: title, exact: true }).waitFor();
    await page.getByText('Nội dung thử nghiệm hỏi đáp FE01').waitFor();
    console.log('FE01 PASS post detail title/content and author view');

    const likePost = page.getByRole('button', { name: 'Thích hoặc bỏ thích bài viết' });
    await likePost.waitFor();
    await likePost.click();
    await page.locator('article').getByText('1 lượt thích').waitFor();
    await likePost.click();
    await page.locator('article').getByText('0 lượt thích').waitFor();
    console.log('FE01 PASS post like/unlike and authoritative count');

    const rootContent = 'FE01 root comment ' + suffix;
    await page.getByLabel('Viết bình luận').fill(rootContent);
    const creating = page.waitForResponse(r =>
      new URL(r.url()).pathname === '/api/comments' && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Gửi bình luận' }).click();
    const rootResponse = await creating;
    assert.equal(rootResponse.status(), 201);
    const rootId = (await rootResponse.json()).data.id;
    await page.getByText(rootContent, { exact: true }).waitFor();
    console.log('FE01 PASS create/display root comment');

    await page.getByRole('button', { name: 'Trả lời bình luận' }).click();
    const replyContent = 'FE01 reply comment ' + suffix;
    await page.getByLabel('Nội dung trả lời').fill(replyContent);
    const replying = page.waitForResponse(r =>
      new URL(r.url()).pathname === '/api/comments' && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Gửi trả lời' }).click();
    const replyResponse = await replying;
    assert.equal(replyResponse.status(), 201);
    const replyId = (await replyResponse.json()).data.id;
    await page.getByText(replyContent, { exact: true }).waitFor();
    console.log('FE01 PASS create/display one-level reply');

    const likeComment = page.getByRole('button', { name: 'Thích hoặc bỏ thích bình luận' }).first();
    await likeComment.click();
    await page.getByRole('list', { name: 'Danh sách bình luận' }).getByText('1 lượt thích').first().waitFor();
    console.log('FE01 PASS comment like');

    // Another student may read, but cannot delete Student A's comment.
    const bReg = await api('/api/auth/register', { method: 'POST', body: {
      full_name: 'FE01 Student B', email: 'fe01-b-' + suffix + '@example.invalid', password,
    } });
    assert.equal(bReg.status, 201);
    const bAuth = (await bReg.json()).data;
    ids.push(bAuth.user.id);
    const denied = await api('/api/comments/' + rootId, { method: 'DELETE', token: bAuth.accessToken });
    assert.equal(denied.status, 403, await denied.text());
    console.log('FE01 PASS server denies cross-user comment deletion 403');

    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Xóa bình luận #' + replyId }).click();
    await page.getByText(replyContent, { exact: true }).waitFor({ state: 'detached' });
    console.log('FE01 PASS owner deletes reply and list refreshes');

    // Responsive / touch-input regression. Browser emulation is NOT physical-device QA.
    const outputDir = path.join(process.env.RUNNER_TEMP || 'client/e2e', 'fe01-responsive');
    await fs.mkdir(outputDir, { recursive: true });
    const widths = [320, 375, 390, 768, 1280];
    for (const width of widths) {
      const mobile = width < 1024;
      const phone = await browser.newContext({
        storageState: await ctx.storageState(),
        viewport: { width, height: mobile ? 812 : 900 },
        isMobile: mobile,
        hasTouch: mobile,
        deviceScaleFactor: mobile ? 2 : 1,
      });
      try {
        const view = await phone.newPage();
        await view.goto(UI + '/posts/' + postId);
        await view.getByRole('heading', { name: title, exact: true }).waitFor();
        const dimensions = await view.evaluate(() => ({
          viewport: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          articleRight: document.querySelector('article')?.getBoundingClientRect().right,
        }));
        assert.ok(dimensions.documentWidth <= dimensions.viewport + 1,
          'Horizontal document overflow at ' + width + ': ' + JSON.stringify(dimensions));
        assert.ok(dimensions.bodyWidth <= dimensions.viewport + 1,
          'Horizontal body overflow at ' + width + ': ' + JSON.stringify(dimensions));
        assert.ok(dimensions.articleRight <= dimensions.viewport + 1,
          'Article spills outside viewport at ' + width + ': ' + JSON.stringify(dimensions));
        const taps = [
          view.getByRole('button', { name: 'Thích hoặc bỏ thích bài viết' }),
          view.getByRole('button', { name: 'Trả lời bình luận' }),
          view.getByRole('button', { name: 'Xóa bình luận #' + rootId }),
          view.getByRole('button', { name: 'Đăng xuất' }),
        ];
        for (const tap of taps) {
          const box = await tap.boundingBox();
          assert.ok(box && box.height >= 39,
            'Tap target too short at width ' + width + ': ' + JSON.stringify(box));
        }
        await view.screenshot({ path: path.join(outputDir, 'post-detail-' + width + '.png'), fullPage: true });
        console.log('FE01 RESPONSIVE PASS ' + width + 'px viewport and 40px touch targets');
        await phone.close();
      } finally {
        await phone.close().catch(() => {});
      }
    }
    // Guest mobile navigation must fit at 320px.
    await guest.setViewportSize({ width: 320, height: 740 });
    await guest.goto(UI + '/posts/' + postId);
    await guest.getByRole('heading', { name: 'Đăng nhập để xem bài viết' }).waitFor();
    const guestWidths = await guest.evaluate(() => ({
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert.ok(guestWidths.scrollWidth <= guestWidths.viewport + 1,
      'Guest navbar overflows at 320px: ' + JSON.stringify(guestWidths));
    console.log('FE01 RESPONSIVE PASS guest 320px navbar/login gate');
    await guest.goto(UI + '/posts/' + postId);
    await guest.getByRole('heading', { name: 'Đăng nhập để xem bài viết' }).waitFor();
    assert.equal(await guest.getByText(rootContent, { exact: true }).count(), 0);
    console.log('FE01 PASS guest login gate does not expose post/comment');

    await page.goto(UI + '/posts/999999999');
    await page.getByRole('heading', { name: 'Bài viết không tồn tại.' }).waitFor();
    console.log('FE01 PASS 404 state');
  } finally {
    // Disposable database only. Delete own fixture children before authors.
    try {
      if (postId) {
        const comments = await Comment.findAll({ where: { post_id: postId }, attributes: ['id'], raw: true });
        const commentIds = comments.map(c => c.id);
        if (commentIds.length) {
          await Like.destroy({ where: { target_type: 'comment', target_id: { [Op.in]: commentIds } } });
        }
        await Like.destroy({ where: { target_type: 'post', target_id: postId } });
        await Comment.destroy({ where: { post_id: postId, parent_id: { [Op.ne]: null } } });
        await Comment.destroy({ where: { post_id: postId } });
        await Post.destroy({ where: { id: postId } });
      }
      for (const id of ids) await User.destroy({ where: { id } });
    } finally {
      await ctx.close();
      await anonymousCtx.close();
      await browser.close();
      await sequelize.close();
    }
  }
});
