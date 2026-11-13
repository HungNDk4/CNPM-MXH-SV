const { Sequelize } = require('sequelize');
const fs = require('node:fs');

// TiDB Starter public endpoint requires TLS with hostname/CA verification.
// Existing local MySQL/CI mode stays unchanged.
function dialectTls() {
  const mode = process.env.DB_SSL_MODE || 'disable';
  if (!['disable', 'require'].includes(mode)) throw new Error('Invalid DB_SSL_MODE');
  const tidb = process.env.TIDB_ENABLE_SSL === 'true';
  if (process.env.TIDB_ENABLE_SSL && !['true', 'false'].includes(process.env.TIDB_ENABLE_SSL)) {
    throw new Error('Invalid TIDB_ENABLE_SSL');
  }
  if (process.env.TIDB_CLOUD === 'true' && !tidb && mode !== 'require') {
    throw new Error('TiDB Cloud must use verified TLS');
  }
  if (!tidb && mode !== 'require') return {};
  const ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  if (process.env.TIDB_CA_PATH) ssl.ca = fs.readFileSync(process.env.TIDB_CA_PATH);
  return { dialectOptions: { ssl } };
}


const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    ...dialectTls(),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle:    10000,
    },
    define: {
      timestamps:  true,
      underscored: true,        // snake_case column names
      charset:     'utf8mb4',
      collate:     'utf8mb4_unicode_ci',
    },
  }
);

module.exports = { sequelize };
