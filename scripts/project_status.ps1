# Read-only snapshot for CNPM-MXH-SV; runs in Windows PowerShell or PowerShell 7.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/project_status.ps1
# Does not change branches, install dependencies or contact remote.
$ErrorActionPreference = 'Stop'
$root = git rev-parse --show-toplevel 2>$null
if ($LASTEXITCODE -ne 0 -or -not $root) { throw 'Run this script from inside a Git clone.' }
Write-Output ('Repo root: ' + $root)
Write-Output '=== Branch and HEAD ==='
git branch --show-current
git rev-parse HEAD
git log -1 --format='%h %ad %s' --date=iso-strict
Write-Output '=== Working changes (including untracked) ==='
git status --short
Write-Output '=== Linked worktrees ==='
git worktree list --porcelain
Write-Output '=== Remotes (URL may identify account; redact before sharing) ==='
git remote
Write-Output '=== Local branches with tracking ==='
git branch -vv
Write-Output '=== GitHub PRs: check online (no remote mutations performed) ==='
Write-Output 'https://github.com/HungNDk4/CNPM-MXH-SV/pulls'
Write-Output '=== Required read-first ==='
Write-Output 'PROJECT_CONTROL.md -> docs/ops/CURRENT_STATE.md -> docs/ops/TASK_BOARD.md -> docs/ops/SESSION_LOG.md'
