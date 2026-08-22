import { describe, expect, it } from "vitest";
import { scrubSecrets } from "./observability.js";

describe("worker scrubSecrets", () => {
  it("redacts the database URL, which appears in most connection errors", () => {
    const err = "connect ECONNREFUSED postgres://lunair:lunair@localhost:5433/lunair";
    expect(scrubSecrets(err)).toBe("connect ECONNREFUSED [redacted]");
  });

  it("redacts API keys that surface in HTTP error bodies", () => {
    expect(scrubSecrets("Stripe rejected rk_test_abc123")).toBe("Stripe rejected [redacted]");
    expect(scrubSecrets("anthropic sk-ant-api03-xyz_ABC")).toBe("anthropic [redacted]");
  });

  it("leaves adapter errors readable", () => {
    expect(scrubSecrets("usitc_hts HTTP 400 for 9503-9504")).toBe("usitc_hts HTTP 400 for 9503-9504");
  });
});
