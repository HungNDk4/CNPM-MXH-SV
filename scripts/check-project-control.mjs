// Self-contained offline integrity check for the cross-session control pack.
// Checks presence, internal links, task IDs/statuses; NOT a product/integration/security test.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const required = [
  'PROJECT_CONTROL.md', 'AGENTS.md', 'README.md',
  'docs/ops/MASTER_PLAN.md', 'docs/ops/CURRENT_STATE.md',
  'docs/ops/TASK_BOARD.md', 'docs/ops/WORKTREE_PLAYBOOK.md',
  'docs/ops/WORKTREE_REGISTRY.md', 'docs/ops/SESSION_START.md',
  'docs/ops/SESSION_LOG.md', 'docs/ops/SESSION_HANDOFF_TEMPLATE.md',
  'docs/ops/CHANGE_CONTROL.md', 'docs/ops/RISK_REGISTER.md',
  'docs/ops/RESEARCH_QUEUE.md', 'docs/SRS.md', 'docs/DECISIONS.md'
]
const errors = []
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) errors.push('Missing: ' + file)
}

const markdownFiles = required.filter((p) => p.endsWith('.md') && fs.existsSync(path.join(root, p)))
for (const file of markdownFiles) {
  const content = fs.readFileSync(path.join(root, file), 'utf8')
  const links = content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)
  for (const link of links) {
    const dest = link[1].trim().split('#')[0]
    if (!dest || /^(?:https?:|mailto:|#|data:)/i.test(dest)) continue
    if (dest.startsWith('/')) { errors.push('Absolute internal link: ' + file + ' -> ' + dest); continue }
    let decoded
    try { decoded = decodeURIComponent(dest) } catch { decoded = dest }
    const resolved = path.resolve(path.dirname(path.join(root, file)), decoded)
    if (!resolved.startsWith(root + path.sep) && resolved !== root) {
      errors.push('Link escapes repository: ' + file + ' -> ' + dest)
    } else if (!fs.existsSync(resolved)) {
      errors.push('Broken internal link: ' + file + ' -> ' + dest)
    }
  }
}

const boardPath = path.join(root, 'docs/ops/TASK_BOARD.md')
if (fs.existsSync(boardPath)) {
  const seen = new Set()
  const valid = new Set(['TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE', 'DEFERRED'])
  const board = fs.readFileSync(boardPath, 'utf8')
  for (const row of board.split(/\r?\n/)) {
    const cells = row.split('|').map((x) => x.trim())
    const id = cells[1]
    if (!/^(?:OPS|AN|DS|SEC|BE|QA|FE|DOC|PAY|DOCS|DEMO)-\d{2}$/.test(id ?? '')) continue
    if (seen.has(id)) errors.push('Duplicate task ID: ' + id)
    seen.add(id)
    const status = cells[5]
    if (!valid.has(status)) errors.push('Invalid status for ' + id + ': ' + status)
  }
  if (seen.size < 20) errors.push('Task board unexpectedly short: ' + seen.size + ' IDs')
}

const state = path.join(root, 'docs/ops/CURRENT_STATE.md')
if (fs.existsSync(state) && !fs.readFileSync(state, 'utf8').includes('NEXT_SESSION_ACTIONS')) {
  errors.push('CURRENT_STATE must include NEXT_SESSION_ACTIONS')
}
if (errors.length) {
  for (const error of errors) console.error('FAIL ' + error)
  process.exitCode = 1
} else {
  console.log('PASS: project control docs, internal links, ' +
    (fs.readFileSync(boardPath, 'utf8').match(/^\| (?:OPS|AN|DS|SEC|BE|QA|FE|DOC|PAY|DOCS|DEMO)-\d{2}/gm)?.length ?? 0) +
    ' unique task rows validated (static only).')
}
