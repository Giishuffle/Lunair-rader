import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";
import {
  schema,
  EcfrClient,
  citationLabel,
  citationUrl,
  partKey,
  sectionsAmendedSince,
  type CfrCitation,
  type Db,
  type PartSnapshot,
} from "@lunair/core";
import { loadRuleLibrary } from "@lunair/rules";

/**
 * Watches the regulations our rule library actually cites.
 *
 * Every other watcher waits for someone to publish a summary. This one reads the
 * law directly: when a CFR part we cite is amended, every product carrying that
 * requirement has a sourced reason to be alerted, whether or not a Federal
 * Register notice we caught happened to describe it.
 *
 * The previous state lives in source_docs (source = "ecfr", externalId =
 * "title-16/part-1110"), so the first run establishes a baseline and never
 * fires a false "changed" for history that predates us.
 */

export interface CitedPart {
  citation: CfrCitation;
  /** Rule-library requirements that depend on this part. */
  requirementIds: string[];
  categoryKeys: string[];
  /**
   * Consensus standards this part incorporates, with the edition we recorded.
   *
   * An amendment is exactly when a part can start naming a newer edition. The
   * watcher sees that the part changed but cannot see that our own recorded
   * edition is now stale, so an amendment here has to be flagged for a human to
   * re-check rather than quietly left alone.
   */
  standards: Array<{ name: string; edition: string; requirementId: string }>;
}

/** Every distinct CFR part referenced by the rule library, with its dependents. */
export function citedParts(library = loadRuleLibrary()): CitedPart[] {
  const byKey = new Map<string, CitedPart>();
  for (const cat of library) {
    for (const req of cat.requirements) {
      for (const c of req.cfr ?? []) {
        const key = partKey(c);
        const entry = byKey.get(key) ?? { citation: c, requirementIds: [], categoryKeys: [], standards: [] };
        if (!entry.requirementIds.includes(req.id)) entry.requirementIds.push(req.id);
        if (!entry.categoryKeys.includes(cat.category_key)) entry.categoryKeys.push(cat.category_key);
        const std = req.incorporated_standard;
        if (std && !entry.standards.some((x) => x.requirementId === req.id && x.name === std.name)) {
          entry.standards.push({ name: std.name, edition: std.edition, requirementId: req.id });
        }
        byKey.set(key, entry);
      }
    }
  }
  return [...byKey.values()];
}

interface StoredSnapshot {
  latestAmendment: string | null;
  sectionCount: number;
}

export async function checkCitedRegulations(
  db: Db,
  client: EcfrClient = new EcfrClient(),
  library = loadRuleLibrary(),
): Promise<{ checked: number; changed: number; baselines: number; editionsToRecheck: string[] }> {
  const parts = citedParts(library);
  let changed = 0;
  let baselines = 0;
  const editionsToRecheck: string[] = [];

  for (const [i, part] of parts.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, 800)); // polite pacing

    const key = partKey(part.citation);
    const snapshot = await client.partSnapshot(part.citation);

    const [prior] = await db
      .select({ raw: schema.sourceDocs.raw })
      .from(schema.sourceDocs)
      .where(and(eq(schema.sourceDocs.source, "ecfr"), eq(schema.sourceDocs.externalId, key)))
      .limit(1);

    const priorState = prior?.raw as StoredSnapshot | undefined;
    const isBaseline = !priorState;

    if (!isBaseline && priorState.latestAmendment !== snapshot.latestAmendment) {
      await recordAmendmentEvent(db, part, snapshot, priorState.latestAmendment);
      changed += 1;
      for (const std of part.standards) {
        editionsToRecheck.push(`${std.name} ${std.edition} (${citationLabel(part.citation)}, ${std.requirementId})`);
      }
    }
    if (isBaseline) baselines += 1;

    await upsertSnapshot(db, key, part, snapshot);
  }

  console.log(`[ecfr] checked ${parts.length} parts, ${changed} changed, ${baselines} new baselines`);
  if (editionsToRecheck.length > 0) {
    console.log(`[ecfr] incorporated editions to re-verify: ${editionsToRecheck.join("; ")}`);
  }
  return { checked: parts.length, changed, baselines, editionsToRecheck };
}

async function upsertSnapshot(db: Db, key: string, part: CitedPart, snapshot: PartSnapshot) {
  const state: StoredSnapshot = {
    latestAmendment: snapshot.latestAmendment,
    sectionCount: snapshot.sections.length,
  };
  await db
    .insert(schema.sourceDocs)
    .values({
      id: randomUUID(),
      source: "ecfr",
      externalId: key,
      title: citationLabel(part.citation),
      url: citationUrl(part.citation),
      publishedAt: snapshot.latestAmendment ? new Date(`${snapshot.latestAmendment}T12:00:00Z`) : null,
      raw: state,
      processedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.sourceDocs.source, schema.sourceDocs.externalId],
      set: {
        raw: state,
        publishedAt: snapshot.latestAmendment ? new Date(`${snapshot.latestAmendment}T12:00:00Z`) : null,
        processedAt: new Date(),
      },
    });
}

async function recordAmendmentEvent(
  db: Db,
  part: CitedPart,
  snapshot: PartSnapshot,
  since: string | null,
) {
  const amended = sectionsAmendedSince(snapshot, since).slice(0, 6);
  const label = citationLabel(part.citation);
  const sectionList = amended.length
    ? amended.map((s) => s.identifier).join(", ")
    : "one or more sections";

  await db.insert(schema.events).values({
    id: randomUUID(),
    type: "regulation_amended",
    affectedCategories: part.categoryKeys,
    summary:
      `${label} was amended on ${snapshot.latestAmendment}. Changed: ${sectionList}. ` +
      `This is the regulation behind ${part.requirementIds.length} requirement` +
      `${part.requirementIds.length === 1 ? "" : "s"} we track, so the wording of what ` +
      `appears to apply may have moved. The official text is at ${citationUrl(part.citation)}.` +
      (part.standards.length
        ? ` This part incorporates ${part.standards
            .map((x) => `${x.name} (we have ${x.edition})`)
            .join(", ")} - an amendment can name a newer edition, so the edition needs re-checking.`
        : ""),
    effectiveDate: snapshot.latestAmendment ? new Date(`${snapshot.latestAmendment}T12:00:00Z`) : null,
    // High: this is the primary law itself, read directly, not an inference.
    confidence: 0.95,
  });

  console.log(`[ecfr] ${label} amended ${since ?? "?"} -> ${snapshot.latestAmendment} (${sectionList})`);
}
