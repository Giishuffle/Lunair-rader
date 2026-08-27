import { describe, expect, it } from "vitest";
import { lockForPlan, LOCKED_RATIONALE } from "./gating";

const finding = {
  rationale: "3 requirements appear to apply (Children's Product Certificate; ASTM F963).",
  sources: [
    { title: "CPSC: Children's Product Certificate", url: "https://www.cpsc.gov/cpc" },
    { title: "16 CFR 1250", url: "https://www.ecfr.gov/current/title-16/part-1250" },
  ],
  impactNote: "Roughly $18,000-21,000/yr on your stated import value",
};

describe("lockForPlan", () => {
  it("withholds every piece of detail from the free plan", () => {
    const r = lockForPlan(finding, "harbor");
    expect(r.locked).toBe(true);
    expect(r.sources).toEqual([]);
    expect(r.impactNote).toBeUndefined();
    expect(r.rationale).toBe(LOCKED_RATIONALE);
  });

  it("leaks nothing identifying through the replacement rationale", () => {
    const r = lockForPlan(finding, "harbor");
    // The point of the gate: no requirement names, no citations, no dollar figures.
    for (const secret of ["ASTM", "F963", "Certificate", "16 CFR", "18,000", "cpsc.gov"]) {
      expect(JSON.stringify(r)).not.toContain(secret);
    }
  });

  it("gives every paid plan the full detail", () => {
    for (const plan of ["voyage", "fleet", "lighthouse"] as const) {
      const r = lockForPlan(finding, plan);
      expect(r.locked).toBe(false);
      expect(r.rationale).toBe(finding.rationale);
      expect(r.sources).toHaveLength(2);
      expect(r.impactNote).toBe(finding.impactNote);
    }
  });

  it("does not mutate the caller's object", () => {
    const input = { ...finding, sources: [...finding.sources] };
    lockForPlan(input, "harbor");
    expect(input.sources).toHaveLength(2);
    expect(input.rationale).toContain("ASTM");
  });
});
