import { describe, expect, it } from "vitest";
import { scrubSecrets } from "./sentry.shared";

describe("scrubSecrets", () => {
  it("redacts Stripe secret and restricted keys", () => {
    expect(scrubSecrets("failed with sk_test_abc123XYZ")).toBe("failed with [redacted]");
    expect(scrubSecrets("key rk_live_9zZq00Aa here")).toBe("key [redacted] here");
  });

  it("redacts webhook signing secrets and Anthropic keys", () => {
    expect(scrubSecrets("whsec_aBc123")).toBe("[redacted]");
    expect(scrubSecrets("sk-ant-api03-abc_DEF-123")).toBe("[redacted]");
  });

  it("redacts Telegram bot tokens and database URLs", () => {
    expect(scrubSecrets("bot 8746297811:AAFYjFbaj8Ol_GfEt4W0xUx9RWWx2TQ4ogXYZ fails")).toContain("[redacted]");
    expect(scrubSecrets("postgres://user:pw@host:5432/db timed out")).toBe("[redacted] timed out");
  });

  it("leaves ordinary error text alone", () => {
    const msg = "TypeError: cannot read property htsno of undefined";
    expect(scrubSecrets(msg)).toBe(msg);
  });
});
