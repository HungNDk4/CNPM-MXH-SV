'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = p => fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8');

test('FE account moderation and My Posts use reviewed real API contracts', () => {
  const api = read('client/src/services/api.js');
  const app = read('client/src/App.jsx');
  const users = read('client/src/pages/admin/AdminUsersPage.jsx');
  const my = read('client/src/pages/posts/MyPostsPage.jsx');
  const nav = read('client/src/components/admin/AdminLayoutNav.jsx');

  assert.match(api, /getMyPosts:\s*\(params\)\s*=>\s*api\.get\('\/posts\/my',\s*\{\s*params\s*\}\)/);
  assert.match(api, /getAccounts:\s*\(params\)\s*=>\s*api\.get\('\/admin\/users',\s*\{\s*params\s*\}\)/);
  assert.match(api, /api\.patch\(`\/admin\/users\/\$\{id\}\/status`,\s*\{\s*is_active,\s*reason\s*\}\)/);
  assert.match(api, /getAccountAuditLogs:[\s\S]*?'\/admin\/users\/audit-logs'/);

  assert.match(app, /<Route path="\/admin\/users" element=\{\s*<AdminRoute><AdminUsersPage\s*\/><\/AdminRoute>/);
  assert.match(nav, /to:\s*'\/admin\/users'/);
  assert.match(users, /adminAPI\.getAccounts\(params\)/);
  assert.match(users, /adminAPI\.setAccountStatus\(id,\s*isActive,\s*note\)/);
  assert.match(users, /adminAPI\.getAccountAuditLogs/);
  assert.match(users, /minLength=\{5\} maxLength=\{500\}/);
  assert.match(users, /target\.id === user\?\.id/);

  assert.match(my, /postAPI\.getMyPosts\(queryParams\)/);
  assert.doesNotMatch(my, /postAPI\.getAll\(queryParams\)/);
  assert.doesNotMatch(my, /author_id:\s*user\?\.id/);
  assert.match(my, /sort:\s*sortBy/);
  assert.match(my, /setSortBy\(e\.target\.value\); setPage\(1\)/);
  assert.match(my, /statusFilter !== 'all'/);
  assert.match(my, /post\.status !== 'active'/);
  assert.match(my, /<PostCard key=\{post\.id\} post=\{post\} onDelete=\{handleDeletePost\} \/>/);
});
