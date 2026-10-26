'use strict';
// FE66 P3: real Chromium -> Vite -> Express -> disposable MySQL 8.
// Run after existing E2E-01 and FE-01, in its own Node process.
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { chromium } = require('playwright');
const serverRequire = require('node:module').createRequire(require.resolve('../../server/package.json'));
const bcrypt = serverRequire('bcryptjs');
const { User, Post, Bookmark, Follow, Notification, ModerationAuditLog, sequelize } =
  require('../../server/src/models');
const UI = process.env.E2E_UI_URL || 'http://127.0.0.1:5173';
const API = process.env.E2E_API_URL || 'http://127.0.0.1:5000';

function guard() {
  const ci = process.env.GITHUB_ACTIONS === 'true' && Boolean(process.env.RUNNER_TEMP) &&
    process.env.DB_NAME === 'mini_study_network';
  const isolatedLocal = process.env.GITHUB_ACTIONS !== 'true' &&
    /^e2e01_[a-z0-9_]+$/.test(process.env.DB_NAME || '');
  if (process.env.E2E_DISPOSABLE_DB !== 'true' || process.env.NODE_ENV !== 'test' ||
      process.env.DB_AUTO_SYNC !== 'false' ||
      !['127.0.0.1', 'localhost'].includes(process.env.DB_HOST) ||
      !(ci || isolatedLocal)) {
    throw new Error('REFUSED: FE66 P3 requires isolated localhost MySQL with disposable E2E opt-in.');
  }
}
async function api(route, opts = {}) {
  const response = await fetch(API + route, {
    method: opts.method || 'GET',
    headers: {
      ...(opts.token ? { Authorization: 'Bearer ' + opts.token } : {}),
      ...(opts.body === undefined ? {} : { 'Content-Type': 'application/json' })
    },
    ...(opts.body === undefined ? {} : { body: JSON.stringify(opts.body) })
  });
  return { status: response.status, data: await response.json() };
}
async function register(page, name, email, password) {
  await page.goto(UI + '/register');
  await page.locator('#full_name').fill(name);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  const pending = page.waitForResponse(res =>
    new URL(res.url()).pathname === '/api/auth/register' && res.request().method() === 'POST');
  await page.getByRole('button', { name: 'Đăng ký ngay' }).click();
  const res = await pending;
  assert.equal(res.status(), 201, await res.text());
  await page.waitForURL(u => u.pathname === '/');
  return (await res.json()).data;
}
async function login(page, email, password) {
  await page.goto(UI + '/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  const pending = page.waitForResponse(res =>
    new URL(res.url()).pathname === '/api/auth/login' && res.request().method() === 'POST');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  const res = await pending;
  assert.equal(res.status(), 200, await res.text());
  await page.waitForURL(u => u.pathname === '/');
  return (await res.json()).data;
}
async function waitFor(condition, label, timeout = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await condition()) return;
    await new Promise(resolve => setTimeout(resolve, 140));
  }
  throw new Error('Timeout: ' + label);
}
async function step(name, fn) {
  await fn();
  console.log('FE66-P3 PASS ' + name);
}

