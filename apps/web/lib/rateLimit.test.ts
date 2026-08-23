import { beforeEach, describe, expect, it } from "vitest";
import { __resetRateLimits, clientKey, rateLimit } from "./rateLimit";

beforeEach(() => __resetRateLimits());

describe("rateLimit", () => {
  it("allows up to the limit then blocks", () => {
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 60_000, t).ok).toBe(true);
    const blocked = rateLimit("k", 3, 60_000, t);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it("reports remaining budget", () => {
    const t = 1_000_000;
    expect(rateLimit("k", 3, 60_000, t).remaining).toBe(2);
    expect(rateLimit("k", 3, 60_000, t).remaining).toBe(1);
  });

  it("starts a fresh window after expiry", () => {
    const t = 1_000_000;
    rateLimit("k", 1, 60_000, t);
    expect(rateLimit("k", 1, 60_000, t).ok).toBe(false);
    expect(rateLimit("k", 1, 60_000, t + 60_001).ok).toBe(true);
  });

  it("keeps callers and scopes separate", () => {
    const t = 1_000_000;
    rateLimit("a:1", 1, 60_000, t);
    expect(rateLimit("a:1", 1, 60_000, t).ok).toBe(false);
    expect(rateLimit("b:1", 1, 60_000, t).ok).toBe(true);
  });
});

describe("clientKey", () => {
  it("takes the first x-forwarded-for entry, since we sit behind a proxy", () => {
    const req = new Request("https://x.test", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } });
    expect(clientKey(req, "crossref")).toBe("crossref:1.2.3.4");
  });
  it("falls back to x-real-ip, then to a shared bucket", () => {
    expect(clientKey(new Request("https://x.test", { headers: { "x-real-ip": "5.6.7.8" } }), "s")).toBe("s:5.6.7.8");
    expect(clientKey(new Request("https://x.test"), "s")).toBe("s:unknown");
  });
});
