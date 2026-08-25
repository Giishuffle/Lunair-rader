import {
  CrossRulingsClient,
  candidatesFromRulings,
  type CrossRuling,
  type HtsCandidate,
} from "./sources/crossRulings.js";

/**
 * The bridge between the Product Passport and the Radar.
 *
 * A finished Passport describes a product in plain English. This engine
 * cross-references that description against several independent sources and
 * returns a set of *watch candidates* - specific, named things the seller can
 * choose to be alerted about. The seller picks; we never silently subscribe them.
 *
 * Legal posture baked in (master-plan §7, counsel question A):
 *  - Classification codes are always presented as codes CBP used for similar
 *    products, each carrying its ruling citation, and the seller confirms their
 *    own. We never assert "your code is X".
 *  - Every candidate carries its sources. No source, no candidate.
 *  - Wording hedges: "appears to apply", never "you must".
 */

export type WatchType =
  | "hts_duty"
  | "origin_tariff"
  | "agency_requirement"
  | "recall"
  | "adcvd";

export interface WatchSource {
  title: string;
  url: string;
}

export interface WatchCandidate {
  /** Stable key: same product profile always yields the same id. */
  id: string;
  type: WatchType;
  /** What the seller sees as the name of the alert. */
  label: string;
  /** Why we surfaced it, in plain English. */
  rationale: string;
  sources: WatchSource[];
  /** 0..1. Below CONFIDENCE_GATE it is offered but never pre-selected. */
  confidence: number;
  /** Pre-ticked in the UI. High-confidence, high-consequence watches only. */
  recommended: boolean;
  /** The thing being watched, e.g. an HTS prefix or a category key. */
  watchKey: string;
  /** Optional plain-English note about money at stake. */
  impactNote?: string;
}

/** Mirrors the AI pipeline's gate: below this we surface but never pre-select. */
export const CONFIDENCE_GATE = 0.8;

export interface ProductProfile {
  name: string;
  description?: string | null;
  materials?: string[] | null;
  audience?: string | null; // kids | adults | both
  hasBattery?: boolean | null;
  hasPlug?: boolean | null;
  /** Contains or is designed to use a button/coin cell. Null = we have not asked. */
  hasButtonCell?: boolean | null;
  /** Designed or intended for play by a child under 14 - federal toy-standard scope. */
  isToy?: boolean | null;
  originCountry?: string | null; // ISO-2
  annualImportValue?: number | null;
  /** Only set if the seller already confirmed one. */
  htsCode?: string | null;
}

export interface RequirementLike {
  id: string;
  agency: string;
  title: string;
  plain_english: string;
  source_url: string;
  severity: "low" | "medium" | "high" | "critical";
  conditions?: {
    audience?: "kids" | "adults" | "both";
    has_battery?: boolean;
    has_plug?: boolean;
    /** True when the product is powered at all - battery or mains. */
    powered_any?: boolean;
    has_button_cell?: boolean;
    is_toy?: boolean;
    materials_any?: string[];
  };
}

export interface RuleCategoryLike {
  category_key: string;
  label: string;
  hts_prefixes: string[];
  requirements: RequirementLike[];
}

/** Countries whose goods currently carry extra origin-based US tariff exposure. */
const HIGH_TARIFF_ORIGINS: Record<string, string> = {
  CN: "China",
  HK: "Hong Kong",
  VN: "Vietnam",
  IN: "India",
  TH: "Thailand",
  MY: "Malaysia",
  KH: "Cambodia",
  ID: "Indonesia",
};

export function productSearchText(p: ProductProfile): string {
  return [p.name, p.description, ...(p.materials ?? [])].filter(Boolean).join(" ");
}

/**
 * Three answers, not two.
 *
 * "unresolved" exists because the alternative is worse: when we have never asked
 * whether a product contains a button cell, treating the unanswered question as
 * "no" silently hides a critical safety rule. An unresolved requirement is shown
 * to the seller as conditional - "this appears to apply if..." - so the gap is
 * visible and answerable instead of invisible.
 */
export type Applicability = "applies" | "unresolved" | "excluded";

/** Compare a known tri-state product fact against a required boolean. */
function matchBool(actual: boolean | null | undefined, required: boolean): Applicability {
  if (actual === null || actual === undefined) return "unresolved";
  return actual === required ? "applies" : "excluded";
}

/**
 * Does a requirement's condition block match this product?
 * A requirement with no conditions applies to everything in its category.
 */
