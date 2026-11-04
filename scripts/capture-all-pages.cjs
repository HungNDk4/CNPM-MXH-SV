const { chromium } = require('../client/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const CLIENT_URL = 'http://localhost:5173';
const OUTPUT_DIR = path.resolve(__dirname, '../screenshots/all_pages');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function checkBrokenImages(page, pageName) {
  const imageReport = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const broken = [];
    imgs.forEach(img => {
      // Check if image failed to load or has 0 natural width/height
      if (!img.complete || img.naturalWidth === 0) {
        // Ignore images that have display:none or hidden
        const style = window.getComputedStyle(img);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          broken.push({
            src: img.src,
            alt: img.alt || '(no alt)',
            currentSrc: img.currentSrc,
          });
        }
      }
    });
    return {
      total: imgs.length,
      broken: broken,
    };
  });

  if (imageReport.broken.length > 0) {
    console.warn(`  [WARN] ${pageName}: Found ${imageReport.broken.length} broken image(s):`, imageReport.broken);
  } else {
    console.log(`  [OK] ${pageName}: ${imageReport.total} images checked, 0 broken.`);
  }
  return imageReport.broken;
}

async function run() {
  console.log('====================================================');
  console.log('CAPTURING ALL PAGES & CHECKING FOR BROKEN IMAGES');
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  const allBrokenImages = [];

  for (const theme of ['light', 'dark']) {
    console.log(`\n>>> STARTING THEME: ${theme.toUpperCase()} <<<`);
    const context = await browser.newContext({
      viewport: { width: 1366, height: 900 },
      colorScheme: theme,
    });
    const page = await context.newPage();

    // 1. Login as student
    console.log(`Logging in as student (${theme})...`);
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'student@study.edu.vn');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // Apply dark class on html if theme is dark
    if (theme === 'dark') {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      });
      await page.waitForTimeout(300);
    } else {
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      });
      await page.waitForTimeout(300);
    }

    // Helper capture function
    async function capture(urlPath, filename, pageName) {
      console.log(`Navigating to ${pageName} (${urlPath})...`);
      await page.goto(`${CLIENT_URL}${urlPath}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      if (theme === 'dark') {
        await page.evaluate(() => document.documentElement.classList.add('dark'));
      }
      const broken = await checkBrokenImages(page, `${pageName} [${theme}]`);
      if (broken.length > 0) {
        allBrokenImages.push({ page: `${pageName} [${theme}]`, broken });
      }
      const shotPath = path.join(OUTPUT_DIR, `${filename}_${theme}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      console.log(`  Saved screenshot: ${shotPath}`);
    }

    // 1. Home Page
    await capture('/', '01_home', 'Home Feed');

    // Find first post link and document link from feed or direct routes
    const firstPostLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href^="/posts/"]'));
      return links.length > 0 ? links[0].getAttribute('href') : '/posts/1';
    });
    const firstDocLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href^="/documents/"]'));
      return links.length > 0 ? links[0].getAttribute('href') : '/documents/1';
    });

    // 2. Post Detail Page
    await capture(firstPostLink, '02_post_detail', 'Post Detail');

    // 3. Document Detail Page
    await capture(firstDocLink, '03_document_detail', 'Document Detail');

    // 4. Profile Page (Student Profile)
    await capture('/profile/2', '04_profile', 'Profile Campus Card');

    // 5. Search Page
    await capture('/search?search=react', '05_search_results', 'Search with Results');
    await capture('/search?search=xyznonexistentterm999', '05_search_empty', 'Search Empty (Mascot)');

    // 6. Bookmarks Page
    await capture('/bookmarks', '06_bookmarks', 'Bookmarks');

    // 7. Notifications Page
    await capture('/notifications', '07_notifications', 'Notifications');

    // 8. Settings Page (Avatar & Preferences)
    await capture('/settings', '08_settings', 'Settings (Avatar Upload)');

    // 9. Mascot Gallery Showcase
    await capture('/mascot-gallery', '09_mascot_gallery', 'Mascot Gallery');

    // 10. Admin Content Moderation (login as admin)
    console.log(`Switching to Admin account (${theme})...`);
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@study.edu.vn');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    if (theme === 'dark') {
      await page.evaluate(() => document.documentElement.classList.add('dark'));
    }

    await capture('/admin/content', '10_admin_content', 'Admin Content Moderation');

    await context.close();
  }

  await browser.close();

  console.log('\n====================================================');
  console.log('SCREENSHOT CAPTURE & IMAGE HEALTH CHECK SUMMARY');
  console.log('====================================================');
  if (allBrokenImages.length === 0) {
    console.log('🎉 100% PASS: All pages captured successfully with ZERO broken images!');
  } else {
    console.warn(`⚠️ Warning: Found broken images on ${allBrokenImages.length} page(s):`);
    console.warn(JSON.stringify(allBrokenImages, null, 2));
  }
}

run().catch(err => {
  console.error('Fatal error during capture script:', err);
  process.exit(1);
});
