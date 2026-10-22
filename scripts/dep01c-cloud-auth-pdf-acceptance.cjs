#!/usr/bin/env node
'use strict';
// DEP-01C single-shot live AUTH-02 -> PDF-01 acceptance test.
// Deliberately isolated in a review-only branch, not the Render auto-deploy branch.
// Generates synthetic credentials in runner memory; NEVER logs passwords, JWTs or tokens.
// Side effects: one synthetic TiDB user; if PDF upload succeeds, one soft-deleted post
// and a private Blob object remain until the provider owner performs audited cleanup.
const assert = require('node:assert/strict');
const { randomBytes, createHash } = require('node:crypto');

const base = 'https://mini-study-network-dep01-demo.onrender.com';
const invocation = process.env.GITHUB_RUN_ID;
if (!process.env.GITHUB_ACTIONS || !/^\d+$/.test(invocation || '') ||
    process.env.GITHUB_HEAD_REF !== 'test/dep01c-cloud-auth-pdf-20261022') {
  throw new Error('Refusing non-authorized runner/branch execution');
}
const email = 'dep01c-live-' + invocation + '-' + randomBytes(4).toString('hex') + '@example.invalid';
const password = randomBytes(24).toString('base64url');
const prefix = '[DEP01C-CLOUD]';
console.log(prefix, 'Endpoint', base);
console.log(prefix, 'Synthetic email for owner cleanup:', email);
console.log(prefix, 'Do not treat test users/Blob as production data.');

