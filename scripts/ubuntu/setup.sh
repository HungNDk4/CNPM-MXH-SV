#!/usr/bin/env bash
# Installs locked Node deps only. Never creates DB, imports schema or runs server.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
bash "$root/scripts/ubuntu/doctor.sh"
if [[ ! -f "$root/server/.env" ]]; then
  cp "$root/server/.env.example" "$root/server/.env"
  chmod 600 "$root/server/.env"
  printf "Created server/.env template. Edit DB password and two distinct JWT secrets.\n"
else
  printf "Existing server/.env preserved.\n"
fi
printf "Installing pinned backend dependencies...\n"
(cd "$root/server" && npm ci)
printf "Installing pinned frontend dependencies...\n"
(cd "$root/client" && npm ci)
printf "Installed npm dependencies. Create local MySQL DEV user and import fresh schema MANUALLY. See docs/UBUNTU_SETUP.md.\n"