export function evaluateRequirement(req: RequirementLike, p: ProductProfile): Applicability {
  const c = req.conditions;
  if (!c) return "applies";

  const checks: Applicability[] = [];

  if (c.audience && c.audience !== "both") {
    if (!p.audience) checks.push("unresolved");
    // "both" on the product satisfies a kids- or adults-specific condition.
    else if (p.audience !== c.audience && p.audience !== "both") checks.push("excluded");
  }
  if (c.has_battery !== undefined) checks.push(matchBool(p.hasBattery, c.has_battery));
  if (c.has_plug !== undefined) checks.push(matchBool(p.hasPlug, c.has_plug));
  if (c.has_button_cell !== undefined) checks.push(matchBool(p.hasButtonCell, c.has_button_cell));
  if (c.is_toy !== undefined) checks.push(matchBool(p.isToy, c.is_toy));

  // "Powered at all" - either source counts. Lets a requirement target every
  // powered product without duplicating it for battery and mains separately.
  if (c.powered_any !== undefined) {
    if (p.hasBattery === true || p.hasPlug === true) {
      checks.push(c.powered_any ? "applies" : "excluded");
    } else if (p.hasBattery == null || p.hasPlug == null) {
      // One unanswered question is enough to leave "is it powered" open.
      checks.push("unresolved");
    } else {
      checks.push(c.powered_any ? "excluded" : "applies");
    }
  }

  if (c.materials_any?.length) {
    const mats = (p.materials ?? []).map((m) => m.toLowerCase());
    if (mats.length === 0) checks.push("unresolved");
    else if (!c.materials_any.some((m) => mats.some((pm) => pm.includes(m.toLowerCase())))) {
      checks.push("excluded");
    }
  }

  if (checks.includes("excluded")) return "excluded";
  return checks.includes("unresolved") ? "unresolved" : "applies";
}

/** Strict form: true only when every condition is known to match. */
export function requirementApplies(req: RequirementLike, p: ProductProfile): boolean {
  return evaluateRequirement(req, p) === "applies";
}

/**
 * Which rule categories apply to this product.
 *
 * Matching is by HTS prefix **and** by product attributes. The attribute path
 * exists because the law does not always follow the tariff schedule: a
 * children's night light is classified as a lamp, not a toy, but children's
 * product rules still reach it. Prefix-only matching silently misses those.
 */
export function matchCategories(
  p: ProductProfile,
  library: RuleCategoryLike[],
  htsPrefixes: string[],
): RuleCategoryLike[] {
  const digits = (s: string) => s.replace(/\D/g, "");
  const codes = [...htsPrefixes, ...(p.htsCode ? [p.htsCode] : [])].map(digits);

  const matched = new Map<string, RuleCategoryLike>();

  for (const cat of library) {
    const byCode = cat.hts_prefixes.some((pre) => codes.some((c) => c.startsWith(digits(pre))));
    // Attribute-driven reach: any requirement whose conditions match the product
    // pulls its category in, whatever the tariff code says.
    const byAttribute = cat.requirements.some(
      (r) => r.conditions !== undefined && requirementApplies(r, p),
    );
    if (byCode || byAttribute) matched.set(cat.category_key, cat);
  }
  return [...matched.values()];
}

export interface CrossRefInput {
  product: ProductProfile;
  library: RuleCategoryLike[];
  /** Injected so the engine is testable without network. */
  crossClient?: Pick<CrossRulingsClient, "searchForProduct">;
}

