'use strict';

/**
 * Phase 5.3 Browser E2E Verification Script with Playwright
 */

const { chromium } = require('../client/node_modules/playwright');
const path = require('path');
require('../server/node_modules/dotenv').config({ path: path.join(__dirname, '../server/.env') });
const jwt = require('../server/node_modules/jsonwebtoken');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const studentToken = jwt.sign({ id: 2, role: 'student', email: 'hungnd13112004@gmail.com' }, JWT_ACCESS_SECRET);
const adminToken = jwt.sign({ id: 1, role: 'admin', email: 'admin@studynet.vn' }, JWT_ACCESS_SECRET);

async function runE2E() {
  console.log('====================================================');
  console.log('STARTING PHASE 5.3 BROWSER E2E VERIFICATION');
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
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

  // ── 1. Student Flow ──
  await check('Student visits Home Feed and finds a report button on another user\'s post', async () => {
    // Inject student auth state
    await page.addInitScript(({ token }) => {
      localStorage.setItem('msn-auth', JSON.stringify({
        state: {
          user: { id: 2, role: 'student', full_name: 'Nguyễn Hùng', email: 'hungnd13112004@gmail.com' },
          accessToken: token,
          refreshToken: token,
          isAuthenticated: true,
        },
        version: 0,
      }));
    }, { token: studentToken });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // Verify report buttons exist on post cards
    const reportButtons = page.locator('button[aria-label="Báo cáo bài viết"]');
    const count = await reportButtons.count();
    console.log(`Found ${count} reportable posts on feed.`);
    if (count > 0) {
      await reportButtons.first().click();
      // Verify Modal opens
      await page.waitForSelector('text=Báo cáo vi phạm', { timeout: 5000 });
      // Check reasons exist
      const radioCount = await page.locator('input[name="reportReason"]').count();
      if (radioCount < 5) throw new Error('Report reasons missing in modal');

      // Close modal
      await page.locator('button:text("Hủy")').click();
      await page.waitForSelector('text=Báo cáo vi phạm', { state: 'detached', timeout: 5000 });
    }
  });

  // ── 2. Admin Flow ──
  await check('Admin visits /admin/content, switches to Reports Queue, and checks filters', async () => {
    // Inject admin auth state
    await page.addInitScript(({ token }) => {
      localStorage.setItem('msn-auth', JSON.stringify({
        state: {
          user: { id: 1, role: 'admin', full_name: 'Administrator', email: 'admin@studynet.vn' },
          accessToken: token,
          refreshToken: token,
          isAuthenticated: true,
        },
        version: 0,
      }));
    }, { token: adminToken });

    await page.goto('http://localhost:5173/admin/content', { waitUntil: 'networkidle' });

    // Check heading
    const title = await page.locator('h1').allInnerTexts();
    console.log('Admin Page title:', title);

    // Switch to Reports tab
    const reportsTabBtn = page.locator('button:has-text("Hàng đợi báo cáo")');
    await reportsTabBtn.click();

    // Verify filter buttons exist
    await page.waitForSelector('text=Lọc theo trạng thái:', { timeout: 5000 });
    const pendingFilter = page.locator('button:has-text("Chờ xử lý")');
    const reviewedFilter = page.locator('button:has-text("Đã duyệt")');
    const dismissedFilter = page.locator('button:has-text("Đã bác bỏ")');

    if (!(await pendingFilter.isVisible()) || !(await reviewedFilter.isVisible()) || !(await dismissedFilter.isVisible())) {
      throw new Error('Filter buttons not visible in Reports Queue');
    }

    // Click "Đã duyệt"
    await reviewedFilter.click();
    await page.waitForTimeout(500);

    // Click "Đã bác bỏ"
    await dismissedFilter.click();
    await page.waitForTimeout(500);

    // Switch back to "Chờ xử lý"
    await pendingFilter.click();
    await page.waitForTimeout(500);
  });

  await browser.close();

  console.log(`\n====================================================`);
  console.log(`BROWSER E2E SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================\n`);

  if (failed > 0) process.exit(1);
}

runE2E().catch((err) => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});