const pass = name => console.log('PASS', name);
const fail = (name, reason) => {
  console.error('FAIL', name, reason);
  process.exitCode = 1;
};
const safeResult = data => ({
  success: data && typeof data.success === 'boolean' ? data.success : null,
  code: typeof data?.code === 'string' ? data.code.slice(0, 60) : null,
});
async function api(name, path, { method = 'GET', json, accessToken, form } = {}) {
  const headers = { 'Cache-Control': 'no-store' };
  if (accessToken) headers.Authorization = 'Bearer ' + accessToken;
  let body;
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (form) {
    body = form;
  }
  const response = await fetch(new URL(path, base), {
    method, headers, body, redirect: 'error', signal: AbortSignal.timeout(110000),
  });
  const contentType = response.headers.get('content-type') || '';
  let payload = null, bytes = null;
  if (/application\/pdf/i.test(contentType)) bytes = Buffer.from(await response.arrayBuffer());
  else {
    const responseText = await response.text();
    try { payload = JSON.parse(responseText); } catch {}
  }
  console.log(prefix, name, 'HTTP', response.status, JSON.stringify(safeResult(payload)));
  return { status: response.status, payload, bytes, headers: response.headers };
}
function required(value, name) {
  assert.equal(typeof value, 'string', name + ' must be a string');
  assert.ok(value.length > 12, name + ' not empty');
  return value;
}
function pdfFixture() {
  const stream = 'BT /F1 12 Tf 48 140 Td (DEP01C synthetic private PDF - no student data) Tj ET\n';
  const items = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    '<< /Length ' + Buffer.byteLength(stream) + ' >>\nstream\n' + stream + 'endstream',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let document = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 0; i < items.length; i++) {
    offsets.push(Buffer.byteLength(document, 'utf8'));
    document += (i + 1) + ' 0 obj\n' + items[i] + '\nendobj\n';
  }
  const xref = Buffer.byteLength(document, 'utf8');
  document += 'xref\n0 ' + (items.length + 1) + '\n0000000000 65535 f \n';
  for (const offset of offsets.slice(1)) document += String(offset).padStart(10, '0') + ' 00000 n \n';
  document += 'trailer\n<< /Size ' + (items.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
  return Buffer.from(document, 'utf8');
}
const sha = buffer => createHash('sha256').update(buffer).digest('hex');
async function main() {
  let auth0, login, rotated, documentId;
  // Fail closed: PDF-01 is not attempted if AUTH-02 fails.
  try {
    const health = await api('health', '/api/health');
    assert.equal(health.status, 200);
    const result = await api('register', '/api/auth/register', {
      method: 'POST', json: { full_name: 'DEP01C Synthetic QA', email, password, university: 'QA synthetic', major: 'QA' },
    });
    assert.equal(result.status, 201);
    auth0 = {
      access: required(result.payload?.data?.accessToken, 'registration access'),
      refresh: required(result.payload?.data?.refreshToken, 'registration refresh'),
    };
    pass('AUTH-02 registration JWT issuance');
    const mine = await api('me', '/api/auth/me', { accessToken: auth0.access });
    assert.equal(mine.status, 200);
    pass('AUTH-02 access token authenticates /me');

    const loggedIn = await api('login', '/api/auth/login', {
      method: 'POST', json: { email, password },
    });
    assert.equal(loggedIn.status, 200);
    login = {
      access: required(loggedIn.payload?.data?.accessToken, 'login access'),
      refresh: required(loggedIn.payload?.data?.refreshToken, 'login refresh'),
    };
    pass('AUTH-02 login');
    const first = await api('rotate-refresh', '/api/auth/refresh', {
      method: 'POST', json: { refreshToken: login.refresh },
    });
    assert.equal(first.status, 200);
    rotated = {
      access: required(first.payload?.data?.accessToken, 'rotated access'),
      refresh: required(first.payload?.data?.refreshToken, 'rotated refresh'),
    };
    assert.notEqual(login.refresh, rotated.refresh);
    pass('AUTH-02 refresh rotation issues distinct JWT');
    const reused = await api('old-refresh-denied', '/api/auth/refresh', {
      method: 'POST', json: { refreshToken: login.refresh },
    });
    assert.equal(reused.status, 401);
    pass('AUTH-02 replay of rotated refresh token denied');

    const logout = await api('logout', '/api/auth/logout', {
      method: 'POST', json: { refreshToken: rotated.refresh },
    });
    assert.equal(logout.status, 200);
    const revoked = await api('logged-out-refresh-denied', '/api/auth/refresh', {
      method: 'POST', json: { refreshToken: rotated.refresh },
    });
    assert.equal(revoked.status, 401);
    pass('AUTH-02 logout revoked provided refresh token');
  } catch (error) {
    fail('AUTH-02', error.name + ': ' + error.message.slice(0, 190));
    console.log(prefix, 'PDF-01 BLOCKED: AUTH-02 must pass first');
    return;
  }

  try {
    const pdf = pdfFixture();
    const form = new FormData();
    form.set('title', 'DEP01C synthetic PDF QA ' + invocation);
    form.set('description', 'Automated test only; delete this record after assessment');
    form.set('subject', 'QA');
    form.set('file', new Blob([pdf], { type: 'application/pdf' }), 'dep01c-private-test.pdf');
    // Use token from successful login (not the already-logged-out refresh session).
    // Access JWT may remain active until expiry even after logout by design.
    const upload = await api('small-pdf-upload', '/api/documents', {
      method: 'POST', accessToken: login.access, form,
    });
    assert.equal(upload.status, 201);
    assert.equal(upload.payload?.success, true);
    documentId = upload.payload?.data?.id;
    assert.match(String(documentId), /^[1-9]\d*$/);
    assert.ok(!JSON.stringify(upload.payload).includes('.blob.vercel-storage.com'));
    pass('PDF-01 create protected PDF metadata without storage URL');
    console.log(prefix, 'POST_ID for cleanup:', documentId, 'PDF_BYTES:', pdf.length);

    const guest = await api('guest-download-denied', '/api/documents/' + documentId + '/download');
    assert.equal(guest.status, 401);
    pass('PDF-01 anonymous direct download 401');

    const download = await api('download', '/api/documents/' + documentId + '/download', {
      accessToken: login.access,
    });
    assert.equal(download.status, 200);
    assert.match(download.headers.get('content-type') || '', /^application\/pdf/i);
    assert.deepEqual(download.bytes, pdf);
    assert.equal(sha(download.bytes), sha(pdf));
    pass('PDF-01 authenticated download byte-for-byte and SHA256 match');
  } catch (error) {
    fail('PDF-01', error.name + ': ' + error.message.slice(0, 190));
  } finally {
    if (documentId && login?.access) {
      try {
        const remove = await api('soft-delete-synthetic-post', '/api/posts/' + documentId, {
          method: 'DELETE', accessToken: login.access,
        });
        if (remove.status === 200) {
          pass('PDF-01 synthetic post soft-deleted');
          const after = await api('deleted-download-denied', '/api/documents/' + documentId + '/download', {
            accessToken: login.access,
          });
          if (after.status === 404) pass('PDF-01 deleted document no longer downloadable');
          else fail('PDF-01 delete-access', 'expected HTTP 404, got ' + after.status);
        } else fail('PDF-01 cleanup', 'soft-delete returned HTTP ' + remove.status);
      } catch (err) { fail('PDF-01 cleanup', err.name + ': ' + err.message.slice(0, 100)); }
    }
    console.log(prefix, 'RECONCILE: Owner must clean synthetic user', email);
    if (documentId) console.log(prefix, 'RECONCILE: Owner must clean post/document_files AND private Blob (soft-delete does not delete Blob)', documentId);
  }
}
main().catch(error => { fail('RUNNER', error.name + ': ' + error.message.slice(0, 180)); });
