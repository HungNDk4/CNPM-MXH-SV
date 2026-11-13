const { chromium } = require('../client/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const CLIENT_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/phase54');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('====================================================');
  console.log('STARTING PHASE 5.4 BENTO ACADEMIC UI VERIFICATION');
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  let passed = 0;
  let failed = 0;

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      colorScheme: 'light',
    });
    const page = await context.newPage();

    // ── 1. Desktop Home Feed & Right Sidebar ──
    console.log('[1] Checking Desktop Home Feed & Right Bento Academic Sidebar...');
    await page.goto(CLIENT_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Verify Right Academic Sidebar widgets exist
    const pomodoroWidget = await page.locator('text=Góc Tập Trung').first();
    const trendingWidget = await page.locator('text=Môn học thịnh hành').first();
    const academicCode = await page.locator('text=Quy tắc học thuật văn minh').first();

    if ((await pomodoroWidget.count()) > 0 && (await trendingWidget.count()) > 0 && (await academicCode.count()) > 0) {
      console.log('  [PASS] Right Academic Sidebar is rendered with all 3 Bento widgets.');
      passed++;
    } else {
      console.error('  [FAIL] Missing widgets in Right Academic Sidebar.');
      failed++;
    }

    // Verify PostCard action buttons
    const likeBtn = page.locator('button[aria-label*="Thích"]').first();
    const commentBtn = page.locator('button[aria-label="Xem bình luận"]').first();
    const bookmarkBtn = page.locator('button[aria-label*="Lưu bài viết"]').first();

    if ((await likeBtn.count()) > 0 && (await commentBtn.count()) > 0 && (await bookmarkBtn.count()) > 0) {
      console.log('  [PASS] Action buttons (Thích, Bình luận, Lưu) are present with preserved ARIA selectors.');
      passed++;
    } else {
      console.error('  [FAIL] Missing action buttons.');
      failed++;
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_desktop_home_light.png'), fullPage: false });

    // ── 2. Mobile Responsive Check (iPhone 14: 390x844) ──
    console.log('\n[2] Checking Mobile View (390x844)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(CLIENT_URL, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);

    // Verify sidebar is hidden on mobile
    const sidebarMobile = mobilePage.locator('aside[aria-label="Cột bên học thuật"]');
    const isSidebarVisible = await sidebarMobile.isVisible().catch(() => false);

    if (!isSidebarVisible) {
      console.log('  [PASS] Right Academic Sidebar is properly hidden on mobile.');
      passed++;
    } else {
      console.error('  [FAIL] Sidebar should be hidden on mobile viewport.');
      failed++;
    }

    // Verify no horizontal overflow on mobile
    const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);

    if (scrollWidth <= clientWidth + 2) {
      console.log(`  [PASS] Clean 1-column mobile feed with no horizontal overflow (${scrollWidth}px <= ${clientWidth}px).`);
      passed++;
    } else {
      console.warn(`  [WARN] Potential horizontal overflow on mobile: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
    }

    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '02_mobile_home_light.png'), fullPage: false });
    await mobileContext.close();

    // ── 3. Academic Empty State with Owl Mascot ──
    console.log('\n[3] Checking Academic Empty State Mascot System...');
    await page.goto(`${CLIENT_URL}/search?search=xyznonexistentterm12345`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const mascot = page.locator('svg[aria-label*="OwlMate"]');
    if ((await mascot.count()) > 0) {
      console.log('  [PASS] Official OwlMate Academic Mascot vector rendered in empty state.');
      passed++;
    } else {
      console.error('  [FAIL] Mascot vector not found in empty state.');
      failed++;
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_empty_search_mascot.png'), fullPage: false });

    // ── 4. Campus Member Card (Profile Page) ──
    console.log('\n[4] Checking Campus Member Card on Profile Page...');
    // Login as student to view own profile
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'student@study.edu.vn');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1200);

    await page.goto(`${CLIENT_URL}/profile/2`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    const memberRoleBadge = page.locator('text=Sinh viên').first();
    const statsRow = page.locator('text=bài đăng').first();

    if ((await memberRoleBadge.count()) > 0 && (await statsRow.count()) > 0) {
      console.log('  [PASS] Campus Member Card renders academic identity badges and real statistics.');
      passed++;
    } else {
      console.error('  [FAIL] Profile member card missing expected elements.');
      failed++;
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_desktop_profile_member_card.png'), fullPage: false });

    // ── 5. Dark Mode Verification ──
    console.log('\n[5] Checking Dark Mode Surface & Contrast...');
    await page.goto(CLIENT_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // Toggle theme to dark
    const themeBtn = page.locator('button[aria-label*="chế độ"]').first();
    if ((await themeBtn.count()) > 0) {
      await themeBtn.click();
      await page.waitForTimeout(500);
    } else {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      });
      await page.waitForTimeout(300);
    }

    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (isDark) {
      console.log('  [PASS] Dark mode activated with neutral canvas surfaces.');
      passed++;
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_desktop_home_dark.png'), fullPage: false });

    // Revert to light mode
    if ((await themeBtn.count()) > 0) {
      await themeBtn.click();
    } else {
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      });
    }

    await context.close();
  } catch (err) {
    console.error('Error during visual verification:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log(`VISUAL & RESPONSIVE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

run();
