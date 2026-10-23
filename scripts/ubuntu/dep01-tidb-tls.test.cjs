'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');

const modulePath=path.resolve(__dirname,'../../server/src/config/database.js');
function run(extra){
  const env={...process.env,DB_NAME:'dep01_test_only',DB_HOST:'localhost',DB_USER:'unit',
    DB_PASSWORD:'unit_only_not_secret',DB_SSL_MODE:'disable',
    TIDB_CLOUD:'false',TIDB_ENABLE_SSL:'false',...extra};
  const js="const {sequelize}=require("+JSON.stringify(modulePath)+");"+
    "console.log(JSON.stringify(sequelize.options.dialectOptions?.ssl||null));"+
    "sequelize.close();";
  return spawnSync(process.execPath,['-e',js],{env,encoding:'utf8'});
}
test('DEP-01C TiDB public endpoint forces verified TLS >=1.2',()=>{
  const p=run({TIDB_CLOUD:'true',TIDB_ENABLE_SSL:'true'});
  assert.equal(p.status,0,p.stderr);
  const ssl=JSON.parse(p.stdout.trim());
  assert.equal(ssl.minVersion,'TLSv1.2');
  assert.equal(ssl.rejectUnauthorized,true);
});
test('DEP-01C TiDB public endpoint without TLS fails closed',()=>{
  const p=run({TIDB_CLOUD:'true',TIDB_ENABLE_SSL:'false'});
  assert.notEqual(p.status,0);
  assert.match(p.stderr,/TiDB Cloud must use verified TLS/);
});
test('DEP-01C local MySQL remains without TLS by default',()=>{
  const p=run({});
  assert.equal(p.status,0,p.stderr);
  assert.equal(JSON.parse(p.stdout.trim()),null);
});