test('FE66-P3 Chromium actual frontend interactions, DB/authorization and regression', {timeout:240000}, async () => {
  guard();
  const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
  const contextA = await browser.newContext({viewport:{width:1280,height:900}});
  const contextB = await browser.newContext({viewport:{width:1280,height:900}});
  const contextAdmin = await browser.newContext({viewport:{width:1280,height:900}});
  const contextGuest = await browser.newContext({viewport:{width:1280,height:900}});
  const page = await contextA.newPage();
  const bPage = await contextB.newPage();
  const adminPage = await contextAdmin.newPage();
  const guest = await contextGuest.newPage();
  const owned = [];
  const posts = [];
  const seed = randomUUID().slice(0,10);
  const A = {name:'P3 Alpha',email:'p3alpha-'+seed+'@example.invalid',password:'P3OriginalPass2026'};
  const B = {name:'P3 Beta',email:'p3beta-'+seed+'@example.invalid',password:'P3BetaPass2026'};
  const ADMIN = {email:'p3admin-'+seed+'@example.invalid',password:'P3AdminPass2026'};
  let authA, authB, question, other, admin;
  try {
    await sequelize.authenticate();
    const [[version]] = await sequelize.query('SELECT DATABASE() AS db, VERSION() AS version');
    assert.equal(version.db,process.env.DB_NAME);
    assert.match(version.version,/^8[.]/);
    await step('A/B registrations and isolated seeded questions',async()=>{
      authA = await register(page,A.name,A.email,A.password); owned.push(authA.user.id);
      authB = await register(bPage,B.name,B.email,B.password); owned.push(authB.user.id);
      const create = async (title, subject, type='question') => {
        const r = await api('/api/posts',{method:'POST',token:authA.accessToken,
          body:{title,content:'P3 automated test body',subject,post_type:type,tags:['P3']}});
        assert.equal(r.status,201,JSON.stringify(r.data));
        posts.push(r.data.data.id); return r.data.data;
      };
      question = await create('P3 Alpha ' + seed + ' unique search','CNPM');
      other = await create('P3 Other ' + seed + ' unrelated','CSDL','discussion');
      assert.ok(question.id && other.id);
    });

    await step('Bookmark UI save, list, refresh, remove and account isolation',async()=>{
      await page.goto(UI+'/posts/'+question.id);
      await page.getByRole('heading',{name:question.title,exact:true}).waitFor();
      await page.getByRole('button',{name:'Lưu bài viết'}).click();
      await waitFor(async()=> (await Bookmark.count({where:{user_id:authA.user.id,post_id:question.id}}))===1,'bookmark persisted');
      await page.goto(UI+'/bookmarks');
      await page.getByRole('heading',{name:'Bài viết đã lưu'}).waitFor();
      await page.getByRole('heading',{name:question.title,exact:true}).waitFor();
      await page.reload();
      await page.getByRole('heading',{name:question.title,exact:true}).waitFor();
      const card = page.locator('article').filter({has:page.getByRole('heading',{name:question.title,exact:true})});
      await card.getByRole('button',{name:'Bỏ lưu bài viết'}).click();
      await waitFor(async()=> (await Bookmark.count({where:{user_id:authA.user.id,post_id:question.id}}))===0,'bookmark removed');
      await page.getByText('Chưa có bài viết nào được lưu').waitFor();
      await bPage.goto(UI+'/bookmarks');
      await bPage.getByText('Chưa có bài viết nào được lưu').waitFor();
    });

    await step('Follow UI state, counters, modal, reload and unfollow',async()=>{
      await page.goto(UI+'/profile/'+authB.user.id);
      await page.getByRole('heading',{name:B.name,exact:true}).waitFor();
      await page.getByRole('button',{name:'Theo dõi',exact:true}).click();
      await page.getByRole('button',{name:'Đang theo dõi',exact:true}).waitFor();
      assert.equal(await Follow.count({where:{follower_id:authA.user.id,following_id:authB.user.id}}),1);
      await page.reload();
      await page.getByRole('button',{name:'Đang theo dõi',exact:true}).waitFor();
      await page.getByRole('button',{name:/1 Người theo dõi/}).click();
      const dialog=page.getByRole('dialog');
      await dialog.getByText(A.name).waitFor();
      await dialog.getByRole('button',{name:'Đóng'}).click();
      await page.getByRole('button',{name:'Đang theo dõi',exact:true}).click();
      await page.getByRole('button',{name:'Theo dõi',exact:true}).waitFor();
      assert.equal(await Follow.count({where:{follower_id:authA.user.id,following_id:authB.user.id}}),0);
    });

    await step('Profile edit UI survives refresh, student cannot edit another profile',async()=>{
      await page.goto(UI+'/profile/'+authA.user.id);
      await page.getByRole('button',{name:'Chỉnh sửa thông tin'}).click();
      await page.locator('#full_name').fill('P3 Alpha Updated');
      await page.locator('#bio').fill('P3 profile regression');
      await page.getByRole('button',{name:'Lưu thay đổi'}).click();
      await page.getByRole('heading',{name:'P3 Alpha Updated',exact:true}).waitFor();
      await page.reload();
      await page.getByRole('heading',{name:'P3 Alpha Updated',exact:true}).waitFor();
      assert.equal((await User.findByPk(authA.user.id)).bio,'P3 profile regression');
      await bPage.goto(UI+'/profile/'+authA.user.id);
      assert.equal(await bPage.getByRole('button',{name:'Chỉnh sửa thông tin'}).count(),0);
    });

    await step('Own post edit and delete; nonowner UI hidden and API 403',async()=>{
      await bPage.goto(UI+'/posts/'+question.id);
      await bPage.getByRole('heading',{name:question.title,exact:true}).waitFor();
      assert.equal(await bPage.getByRole('button',{name:'Sửa bài viết'}).count(),0);
      assert.equal(await bPage.getByRole('button',{name:'Xóa bài viết'}).count(),0);
      assert.equal((await api('/api/posts/'+question.id,
        {method:'DELETE',token:authB.accessToken})).status,403);
      await page.goto(UI+'/posts/'+question.id);
      await page.getByRole('button',{name:'Sửa bài viết'}).click();
      await page.locator('#edit-title').fill('P3 Edited ' + seed);
      await page.getByRole('button',{name:'Lưu thay đổi'}).click();
      await page.getByRole('heading',{name:'P3 Edited '+seed,exact:true}).waitFor();
      assert.equal((await Post.findByPk(question.id)).title,'P3 Edited '+seed);
      page.once('dialog',dialog=>dialog.accept());
      await page.getByRole('button',{name:'Xóa bài viết'}).click();
      await page.waitForURL(u=>u.pathname==='/');
      assert.equal((await Post.findByPk(question.id)).status,'deleted');
    });

    await step('Notifications unread badge, item click/read and read-all in React',async()=>{
      const first=await Notification.create({
        recipient_id:authA.user.id,actor_id:authB.user.id,event_type:'comment',
        post_id:other.id,is_read:false
      });
      await Notification.create({
        recipient_id:authA.user.id,actor_id:authB.user.id,event_type:'follow',
        is_read:false
      });
      await page.goto(UI+'/');
      await page.getByRole('button',{name:'Thông báo'}).click();
      await page.getByRole('heading',{name:'Thông báo'}).waitFor();
      await page.getByText('Đã bình luận về bài viết của bạn').first().waitFor();
      // Click first unread comment event; navigation must use actual post id.
      const pending=page.waitForResponse(res=>
        new URL(res.url()).pathname==='/api/users/me/notifications/'+first.id+'/read' &&
        res.request().method()==='PATCH');
      await page.getByText('Đã bình luận về bài viết của bạn').first().click();
      assert.equal((await pending).status(),200);
      await page.waitForURL(u=>u.pathname==='/posts/'+other.id);
      assert.equal((await Notification.findByPk(first.id)).is_read,true);
      await page.getByRole('button',{name:'Thông báo'}).click();
      await page.getByRole('button',{name:'Đọc tất cả'}).click();
      await waitFor(async()=> (await Notification.count({where:{recipient_id:authA.user.id,is_read:false}}))===0,'read-all state');
    });

    await step('Search and category filtering reflected in browser result/URL',async()=>{
      await page.goto(UI+'/');
      await page.getByPlaceholder('Tìm kiếm bài viết, tài liệu...').fill('P3 Other '+seed);
      await page.getByPlaceholder('Tìm kiếm bài viết, tài liệu...').press('Enter');
      await page.waitForURL(u=>u.searchParams.get('search')==='P3 Other '+seed);
      await page.getByRole('heading',{name:other.title,exact:true}).waitFor();
      await page.getByRole('button',{name:'Xóa từ khóa tìm kiếm'}).click();
      await page.waitForURL(u=>!u.searchParams.has('search'));
      await page.getByRole('button',{name:'Thảo luận'}).last().click();
      await page.getByRole('heading',{name:other.title,exact:true}).waitFor();
      assert.equal(await page.getByRole('heading',{name:'P3 Edited '+seed,exact:true}).count(),0);
    });

    await step('Admin route guarded for guest/student, admin moderation UI and audit filter',async()=>{
      await guest.goto(UI+'/admin/audit-logs');
      await guest.waitForURL(u=>u.pathname==='/login');
      await bPage.goto(UI+'/admin/audit-logs');
      await bPage.waitForURL(u=>u.pathname==='/');
      assert.equal((await api('/api/posts/moderation/audit-logs',{token:authB.accessToken})).status,403);
      admin=await User.create({
        full_name:'P3 Administrator',email:ADMIN.email,
        password_hash:await bcrypt.hash(ADMIN.password,10),role:'admin',is_active:true
      });
      owned.push(admin.id);
      await login(adminPage,ADMIN.email,ADMIN.password);
      await adminPage.goto(UI+'/admin/audit-logs');
      await adminPage.getByRole('heading',{name:/Quản trị viên — Nhật ký kiểm duyệt/}).waitFor();
      await adminPage.locator('#mod-post-id').fill(String(other.id));
      adminPage.once('dialog',dialog=>dialog.accept());
      await adminPage.getByRole('button',{name:'Xác nhận kiểm duyệt'}).click();
      await waitFor(async()=> (await Post.findByPk(other.id)).status==='hidden','moderation status');
      await adminPage.getByText('Bị ẩn (hidden)').first().waitFor();
      await adminPage.locator('#filter-post-id').fill(String(other.id));
      await adminPage.getByRole('button',{name:'Lọc nhật ký'}).click();
      await adminPage.getByRole('link',{name:'Bài #'+other.id}).first().waitFor();
      assert.equal(await ModerationAuditLog.count({where:{post_id:other.id}}),1);
    });

    await step('Password update UI rejects old login, new credential succeeds',async()=>{
      await page.goto(UI+'/profile/'+authA.user.id);
      await page.getByRole('button',{name:'Đổi mật khẩu',exact:true}).click();
      await page.locator('#current_password').fill(A.password);
      await page.locator('#new_password').fill('P3ChangedPass2026');
      await page.locator('#confirm_password').fill('P3ChangedPass2026');
      const pending=page.waitForResponse(res=>
        new URL(res.url()).pathname==='/api/users/change-password' &&
        res.request().method()==='PUT');
      await page.getByRole('button',{name:'Đổi mật khẩu',exact:true}).last().click();
      assert.equal((await pending).status(),200);
      assert.equal((await api('/api/auth/login',{method:'POST',
        body:{email:A.email,password:A.password}})).status,401);
      assert.equal((await api('/api/auth/login',{method:'POST',
        body:{email:A.email,password:'P3ChangedPass2026'}})).status,200);
    });
  } finally {
    try {
      // Per-test owned fixtures only, never global wipe; CI isolated DB.
      if (posts.length) await ModerationAuditLog.destroy({where:{post_id:posts}}).catch(()=>{});
      if (owned.length) await User.destroy({where:{id:owned}}).catch(()=>{});
    } finally {
      for (const c of [contextA,contextB,contextAdmin,contextGuest]) await c.close().catch(()=>{});
      await browser.close().catch(()=>{});
      await sequelize.close().catch(()=>{});
    }
  }
});
