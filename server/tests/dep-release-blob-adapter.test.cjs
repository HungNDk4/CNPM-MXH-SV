'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createBlobAdapter, filePath } = require('../src/services/private-document-storage');

const pdf = Buffer.from('%PDF-1.7\n%%EOF');
function streamBytes(bytes) {
  return new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(bytes)); controller.close(); }
  });
}
test('private Blob adapter supports authenticated save/get/delete; never returns public URL', async () => {
  let savedKey, removed, tokenSeen;
  const sdk = {
    async put(key, blob, opts) {
      assert.equal(opts.access, 'private');
      assert.equal(opts.token, 'fake-ci-token');
      assert.equal(opts.addRandomSuffix, false);
      assert.equal(blob.size, pdf.length);
      savedKey = key; tokenSeen = opts.token;
      return { pathname:key, url:'https://ci.private.blob.vercel-storage.com/'+key };
    },
    async get(key, opts) {
      assert.equal(key,savedKey); assert.equal(opts.token,'fake-ci-token');
      return {statusCode:200,blob:{size:pdf.length},stream:streamBytes(pdf)};
    },
    async del(key,opts) {removed=key; assert.equal(opts.token,'fake-ci-token');}
  };
  const adapter=createBlobAdapter(sdk,'fake-ci-token');
  const key=await adapter.save(pdf);
  assert.match(key,/^[0-9a-f-]+\.pdf$/);
  assert.equal(tokenSeen,'fake-ci-token');
  const result=await adapter.openRead(key);
  assert.equal(result.size,pdf.length);
  const chunks=[];
  for await (const c of result.stream) chunks.push(c);
  assert.deepEqual(Buffer.concat(chunks),pdf);
  await adapter.remove(key);
  assert.equal(removed,key);
  await assert.rejects(()=>adapter.openRead('../secret.pdf'),/Invalid internal document key/);
  assert.throws(()=>filePath('../secret.pdf'),/Invalid internal document key/);
});
test('private Blob adapter refuses public-store response and cleans failed upload', async () => {
  let cleaned;
  const sdk={
    put:async(key)=>({pathname:key,url:'https://public.blob.vercel-storage.com/'+key}),
    del:async(key)=>{cleaned=key},
    get:async()=>({statusCode:404})
  };
  const adapter=createBlobAdapter(sdk,'ci-token');
  await assert.rejects(()=>adapter.save(pdf),/did not confirm private storage/);
  assert.match(cleaned,/\.pdf$/);
  await assert.rejects(()=>adapter.openRead('not-a-key'),/Invalid internal document key/);
});
test('private Blob adapter refuses missing credentials and >10 MiB bytes', async () => {
  const sdk={put:async()=>{},get:async()=>{},del:async()=>{}};
  assert.throws(()=>createBlobAdapter(sdk,''),/Private Blob SDK\/token missing/);
  const adapter=createBlobAdapter(sdk,'ci-token');
  await assert.rejects(()=>adapter.save(Buffer.alloc(10*1024*1024+1)),/Invalid PDF storage size/);
});
