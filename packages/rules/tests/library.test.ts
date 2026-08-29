import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { categoriesForHts, loadRuleLibrary } from "../src/index.js";

const rulesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "rules");

describe("rule library", () => {
  it("loads and validates all category files", () => {
    const lib = loadRuleLibrary(rulesDir);
    expect(lib.length).toBeGreaterThanOrEqual(2);
    for (const cat of lib) {
      // A category has to be reachable somehow. Most are scoped by tariff
      // chapter; a jurisdictional overlay like Prop 65 is not tied to any code
      // and reaches products by attribute, so it must carry conditions instead.
      const reachableByAttribute = cat.requirements.some((r) => r.conditions !== undefined);
      expect(cat.hts_prefixes.length > 0 || reachableByAttribute).toBe(true);

      for (const req of cat.requirements) {
        expect(req.source_url).toMatch(/^https:\/\//);
        // legal copy discipline: templates must hedge, never assert compliance
        expect(req.plain_english.toLowerCase()).not.toContain("guaranteed");
        expect(req.plain_english.toLowerCase()).not.toContain("we ensure compliance");
        // A citation is what makes an entry checkable. Only a state-law or
        // guidance entry is allowed to rest on its source page alone.
        const federal = req.authority_layer.startsWith("federal_");
        if (federal && req.legal_status !== "guidance_or_enforcement_policy") {
          expect(
            Boolean(req.cfr?.length || req.statute?.length),
            `${req.id} is a federal requirement with no CFR part or statute`,
          ).toBe(true);
        }
      }
    }
  });

  it("never presents a non-federal requirement as a federal one", () => {
    const lib = loadRuleLibrary(rulesDir);
    const prop65 = lib
      .flatMap((c) => c.requirements)
      .find((r) => r.id === "ca-prop65");
    expect(prop65?.authority_layer).toBe("state");
    // The distinction the broker review insisted on: this does not stop a shipment.
    expect(prop65?.enforcement_effect).not.toContain("cbp_hold");
    expect(prop65?.enforcement_effect).not.toContain("detention_or_refusal");
  });

  it("matches HTS codes to categories by prefix", () => {
    const lib = loadRuleLibrary(rulesDir);
    const toyMatches = categoriesForHts("9503.00.00", lib);
    expect(toyMatches.map((c) => c.category_key)).toContain("toys_children");
    const speakerMatches = categoriesForHts("8518.22.00", lib);
    expect(speakerMatches.map((c) => c.category_key)).toContain("electronics_consumer");
    expect(categoriesForHts("6301.30.00", lib)).toHaveLength(0);
  });
});
