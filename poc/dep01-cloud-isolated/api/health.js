'use strict';

/**
 * DEP-01 Cloud PoC Stage A — intentionally standalone, no app dependencies.
 * No database, Blob, upload, accounts, payment, or user data access.
 * Vercel builds this handler ONLY from poc/dep01-cloud-isolated as project root.
 */
module.exports = function health(request, response) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    response.statusCode = 405;
    response.end(JSON.stringify({ ok: false, error: 'METHOD_NOT_ALLOWED' }));
    return;
  }

  response.statusCode = 200;
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  response.end(JSON.stringify({
    ok: true,
    service: 'mini-study-network-dep01-isolated',
    stage: 'HTTPS_HEALTH_ONLY',
    database: 'NOT_CONNECTED',
    pdfStorage: 'NOT_CONNECTED',
    legacyApis: 'NOT_INCLUDED',
    runtime: 'vercel-compatible-node-handler'
  }));
};
