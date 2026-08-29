import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_GATE,
  crossReferenceProduct,
  evaluateRequirement,
  matchCategories,
  requirementApplies,
  type ProductProfile,
  type RuleCategoryLike,
} from "../src/crossref.js";
import type { CrossRuling } from "../src/sources/crossRulings.js";

const LIBRARY: RuleCategoryLike[] = [
  {
    category_key: "toys_children",
    label: "Toys & children's products",
    hts_prefixes: ["9503", "9504", "9505"],
    requirements: [
      {
        id: "cpsia-cpc",
        agency: "CPSC",
        title: "Children's Product Certificate (CPC)",
        plain_english: "Appears to apply to products for children 12 and under.",
        source_url: "https://www.cpsc.gov/cpc",
        severity: "high",
        conditions: { audience: "kids" },
      },
    ],
  },
  {
    category_key: "electronics_consumer",
    label: "Consumer electronics & accessories",
    hts_prefixes: ["8517", "8518", "9405"],
    requirements: [
      {
        id: "fcc-authorization",
        agency: "FCC",
        title: "FCC equipment authorization",
        plain_english: "Appears to apply to devices that emit radio frequency.",
        source_url: "https://www.fcc.gov/eas",
        severity: "high",
      },
      {
        id: "battery-transport",
        agency: "DOT/PHMSA",
        title: "Lithium battery shipping rules",
        plain_english: "Appears to apply to products containing lithium batteries.",
        source_url: "https://www.phmsa.dot.gov/lithiumbatteries",
        severity: "medium",
        conditions: { has_battery: true },
      },
    ],
  },
];

const nightLight: ProductProfile = {
  name: "GlowPals LED Night Light for Kids",
  description: "Silicone tap-activated night light for children, USB-C rechargeable lithium battery",
  materials: ["silicone", "ABS plastic", "lithium battery"],
  audience: "kids",
  hasBattery: true,
  hasPlug: false,
  originCountry: "CN",
  annualImportValue: 120000,
};

function fakeCross(rulings: Partial<CrossRuling>[]) {
  return {
    searchForProduct: async () =>
      rulings.map((r, i) => ({
        rulingNumber: r.rulingNumber ?? `N${100000 + i}`,
        subject: r.subject ?? "The tariff classification of a thing",
        date: r.date ?? "2024-01-01",
        tariffs: r.tariffs ?? ["9405.40.8000"],
        url: r.url ?? "https://rulings.cbp.gov/ruling/N100000",
        relevance: r.relevance ?? 0.5,
      })) as CrossRuling[],
  };
}

describe("requirementApplies", () => {
  it("applies unconditional requirements to everything", () => {
    const req = LIBRARY[1]!.requirements[0]!;
    expect(requirementApplies(req, nightLight)).toBe(true);
  });

  it("respects a battery condition", () => {
    const battery = LIBRARY[1]!.requirements[1]!;
    expect(requirementApplies(battery, nightLight)).toBe(true);
    expect(requirementApplies(battery, { ...nightLight, hasBattery: false })).toBe(false);
  });

  it("respects an audience condition, and treats 'both' as satisfying it", () => {
    const cpc = LIBRARY[0]!.requirements[0]!;
    expect(requirementApplies(cpc, nightLight)).toBe(true);
    expect(requirementApplies(cpc, { ...nightLight, audience: "adults" })).toBe(false);
    expect(requirementApplies(cpc, { ...nightLight, audience: "both" })).toBe(true);
  });
});

/**
 * The distinction that keeps a critical rule visible: "we asked and the answer
 * was no" must never look the same as "we never asked".
 */
