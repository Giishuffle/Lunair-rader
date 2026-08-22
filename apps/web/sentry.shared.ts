/**
 * Shared Sentry options for every runtime (browser, server, edge).
 *
 * Privacy posture: users describe commercially sensitive products to us, so we
 * never let Sentry attach request bodies, cookies, or user identifiers, and we
 * scrub anything that looks like a secret before an event leaves the process.
 */
import type { ErrorEvent, EventHint } from "@sentry/nextjs";

const SECRET_PATTERNS = [
  /sk_(live|test)_[A-Za-z0-9]+/g,
  /rk_(live|test)_[A-Za-z0-9]+/g,
  /whsec_[A-Za-z0-9]+/g,
  /sk-ant-[A-Za-z0-9_-]+/g,
  /\b\d{9,10}:[A-Za-z0-9_-]{30,}\b/g, // telegram bot token
  /postgres(ql)?:\/\/[^\s"']+/g,
];

export function scrubSecrets(input: string): string {
  return SECRET_PATTERNS.reduce((acc, re) => acc.replace(re, "[redacted]"), input);
}

/** Recursively scrub string values in an event payload. */
function scrubDeep<T>(value: T, depth = 0): T {
  if (depth > 6) return value;
  if (typeof value === "string") return scrubSecrets(value) as T;
  if (Array.isArray(value)) return value.map((v) => scrubDeep(v, depth + 1)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = scrubDeep(v, depth + 1);
    return out as T;
  }
  return value;
}

export const sharedSentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Never attach IPs, cookies, or request bodies.
  sendDefaultPii: false,
  // Full tracing in dev, sampled in production to stay inside the free tier.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Noise we never want to page anyone about.
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    /^AbortError/,
    /Failed to fetch/,
  ],
  beforeSend(event: ErrorEvent, _hint: EventHint) {
    delete event.user;
    if (event.request) {
      delete event.request.cookies;
      delete event.request.data;
      delete event.request.headers;
    }
    return scrubDeep(event);
  },
};
