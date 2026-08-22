import * as Sentry from "@sentry/node";

/**
 * Worker error reporting. Same privacy posture as the web app: no PII, and
 * secrets scrubbed before anything leaves the process.
 */

const SECRET_PATTERNS = [
  /sk_(live|test)_[A-Za-z0-9]+/g,
  /rk_(live|test)_[A-Za-z0-9]+/g,
  /whsec_[A-Za-z0-9]+/g,
  /sk-ant-[A-Za-z0-9_-]+/g,
  /\b\d{9,10}:[A-Za-z0-9_-]{30,}\b/g,
  /postgres(ql)?:\/\/[^\s"']+/g,
];

export function scrubSecrets(input: string): string {
  return SECRET_PATTERNS.reduce((acc, re) => acc.replace(re, "[redacted]"), input);
}

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

export function initObservability(): boolean {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log("[sentry] SENTRY_DSN not set - error reporting disabled");
    return false;
  }
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    beforeSend(event) {
      delete event.user;
      return scrubDeep(event);
    },
  });
  return true;
}

/** Report a failed job with the job name attached, then rethrow to pg-boss. */
export function captureJobError(job: string, err: unknown): void {
  Sentry.withScope((scope) => {
    scope.setTag("job", job);
    scope.setLevel("error");
    Sentry.captureException(err);
  });
}

export async function flushObservability(timeoutMs = 2000): Promise<void> {
  await Sentry.flush(timeoutMs).catch(() => undefined);
}
