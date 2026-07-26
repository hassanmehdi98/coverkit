/**
 * In-memory sliding-window rate limiter.
 * TODO: move to Redis/ElastiCache if App Runner instance count > 1.
 */

type Entry = {
  timestamps: number[];
};

const hits = new Map<string, Entry>();

const WINDOW_MS = 60_000;

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = WINDOW_MS,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    hits.set(key, entry);
    return { allowed: false, remaining: 0 };
  }

  entry.timestamps.push(now);
  hits.set(key, entry);
  return { allowed: true, remaining: limit - entry.timestamps.length };
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
