/**
 * Fixed-window rate limiting for public endpoints.
 *
 * The pressing case is /api/crossref: it is unauthenticated and fans out to
 * several CBP requests per call. Left open, one person with a loop could get
 * our IP blocked by CBP - which takes out the core of the product, not just
 * that endpoint.
 *
 * In-memory, so the budget is per server instance. That is honest for a single
 * Railway instance and degrades sensibly if we scale out (each instance keeps
 * its own share). Move to Postgres or Redis before running several instances.
 */

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

/** Stop the map growing without bound on a long-lived process. */
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [k, w] of buckets) if (w.resetAt <= now) buckets.delete(k);
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  sweep(now);
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > limit) return { ok: false, remaining: 0, retryAfterSeconds };
  return { ok: true, remaining: limit - existing.count, retryAfterSeconds };
}

/**
 * Caller identity for limiting. Railway sits behind a proxy, so the socket
 * address is useless; x-forwarded-for's first entry is the client.
 * Spoofable, but this is abuse-dampening, not authentication.
 */
export function clientKey(req: Request, scope: string): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}

/** For tests only. */
export function __resetRateLimits() {
  buckets.clear();
}
