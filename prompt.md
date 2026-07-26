# Cursor Build Prompt — "CoverKit" OG Image Generator (Validation MVP, AWS edition)

Copy everything below the line into Cursor. Work phase by phase: tell Cursor to complete a phase, verify it runs, then proceed. Do not paste all phases at once.

---

## Project Overview

Build a web app that lets users design Open Graph (link preview) image templates in a visual editor, then generates those images dynamically via URL. Think "Canva for social cards, where the template becomes an API URL."

**This is a validation MVP.** Optimize for shipping fast and clean, not for scale. No payments, no teams, no admin panel.

## Tech Stack (do not deviate)

- **Next.js 14+ (App Router), TypeScript, Tailwind CSS**
- **Rendering:** Satori + @resvg/resvg-js to render templates to PNG server-side (Node runtime route handlers only — no edge runtime, to avoid font/wasm headaches)
- **Database:** PostgreSQL via Prisma. Local dev: Postgres in Docker Compose. Production: AWS RDS.
- **Auth:** Auth.js (NextAuth v5) with Google OAuth provider, JWT session strategy, Prisma adapter for user records. **Auth is optional for users** — see Ownership Model below.
- **Storage:** AWS S3 for uploaded images (logos, backgrounds). Abstract behind a `lib/storage.ts` module (`putObject`, `getPublicUrl`, `deleteObject`). Local dev: MinIO in Docker Compose using the same S3 SDK, so no code branches between dev and prod.
- **Deployment:** Docker container on AWS App Runner, RDS Postgres, S3 (+ optional CloudFront). Full details in Phase 4.

## Ownership Model (important)

- Templates have a nullable `userId`.
- **Anonymous templates** (`userId = null`): anyone with the unguessable edit link (`/t/[id]/edit`, nanoid 12+ chars) can edit. This keeps the funnel signup-free.
- **Claimed templates**: a signed-in user can claim an anonymous template ("Save to my account" button in the editor). Once claimed, only the owner can edit; others hitting the edit URL see a read-only view with a "duplicate to your own" option.
- Signed-in users get a minimal `/dashboard` listing their templates (name, thumbnail, created date, open/delete).
- **Render URLs (`/img/[id].png`) are ALWAYS public regardless of ownership** — social platforms' crawlers must fetch them unauthenticated. Never gate rendering behind auth.
- Never force login to use the editor. Auth entry points: header "Sign in" button, and the "Save to my account" prompt in the editor.

## Core Architecture Principle (critical)

There is ONE source of truth for what a template looks like: a JSON layout schema.

- The **editor** renders this schema client-side as absolutely-positioned styled divs inside a fixed 1200×630 canvas (scaled down to fit viewport with CSS transform).
- The **server** renders the SAME schema by converting it to Satori-compatible JSX (Satori supports a flexbox/absolute-position subset of CSS).
- Therefore: only use CSS properties in the editor that Satori supports (absolute positioning, flexbox, background color/gradient/image, border-radius, color, fontSize, fontWeight, letterSpacing, lineHeight, textAlign, opacity, padding). Enforce this by having a single shared `renderElementStyle(element)` function used by both the editor and the server converter.

### Template Schema (TypeScript)

```ts
type Template = {
  id: string;              // nanoid, 12+ chars
  userId: string | null;   // null = anonymous, link-editable
  name: string;
  createdAt: string;
  background: {
    type: "color" | "gradient" | "image";
    color?: string;            // hex
    gradient?: { from: string; to: string; angle: number };
    imageUrl?: string;         // S3 public URL
  };
  elements: Element[];     // z-order = array order
};

type Element = TextElement | ImageElement | RectElement;

type BaseElement = {
  id: string;
  x: number; y: number;    // px in 1200x630 space
  width: number; height: number;
  opacity: number;         // 0-1
};

type TextElement = BaseElement & {
  type: "text";
  content: string;         // may contain {{variables}}
  fontFamily: "Inter" | "Roboto" | "Playfair Display" | "JetBrains Mono";
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700 | 800;
  color: string;
  textAlign: "left" | "center" | "right";
  lineHeight: number;
};

type ImageElement = BaseElement & {
  type: "image";
  src: string;             // S3 URL or {{variable}}
  borderRadius: number;
  objectFit: "cover" | "contain";
};

type RectElement = BaseElement & {
  type: "rect";
  fill: string;
  borderRadius: number;
};
```

### Variable substitution

Any `{{variableName}}` inside text content or image src is a dynamic variable. At render time, variables are filled from URL query parameters. Missing variables render as empty string. Sanitize: strip HTML, cap each variable at 200 chars. For image-src variables, only allow https URLs and fetch with a 3s timeout and 5MB cap.

---

## Phase 0 — Local environment

