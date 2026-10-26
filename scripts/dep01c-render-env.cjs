#!/usr/bin/env node
'use strict';
// DEP-01C: safe Render API configuration for an existing, manually created
// Free Web Service. Intended to be executed by a locally authorized Codex.
// NEVER print secrets, commit credentials, or replace the entire env list.
const { randomBytes } = require('node:crypto');

const TARGET_REPO = 'hungndk4/cnpm-mxh-sv';
const TARGET_BRANCH = 'feat/dep01c-render-tidb-blob-poc-20261022';
const SETTINGS = Object.freeze({
  NODE_ENV: 'production',
  SERVE_CLIENT_DIST: 'true',
  DB_AUTO_SYNC: 'false',
  DOCUMENT_STORAGE_DRIVER: 'vercel-blob',
  TIDB_CLOUD: 'true',
  TIDB_ENABLE_SSL: 'true',
  DB_SSL_MODE: 'require',
});
const SECRETS = Object.freeze({
  DB_HOST: 'DEP01_TIDB_DB_HOST',
  DB_PORT: 'DEP01_TIDB_DB_PORT',
  DB_NAME: 'DEP01_TIDB_DB_NAME',
  DB_USER: 'DEP01_TIDB_DB_USER',
  DB_PASSWORD: 'DEP01_TIDB_DB_PASSWORD',
  BLOB_READ_WRITE_TOKEN: 'DEP01_PRIVATE_BLOB_TOKEN',
});
const REQUIRED = [
  ...Object.keys(SECRETS), 'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET', 'CLIENT_URL',
];

function validateService(service) {
  const repo = String(service.repo || '').toLowerCase()
    .replace(/\\/g, '/').replace(/\.git$/, '').replace(/\/$/, '');
  if (!repo.endsWith('/' + TARGET_REPO) &&
      repo !== 'git@github.com:' + TARGET_REPO) {
    throw new Error('Refusing to edit a service outside the expected GitHub repo');
  }
  if (service.branch !== TARGET_BRANCH) {
    throw new Error('Refusing service on a different Git branch (especially main)');
  }
  const plan = service.serviceDetails?.plan;
  if (plan !== 'free') {
    throw new Error('Refusing service without a verified Free compute plan');
  }
  if (service.type !== 'web_service') {
    throw new Error('Refusing a non-Web-Service Render resource');
  }
}

function planChanges(current, privateInput, service) {
  const updates = { ...SETTINGS };
  for (const [name, source] of Object.entries(SECRETS)) {
    if (!current.has(name) && privateInput[source]) updates[name] = privateInput[source];
  }
  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
    if (!current.has(key)) updates[key] = randomBytes(48).toString('hex');
  }
  if (!current.has('CLIENT_URL')) {
    const url = service.serviceDetails?.url;
    if (typeof url === 'string' && /^https:\/\/[a-z0-9-]+\.onrender\.com\/?$/i.test(url)) {
      updates.CLIENT_URL = url.replace(/\/$/, '');
    }
  }
  const changed = Object.entries(updates).filter(([key,value]) =>
    current.get(key) !== value);
  const after = new Map(current);
  for (const [key,value] of changed) after.set(key,value);
  const missing = REQUIRED.filter(key => !after.get(key));
  return { changed, missing };
}

async function configure({ fetchImpl = fetch, env = process.env, apply = false } = {}) {
  const token = env.RENDER_API_KEY, id = env.RENDER_SERVICE_ID;
  if (!token || !id || !/^srv-[a-z0-9-]+$/i.test(id)) {
    throw new Error('Need private RENDER_API_KEY and RENDER_SERVICE_ID (srv-...) in Codex environment');
  }
  const root = 'https://api.render.com/v1/services/' + encodeURIComponent(id);
  const headers = { Authorization: 'Bearer ' + token, Accept: 'application/json' };
  async function call(path, method = 'GET', body) {
    const res = await fetchImpl(root + path, {
      method, headers: {
        ...headers, ...(body === undefined ? {} : { 'Content-Type':'application/json' }),
      }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!res.ok) throw new Error('Render API ' + method + ' failed (HTTP ' + res.status + ')');
    return res.json();
  }
  const service = await call('');
  validateService(service);
  const current = new Map();
  let cursor;
  do {
    const page = await call('/env-vars?limit=100' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
    if (!Array.isArray(page)) throw new Error('Unexpected Render API env-var response');
    for (const item of page) {
      if (typeof item.envVar?.key === 'string') current.set(item.envVar.key, item.envVar.value);
    }
    cursor = page.length === 100 ? page.at(-1)?.cursor : null;
  } while (cursor);
  const { changed, missing } = planChanges(current, env, service);
  const safeChanges = changed.map(([key])=>key);
  if (apply) {
    for (const [key,value] of changed) {
      // One-key PUT preserves every other existing variable; never print values.
      await call('/env-vars/' + encodeURIComponent(key), 'PUT', { value });
    }
  }
  return { applied: apply, updatedKeys: safeChanges, missingKeys: missing, resource: id };
}
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.some(x=>!['--apply','--dry-run'].includes(x)) ||
      (args.includes('--apply') && args.includes('--dry-run'))) {
    console.error('Usage: node scripts/dep01c-render-env.cjs [--dry-run|--apply]');
    process.exitCode=2;
  } else {
    configure({ apply: args.includes('--apply') })
      .then(result=>{
        console.log(result.applied ? 'Render env keys updated:' : 'Render env keys to update:');
        console.log(result.updatedKeys.join(', ') || '(none)');
        console.log('Still missing required cloud credentials/config:', result.missingKeys.join(', ') || '(none)');
        console.log('No deploy triggered. No secret values were printed.');
        if(result.missingKeys.length) process.exitCode=3;
      })
      .catch(error=>{ console.error('DEP-01C BLOCKED:',error.message); process.exitCode=1; });
  }
}
module.exports = { validateService, planChanges, configure, SETTINGS };
