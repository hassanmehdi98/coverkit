# CoverKit production deploy (single EC2 + Docker Compose)

You provision AWS resources in the **console**. This repo provides the Docker stack, scripts, and the steps below.

Architecture: **one `t4g.small` (arm64) EC2** running `app` + `Caddy` + `Postgres` via `docker-compose.prod.yml`, plus **S3** for uploads/backups. No RDS, App Runner, or load balancer.

---

## 1. S3 bucket (console)

1. **S3 → Create bucket**
   - Name: e.g. `coverkit-uploads-<yourname>`
   - Region: same as the instance (e.g. `us-east-1`)
   - **Block Public Access**: turn **off** “Block all public access” (MVP public-read on uploads). Confirm the warning.
   - Default encryption: SSE-S3 is fine.

2. **Permissions → Bucket policy** (replace `BUCKET` and account/region as needed):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadUploads",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::BUCKET/uploads/*",
        "arn:aws:s3:::BUCKET/demo/*",
        "arn:aws:s3:::BUCKET/render-cache/*"
      ]
    }
  ]
}
```

3. **Management → Lifecycle rules**
   - Rule name: `expire-db-backups`
   - Prefix: `backups/`
   - Expire current versions after **30 days**

4. **TODO (later):** put CloudFront (OAC) in front of the bucket and point `S3_PUBLIC_BASE_URL` at the distribution.

Set `S3_PUBLIC_BASE_URL` to:

`https://BUCKET.s3.REGION.amazonaws.com`

(no trailing slash)

---

## 2. IAM instance role (console)

1. **IAM → Roles → Create role**
   - Trusted entity: **AWS service → EC2**
   - Name: e.g. `coverkit-ec2`

