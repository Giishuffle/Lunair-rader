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
      expect(cat.hts_prefixes.length).toBeGreaterThan(0);
      for (const req of cat.requirements) {
        expect(req.source_url).toMatch(/^https:\/\//);
        // legal copy discipline: templates must hedge, never assert compliance
        expect(req.plain_english.toLowerCase()).not.toContain("guaranteed");
        expect(req.plain_english.toLowerCase()).not.toContain("we ensure compliance");
      }
    }
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
