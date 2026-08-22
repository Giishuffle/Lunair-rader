import { describe, expect, it } from "vitest";
import { PLAN_LIMITS, containsBannedCopy, findUnhedgedBannedCopy } from "../src/plans.js";

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

describe("findUnhedgedBannedCopy (legal documents)", () => {
  it("allows banned phrases inside a negation", () => {
    expect(findUnhedgedBannedCopy("The Service is not legal advice.")).toBeNull();
    expect(findUnhedgedBannedCopy("We do not guarantee that the information is complete.")).toBeNull();
    expect(findUnhedgedBannedCopy("We disclaim any suggestion that results are guaranteed.")).toBeNull();
    expect(findUnhedgedBannedCopy("Nothing here is legal advice; consult a broker.")).toBeNull();
  });

  it("still catches affirmative claims", () => {
    expect(findUnhedgedBannedCopy("Our results are guaranteed accurate.")?.phrase).toBe("guaranteed");
    expect(findUnhedgedBannedCopy("We provide legal advice to importers.")?.phrase).toBe("legal advice");
  });

  it("reports surrounding context so the offending sentence is findable", () => {
    const found = findUnhedgedBannedCopy("Ship with confidence. Compliance is guaranteed for every order.");
    expect(found?.context).toContain("guaranteed");
  });

  it("catches a claim that follows an unrelated earlier negation", () => {
    expect(findUnhedgedBannedCopy("We do not sell data. Your compliance is guaranteed.")?.phrase).toBe("guaranteed");
  });
});