describe("evaluateRequirement - unresolved vs excluded", () => {
  const buttonCell = {
    id: "button-cell",
    agency: "CPSC",
    title: "Button & coin battery safety",
    plain_english: "x",
    source_url: "https://example.com",
    severity: "critical" as const,
    conditions: { has_button_cell: true },
  };

  it("applies when the seller said yes", () => {
    expect(evaluateRequirement(buttonCell, { ...nightLight, hasButtonCell: true })).toBe("applies");
  });

  it("excludes when the seller said no", () => {
    expect(evaluateRequirement(buttonCell, { ...nightLight, hasButtonCell: false })).toBe("excluded");
  });

  it("is unresolved - not excluded - when never asked", () => {
    expect(evaluateRequirement(buttonCell, { ...nightLight, hasButtonCell: null })).toBe("unresolved");
    expect(evaluateRequirement(buttonCell, nightLight)).toBe("unresolved");
  });

  it("lets a known mismatch beat an unknown, so we do not nag about excluded rules", () => {
    const both = { ...buttonCell, conditions: { has_button_cell: true, audience: "adults" as const } };
    expect(evaluateRequirement(both, { ...nightLight, hasButtonCell: null, audience: "kids" })).toBe("excluded");
  });

  it("treats an unanswered audience as unresolved rather than a miss", () => {
    const kidsOnly = { ...buttonCell, conditions: { audience: "kids" as const } };
    expect(evaluateRequirement(kidsOnly, { ...nightLight, audience: null })).toBe("unresolved");
  });

  it("leaves powered_any unresolved while either power question is unanswered", () => {
    const powered = { ...buttonCell, conditions: { powered_any: true } };
    expect(evaluateRequirement(powered, { ...nightLight, hasBattery: null, hasPlug: null })).toBe("unresolved");
    // A single yes settles it - the product is powered whatever the other answer.
    expect(evaluateRequirement(powered, { ...nightLight, hasBattery: true, hasPlug: null })).toBe("applies");
    expect(evaluateRequirement(powered, { ...nightLight, hasBattery: false, hasPlug: false })).toBe("excluded");
  });

  it("matches on product text, so a rule can turn on what the thing actually is", () => {
    const firearm = {
      id: "imitation-firearms", agency: "CPSC", title: "Imitation firearm marking",
      plain_english: "x", source_url: "https://example.com", severity: "high" as const,
      conditions: { text_matches_any: ["gun", "pistol", "blaster"] },
    };
    // Over-warning is the failure mode here: every toy must not get a
    // firearm-marking notice just because it is a toy.
    expect(evaluateRequirement(firearm, { ...nightLight, name: "Wooden magnet puzzle" })).toBe("excluded");
    expect(evaluateRequirement(firearm, { ...nightLight, name: "Galaxy Space Blaster" })).toBe("applies");
    // The description counts too, not only the name.
    expect(
      evaluateRequirement(firearm, { ...nightLight, name: "Galaxy Defender", description: "A toy laser gun" }),
    ).toBe("applies");
    // Case-insensitive.
    expect(evaluateRequirement(firearm, { ...nightLight, name: "TOY PISTOL SET" })).toBe("applies");
  });

  it("requirementApplies stays strict, so unresolved is never counted as a match", () => {
    expect(requirementApplies(buttonCell, { ...nightLight, hasButtonCell: null })).toBe(false);
  });
});

describe("matchCategories", () => {
  /**
   * Regression test for a real bug: a children's night light is classified as a
   * lamp (9405), not a toy (9503), so prefix-only matching returned zero CPSC
   * requirements for a product explicitly sold for children.
   */
  it("reaches children's rules for a kids' product that is not classified as a toy", () => {
    const keys = matchCategories(nightLight, LIBRARY, ["940540"]).map((c) => c.category_key);
    expect(keys).toContain("electronics_consumer"); // by tariff code
    expect(keys).toContain("toys_children"); // by audience, despite the code
  });

  it("does not pull in children's rules for an adult product", () => {
    const adult: ProductProfile = { ...nightLight, audience: "adults", name: "Desk lamp" };
    const keys = matchCategories(adult, LIBRARY, ["940540"]).map((c) => c.category_key);
    expect(keys).toContain("electronics_consumer");
    expect(keys).not.toContain("toys_children");
  });

  it("matches on a code the seller already confirmed", () => {
    const p: ProductProfile = { ...nightLight, audience: "adults", htsCode: "8518.22.00" };
    const keys = matchCategories(p, LIBRARY, []).map((c) => c.category_key);
    expect(keys).toContain("electronics_consumer");
  });
});

