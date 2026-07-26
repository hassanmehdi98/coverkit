# CoverKit

OG image generator MVP — design templates in a visual editor, render them dynamically via URL.

## Phase 0 — Local environment

### Prerequisites

- Node.js 20+
- Docker + Docker Compose

### Setup

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)  
Demo PNG: [http://localhost:3000/img/demo.png?title=Hello+World](http://localhost:3000/img/demo.png?title=Hello+World)  
Postgres: `localhost:5433` (mapped from container 5432)  
MinIO console: [http://localhost:9001](http://localhost:9001) (`minioadmin` / `minioadmin`)

### Smoke tests

```bash
npm run test:storage
npm run db:seed
# then open /img/demo.png?title=Testing+123
```

### Production deploy (Phase 5)

Single EC2 + Docker Compose (app, Caddy, Postgres) + S3.  
See **[DEPLOY.md](./DEPLOY.md)** for AWS **console** steps, first boot, backups, and rollback.

```bash
# on the server after cloning
cp .env.production.example .env.production && chmod 600 .env.production
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Landing + analytics (Phase 4)

- `/` marketing landing with live demo against `/img/demo.png`
- Waitlist: `POST /api/waitlist`
- Funnel events: `POST /api/events` (self-hosted `AnalyticsEvent` table)

Optional footer env vars: `NEXT_PUBLIC_BUILT_BY`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_TWITTER_URL`.

### Editor (Phase 3)

Home page preset picker → `/t/[id]/edit` with canvas, properties, variables, autosave, Preview PNG, Get URL.

Image uploads require working MinIO/S3 credentials. For local Docker MinIO keep:

```
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"
```

Do not mix AWS IAM keys with a MinIO `S3_ENDPOINT` — uploads will 403.

### Google OAuth (Phase 2)

1. Create an OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Set in `.env`:
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - `AUTH_SECRET` (e.g. `openssl rand -base64 32`)
   - `APP_URL=http://localhost:3000`
4. Restart `npm run dev`, then use **Sign in with Google** in the header.
