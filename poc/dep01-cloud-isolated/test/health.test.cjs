const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const health = require('../api/health.js');

async function withServer(fn) {
  const server = http.createServer(health);
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  try {
    await fn('http://127.0.0.1:' + server.address().port);
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
}

test('health responds GET 200 without DB/Blob/app secrets', async () => {
  await withServer(async base => {
    const res = await fetch(base + '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('cache-control'), 'no-store, max-age=0');
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.stage, 'HTTPS_HEALTH_ONLY');
    assert.equal(data.database, 'NOT_CONNECTED');
    assert.equal(data.pdfStorage, 'NOT_CONNECTED');
    assert.equal(data.legacyApis, 'NOT_INCLUDED');
    assert.equal('url' in data, false);
  });
});
test('only GET/HEAD allowed', async () => {
  await withServer(async base => {
    const post = await fetch(base, {method:'POST'});
    assert.equal(post.status,405);
    assert.equal(post.headers.get('allow'), 'GET, HEAD');
    const head = await fetch(base, {method:'HEAD'});
    assert.equal(head.status,200);
    assert.equal((await head.text()).length,0);
  });
});
test('isolated package has no dependencies or link to legacy server', () => {
  const root = path.join(__dirname,'..');
  const p = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.equal(Object.keys(p.dependencies || {}).length,0);
  assert.equal(Object.keys(p.devDependencies || {}).length,0);
  assert.ok(fs.existsSync(path.join(root,'index.html')));
  const code = fs.readFileSync(path.join(root,'api','health.js'),'utf8');
  assert.ok(!code.includes('require(\'../../server/'));
  assert.ok(!code.includes('payment.controller'));
  assert.ok(!code.includes('process.env'));
});
