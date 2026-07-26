#!/usr/bin/env bash
# Deploy CoverKit to the EC2 host over SSH.
#
# Usage:
#   ./deploy.sh user@your.elastic.ip
#   DEPLOY_HOST=ubuntu@1.2.3.4 ./deploy.sh
#   APP_DIR=/opt/coverkit ./deploy.sh ubuntu@1.2.3.4
#
# First-time: clone the repo on the server to APP_DIR and create .env.production.
# Rollback: ssh in, git checkout <prev-tag>, then re-run this script (or compose up --build).

set -euo pipefail

HOST="${1:-${DEPLOY_HOST:-}}"
APP_DIR="${APP_DIR:-/opt/coverkit}"
BRANCH="${DEPLOY_BRANCH:-main}"

if [[ -z "$HOST" ]]; then
  echo "Usage: ./deploy.sh user@host" >&2
  echo "   or: DEPLOY_HOST=user@host ./deploy.sh" >&2
  exit 1
fi

echo "Deploying to ${HOST}:${APP_DIR} (branch ${BRANCH})..."

ssh -o StrictHostKeyChecking=accept-new "$HOST" bash -s -- "$APP_DIR" "$BRANCH" <<'REMOTE'
set -euo pipefail
APP_DIR="$1"
BRANCH="$2"
cd "$APP_DIR"
git fetch --all --tags
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.production ps
echo "Deploy finished."
REMOTE

echo "Done. Check https://\$DOMAIN on the server."