1. Scaffold Next.js (App Router, TypeScript, Tailwind). Prisma with Postgres.
2. `docker-compose.yml` for local dev: `postgres:16` and `minio` (S3-compatible) with a bootstrap script that creates the bucket.
3. `.env.example` documenting every variable: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT` (set for MinIO locally, unset in prod), `S3_PUBLIC_BASE_URL`, `APP_URL`.
4. `lib/storage.ts` using @aws-sdk/client-s3, honoring `S3_ENDPOINT` when present (MinIO) and defaulting to real S3 otherwise.

**Acceptance test:** `docker compose up`, `prisma migrate dev`, `npm run dev` boots with zero errors; a test script can put/get an object through `storage.ts` against MinIO.

## Phase 1 — Rendering engine first (the risky part)

1. Implement `lib/render.ts`: takes a `Template` + a `Record<string,string>` of variables, converts schema → Satori JSX → SVG → PNG buffer via resvg. Bundle the four font families locally in `/assets/fonts` (regular + bold weights minimum); load them into Satori.
2. Route handler `GET /img/[templateId].png` — loads template from DB, substitutes query params as variables, renders PNG, returns with `Cache-Control: public, max-age=3600`, `Content-Type: image/png`.
3. Watermark: render a small semi-transparent "made with CoverKit" text pinned bottom-right on every image (hardcoded on; gated by plan later).
4. Seed the DB with one hardcoded demo template (gradient background, {{title}} text element, logo image) so `/img/demo.png?title=Hello+World` works immediately.
5. Protection on the render route: rate limit 60 renders/minute per IP (in-memory is acceptable while running a single App Runner instance — leave a TODO to move to Redis/ElastiCache if instance count > 1); return 429 beyond that. Reject rendering if any query param exceeds 200 chars.
6. Optional but recommended: cache rendered PNGs to S3 under a key of `sha256(templateId + templateUpdatedAt + sortedParams)`; serve from cache on hit. Keeps render CPU flat when a card goes viral.

**Acceptance test:** visiting `/img/demo.png?title=Testing+123` in a browser returns a correct 1200×630 PNG with the title text and watermark. Changing the title in the URL changes the image.

## Phase 2 — Auth + ownership

1. Auth.js v5 with Google provider, JWT sessions, Prisma adapter (User/Account tables). Header shows "Sign in with Google" or avatar + menu (Dashboard, Sign out).
2. Ownership enforcement per the Ownership Model above: `PUT /api/templates/[id]` allows writes if template is anonymous OR session user is owner; otherwise 403.
3. "Save to my account" button in the editor for signed-in users viewing an anonymous template (sets `userId`). If not signed in, the button triggers the Google sign-in flow and claims on return.
4. `/dashboard`: list of the user's templates with thumbnail (render at 300px wide via the render endpoint), rename, delete (deleting also deletes its S3 uploads), "New template".
5. Read-only view of a claimed template for non-owners with "Duplicate to edit" (creates an anonymous copy, or owned copy if signed in).

**Acceptance test:** anonymous create → edit works logged out; claim with Google; second browser (logged out) gets read-only + duplicate; owner sees template in dashboard.

## Phase 3 — Template editor

Route: `/t/[templateId]/edit`

Layout: left sidebar (element list + add buttons), center canvas, right sidebar (properties of selected element).

1. **Canvas:** fixed 1200×630 logical size, CSS-scaled to fit. Renders `template.elements` as absolutely positioned divs using the shared `renderElementStyle` function. Click to select (blue outline + corner handles), drag to move, drag corner handles to resize. Snap to 8px grid. Arrow keys nudge 1px (shift = 10px). Delete key removes element.
2. **Add elements:** buttons for Text, Image (file upload → `POST /api/upload` → S3 via `storage.ts`; jpg/png/webp, max 5MB), Rectangle.
3. **Properties panel:** edit all schema fields of the selected element with appropriate controls (color pickers, sliders for opacity/borderRadius, font dropdowns, textarea for text content). Background section when nothing selected: color / gradient (two colors + angle slider) / uploaded image.
4. **Variables UX:** typing `{{` in a text field works as-is; additionally show a panel listing all detected variables in the template with sample values the user can set for preview. Editor preview substitutes these sample values live.
5. **Persistence:** autosave template JSON to the DB (debounced 1s) via `PUT /api/templates/[id]`. Show "Saved" indicator; show a clear error state on 403 (claimed by someone else).
6. **Toolbar:** template name (editable), "Preview PNG" button (opens `/img/[id].png?{sampleValues}` in new tab — proves editor/server parity), "Save to my account" (per Phase 2), and "Get URL".
7. **"Get URL" modal:** the dynamic image URL with detected variables as query params, a copy button, and a ready-to-copy meta tag snippet:
   `<meta property="og:image" content="https://DOMAIN/img/{id}.png?title={{YOUR_TITLE}}" />`
8. `POST /api/templates` creates a template (blank or from one of 3 starter presets: "Blog post", "Product/SaaS page", "Podcast episode" — design these tastefully with gradients and good typography; they are the first thing users judge). If a session exists, set `userId` at creation.

**Acceptance test:** create from preset → edit text with {{title}} → set sample value → Preview PNG matches canvas visually → Get URL → open URL with a different title param → correct PNG.

## Phase 4 — Landing page + funnel instrumentation

1. `/` landing page. Hero: headline "Every page deserves its own social card", subhead explaining design-once-generate-forever, a live demo (an input where typing a title live-updates a rendered card via the demo template URL — this IS the product demo), primary CTA "Design your card — free, no signup".
2. Sections: 3-step how-it-works (Design → Copy URL → Every page gets a card); before/after of a bare link vs rich card in a fake tweet/Slack mock; pricing:
   - **Free:** editor, watermarked images, 50 renders/mo
   - **Pro — $12/mo:** no watermark, 5,000 renders/mo, multiple templates — button says "Join the waitlist"
3. Waitlist: email input, `POST /api/waitlist`, store email + timestamp + referrer in Postgres. No email service integration; just store rows.
4. Analytics: Plausible (or a simple self-hosted event table if no Plausible account): track landing view, editor opened, template created, PNG previewed, Get-URL copied, sign-in, template claimed, waitlist signup. These events are the entire point of the MVP — do not skip.
5. Footer: "Built by [name]" + contact email + Twitter/X link.

**Acceptance test:** full journey works logged-out end to end: land → try live demo → create template → get URL → hit waitlist; and the auth journey: claim → appears in dashboard.

## Phase 5 — AWS deployment (bare-minimum single EC2)

Target architecture: **one EC2 instance running Docker Compose (app + Caddy + Postgres) + S3 for uploads**. No RDS, no App Runner, no load balancer. Deliverables: a production compose file, a `DEPLOY.md` with exact commands, and a tiny deploy script. Include:

1. **Dockerfile:** multi-stage Node 20 build using Next.js `output: "standalone"`; final image runs `node server.js` on port 3000. Entrypoint script runs `prisma migrate deploy` before boot. Build for **arm64** (instance is Graviton).
2. **Instance:** `t4g.small` (2 vCPU / 2GB — do NOT downsize to micro; PNG rendering + Postgres needs the headroom), Ubuntu 24.04 arm64, 20GB gp3, Elastic IP. Security group: 80/443 open, 22 restricted to my IP. Add 2GB swap in setup instructions as an OOM safety net.
3. **`docker-compose.prod.yml`** with three services:
   - `app`: the Next.js image, env from `.env.production` (chmod 600, never committed)
   - `caddy`: reverse proxy with a 5-line Caddyfile — automatic HTTPS via Let's Encrypt for the domain, proxying to `app:3000`
   - `db`: `postgres:16` with a named volume; not exposed on any host port (compose network only)
4. **Backups (mandatory, since Postgres is self-hosted):** a cron/systemd-timer on the host running nightly `docker compose exec db pg_dump ... | gzip | aws s3 cp - s3://BUCKET/backups/$(date +%F).sql.gz`, with a 30-day S3 lifecycle expiry rule. Include a tested restore command in DEPLOY.md. Also recommend a weekly EBS snapshot (one-line note, can be set in console).
5. **S3 + IAM:** uploads bucket; EC2 **instance profile role** granting only `s3:PutObject/GetObject/DeleteObject` on the uploads prefix and `s3:PutObject` on the backups prefix — no access keys stored on the box. Public read via bucket policy on the uploads prefix is acceptable for MVP (leave a CloudFront TODO); set `S3_PUBLIC_BASE_URL` accordingly.
6. **Deploys:** simplest viable — `deploy.sh` that SSHes in, `git pull`, `docker compose -f docker-compose.prod.yml up -d --build`. Optional GitHub Actions workflow doing the same over SSH on push to main. Rollback = `git checkout <prev-tag>` + re-run.
7. **Domain + TLS:** DNS A record → Elastic IP; Caddy handles certificates automatically. Set `APP_URL=https://DOMAIN` and the Google OAuth redirect URI (`https://DOMAIN/api/auth/callback/google`).
8. **`DEPLOY.md`** must cover, in order: launching the instance (console or a single `aws ec2 run-instances` command), installing Docker + compose plugin, creating the IAM role and bucket, the Google OAuth client setup, first deploy + migration, the backup cron, the restore procedure, and unattended-upgrades for OS security patches.

**Acceptance test:** production URL serves the landing page over HTTPS with a valid certificate; `/img/demo.png?title=Prod+Check` renders; Google sign-in round-trips on the production domain; an uploaded logo lands in S3 and displays; the backup cron produces a restorable dump in S3.

## Explicitly OUT of scope — do not build

- Payments/Stripe, teams/sharing, template gallery/marketplace
- Multiple formats (Twitter/LinkedIn sizes), font uploads, custom domains for image URLs
- Email sending (magic links, notifications), admin dashboard, API keys (unguessable URL is the "key" for MVP)
- Any queue/worker infra — render synchronously
- Multi-instance scaling concerns beyond the noted rate-limit TODO

## Code quality bar

TypeScript strict mode. Zod-validate all API inputs (template JSON especially — never trust client schema). Ownership checks live in one server-side helper, used by every mutating route. Keep components small. Comment the Satori conversion code well — it's the part that will be extended. `npm run build` must pass with zero errors before declaring any phase done.