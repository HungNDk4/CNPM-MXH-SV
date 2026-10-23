'use strict';
// DOC-04: real MySQL, real filesystem, two synthetic students, no real PDFs.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const path = require('node:path');
const http = require('node:http');
const fs = require('node:fs/promises');
process.env.NODE_ENV = 'test';
const app = require('../../server/src/app');
const { sequelize, User, Post, DocumentFile } = require('../../server/src/models');
const storage = require('../../server/src/services/private-document-storage');

test('DOC-04 authenticated attachment download + visibility', {timeout:90000}, async()=>{
  const server=http.createServer(app), ids=[], keys=[];
  let opened=false,origin,steps=0;
  const seed=crypto.randomUUID().slice(0,12);
  const pdf=Buffer.from('%PDF-1.4\n1 0 obj <</Type/Catalog>> endobj\n%%EOF\n');
  async function send(route,opts={}){
    const r=await fetch(origin+route,opts);
    const bytes=Buffer.from(await r.arrayBuffer());
    let json=null;try{json=JSON.parse(bytes.toString())}catch{}
    return {status:r.status,bytes,json,headers:r.headers};
  }
  async function step(label, fn){await fn();console.log('PASS DOC04 ['+String(++steps).padStart(2,'0')+'] '+label);}
  try{
    await sequelize.authenticate();
    await new Promise((res,rej)=>{server.once('error',rej);server.listen(0,'127.0.0.1',res)});
    opened=true;origin='http://127.0.0.1:'+server.address().port;
    let a,b;
    await step('Register two distinct active students', async()=>{
      for(const who of ['a','b']){
        const r=await send('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({full_name:'DOC04 '+who,email:'doc04-'+who+'-'+seed+'@example.test',password:'SafeDemoPass2026'})});
        assert.equal(r.status,201);
        ids.push(r.json.data.user.id);
        if(who==='a')a=r.json.data.accessToken; else b=r.json.data.accessToken;
      }
    });
    let postId;
    await step('A uploads a free PDF to protected private storage',async()=>{
      const form=new FormData();
      form.set('title','DOC04 PDF '+seed);
      form.append('file',new Blob([pdf],{type:'application/pdf'}),'private demo.pdf');
      const r=await send('/api/documents',{method:'POST',headers:{Authorization:'Bearer '+a},body:form});
      assert.equal(r.status,201,JSON.stringify(r.json));
      postId=r.json.data.id;
      const row=await DocumentFile.findOne({where:{post_id:postId}});
      assert.ok(row);keys.push(row.storage_key);
    });
    const url='/api/documents/'+postId+'/download';
    await step('Guest and malformed JWT cannot fetch PDF bytes',async()=>{
      for(const authorization of [undefined,'Bearer invalid.jwt.token']){
        const r=await send(url,{headers:authorization?{Authorization:authorization}:{}});
        assert.equal(r.status,401);
        assert.notEqual(r.headers.get('content-type'),'application/pdf');
        assert.ok(!r.bytes.includes(Buffer.from('%PDF-')));
      }
    });
    await step('Student B downloads A public/free PDF as a safe attachment',async()=>{
      const r=await send(url,{headers:{Authorization:'Bearer '+b}});
      assert.equal(r.status,200);
      assert.deepEqual(r.bytes,pdf);
      assert.equal(r.headers.get('content-type'),'application/pdf');
      assert.match(r.headers.get('content-disposition')||'',/^attachment; filename="/);
      assert.equal(r.headers.get('cache-control'),'private, no-store');
      assert.equal(r.headers.get('x-content-type-options'),'nosniff');
      assert.ok(!(r.headers.get('content-disposition')||'').includes('/') );
    });
    await step('Raw /uploads paths remain 404 despite valid token',async()=>{
      const r=await send('/uploads/'+keys[0],{headers:{Authorization:'Bearer '+b}});
      assert.equal(r.status,404);
    });
    await step('Student B cannot update/delete owner A document',async()=>{
      const update=await send('/api/posts/'+postId,{method:'PUT',headers:{Authorization:'Bearer '+b,'Content-Type':'application/json'},body:JSON.stringify({title:'stolen'})});
      assert.equal(update.status,403);
      const del=await send('/api/posts/'+postId,{method:'DELETE',headers:{Authorization:'Bearer '+b}});
      assert.equal(del.status,403);
      assert.equal((await Post.findByPk(postId)).status,'active');
    });
    await step('Hidden file becomes inaccessible immediately, including owner',async()=>{
      await Post.update({status:'hidden'},{where:{id:postId}});
      for(const token of [a,b]){
        assert.equal((await send(url,{headers:{Authorization:'Bearer '+token}})).status,404);
      }
      assert.equal((await send('/api/posts/'+postId)).status,404);
    });
    await step('Paid document and missing ID cannot be downloaded',async()=>{
      await Post.update({status:'active',price:1},{where:{id:postId}});
      assert.equal((await send(url,{headers:{Authorization:'Bearer '+b}})).status,404);
      assert.equal((await send('/api/documents/not-an-id/download',{headers:{Authorization:'Bearer '+b}})).status,404);
    });
    await step('Deleted PDF still denied after reverting free price',async()=>{
      await Post.update({status:'deleted',price:0},{where:{id:postId}});
      assert.equal((await send(url,{headers:{Authorization:'Bearer '+a}})).status,404);
      assert.equal((await send('/api/posts/'+postId)).status,404);
    });
    // BE-09 uses a separate process/Sequelize connection and rate-limit budget.
    await step('BE09 Post create/edit security regression (isolated MySQL8)', async () => {
      await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [path.join(__dirname, 'be09-post-validation-regression.cjs')], {
          env: process.env, stdio: 'inherit',
        });
        child.once('error', reject);
        child.once('close', code => code === 0 ? resolve() :
          reject(new Error('BE09 Post validation regression exited with status ' + code)));
      });
    });
    console.log('DOC-04 RESULT: '+steps+'/'+steps+' PASS; cleanup follows');
  }finally{
    if(ids.length)await User.destroy({where:{id:ids}}).catch(()=>{});
    for(const key of keys)await storage.remove(key).catch(()=>{});
    if(opened)await new Promise(resolve=>server.close(resolve));
    await sequelize.close();
  }
});
