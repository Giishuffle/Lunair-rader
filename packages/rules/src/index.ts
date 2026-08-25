import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

/**
 * Versioned requirement-template library ("the crown-jewel data asset").
 * One JSON file per category under rules/. AI proposes new templates;
 * the founder approves in admin before they land here.
 */

export const RequirementTemplate = z.object({
  id: z.string(),
  agency: z.string(),
  title: z.string(),
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
      /** Within the federal toy-standard scope: for play by a child under 14. */
      is_toy: z.boolean().optional(),
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
