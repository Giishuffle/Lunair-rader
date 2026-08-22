import { describe, expect, it } from "vitest";
import { PLAN_LIMITS, containsBannedCopy } from "../src/plans.js";

describe("tier gating", () => {
  it("free tier is limited to 1 product and no realtime alerts", () => {
    expect(PLAN_LIMITS.harbor.products).toBe(1);
    expect(PLAN_LIMITS.harbor.realtimeAlerts).toBe(false);
  });
  it("paid tiers unlock the audit", () => {
    expect(PLAN_LIMITS.voyage.fullAudit).toBe(true);
    expect(PLAN_LIMITS.fleet.csvExport).toBe(true);
    expect(PLAN_LIMITS.lighthouse.clientWorkspaces).toBe(10);
  });
});

describe("banned copy checker", () => {
  it("flags banned phrases regardless of case", () => {
    expect(containsBannedCopy("Your compliance is GUARANTEED!")).toBe("guaranteed");
    expect(containsBannedCopy("We ensure compliance for you")).toBe("we ensure compliance");
  });
  it("passes hedged informational copy", () => {
    expect(containsBannedCopy("This requirement appears to apply to your product.")).toBeNull();
  });
});
