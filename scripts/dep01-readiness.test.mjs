import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { audit } from './dep01-readiness.mjs';

test('DEP-01 audit is reproducible and does not claim a hosted proof', () => {
  const report = audit();
  assert.equal(report.scope, 'OFFLINE_SOURCE_ONLY');
  assert.equal(report.hostedDeployment, 'NOT_RUN');
  assert.equal(report.tidbIntegration, 'NOT_RUN');
  assert.equal(report.privateBlobE2E, 'NOT_RUN');
  assert.equal(report.onlineAvailability, 'NOT_RUN');
  assert.equal(report.codeSecurityQA, 'NOT_RUN');
  assert.deepEqual(report.missingRequiredFiles, []);
  assert.equal(report.checks.length, 11);
  assert.equal(new Set(report.checks.map(c => c.id)).size, report.checks.length);
});

test('approved 10 MiB PDF exceeds the external documented 4.5 MB Function body limit', () => {
  const report = audit();
  assert.equal(report.constraints.maxPdfBytes, 10485760);
  assert.equal(report.constraints.functionRequestBodyBytes, 4500000);
  assert.ok(report.constraints.maxPdfBytes > report.constraints.functionRequestBodyBytes);
  assert.equal(report.checks.find(c => c.id === 'DEP-S11').status, 'DIRECT_UPLOAD_REQUIRED');
});

test('findings have inspectable source references and non-PASS statuses', () => {
  const report = audit();
  for (const finding of report.checks) {
    assert.ok(finding.source);
    assert.ok(finding.finding);
    assert.notEqual(finding.status, 'PASS');
  }
});

// SEC-04 pre-upload security guard: verify installed version in CI, not only manifest.
test('SEC-04 patched Multer version matches install, manifest and lock', () => {
  const backendRequire = createRequire(new URL('../server/package.json', import.meta.url));
  const installed = backendRequire('multer/package.json');
  const manifest = backendRequire('./package.json');
  const lock = JSON.parse(readFileSync(new URL('../server/package-lock.json', import.meta.url), 'utf8'));
  assert.equal(manifest.dependencies.multer, '^2.4.0');
  assert.equal(lock.packages[''].dependencies.multer, '^2.4.0');
  assert.equal(lock.packages['node_modules/multer'].version, '2.4.0');
  assert.equal(installed.version, '2.4.0');
  assert.equal(typeof backendRequire('multer').memoryStorage, 'function');
});
