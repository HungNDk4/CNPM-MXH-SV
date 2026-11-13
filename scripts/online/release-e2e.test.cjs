'use strict';
// Real Chromium against production-built Express + React, disposable MySQL only.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
if (process.env.GITHUB_ACTIONS !== 'true' || !process.env.RUNNER_TEMP ||
    process.env.ONLINE_RELEASE_QA_DISPOSABLE !== 'true' ||
    process.env.NODE_ENV !== 'production' ||
    process.env.DB_HOST !== '127.0.0.1' ||
    process.env.DB_NAME !== 'mini_study_network' ||
    process.env.DB_AUTO_SYNC !== 'false') {
  throw Error('REFUSED: production bundle browser tests need disposable GitHub MySQL8');
}
const playwright = createRequire(path.resolve(__dirname, '../../client/package.json'))('playwright');
const dbRequire = createRequire(path.resolve(__dirname, '../../server/package.json'));
const bcrypt = dbRequire('bcryptjs');
const { User, sequelize, Post } = require('../../server/src/models');
const root = 'http://127.0.0.1:5000';
const out = path.join(process.env.RUNNER_TEMP, 'online-release-screenshots');
fs.mkdirSync(out, { recursive: true });
async function api(endpoint, options = {}) {
  const r = await fetch(root + endpoint, options);
  const ct = r.headers.get('content-type') || '';
  return { status: r.status, body: ct.includes('application/json') ? await r.json() : await r.arrayBuffer() };
}
async function ss(page, filename) {
  await page.screenshot({ path: path.join(out, filename), animations: 'disabled' });
  assert.ok(fs.statSync(path.join(out, filename)).size > 10000);
}
test('Production compiled bundle: auth, posts, PDF, Admin, route refresh', {timeout:240000}, async () => {
  const browser = await playwright.chromium.launch({headless:true,args:['--no-sandbox']});
  const browserA = await browser.newContext({ viewport: {width:1440,height:900}});
  const browserAdmin = await browser.newContext({ viewport: {width:1440,height:900}});
  const guest = await browser.newContext({viewport:{width:1440,height:900}});
  const page = await browserA.newPage(), adminPage = await browserAdmin.newPage(), guestPage = await guest.newPage();
  const seed = randomUUID().slice(0,10), password = 'QaReleasePass2026';
  try {
    await sequelize.authenticate();
    assert.equal((await api('/api/health')).status,200);
    await guestPage.goto(root + '/admin/users');
    await guestPage.waitForURL(u=>u.pathname==='/login');
    await ss(guestPage,'01-guest-admin-guard.png');

    const got = await page.goto(root+'/register');
    assert.equal(got.status(),200);
    await page.locator('#full_name').fill('Release Student');
    await page.locator('#email').fill('release-'+seed+'@example.invalid');
    await page.locator('#password').fill(password);
    const created = page.waitForResponse(r => r.url().endsWith('/api/auth/register'));
    await page.getByRole('button',{name:'Đăng ký ngay'}).click();
    const registerResponse = await created;
    assert.equal(registerResponse.status(),201,await registerResponse.text());
    const { user,accessToken } = (await registerResponse.json()).data;
    await page.waitForURL(u=>u.pathname==='/');

    const post = await api('/api/posts', {method:'POST',
      headers:{'content-type':'application/json', authorization:'Bearer '+accessToken},
      body:JSON.stringify({title:'Production QA '+seed,content:'Bài viết kiểm thử',post_type:'question',subject:'CNPM'})});
    assert.equal(post.status,201,JSON.stringify(post.body));
    await page.goto(root+'/my-posts');
    await page.getByText('Production QA '+seed).waitFor({timeout:15000});
    await ss(page,'02-my-posts-production-bundle.png');

    // An actual PDF survives the upload/download path on the isolated filesystem.
    const pdf = new Blob([Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n')], {type:'application/pdf'});
    const fd = new FormData(); fd.append('file',pdf,'qa.pdf'); fd.append('title','QA PDF '+seed);
    const saved = await api('/api/documents',{method:'POST', headers:{authorization:'Bearer '+accessToken},body:fd});
    assert.equal(saved.status,201,JSON.stringify(saved.body));
    const pdfId = saved.body.data.id;
    assert.equal((await api('/api/documents/'+pdfId+'/download')).status,401);
    const download = await api('/api/documents/'+pdfId+'/download',{headers:{authorization:'Bearer '+accessToken}});
    assert.equal(download.status,200);
    assert.ok(download.body.byteLength>20);

    const hash = await bcrypt.hash(password,10);
    const admin = await User.create({full_name:'Release QA Admin',email:'qa-admin-'+seed+'@example.invalid',
      password_hash:hash,role:'admin',is_active:true});
    await adminPage.goto(root+'/login');
    await adminPage.locator('#email').fill(admin.email);
    await adminPage.locator('#password').fill(password);
    const login = adminPage.waitForResponse(r=>r.url().endsWith('/api/auth/login'));
    await adminPage.getByRole('button',{name:'Đăng nhập',exact:true}).click();
    assert.equal((await login).status(),200);
    await adminPage.goto(root+'/admin/users');
    await adminPage.getByText('Release Student').waitFor({timeout:15000});
    await ss(adminPage,'03-admin-list-production-bundle.png');

    const item = adminPage.locator('article').filter({hasText:user.email});
    await item.getByRole('button',{name:'Khóa tài khoản'}).click();
    const dialog = adminPage.getByRole('dialog');
    await dialog.getByPlaceholder('Nhập lý do cụ thể cho thao tác này').fill('Kiểm thử khóa trên production bundle');
    await dialog.getByRole('button',{name:'Xác nhận khóa'}).click();
    await dialog.waitFor({state:'hidden'});
    await item.getByText('Đã khóa',{exact:true}).waitFor({timeout:15000});
    assert.equal((await api('/api/posts/my',{headers:{authorization:'Bearer '+accessToken}})).status,401);
    await ss(adminPage,'04-admin-locked-production-bundle.png');

    const asset = await page.goto(root+'/register');
    assert.equal(asset.status(),200,'SPA direct refresh must serve React index');
    const notFoundApi = await api('/api/does-not-exist');
    assert.equal(notFoundApi.status,404,'unknown API must not serve React HTML');
    console.log('PASS actual browser + authenticated API + PDF + admin + SPA same-origin bundle');
  } finally {
    await Promise.all([browserA.close(),browserAdmin.close(),guest.close()]);
    await browser.close();
    await sequelize.close();
  }
});