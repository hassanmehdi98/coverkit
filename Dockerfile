# CoverKit production image — build on linux/arm64 (Graviton / t4g).
# Multi-stage: deps → build → prisma CLI → slim runtime with Next.js standalone.

FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Prisma generate does not need a live DB; provide a dummy URL for schema load.
ENV DATABASE_URL="postgresql://coverkit:coverkit@localhost:5432/coverkit?schema=public"
# Client DSN is inlined at build; server DSN comes from runtime env_file.
ARG NEXT_PUBLIC_SENTRY_DSN=
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
# Optional source-map upload (no-op when unset — see next.config.ts)
ARG SENTRY_AUTH_TOKEN=
ARG SENTRY_ORG=
ARG SENTRY_PROJECT=
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT
RUN npx prisma generate
RUN npm run build

# Isolated Prisma CLI install (complete dependency tree for migrate deploy)
FROM node:20-bookworm-slim AS prisma-cli
WORKDIR /prisma-cli
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN npm init -y \
  && npm install prisma@6.19.3 \
  && test -f node_modules/prisma/build/index.js

FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone Next server
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Fonts for Satori + brand mark for demo seed
COPY --from=builder /app/assets ./assets

# Prisma schema/migrations + full CLI tree for migrate on boot
COPY --from=builder /app/prisma ./prisma
COPY --from=prisma-cli /prisma-cli/node_modules ./prisma-cli/node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/package.json ./package.json

# Native renderer + S3 client for runtime/seed
COPY --from=builder /app/node_modules/@resvg ./node_modules/@resvg
COPY --from=builder /app/node_modules/@aws-sdk ./node_modules/@aws-sdk
COPY --from=builder /app/scripts/seed-demo.mjs ./scripts/seed-demo.mjs

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh \
  && test -f ./prisma-cli/node_modules/prisma/build/index.js \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
