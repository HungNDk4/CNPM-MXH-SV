'use strict';
/** Prepare SQL in ephemeral CI workspace; never modifies canonical migration files. */
const fs = require('node:fs');
const path = require('node:path');
const { assertDisposableEnvironment } = require('../../server/src/seeders/fe66-disposable-guard');
const target = assertDisposableEnvironment();
if (!process.env.GITHUB_ACTIONS || !process.env.RUNNER_TEMP) {
  throw new Error('REFUSED: this SQL preparation is CI-only.');
}
const outDir = process.env.RUNNER_TEMP;
function load(rel) {
  const original = fs.readFileSync(path.resolve(__dirname, '..', '..', rel), 'utf8');
  if (!original.includes('USE mini_study_network;')) throw new Error('Unexpected schema form in ' + rel);
  return original.replaceAll('mini_study_network', target);
}
let base = load('database/schema.sql');
const seedMarker = '-- Seed: Admin user';
if (!base.includes(seedMarker)) throw new Error('Cannot locate default admin insertion; refuse schema rewrite.');
base = base.slice(0, base.indexOf(seedMarker));
const first = path.join(outDir, 'fe66-schema.sql');
const second = path.join(outDir, 'fe66-document-files.sql');
fs.writeFileSync(first, base, { flag: 'w', mode: 0o600 });
fs.writeFileSync(second, load('database/migrations/20261021_document_files.sql'), { flag: 'w', mode: 0o600 });
console.log('Prepared FE66-only SQL schema and migration for ephemeral DB: ' + target);
