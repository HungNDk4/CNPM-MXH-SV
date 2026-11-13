#!/usr/bin/env node
/**
 * DEP-01 OFFLINE source-only readiness probe.
 * This is NOT a Vercel deploy, TiDB integration test, Blob upload test, or security PASS.
 * No credentials, network, or environment variables are needed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const VERCEL_FUNCTION_BODY_BYTES = 4_500_000; // documentation's decimal 4.5 MB

function read(root, p) {
  const file = path.join(root, p);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

export function audit(root = REPO_ROOT) {
  const app = read(root, 'server/src/app.js');
  const bootstrap = read(root, 'server/src/index.js');
  const db = read(root, 'server/src/config/database.js');
  const model = read(root, 'server/src/models/index.js');
  const post = read(root, 'server/src/controllers/post.controller.js');
  const postModel = read(root, 'server/src/models/Post.js');
  const schema = read(root, 'database/schema.sql');
  const axios = read(root, 'client/src/lib/axios.js');
  const vite = read(root, 'client/vite.config.js');
  const serverPkg = read(root, 'server/package.json');
  const serverPackage = serverPkg ? JSON.parse(serverPkg) : {};
  const accessRoutes = ['server/src/routes/post.routes.js', 'server/src/routes/order.routes.js'];
  const requiredPaths = ['server/src/app.js', 'server/src/index.js',
    'server/src/config/database.js', 'server/src/models/index.js',
    'server/src/controllers/post.controller.js', 'server/package.json',
    'client/vite.config.js', 'client/src/lib/axios.js', 'database/schema.sql'];
  const missing = requiredPaths.filter(p => !fs.existsSync(path.join(root, p)));
  const refreshBlock = schema.match(/CREATE TABLE refresh_tokens\s*\(([\s\S]*?)\)\s*ENGINE=/i)?.[1] || '';

  const checks = [
    {
      id: 'DEP-S01', area: 'Express entry', source: 'server/src/app.js',
      status: /module\.exports\s*=\s*app/.test(app) ? 'ADAPTABLE' : 'REVIEW',
      finding: 'Express app export permits an isolated Function wrapper; this is not a deployed adapter.',
    },
    {
      id: 'DEP-S02', area: 'Process bootstrap', source: 'server/src/index.js',
      status: /app\.listen\(/.test(bootstrap) ? 'NEEDS_ADAPTER' : 'REVIEW',
      finding: 'Current entry point starts long-running HTTP listener and DB authentication; verify Function invocation startup/pool behavior.',
    },
    {
      id: 'DEP-S03', area: 'API same-origin', source: 'client/src/lib/axios.js; client/vite.config.js',
      status: /baseURL:\s*['"]\/api['"]/.test(axios) && /proxy\s*:/.test(vite) ? 'NEEDS_HOST_REWRITE' : 'REVIEW',
      finding: 'React API uses /api and Vite proxies this only in development. Production project configuration/rewrite is not present.',
    },
    {
      id: 'DEP-S04', area: 'SQL backend', source: 'server/src/config/database.js',
      status: /dialect:\s*['"]mysql['"]/.test(db) ? 'TIDB_POC_REQUIRED' : 'REVIEW',
      finding: 'Sequelize mysql dialect is configured; TiDB compatibility, schema/DDL and connection-pooling remain unverified.',
    },
    {
      id: 'DEP-S05', area: 'Schema parity', source: 'database/schema.sql; server/src/models/index.js',
      status: /timestamps:\s*true/.test(model) && !/\bupdated_at\b/i.test(refreshBlock)
        ? 'SCHEMA_DRIFT_FOUND' : 'REVIEW',
      finding: 'refresh_tokens table lacks updated_at in SQL while Sequelize model enables timestamps; reconcile before hosted migration.',
    },
    {
      id: 'DEP-S06', area: 'PDF object storage', source: 'server/src/controllers/post.controller.js',
      status: /file_url/.test(post) && /file_url/.test(postModel) ? 'SECURE_UPLOAD_NOT_IMPLEMENTED' : 'REVIEW',
      finding: 'Post controller persists user-supplied file_url metadata, not PDF content or private object key with validated upload.',
    },
    {
      id: 'DEP-S07', area: 'Public static URL', source: 'server/src/app.js',
      status: /app\.use\(\s*['"]\/uploads['"]/.test(app) ? 'PUBLIC_FILE_ROUTE' : 'REVIEW',
      finding: 'Express exposes /uploads as public static files; cannot host authenticated student PDFs there.',
    },
    {
      id: 'DEP-S08', area: 'Paid API guard', source: 'server/src/app.js',
      status: /app\.use\(\s*['"]\/api\/payment['"]/.test(app) || /app\.use\(\s*['"]\/api\/orders['"]/.test(app)
        ? 'PAID_ROUTES_MOUNTED' : 'REVIEW',
      finding: 'Legacy paid routes are mounted and must be blocked server-side before any public student MVP deployment.',
    },
    {
      id: 'DEP-S09', area: 'Upload parser', source: 'server/package.json',
      status: /^(\^|~)?1\./.test(serverPackage.dependencies?.multer || '') ? 'OUTDATED_MULTER' : 'REVIEW',
      finding: 'Manifest uses Multer 1.x; patched package and explicit bounds required prior to public PDF uploads.',
    },
    {
      id: 'DEP-S10', area: 'Production routing', source: 'vercel.json',
      status: fs.existsSync(path.join(root, 'vercel.json')) ? 'CONFIG_REVIEW_REQUIRED' : 'NO_VERCEL_CONFIG',
      finding: 'No root Vercel configuration was found at audit baseline; project root, rewrites and SPA history fallback require design.',
    },
    {
      id: 'DEP-S11', area: 'Multipart limit', source: 'ADR-012; Vercel Function documentation',
      status: MAX_PDF_BYTES > VERCEL_FUNCTION_BODY_BYTES ? 'DIRECT_UPLOAD_REQUIRED' : 'REVIEW',
      finding: '10 MiB PDF exceeds the 4.5 MB Function request-body limit; browser-to-private-Blob upload is necessary for candidate stack.',
    },
  ];

  return {
    scope: 'OFFLINE_SOURCE_ONLY',
    hostedDeployment: 'NOT_RUN',
    tidbIntegration: 'NOT_RUN',
    privateBlobE2E: 'NOT_RUN',
    onlineAvailability: 'NOT_RUN',
    codeSecurityQA: 'NOT_RUN',
    constraints: { maxPdfBytes: MAX_PDF_BYTES, functionRequestBodyBytes: VERCEL_FUNCTION_BODY_BYTES },
    missingRequiredFiles: missing,
    checkedRouteFilePaths: accessRoutes,
    checks,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = audit();
  if (process.argv.includes('--json')) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    console.log('DEP-01 source-only feasibility audit — NO HOSTED TESTS RUN');
    for (const c of result.checks) console.log(c.id + ' [' + c.status + '] ' + c.finding);
    console.log('Online/TiDB/Blob E2E: NOT_RUN');
  }
  if (result.missingRequiredFiles.length) {
    console.error('Missing required baseline source:', result.missingRequiredFiles.join(', '));
    process.exitCode = 1;
  }
}
