'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');

test('DEP-01C production Express safely serves React SPA but not private paths',async()=>{
  const dir=path.resolve(__dirname,'../../client/dist');
  const index=path.join(dir,'index.html');
  const oldEnv={NODE_ENV:process.env.NODE_ENV,SERVE_CLIENT_DIST:process.env.SERVE_CLIENT_DIST};
  let server;
  try{
    await fs.mkdir(dir,{recursive:true});
    await fs.writeFile(index,'<!doctype html><html><body>DEP01-SPA-SMOKE</body></html>');
    process.env.NODE_ENV='production';
    process.env.SERVE_CLIENT_DIST='true';
    delete require.cache[require.resolve('../../server/src/app')];
    const app=require('../../server/src/app');
    server=http.createServer(app);
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
    const origin='http://127.0.0.1:'+server.address().port;
    const health=await fetch(origin+'/api/health');
    assert.equal(health.status,200);
    assert.equal((await health.json()).success,true);
    const spa=await fetch(origin+'/login');
    assert.equal(spa.status,200);
    assert.match(await spa.text(),/DEP01-SPA-SMOKE/);
    const missing=await fetch(origin+'/api/not-a-route');
    assert.equal(missing.status,404);
    assert.equal((await missing.json()).success,false);
    const privatePath=await fetch(origin+'/uploads/secret.pdf');
    assert.equal(privatePath.status,404);
    assert.equal((await privatePath.json()).success,false);
  }finally{
    if(server)await new Promise(resolve=>server.close(resolve));
    await fs.rm(dir,{recursive:true,force:true});
    if(oldEnv.NODE_ENV===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=oldEnv.NODE_ENV;
    if(oldEnv.SERVE_CLIENT_DIST===undefined)delete process.env.SERVE_CLIENT_DIST;else process.env.SERVE_CLIENT_DIST=oldEnv.SERVE_CLIENT_DIST;
  }
});
