#!/usr/bin/env bash
# Nightly Postgres dump → S3. Run on the EC2 host via cron/systemd.
# Requires: AWS CLI v2, instance profile with s3:PutObject on backups/*,
# and docker compose working from the app directory.
#
# Env (or edit defaults below):
#   COMPOSE_DIR   — path to the git checkout (default: /opt/coverkit)
#   S3_BUCKET     — bucket name
#   S3_REGION     — AWS region
#   POSTGRES_USER / POSTGRES_DB — must match compose

set -euo pipefail

COMPOSE_DIR="${COMPOSE_DIR:-/opt/coverkit}"
S3_BUCKET="${S3_BUCKET:?S3_BUCKET is required}"
S3_REGION="${S3_REGION:-us-east-1}"
POSTGRES_USER="${POSTGRES_USER:-coverkit}"
POSTGRES_DB="${POSTGRES_DB:-coverkit}"
DATE="$(date +%F)"
KEY="backups/${DATE}.sql.gz"

cd "$COMPOSE_DIR"

echo "Dumping ${POSTGRES_DB} → s3://${S3_BUCKET}/${KEY}"
docker compose -f docker-compose.prod.yml --env-file .env.production \
  exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip \
  | aws s3 cp - "s3://${S3_BUCKET}/${KEY}" --region "$S3_REGION" \
      --content-type "application/gzip"

echo "Backup complete: s3://${S3_BUCKET}/${KEY}"
