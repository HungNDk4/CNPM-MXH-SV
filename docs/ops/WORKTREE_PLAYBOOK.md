# Git Worktree Playbook — Windows / GitHub Desktop / AI
**Objective:** one repository, independent local directories and branches for Human A, Human B and AI sessions. A remote branch is NOT a local git worktree. This guide never claims to have created folders on anyone's PC.

## Concepts
- Primary clone contains shared Git object store. `git worktree add` creates another checkout with a distinct working tree/index/branch, but same underlying repository history.
- Git branches/commits can be pushed; worktree folders, installs, local `.env`, and dirty file changes are **not** synchronized automatically.
- Remote source of truth is GitHub PR and commits. Logical ownership is tracked in [WORKTREE_REGISTRY.md](WORKTREE_REGISTRY.md).
- Do not create worktree *inside* the repository root; use sibling folders.

## Preconditions
Open PowerShell **in the existing repo clone** (the folder with `.git`), with Git installed. Check:
```powershell
git remote -v
git branch --show-current
git status --short
git worktree list --porcelain
git fetch origin
```
If clone is dirty, do not reset/clean it to continue. Resolve or commit own uncommitted work in its own branch.

## Create worktrees (AFTER foundation docs merged into main)
Each person/AI claims a branch with a unique task name. Exact folder path is local; examples only:
```powershell
# Person A / analysis & design
git worktree add -b docs/requirements-baseline ../CNPM-MXH-SV-wt-analysis origin/main

# Person B / implementation (only after scope/contract approved)
git worktree add -b feat/post-detail ../CNPM-MXH-SV-wt-dev origin/main

# Optional independent QA workstream
git worktree add -b test/core-regression ../CNPM-MXH-SV-wt-qa origin/main
```
Choose unique branch names. `git worktree add -b` fails if the branch already exists, which is safer than silently taking over someone else's branch.

**Before foundation merge:** `main` does not yet include the new playbooks. Docs-only experiments can instead base on `origin/docs/session-worktree-control-20261017` after fetching that branch, but keep the PR dependency explicit. Do not place production feature work atop unapproved docs if avoidable.

## Daily routine INSIDE one worktree
```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git log -1 --oneline
git worktree list
# Edit, build/test, git add <specific files>, commit, push branch, open PR.
```
Avoid `git add .` if unintended files have changed. Frontend and server require separate `npm ci` per worktree. Keep `.env` per worktree outside Git.
Use `scripts/project_status.ps1` from repo root/worktree to print read-only local evidence.

## Resume an existing remote branch in a NEW worktree
```powershell
git fetch origin
git worktree list --porcelain
git branch --list docs/requirements-baseline
# If branch exists locally and is NOT checked out elsewhere:
git worktree add ../CNPM-MXH-SV-wt-analysis docs/requirements-baseline
# Otherwise create NEW unique task branch from the appropriate reviewed base.
```
If Git reports `already checked out`, inspect existing worktree rather than bypass with force. Avoid attaching the same branch to multiple worktrees.

## Handoff across chat sessions
1. Commit changes and push remote branch.
2. Update TASK_BOARD/CURRENT_STATE/SESSION_LOG and WORKTREE_REGISTRY in a dedicated docs commit/PR; do not pretend an unpushed local log is shared.
3. Capture full commit SHA, PR URL, task ID, exact tests and next action in handoff.
4. Next session verifies branch/status/HEAD before acting. Read [SESSION_START.md](SESSION_START.md).

## Safe cleanup
```powershell
git worktree list --porcelain
git -C ../CNPM-MXH-SV-wt-qa status --short
# Only after all desired changes are committed/pushed and branch reviewed:
git worktree remove ../CNPM-MXH-SV-wt-qa
git worktree list
```
Never use `--force` to remove dirty/locked worktrees. Never delete worktree folders directly if Git can remove them. Never delete shared branches without coordination. If moved externally, consult `git worktree repair`. `git worktree prune -n` previews stale cleanup; do not run destructive cleanup blindly.

## Conflict protocol
- Human A and Human B must not edit the SAME local worktree simultaneously.
- If two PRs touch `App.jsx`, routes or a shared model, coordinate merge order, sync base, resolve conflicts on branch; do not directly overwrite another member's branch.
- Stacked PRs have explicit dependency. The planning PR targets the foundation branch because PR #1 has not merged. GitHub Desktop does not fully handle stacked PRs; use GitHub web/CLI for stack review and Git CLI for worktrees.

## Where to record local worktrees
Enter only **verified** local path, machine alias (not private address) and branch into registry via a PR. Do not invent worktree creation from GitHub branch state.
