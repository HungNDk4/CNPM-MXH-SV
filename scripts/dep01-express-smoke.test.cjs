/* DEP-01 isolated Node HTTP smoke. No DB connection, Vercel deploy or cloud account. */
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.NODE_ENV = 'test';
const app = require('../server/src/app');

async function withAppServer(callback) {
  const server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    const address = server.address();
    await callback('http://127.0.0.1:' + address.port);
  } finally {
    await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()));
  }
}

test('DEP-01 local Express app handler responds to health without a running database', async () => {
  await withAppServer(async origin => {
    const response = await fetch(origin + '/api/health');
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.match(body.message, /API is running/);
  });
});

test('DEP-01 source baseline: guest feed currently returns 401 (known gap, not an acceptance PASS)', async () => {
  await withAppServer(async origin => {
    const response = await fetch(origin + '/api/posts');
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.success, false);
  });
});