describe("crossReferenceProduct", () => {
  it("turns a finished passport into named, sourced watch choices", async () => {
    const res = await crossReferenceProduct({
      product: nightLight,
      library: LIBRARY,
      crossClient: fakeCross([
        { rulingNumber: "G86859", subject: "The tariff classification of a night-light from China", tariffs: ["9405.40.8000"], relevance: 0.8 },
      ]),
    });

    const types = res.watches.map((w) => w.type);
    expect(types).toContain("hts_duty");
    expect(types).toContain("origin_tariff"); // made in China
    expect(types).toContain("agency_requirement");
    expect(types).toContain("recall");
    expect(types).toContain("adcvd");

    // Every candidate must carry at least one source - no source, no candidate.
    for (const w of res.watches) expect(w.sources.length).toBeGreaterThan(0);

    // The children's requirement must be reachable despite the lamp code.
    const agency = res.watches.filter((w) => w.type === "agency_requirement");
    expect(agency.some((w) => w.watchKey === "toys_children")).toBe(true);
  });

  it("cites the actual CBP ruling in the duty watch", async () => {
    const res = await crossReferenceProduct({
      product: nightLight,
      library: LIBRARY,
      crossClient: fakeCross([
        { rulingNumber: "G86859", subject: "The tariff classification of a night-light from China", tariffs: ["9405.40.8000"], relevance: 0.8 },
      ]),
    });
    const duty = res.watches.find((w) => w.type === "hts_duty");
    expect(duty?.rationale).toContain("G86859");
    expect(duty?.sources[0]?.url).toContain("rulings.cbp.gov");
    // Never asserts the code is theirs.
    expect(duty?.rationale.toLowerCase()).toContain("confirm");
  });

  it("never pre-selects a low-confidence candidate", async () => {
    const res = await crossReferenceProduct({
      product: nightLight,
      library: LIBRARY,
      crossClient: fakeCross([
        { rulingNumber: "N111111", subject: "The tariff classification of a night-light", tariffs: ["9405.40.8000"], relevance: 0.2 },
      ]),
    });
    for (const w of res.watches) {
      if (w.confidence < CONFIDENCE_GATE) expect(w.recommended).toBe(false);
    }
  });

  it("computes dollar impact from the seller's own import value", async () => {
    const res = await crossReferenceProduct({
      product: nightLight,
      library: LIBRARY,
      crossClient: fakeCross([{ tariffs: ["9405.40.8000"], relevance: 0.9 }]),
    });
    const duty = res.watches.find((w) => w.type === "hts_duty");
    expect(duty?.impactNote).toContain("$12,000"); // 10% of $120,000
  });

  it("reports a degraded source instead of failing the whole passport", async () => {
    const res = await crossReferenceProduct({
      product: nightLight,
      library: LIBRARY,
      crossClient: { searchForProduct: async () => { throw new Error("CROSS down"); } },
    });
    expect(res.degraded).toContain("cbp_cross");
    // Rule-library and origin watches still come through.
    expect(res.watches.length).toBeGreaterThan(0);
    expect(res.htsCandidates).toHaveLength(0);
  });

  it("skips origin watches for a low-tariff origin", async () => {
    const res = await crossReferenceProduct({
      product: { ...nightLight, originCountry: "DE" },
      library: LIBRARY,
      crossClient: fakeCross([{ tariffs: ["9405.40.8000"], relevance: 0.9 }]),
    });
    expect(res.watches.some((w) => w.type === "origin_tariff")).toBe(false);
    expect(res.watches.some((w) => w.type === "adcvd")).toBe(false);
  });
});

describe("powered_any condition", () => {
  const FCC = {
    id: "fcc",
    agency: "FCC",
    title: "FCC equipment authorization",
    plain_english: "Appears to apply to powered devices.",
    source_url: "https://www.fcc.gov/eas",
    severity: "high" as const,
    conditions: { powered_any: true },
  };

  it("reaches a battery product and a mains product alike", () => {
    expect(requirementApplies(FCC, { name: "x", hasBattery: true, hasPlug: false })).toBe(true);
    expect(requirementApplies(FCC, { name: "x", hasBattery: false, hasPlug: true })).toBe(true);
  });

  /**
   * The reason this condition exists: FCC authorization used to attach to every
   * code in the electronics category, so a passive accessory got the same
   * alarming line as a WiFi device. Over-warning teaches people to ignore us.
   */
  it("leaves an unpowered accessory alone", () => {
    expect(requirementApplies(FCC, { name: "phone case", hasBattery: false, hasPlug: false })).toBe(false);
  });
});
