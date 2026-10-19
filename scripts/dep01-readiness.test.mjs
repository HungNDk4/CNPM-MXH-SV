import test from 'node:test';
import assert from 'node:assert/strict';
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
