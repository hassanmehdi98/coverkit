import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    if (isExpectedError(hint.originalException)) {
      return null;
    }
    return event;
  },
});

function isExpectedError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { name?: string; status?: number; statusCode?: number };
  if (err.name === "ZodError") return true;
  const status = err.status ?? err.statusCode;
  return status === 404 || status === 429;
}
