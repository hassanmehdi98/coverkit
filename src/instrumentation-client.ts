import * as Sentry from "@sentry/nextjs";

// Next.js 16 (Turbopack) loads this file for client SDK init.
// Keeps the wizard-style sentry.client.config.ts as the source of truth.
import "../sentry.client.config";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