2. **Add inline policy** (replace `BUCKET`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "UploadsAndCache",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": [
        "arn:aws:s3:::BUCKET/uploads/*",
        "arn:aws:s3:::BUCKET/demo/*",
        "arn:aws:s3:::BUCKET/render-cache/*"
      ]
    },
    {
      "Sid": "BackupsPut",
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::BUCKET/backups/*"
    },
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::BUCKET",
      "Condition": {
        "StringLike": {
          "s3:prefix": ["uploads/*", "demo/*", "render-cache/*", "backups/*"]
        }
      }
    }
  ]
}
```

Do **not** put long-lived access keys on the instance. The app and `aws s3 cp` for backups use this role.

---

## 3. EC2 instance (console)

1. **EC2 → Launch instance**
   - Name: `coverkit`
   - AMI: **Ubuntu Server 24.04 LTS (Arm)**
   - Type: **`t4g.small`** (2 vCPU / 2 GB — do not use nano/micro)
   - Key pair: one you can SSH with
   - Network: default VPC is fine
   - **Auto-assign public IP:** enable (or attach Elastic IP in the next step)
   - Storage: **20 GB gp3**
   - **Advanced → IAM instance profile:** `coverkit-ec2`

2. **Security group**
   - Inbound:
     - **22/tcp** from **My IP** only
     - **80/tcp** from `0.0.0.0/0`
     - **443/tcp** from `0.0.0.0/0`
   - Outbound: all (default)

3. **Elastic IP → Allocate → Associate** with this instance. Note the IP.

4. **Optional:** EC2 → Snapshots / Data Lifecycle Manager — weekly EBS snapshot of the root volume (console one-liner setup is enough).

---

## 4. DNS

Create an **A record** for your domain (e.g. `coverkit.dev`) → Elastic IP.  
Caddy will obtain a Let’s Encrypt certificate automatically once ports 80/443 reach the box.

---

## 5. Google OAuth (console)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth client (Web)
2. Authorized redirect URI:

`https://coverkit.dev/api/auth/callback/google`

3. Copy Client ID / Secret into `.env.production` on the server (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`).

---

## 6. First boot on the instance

SSH in:

```bash
ssh -i /path/to/key.pem ubuntu@ELASTIC_IP
```

### 6.1 Swap (2 GB OOM safety net)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

### 6.2 Docker + Compose plugin

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl unzip
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker ubuntu
# log out and back in so docker works without sudo
```

### 6.3 AWS CLI v2 (for backups; uses instance role)

```bash
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o /tmp/awscliv2.zip
cd /tmp && unzip -q awscliv2.zip && sudo ./aws/install
aws sts get-caller-identity   # should show the instance role
```

### 6.4 Unattended upgrades

```bash
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 6.5 Clone app + env

```bash
sudo mkdir -p /opt/coverkit
sudo chown ubuntu:ubuntu /opt/coverkit
git clone https://github.com/YOUR_ORG/coverkit.git /opt/coverkit
cd /opt/coverkit

cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

Fill in at least:

| Variable | Value |
|----------|--------|
| `DOMAIN` | `coverkit.dev` (no `https://`) |
| `APP_URL` / `AUTH_URL` | `https://coverkit.dev` |
| Google redirect | `https://coverkit.dev/api/auth/callback/google` |
| `POSTGRES_PASSWORD` | long random string |
| `DATABASE_URL` | same password, host `db`, port `5432` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_GOOGLE_*` | from Google console |
| `S3_BUCKET` / `S3_REGION` | your bucket |
| `S3_PUBLIC_BASE_URL` | `https://BUCKET.s3.REGION.amazonaws.com` |
| `SENTRY_DSN` | Sentry project DSN (server / render errors) |
| `NEXT_PUBLIC_SENTRY_DSN` | same DSN (client `global-error`; inlined at Docker build) |

**Do not set** `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, or `S3_SECRET_ACCESS_KEY` in production.

Sentry is optional: leave both DSN vars empty and the SDK is a no-op. For readable stack traces, optionally set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` in `.env.production` (chmod 600) — source-map upload is skipped when the token is absent, so builds never fail for missing Sentry credentials.

### 6.6 First deploy (migrations run in the container entrypoint)

```bash
cd /opt/coverkit
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f app
```

If you already deployed and only pulled a fix (e.g. Prisma CLI path), rebuild the app image:

```bash
cd /opt/coverkit
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build --force-recreate app
```

Build is **arm64-native** on `t4g` — no QEMU needed.

### 6.7 Seed the demo + site OG templates

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec app \
  node scripts/seed-demo.mjs
```

Re-run the same command after pulling logo/favicon or site-card fixes so `demo/logo.png` and the `site` template stay in sync.

Verify:
- `https://coverkit.dev/img/demo.png?title=Prod+Check`
- `https://coverkit.dev/img/site.png` (homepage Open Graph image; no watermark)

---

## 7. Day-to-day deploys

From your laptop (repo root):

```bash
chmod +x deploy.sh
./deploy.sh ubuntu@ELASTIC_IP
# or: DEPLOY_HOST=ubuntu@ELASTIC_IP APP_DIR=/opt/coverkit ./deploy.sh
```

That SSHes in, `git pull`s `main`, and runs `docker compose … up -d --build`.

**Rollback:** on the server:

```bash
cd /opt/coverkit
git fetch --tags
git checkout <previous-tag-or-sha>
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Optional: GitHub Actions (`.github/workflows/deploy.yml`) — set secrets `DEPLOY_HOST` (hostname/IP only), `DEPLOY_USER` (`ubuntu`), `DEPLOY_SSH_KEY`, optional `DEPLOY_APP_DIR`.

---

## 8. Nightly database backups

On the EC2 host:

```bash
chmod +x /opt/coverkit/scripts/backup-db.sh

# smoke-test once
export S3_BUCKET=your-bucket-name
export S3_REGION=us-east-1
export COMPOSE_DIR=/opt/coverkit
/opt/coverkit/scripts/backup-db.sh

# cron at 03:15 UTC daily
crontab -e
```

Add:

```cron
15 3 * * * S3_BUCKET=your-bucket-name S3_REGION=us-east-1 COMPOSE_DIR=/opt/coverkit /opt/coverkit/scripts/backup-db.sh >> /var/log/coverkit-backup.log 2>&1
```

Confirm an object appears at `s3://BUCKET/backups/YYYY-MM-DD.sql.gz`.

### Restore (tested procedure)

```bash
cd /opt/coverkit
# download
aws s3 cp s3://BUCKET/backups/YYYY-MM-DD.sql.gz /tmp/restore.sql.gz --region us-east-1
gunzip -c /tmp/restore.sql.gz > /tmp/restore.sql

# replace DB contents (destructive)
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T db \
  psql -U coverkit -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'coverkit' AND pid <> pg_backend_pid();"
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T db \
  psql -U coverkit -d postgres -c "DROP DATABASE IF EXISTS coverkit;"
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T db \
  psql -U coverkit -d postgres -c "CREATE DATABASE coverkit OWNER coverkit;"
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T db \
  psql -U coverkit -d coverkit < /tmp/restore.sql

# restart app so pools reconnect
docker compose -f docker-compose.prod.yml --env-file .env.production restart app
```

---

## 9. Acceptance checklist

- [ ] `https://YOUR_DOMAIN` loads the landing page with a **valid** certificate  
- [ ] `https://YOUR_DOMAIN/img/demo.png?title=Prod+Check` returns a PNG  
- [ ] Google sign-in completes on the production domain  
- [ ] Upload a logo in the editor → object appears in S3 and renders on the card  
- [ ] Backup cron (or manual `backup-db.sh`) produces a dump under `s3://…/backups/` that restores with the steps above  

---

## 10. Useful commands

```bash
# status
docker compose -f docker-compose.prod.yml --env-file .env.production ps

# app logs
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f app caddy

# shell in app
docker compose -f docker-compose.prod.yml --env-file .env.production exec app sh
```
