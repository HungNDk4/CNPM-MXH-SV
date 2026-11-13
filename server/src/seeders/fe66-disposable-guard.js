'use strict';
/**
 * FE66 isolated sample-data guard. Intentionally NEVER supports production/shared DBs.
 * Requires an explicitly named, localhost, disposable test database.
 */
function assertDisposableEnvironment(env = process.env) {
  if (env.NODE_ENV !== 'test' ||
      env.FE66_SEED_DISPOSABLE !== 'I_UNDERSTAND_THIS_IS_DISPOSABLE' ||
      env.DB_AUTO_SYNC !== 'false' ||
      !/^(fe66_seed_[a-z0-9_]{8,48})$/.test(env.DB_NAME || '') ||
      !['127.0.0.1', 'localhost'].includes(env.DB_HOST) ||
      !/^[0-9]{2,5}$/.test(String(env.DB_PORT || '')) ||
      !env.DB_USER || !env.DB_PASSWORD ||
      /^(root|admin)$/i.test(env.DB_USER)) {
    throw new Error('REFUSED: FE66 seed tools require NODE_ENV=test, explicit disposable opt-in, DB_AUTO_SYNC=false, localhost, non-root DB credentials and DB_NAME=fe66_seed_<8+ characters>.');
  }
  return env.DB_NAME;
}
async function assertDatabaseIdentity(sequelize, expected) {
  await sequelize.authenticate();
  const [rows] = await sequelize.query('SELECT DATABASE() AS db_name, @@hostname AS server_name');
  if (!rows || rows.length !== 1 || rows[0].db_name !== expected) {
    throw new Error('REFUSED: connected database identity mismatch.');
  }
}
module.exports = { assertDisposableEnvironment, assertDatabaseIdentity };
