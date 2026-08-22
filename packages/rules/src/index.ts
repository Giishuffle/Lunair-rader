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
  severity: z.enum(["low", "medium", "high"]),
  plain_english: z.string(),
  source_url: z.string().url(),
  self_check_hint: z.string(),
  /** Conditions narrowing when this appears to apply (all optional = always) */
  conditions: z
    .object({
      audience: z.enum(["kids", "adults", "both"]).optional(),
      has_battery: z.boolean().optional(),
      has_plug: z.boolean().optional(),
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