export interface CrossRefResult {
  htsCandidates: HtsCandidate[];
  watches: WatchCandidate[];
  /** Sources we could not reach this run; surfaced rather than hidden. */
  degraded: string[];
}

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export async function crossReferenceProduct(input: CrossRefInput): Promise<CrossRefResult> {
  const { product, library } = input;
  const client = input.crossClient ?? new CrossRulingsClient();
  const degraded: string[] = [];

  // 1. CBP's own classification precedent.
  let rulings: CrossRuling[] = [];
  try {
    rulings = await client.searchForProduct(product.name, product.description);
  } catch {
    degraded.push("cbp_cross");
  }
  const htsCandidates = candidatesFromRulings(rulings);

  const watches: WatchCandidate[] = [];
  const prefixes = htsCandidates.map((c) => c.htsPrefix);

  // 2. Duty-rate watch per candidate code.
  for (const cand of htsCandidates) {
    const top = cand.rulings[0];
    watches.push({
      id: `hts_duty:${cand.htsPrefix}`,
      type: "hts_duty",
      watchKey: cand.htsPrefix,
      label: `Duty rate changes for ${cand.fullCodes[0] ?? cand.htsPrefix}`,
      rationale:
        `CBP classified a similar product under this code` +
        (top ? ` in ruling ${top.rulingNumber} (${top.date}): "${top.subject}".` : ".") +
        ` Confirm this is your code, then we watch it for rate changes.`,
      sources: cand.rulings.map((r) => ({ title: `CBP ruling ${r.rulingNumber}`, url: r.url })),
      confidence: cand.support,
      recommended: cand.support >= CONFIDENCE_GATE,
      impactNote: product.annualImportValue
        ? `A 10-point rate move on ${money(product.annualImportValue)} of imports is about ${money(product.annualImportValue * 0.1)} a year.`
        : undefined,
    });
  }

  // 3. Origin-based tariff exposure (Chapter 99: §301, IEEPA, §232).
  const origin = product.originCountry?.toUpperCase();
  if (origin && HIGH_TARIFF_ORIGINS[origin]) {
    watches.push({
      id: `origin_tariff:${origin}`,
      type: "origin_tariff",
      watchKey: origin,
      label: `Additional tariffs on goods from ${HIGH_TARIFF_ORIGINS[origin]}`,
      rationale:
        `You told us this product is made in ${HIGH_TARIFF_ORIGINS[origin]}. Country-based ` +
        `additional duties are published as Chapter 99 tariff lines and change by executive ` +
        `action, sometimes with only days of notice.`,
      sources: [
        { title: "USITC Harmonized Tariff Schedule, Chapter 99", url: "https://hts.usitc.gov/" },
      ],
      confidence: 0.95,
      recommended: true,
      impactNote: product.annualImportValue
        ? `These stack on top of the base rate. On ${money(product.annualImportValue)} of imports, each 10 points is about ${money(product.annualImportValue * 0.1)} a year.`
        : undefined,
    });

    // 4. Antidumping / countervailing duty orders - the largest single surprise.
    if (prefixes.length > 0) {
      watches.push({
        id: `adcvd:${origin}:${prefixes[0]}`,
        type: "adcvd",
        watchKey: `${origin}:${prefixes.join(",")}`,
        label: `Antidumping and countervailing duty orders`,
        rationale:
          `New orders can apply to a product category and origin with little warning, and ` +
          `rates can exceed the value of the goods. We watch Commerce Department notices for ` +
          `orders touching your codes and ${HIGH_TARIFF_ORIGINS[origin]}.`,
        sources: [
          {
            title: "International Trade Administration notices, Federal Register",
            url: "https://www.federalregister.gov/agencies/international-trade-administration",
          },
        ],
        confidence: 0.7,
        recommended: false,
        impactNote: "AD/CVD rates have historically exceeded 100% of product value.",
      });
    }
  }

  // 5. Agency requirements from the rule library.
  const categories = matchCategories(product, library, prefixes);
  for (const cat of categories) {
    const byState = cat.requirements.map((r) => ({ r, state: evaluateRequirement(r, product) }));
    const applicable = byState.filter((x) => x.state === "applies").map((x) => x.r);
    // Shown, not hidden: we could not tell from what the seller told us, and a
    // critical rule we never mentioned is the worst outcome here.
    const unresolved = byState.filter((x) => x.state === "unresolved").map((x) => x.r);
    const surfaced = [...applicable, ...unresolved];
    if (surfaced.length === 0) continue;

    const agencies = [...new Set(surfaced.map((r) => r.agency))];
    const severe = (r: RequirementLike) => r.severity === "high" || r.severity === "critical";

    watches.push({
      id: `agency_requirement:${cat.category_key}`,
      type: "agency_requirement",
      watchKey: cat.category_key,
      label: `${agencies.join(", ")} rule changes for ${cat.label.toLowerCase()}`,
      rationale:
        (applicable.length > 0
          ? `${applicable.length} requirement${applicable.length === 1 ? "" : "s"} appear${applicable.length === 1 ? "s" : ""} to apply to your product ` +
            `(${applicable.map((r) => r.title).join("; ")}). `
          : "") +
        (unresolved.length > 0
          ? `${unresolved.length} more may apply depending on details we do not have yet ` +
            `(${unresolved.map((r) => r.title).join("; ")}). `
          : "") +
        "We watch these agencies for changes.",
      sources: surfaced.map((r) => ({ title: `${r.agency}: ${r.title}`, url: r.source_url })),
      // A watch resting partly on unanswered questions is offered, not pre-ticked.
      confidence: unresolved.length > 0 && applicable.length === 0 ? 0.7 : 0.85,
      recommended: applicable.some(severe),
    });

    // 6. Recalls in the same category - a signal no competitor offers.
    watches.push({
      id: `recall:${cat.category_key}`,
      type: "recall",
      watchKey: cat.category_key,
      label: `Recalls in ${cat.label.toLowerCase()}`,
      rationale:
        `A recall of a comparable product often signals a rule or enforcement shift heading ` +
        `your way, and tells you what regulators are looking at right now.`,
      sources: [{ title: "CPSC recall notices", url: "https://www.cpsc.gov/Recalls" }],
      confidence: 0.8,
      recommended: false,
    });
  }

  return { htsCandidates, watches, degraded };
}
