import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

/**
 * Versioned requirement-template library ("the crown-jewel data asset").
 * One JSON file per category under rules/. AI proposes new templates;
 * the founder approves in admin before they land here.
 */

/**
 * Who is imposing this, which decides how much force it carries. The broker
 * review is blunt about why this matters: a retailer or marketplace demanding a
 * UL mark is a commercial condition, and presenting it as a federal condition of
 * entry is simply wrong. Every requirement has to say which it is.
 */
export const AuthorityLayer = z.enum([
  "federal_product_safety",
  "federal_customs",
  "federal_transport",
  "state",
  "carrier",
  "retailer_or_marketplace",
  "insurance",
  "voluntary",
]);

/** How binding the thing is, in its own right. */
export const LegalStatus = z.enum([
  "statute",
  "regulation",
  /** The CFR names a consensus standard; the standard carries the technical content. */
  "incorporated_standard",
  "guidance_or_enforcement_policy",
  "voluntary_standard",
  "contractual",
]);

/** When the obligation has to be satisfied - often long before the shipment moves. */
export const Timing = z.enum([
  "before_manufacture",
  "before_import",
  "at_entry",
  "before_sale",
  "at_listing",
  "ongoing",
  "post_market",
]);

/** What actually happens if it is missing. Concrete beats "non-compliance". */
export const EnforcementEffect = z.enum([
  "transport_rejection",
  "cbp_hold",
  "detention_or_refusal",
  "sale_prohibition",
  "recall",
  "relabeling",
  "audit",
  "civil_penalty",
  "state_notice",
  "commercial_rejection",
]);

/**
 * Our own confidence in the entry, not the regulator's.
 *
 * The broker's acceptance rule: nothing is "confirmed" until we can state the
 * triggering product facts, the authority and its current version, the exact
 * evidence, who creates it, when it must exist, and what happens without it.
 */
export const ReviewStatus = z.enum([
  "confirmed",
  "conditional",
  "unresolved",
  "specialist_review_required",
]);

export const RequirementTemplate = z.object({
  id: z.string(),
  agency: z.string(),
  title: z.string(),
  authority_layer: AuthorityLayer,
  legal_status: LegalStatus,
  timing: z.array(Timing).nonempty(),
  /** The artifact that proves it: a certificate, test report, permit, label. */
  evidence: z.array(z.string()).nonempty(),
  enforcement_effect: z.array(EnforcementEffect).nonempty(),
  review_status: ReviewStatus,
  /** When we last checked this entry against its primary source. */
  reviewed_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /**
   * "critical" is the broker-review level above high: likely to stop, detain,
   * refuse, or render a shipment non-transportable, or trigger a recall.
   */
  severity: z.enum(["low", "medium", "high", "critical"]),
  plain_english: z.string(),
  source_url: z.string().url(),
  self_check_hint: z.string(),
  /**
   * The CFR part(s) that actually create this obligation. Not an agency web page
   * about it - the regulation itself, so a reviewer can check us in minutes and
   * so an amendment to the text becomes an alert.
   */
  cfr: z
    .array(
      z.object({
        title: z.number().int(),
        part: z.string(),
        label: z.string().optional(),
      }),
    )
    .optional(),
  /**
   * Statutory basis, where the duty comes from an Act rather than a regulation.
   * Several CPSIA obligations work this way and have no dedicated CFR part -
   * citing a plausible-looking wrong part is worse than citing nothing.
   */
  statute: z.array(z.string()).optional(),
  /**
   * The standard that actually carries the technical content, where the CFR
   * incorporates one by reference rather than reproducing it. The edition
   * matters: the CFR can name a new edition without its own text changing, so
   * eCFR watching alone will not catch it (broker review §10).
   */
  incorporated_standard: z
    .object({
      name: z.string(),
      edition: z.string(),
      note: z.string().optional(),
    })
    .optional(),
  /**
   * Set only where the obligation follows the product rather than the tariff
   * code - a children's rule reaching a night light classified as a lamp, or a
   * battery rule reaching anything with a cell in it. Default is code-scoped.
   */
  cross_category: z.boolean().optional(),
  /** Conditions narrowing when this appears to apply (all optional = always) */
  conditions: z
    .object({
      audience: z.enum(["kids", "adults", "both"]).optional(),
      has_battery: z.boolean().optional(),
      has_plug: z.boolean().optional(),
      /** True when the product is powered at all - battery or mains. */
      powered_any: z.boolean().optional(),
      /** Contains or is designed to use a button or coin cell. */
      has_button_cell: z.boolean().optional(),
      /** Deliberately transmits RF - wifi, bluetooth, cellular, RFID, radio remote. */
      has_radio: z.boolean().optional(),
      /** Contains a clock or microprocessor, so it radiates incidentally. */
      is_digital_device: z.boolean().optional(),
      /** Within the federal toy-standard scope: for play by a child under 14. */
      is_toy: z.boolean().optional(),
      /**
       * Case-insensitive substring match against the product name and
       * description. The review lists product name and marketing among the
       * facts that decide applicability, and some rules turn on what the thing
       * actually is rather than on any attribute we ask about directly.
       */
      text_matches_any: z.array(z.string()).optional(),
      /** Age bands that satisfy this rule; any one match is enough. */
      age_band_any: z.array(z.enum(["under_3", "3_to_12", "13_plus", "not_for_children"])).optional(),
      materials_any: z.array(z.string()).optional(),
    })
    .optional(),
});

export const RuleCategory = z.object({
  category_key: z.string(),
  label: z.string(),
  hts_prefixes: z.array(z.string()),
  requirements: z.array(RequirementTemplate),
});

export type RequirementTemplate = z.infer<typeof RequirementTemplate>;
export type RuleCategory = z.infer<typeof RuleCategory>;
export type AuthorityLayer = z.infer<typeof AuthorityLayer>;
export type LegalStatus = z.infer<typeof LegalStatus>;
export type Timing = z.infer<typeof Timing>;
export type EnforcementEffect = z.infer<typeof EnforcementEffect>;
export type ReviewStatus = z.infer<typeof ReviewStatus>;

/**
 * Federal conditions of entry, versus everything else. A seller deciding what
 * blocks a shipment needs this line drawn for them.
 */
export function isFederalRequirement(r: { authority_layer: AuthorityLayer }): boolean {
  return r.authority_layer.startsWith("federal_");
}

const rulesDir = join(dirname(fileURLToPath(import.meta.url)), "rules");

export function loadRuleLibrary(dir: string = rulesDir): RuleCategory[] {
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  return files
    .map((f) => RuleCategory.parse(JSON.parse(readFileSync(join(dir, f), "utf8"))))
    .sort((a, b) => a.category_key.localeCompare(b.category_key));
}

/** Match a product's HTS code (or prefix) to rule categories. */
export function categoriesForHts(hts: string, library: RuleCategory[]): RuleCategory[] {
  const clean = hts.replaceAll(".", "");
  return library.filter((c) => c.hts_prefixes.some((p) => clean.startsWith(p.replaceAll(".", ""))));
}
