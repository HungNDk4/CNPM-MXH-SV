'use strict';
/** Real MySQL 8 regression; only for ephemeral FE66 test DB in CI. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const path = require('node:path');
const { createRequire } = require('node:module');
const { assertDisposableEnvironment } = require('../../server/src/seeders/fe66-disposable-guard');
const serverRequire = createRequire(path.resolve(__dirname, '../../server/package.json'));
const mysql = serverRequire('mysql2/promise');
const expectedDB = assertDisposableEnvironment();
const serverRoot = path.resolve(__dirname, '../../server');
const tables = [
  'users', 'posts', 'comments', 'likes', 'user_follows', 'bookmarks', 'notifications',
  'orders', 'document_access', 'document_files', 'refresh_tokens', 'moderation_audit_logs'
];
const fixtureCounts = { users: 10, posts: 18, comments: 1, likes: 2, user_follows: 1, bookmarks: 1, notifications: 1 };
function runTool(script, opts = {}, succeeds = true) {
  const env = {
    ...process.env, FE66_TEST_FAIL_STAGE: opts.failure || '', FE66_ROLLBACK_CONFIRM: opts.confirm || ''
  };
  const args = [path.join('src', 'seeders', script)];
  if (opts.apply) args.push('--apply');
  const result = spawnSync(process.execPath, args, {
    cwd: serverRoot, env, encoding: 'utf8', timeout: 45000
  });
  if (result.error) throw result.error;
  assert.equal(result.status === 0, succeeds,
    script + ' expected ' + (succeeds ? 'success' : 'failure') + '; exit=' + result.status +
    '; ' + String(result.stderr).slice(0,1500) + ' ' + String(result.stdout).slice(0,1500));
  return result;
}
async function snapshot(db) {
  const out = {};
  for (const t of tables) {
    const [rows] = await db.query('SELECT * FROM ' + t + ' ORDER BY id ASC');
    out[t] = rows;
  }
  return JSON.stringify(out);
}
async function counts(db) {
  const out = {};
  for (const t of tables) {
    const [[r]] = await db.query('SELECT COUNT(*) AS n FROM ' + t);
    out[t] = r.n;
  }
  return out;
}
function assertEmpty(v) {
  for (const [t, n] of Object.entries(v)) assert.equal(n, 0, t + ' must be empty');
}
function assertFixture(v) {
  for (const [t, n] of Object.entries(v)) assert.equal(n, fixtureCounts[t] || 0, t + ' expected fixture count');
}
test('FE66 P1 MySQL 8: seed, rerun, dry-run, foreign data, atomic failures and rollback', { timeout: 180000 }, async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: expectedDB, timezone: 'Z'
  });
  try {
    const [[identity]] = await db.query('SELECT DATABASE() AS db_name, VERSION() AS version');
    assert.equal(identity.db_name, expectedDB);
    assert.match(identity.version, /^8[.]/, 'must use real MySQL 8');
    const [existingTables] = await db.query('SHOW TABLES');
    assert.equal(existingTables.length, tables.length, 'migrated schema must match expected baseline');
    assertEmpty(await counts(db));
    console.log('PASS FE66-P1-01: dedicated MySQL 8 DB and empty migrated schema');
    runTool('seed-sample-data.js', { failure: 'seed-after-posts' }, false);
    assertEmpty(await counts(db));
    console.log('PASS FE66-P1-02: failed seed transaction rolled back all rows');
    runTool('seed-sample-data.js');
    assertFixture(await counts(db));
    const initial = await snapshot(db);
    console.log('PASS FE66-P1-03: first seed created expected isolated fixture');
    runTool('seed-sample-data.js');
    assert.equal(await snapshot(db), initial);
    console.log('PASS FE66-P1-04: repeated seed is non-mutating');
    runTool('undo-sample-data.js');
    assert.equal(await snapshot(db), initial);
    console.log('PASS FE66-P1-05: default rollback is dry-run');
    runTool('undo-sample-data.js', { apply: true }, false);
    assert.equal(await snapshot(db), initial);
    console.log('PASS FE66-P1-06: --apply without exact confirmation refused');
    runTool('undo-sample-data.js', { apply: true, confirm: expectedDB, failure: 'rollback-after-notifications' }, false);
    assert.equal(await snapshot(db), initial);
    console.log('PASS FE66-P1-07: failed rollback transaction preserved all rows');
    const [foreign] = await db.execute(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'student')",
      ['Foreign preserved', 'foreign-user@example.invalid', 'not-a-real-hash']
    );
    const contaminated = await snapshot(db);
    runTool('seed-sample-data.js', {}, false);
    runTool('undo-sample-data.js', { apply: true, confirm: expectedDB }, false);
    assert.equal(await snapshot(db), contaminated, 'foreign data must remain unchanged');
    const [[stillForeign]] = await db.execute('SELECT email FROM users WHERE id = ?', [foreign.insertId]);
    assert.equal(stillForeign.email, 'foreign-user@example.invalid');
    console.log('PASS FE66-P1-08: foreign account preserved; both mutations refused');
    await db.execute('DELETE FROM users WHERE id = ? AND email = ?', [foreign.insertId, 'foreign-user@example.invalid']);
    assert.equal(await snapshot(db), initial);
    runTool('undo-sample-data.js', { apply: true, confirm: expectedDB });
    assertEmpty(await counts(db));
    runTool('undo-sample-data.js', { apply: true, confirm: expectedDB });
    assertEmpty(await counts(db));
    console.log('PASS FE66-P1-09: rollback + repeated rollback left all tables empty');
    const digest = createHash('sha256').update(initial).digest('hex');
    console.log('FE66 P1 MySQL 8 regression SUCCESS; source snapshot SHA256=' + digest);
  } finally {
    await db.end();
  }
});
