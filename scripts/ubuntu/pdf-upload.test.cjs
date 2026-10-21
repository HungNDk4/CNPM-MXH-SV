'use strict';
// DOC-03 live multipart upload regression against disposable MySQL 8.
// The test creates synthetic PDFs in memory and cleans only its own records/files.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');

process.env.NODE_ENV = 'test';
const app = require('../../server/src/app');
const { sequelize, User, Post, DocumentFile } = require('../../server/src/models');
const storage = require('../../server/src/services/private-document-storage');

test('DOC-03 PDF upload: one private 10 MiB max file, safe metadata, cleanup', { timeout: 120000 }, async () => {
  const srv = http.createServer(app);
  const userIds = [];
  const keys = [];
  let origin, opened = false;
  let checked = 0;
  const seed = crypto.randomUUID().slice(0, 14);
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n');
  async function request(route, options = {}) {
    const res = await fetch(origin + route, options);
    const raw = await res.text();
    let body;
    try { body = JSON.parse(raw); } catch { body = null; }
    return { status: res.status, raw, body, headers: res.headers };
  }
  function form(file = pdf, filename = 'sample.pdf', mime = 'application/pdf', extra = {}) {
    const data = new FormData();
    data.set('title', 'DOC03 synthetic ' + seed);
    data.set('description', 'Mô tả hợp lệ');
    data.set('subject', 'CNPM');
    data.set('tags', JSON.stringify(['pdf', 'test']));
    if (file !== null) data.append('file', new Blob([file], { type: mime }), filename);
    for (const [k,v] of Object.entries(extra)) data.append(k, v);
    return data;
  }
  const postForm = (token, data) => request('/api/documents', {
    method: 'POST', headers: token ? { Authorization: 'Bearer ' + token } : {},
    body: data
  });
  async function step(name, fn) {
    await fn();
    console.log('PASS DOC03 [' + String(++checked).padStart(2, '0') + '] ' + name);
  }
  try {
    await sequelize.authenticate();
    await new Promise((resolve,reject) => { srv.once('error',reject); srv.listen(0,'127.0.0.1',resolve); });
    opened = true;
    origin = 'http://127.0.0.1:' + srv.address().port;

    let token, id;
    await step('Register isolated student', async () => {
      const r = await request('/api/auth/register', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ full_name:'DOC03 Student', email:'doc03-'+seed+'@example.test',password:'Synthetic-Password-2026' })
      });
      assert.equal(r.status,201);
      id = r.body.data.user.id;
      userIds.push(id);
      token = r.body.data.accessToken;
    });

    await step('Guest cannot upload bytes', async () => {
      const r = await postForm(null,form());
      assert.equal(r.status,401);
    });

    await step('Valid PDF creates active free Post with private storage row', async () => {
      const r=await postForm(token,form());
      assert.equal(r.status,201,JSON.stringify(r.body));
      assert.equal(r.body.data.post_type,'document');
      assert.equal(r.body.data.status,'active');
      assert.equal(r.body.data.price,'0.00');
      assert.equal(r.body.data.content,'Mô tả hợp lệ');
      for(const forbidden of ['storage_key','file_url','file_name','original_name','sha256']) {
        assert.ok(!r.raw.includes(forbidden),'sensitive field '+forbidden);
      }
      const row=await DocumentFile.findOne({where:{post_id:r.body.data.id}});
      assert.ok(row);
      keys.push(row.storage_key);
      assert.equal(row.size_bytes,pdf.length);
      assert.equal(row.sha256,crypto.createHash('sha256').update(pdf).digest('hex'));
      assert.equal((await Post.findByPk(r.body.data.id)).status,'active');
      const stored=await require('node:fs/promises').readFile(storage.filePath(row.storage_key));
      assert.deepEqual(stored,pdf);
    });

    await step('Guest metadata safe; raw static and missing download remain unavailable', async()=>{
      const feed=await request('/api/posts?type=document');
      assert.equal(feed.status,200);
      assert.ok(feed.body.data.some(p=>p.title==='DOC03 synthetic '+seed));
      assert.ok(!feed.raw.includes('storage_key'));
      const dir=storage.filePath(keys[0]);
      const raw=await request('/uploads/'+keys[0]);
      assert.equal(raw.status,404);
      assert.ok(!raw.raw.includes('%PDF-'));
      assert.ok(!feed.raw.includes(dir));
    });

    await step('Missing file and double-file request rejected', async()=>{
      assert.equal((await postForm(token,form(null))).status,422);
      const multi=form();
      multi.append('file',new Blob([pdf],{type:'application/pdf'}),'another.pdf');
      assert.equal((await postForm(token,multi)).status,422);
    });

    await step('Fake PDF bytes and wrong extension rejected', async()=>{
      assert.equal((await postForm(token,form(Buffer.from('NOT-PDF'), 'fake.pdf'))).status,415);
      assert.equal((await postForm(token,form(pdf, 'fake.exe'))).status,415);
      assert.equal((await postForm(token,form(pdf, 'fake.pdf', 'application/octet-stream'))).status,415);
      assert.equal((await postForm(token,form(Buffer.alloc(0)))).status,415);
    });

    await step('Oversize 10 MiB + 1 byte rejected HTTP 413', async()=>{
      const oversized=Buffer.alloc(10*1024*1024+1,0x20);
      oversized.write('%PDF-',0);
      oversized.write('%%EOF',oversized.length-5);
      const r=await postForm(token,form(oversized));
      assert.equal(r.status,413,JSON.stringify(r.body));
    });

    await step('Inclusive 10 MiB boundary accepted, if PDF signatures valid', async()=>{
      const exact=Buffer.alloc(10*1024*1024,0x20);
      exact.write('%PDF-',0);
      exact.write('%%EOF',exact.length-5);
      const r=await postForm(token,form(exact));
      assert.equal(r.status,201,JSON.stringify(r.body));
      const file=await DocumentFile.findOne({where:{post_id:r.body.data.id}});
      assert.equal(file.size_bytes,10485760);
      keys.push(file.storage_key);
    });

    await step('No rejected request left extra Post or blob', async()=>{
      const rows=await Post.count({where:{user_id:id,post_type:'document'}});
      assert.equal(rows,2);
      const files=await DocumentFile.count({where:{storage_key:keys}});
      assert.equal(files,2);
    });

    console.log('DOC-03 RESULT: '+checked+'/'+checked+' PASS; fixture cleanup follows');
  } finally {
    if(userIds.length) await User.destroy({where:{id:userIds}}).catch(()=>{});
    for(const key of keys) await storage.remove(key).catch(()=>{});
    if(opened) await new Promise(resolve=>srv.close(resolve));
    await sequelize.close();
  }
});
