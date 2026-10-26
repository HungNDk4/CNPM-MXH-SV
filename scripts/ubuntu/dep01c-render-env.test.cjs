'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateService, planChanges, configure } = require('../dep01c-render-env.cjs');

const service = () => ({
  type: 'web_service',
  repo: 'https://github.com/HungNDk4/CNPM-MXH-SV',
  branch: 'feat/dep01c-render-tidb-blob-poc-20261022',
  serviceDetails: { plan: 'free', url: 'https://cnpm-mxh-sv.onrender.com' },
});
test('Render env helper refuses wrong GitHub repo, main branch and paid plans', () => {
  assert.doesNotThrow(() => validateService(service()));
  assert.throws(() => validateService({ ...service(), branch: 'main' }), /different Git branch/);
  assert.throws(() => validateService({ ...service(), repo: 'https://github.com/other/repo' }), /outside/);
  assert.throws(() => validateService({ ...service(), serviceDetails: { plan: 'starter' } }), /Free/);
});
test('Render env helper preserves existing secrets and marks missing credentials', () => {
  const current = new Map([
    ['BLOB_READ_WRITE_TOKEN', 'existing-never-rotate'],
    ['JWT_ACCESS_SECRET', 'existing-access'],
    ['JWT_REFRESH_SECRET', 'existing-refresh'],
  ]);
  const result = planChanges(current, {}, service());
  assert.ok(result.changed.some(([k,v]) => k === 'DOCUMENT_STORAGE_DRIVER' && v === 'vercel-blob'));
  assert.ok(result.changed.some(([k,v]) => k === 'CLIENT_URL' && v === 'https://cnpm-mxh-sv.onrender.com'));
  assert.ok(result.changed.every(([k]) => k !== 'BLOB_READ_WRITE_TOKEN' && k !== 'JWT_ACCESS_SECRET'));
  assert.ok(result.missing.includes('DB_HOST'));
  assert.ok(!result.missing.includes('BLOB_READ_WRITE_TOKEN'));
});
test('Render env helper dry-run does not make PUT requests', async () => {
  const methods = [];
  const fakeFetch = async (url, init) => {
    methods.push(init.method);
    const path = new URL(url).pathname;
    const data = path.endsWith('/env-vars') ? [] : service();
    return { ok: true, json: async () => data };
  };
  const result = await configure({
    fetchImpl: fakeFetch, env: { RENDER_API_KEY: 'test-only', RENDER_SERVICE_ID: 'srv-demo123' },
  });
  assert.equal(result.applied, false);
  assert.equal(methods.includes('PUT'), false);
  assert.ok(result.updatedKeys.includes('DOCUMENT_STORAGE_DRIVER'));
});
test('Render env helper writes only individual keys and does not trigger deploy', async () => {
  const requests = [];
  const fakeFetch = async (url, init) => {
    const path = new URL(url).pathname;
    requests.push({ path, method: init.method });
    if (init.method === 'PUT') {
      assert.match(path, /\/env-vars\/[A-Z_]+$/);
      assert.ok(JSON.parse(init.body).value);
      return { ok: true, json: async()=>({}) };
    }
    return { ok: true, json: async()=>path.endsWith('/env-vars') ? [] : service() };
  };
  const result = await configure({
    fetchImpl: fakeFetch, apply: true,
    env: {
      RENDER_API_KEY: 'test-only',
      RENDER_SERVICE_ID: 'srv-demo123',
      DEP01_PRIVATE_BLOB_TOKEN: 'test-private-token',
    },
  });
  assert.equal(result.applied, true);
  assert.ok(requests.some(x => x.path.endsWith('/DOCUMENT_STORAGE_DRIVER')));
  assert.ok(requests.every(x=>!x.path.endsWith('/deploys')));
  assert.ok(requests.every(x=>x.method==='GET' || x.method==='PUT'));
});
