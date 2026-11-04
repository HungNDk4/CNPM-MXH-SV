const { chromium } = require('../client/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const CLIENT_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots/mascots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  const browser = await chromium.launch({ headless: true });

  // 1. Light Mode Gallery
  const lightCtx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const lightPage = await lightCtx.newPage();
  await lightPage.goto(`${CLIENT_URL}/mascot-gallery`, { waitUntil: 'networkidle' });
  await lightPage.waitForTimeout(800);
  await lightPage.screenshot({ path: path.join(SCREENSHOT_DIR, '00_mascot_system_overview_light.png'), fullPage: false });

  // Capture individual cards
  const cards = await lightPage.locator('div.grid > div').all();
  const names = [
    '01_mascot_feed_đọc_sách',
    '02_mascot_search_kính_lúp',
    '03_mascot_notifications_chuông_vàng',
    '04_mascot_documents_tài_liệu_pdf',
    '05_mascot_profile_mũ_cử_nhân',
    '06_mascot_bookmarks_ruy_băng',
  ];

  for (let i = 0; i < cards.length && i < names.length; i++) {
    await cards[i].screenshot({ path: path.join(SCREENSHOT_DIR, `${names[i]}.png`) });
    console.log(`Saved ${names[i]}.png`);
  }
  await lightCtx.close();

  // 2. Dark Mode Gallery
  const darkCtx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const darkPage = await darkCtx.newPage();
  await darkPage.goto(`${CLIENT_URL}/mascot-gallery`, { waitUntil: 'networkidle' });
  await darkPage.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });
  await darkPage.waitForTimeout(800);
  await darkPage.screenshot({ path: path.join(SCREENSHOT_DIR, '00_mascot_system_overview_dark.png'), fullPage: false });
  console.log('Saved 00_mascot_system_overview_dark.png');
  await darkCtx.close();

  await browser.close();
  console.log('All gallery screenshots taken successfully!');
}

capture().catch(console.error);

