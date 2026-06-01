#!/usr/bin/env bash
#
# Deploy Padsmith to a local directory served by your web server.
#
# Usage:
#   DEPLOY_TARGET=/var/www/padsmith ./scripts/deploy.sh
#
# What it does:
#   1. git pull --ff-only (skip if PADSMITH_NO_PULL=1)
#   2. npm ci             (only if package-lock.json changed since last run)
#   3. npm run build      (Vite, base=/padsmith/)
#   4. rsync -a --delete  dist/ → $DEPLOY_TARGET/
#
# Set VITE_BASE to deploy at a different subpath (defaults to /padsmith/).

set -euo pipefail

TARGET="${DEPLOY_TARGET:-}"
if [[ -z "$TARGET" ]]; then
  echo "error: set DEPLOY_TARGET to the directory your web server serves" >&2
  echo "  example: DEPLOY_TARGET=/var/www/padsmith ./scripts/deploy.sh" >&2
  exit 1
fi

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

if [[ "${PADSMITH_NO_PULL:-0}" != "1" ]]; then
  echo ">>> git pull"
  git pull --ff-only
fi

# Re-run `npm ci` only when the lockfile actually changed since the last
# build. Cuts ~30s off typical redeploys.
LOCK_HASH=$(sha256sum package-lock.json | awk '{print $1}')
STAMP="node_modules/.padsmith-lock-hash"
if [[ ! -f "$STAMP" || "$(cat "$STAMP")" != "$LOCK_HASH" ]]; then
  echo ">>> npm ci"
  npm ci
  echo "$LOCK_HASH" > "$STAMP"
else
  echo ">>> npm ci skipped (lockfile unchanged)"
fi

echo ">>> npm run build"
npm run build

echo ">>> rsync dist/ → $TARGET/"
rsync -a --delete dist/ "$TARGET/"

echo ">>> done. Verify with: curl -I https://willko.dev/padsmith/"
