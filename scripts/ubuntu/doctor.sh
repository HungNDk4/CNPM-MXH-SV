#!/usr/bin/env bash
# Read-only prerequisites check: no sudo, network, DB writes.
set -euo pipefail
errors=0
warn() { printf "WARN  %s\n" "$1"; }
ok() { printf "PASS  %s\n" "$1"; }
fail() { printf "FAIL  %s\n" "$1"; errors=$((errors+1)); }
if [[ -r /etc/os-release ]]; then
  . /etc/os-release
  if [[ "${ID:-}" == "ubuntu" ]]; then ok "Ubuntu: ${PRETTY_NAME:-unknown}"; else warn "System ${PRETTY_NAME:-unknown}, instructions target Ubuntu 24.04"; fi
else warn "Cannot read /etc/os-release"; fi
for cmd in git node npm mysql; do
  if command -v "$cmd" >/dev/null 2>&1; then
    case "$cmd" in
      mysql) ok "$cmd: $(mysql --version)" ;;
      *) ok "$cmd: $("$cmd" --version 2>&1 | head -n 1)" ;;
    esac
  else fail "Missing executable: $cmd"; fi
done
if command -v node >/dev/null 2>&1; then
  current="$(node -p 'process.versions.node.split(".")[0]')"
  if [[ "$current" == "24" ]]; then ok "Node.js major version 24"; else fail "Node.js must be 24.x; detected ${current}"; fi
fi
if command -v mysqladmin >/dev/null 2>&1; then
  if mysqladmin ping >/dev/null 2>&1; then ok "Local MySQL responds to ping"; else warn "MySQL ping unavailable (could be service or auth); check separately"; fi
else warn "mysqladmin unavailable"; fi
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
for file in "$root/server/package-lock.json" "$root/client/package-lock.json" "$root/database/schema.sql"; do
  if [[ -f "$file" ]]; then ok "Found ${file#"$root"/}"; else fail "Missing ${file#"$root"/}"; fi
done
printf "\nUbuntu prerequisite check: %s errors. This does not verify application database, PDF or payment operations.\n" "$errors"
if (( errors > 0 )); then exit 1; fi
