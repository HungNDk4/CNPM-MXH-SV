'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { assertDisposableEnvironment, assertDatabaseIdentity } = require('../src/seeders/fe66-disposable-guard');
const good = {
  NODE_ENV: 'test', FE66_SEED_DISPOSABLE: 'I_UNDERSTAND_THIS_IS_DISPOSABLE',
  DB_AUTO_SYNC: 'false', DB_NAME: 'fe66_seed_12345678', DB_HOST: '127.0.0.1',
  DB_PORT: '3306', DB_USER: 'fe66_tester', DB_PASSWORD: 'isolated_only'
};
test('FE66 guard accepts explicit disposable local test environment', () => {
  assert.equal(assertDisposableEnvironment(good), good.DB_NAME);
});
for (const [name, change] of Object.entries({
  production: { NODE_ENV: 'production' },
  missingOptIn: { FE66_SEED_DISPOSABLE: '' },
  realDbName: { DB_NAME: 'mini_study_network' },
  shortDbName: { DB_NAME: 'fe66_seed_1' },
  sharedHost: { DB_HOST: 'tidb.example.com' },
  missingPort: { DB_PORT: '' },
  autoSync: { DB_AUTO_SYNC: 'true' },
  root: { DB_USER: 'root' },
  missingPassword: { DB_PASSWORD: '' }
})) {
  test('FE66 guard refuses ' + name, () => {
    assert.throws(() => assertDisposableEnvironment({ ...good, ...change }), /REFUSED/);
  });
}
test('FE66 verifies connected DB identity', async () => {
  const sequelize = { authenticate: async () => {}, query: async () => [[{ db_name: good.DB_NAME }]] };
  await assertDatabaseIdentity(sequelize, good.DB_NAME);
  await assert.rejects(assertDatabaseIdentity(sequelize, 'fe66_seed_other123'), /REFUSED/);
});
