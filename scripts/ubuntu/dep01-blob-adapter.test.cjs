'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const storage = require('../../server/src/services/private-document-storage');

test('DEP-01C private Blob save/openRead/remove remains internal and byte-exact', async () => {
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj <<>> endobj\n%%EOF');
  let storedKey, removed = false;
  const sdk = {
    async put(key, body, options) {
      storedKey = key;
      assert.match(key, /^[a-f0-9-]{36}\.pdf$/);
      assert.equal(options.access, 'private');
      assert.equal(options.token, 'test-token');
      assert.equal(options.addRandomSuffix, false);
      assert.deepEqual(Buffer.from(await body.arrayBuffer()), pdf);
      return {pathname:key,url:'https://demo.private.blob.vercel-storage.com/'+key};
    },
    async get(key, options) {
      assert.equal(key, storedKey);
      assert.equal(options.access, 'private');
      assert.equal(options.token, 'test-token');
      return { statusCode:200, blob:{size:pdf.length},
        stream:Readable.toWeb(Readable.from([pdf])) };
    },
    async del(key, options) {
      assert.equal(key, storedKey);
      assert.equal(options.token, 'test-token');
      removed = true;
    },
  };
  const adapter = storage.createBlobAdapter(sdk, 'test-token');
  assert.equal(await adapter.save(pdf), storedKey);
  const attachment = await adapter.openRead(storedKey);
  assert.equal(attachment.size, pdf.length);
  const bytes = [];
  for await (const chunk of attachment.stream) bytes.push(chunk);
  assert.deepEqual(Buffer.concat(bytes), pdf);
  await adapter.remove(storedKey);
  assert.equal(removed, true);
  await assert.rejects(adapter.openRead('../etc/passwd'), /Invalid internal document key/);
  await assert.rejects(adapter.save(Buffer.alloc(10 * 1024 * 1024 + 1)), /Invalid PDF storage size/);
});

test('DEP-01C public Blob provider is rejected and cleaned up', async () => {
  let removed=false;
  const adapter=storage.createBlobAdapter({
    async put(key) { return {pathname:key,url:'https://demo.public.blob.vercel-storage.com/'+key}; },
    async del() { removed=true; },
    async get() { return {statusCode:200,blob:{},stream:Readable.toWeb(Readable.from([Buffer.from('x')]))}; },
  },'test-token');
  await assert.rejects(adapter.save(Buffer.from('%PDF-1.4\n%%EOF')), /did not confirm private storage/);
  assert.equal(removed,true);
  await assert.rejects(adapter.openRead('b42658d5-fbbb-4ec7-ae01-f4bd6e22b5cd.pdf'), /size unverifiable/);
});

test('DEP-01C local mode remains default and cloud requires server-only token', () => {
  const previousDriver=process.env.DOCUMENT_STORAGE_DRIVER;
  const previousToken=process.env.BLOB_READ_WRITE_TOKEN;
  try {
    delete process.env.DOCUMENT_STORAGE_DRIVER;
    storage.validateConfig();
    process.env.DOCUMENT_STORAGE_DRIVER='vercel-blob';
    delete process.env.BLOB_READ_WRITE_TOKEN;
    assert.throws(()=>storage.validateConfig(),/token missing/);
  } finally {
    if(previousDriver===undefined)delete process.env.DOCUMENT_STORAGE_DRIVER;
    else process.env.DOCUMENT_STORAGE_DRIVER=previousDriver;
    if(previousToken===undefined)delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN=previousToken;
  }
});
