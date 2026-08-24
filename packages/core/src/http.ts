/**
 * Retry wrapper for outbound calls to government APIs.
 *
 * Government endpoints occasionally return a transient 503/502/429 that clears
 * within seconds - retrying quietly here is the difference between "the watcher
 * recovered on its own" and "Sentry paged Guy for something that fixed itself
 * before he opened the email." Only retry what is actually transient: a 4xx
 * other than 429 means our request is wrong, and retrying it wastes CBP's time
 * for no benefit.
 */

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export interface RetryOptions {
  attempts?: number;
  /** Base delay; actual wait grows as delayMs * 2^attempt, plus jitter. */
  delayMs?: number;
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  fetchImpl: typeof fetch,
  opts: RetryOptions = {},
): Promise<Response> {
  const { attempts = 3, delayMs = 500 } = opts;
  let lastRes: Response | null = null;
  let lastErr: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      const backoff = delayMs * 2 ** (attempt - 1) + Math.random() * 100;
      await new Promise((r) => setTimeout(r, backoff));
    }
    try {
      const res = await fetchImpl(url, init);
      if (res.ok || !RETRYABLE_STATUSES.has(res.status)) return res;
      lastRes = res;
    } catch (err) {
      lastErr = err; // network error - also worth a retry
    }
  }

  if (lastRes) return lastRes; // give the caller the final response to report the real status
  throw lastErr;
}
