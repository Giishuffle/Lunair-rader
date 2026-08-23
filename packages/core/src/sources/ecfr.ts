/**
 * eCFR - the Code of Federal Regulations, as data. Verified 2026-08-23:
 * free, no API key, no rate limit encountered.
 *
 * Two things this gives Lunair that nothing else does:
 *
 *  1. **Primary-law citations.** Every requirement can point at the actual
 *     regulation rather than an agency marketing page, with the date it was last
 *     amended. That is what makes our content checkable by a broker or lawyer in
 *     minutes instead of hours.
 *  2. **An alert source keyed to the law itself.** The version endpoint reports an
 *     `amendment_date` per section, so when a regulation we cite changes, every
 *     product carrying that requirement has a real, sourced reason to be alerted -
 *     independent of whether anyone published a Federal Register summary we caught.
 */

const BASE = "https://www.ecfr.gov/api/versioner/v1";

export interface CfrCitation {
  /** CFR title number: 16 CPSC, 21 FDA, 47 FCC, 49 DOT/PHMSA, 19 Customs. */
  title: number;
  /** Part number as a string - parts are not always numeric ("1110", "1500"). */
  part: string;
  /** Human label for display, e.g. "Certificates of Compliance". */
  label?: string;
}

export interface SectionVersion {
  identifier: string;
  name: string;
  amendmentDate: string; // YYYY-MM-DD
  issueDate: string;
}

export interface PartSnapshot {
  title: number;
  part: string;
  sections: SectionVersion[];
  /** Most recent amendment across every section in the part. */
  latestAmendment: string | null;
}

export function citationLabel(c: CfrCitation): string {
  return `${c.title} CFR Part ${c.part}${c.label ? ` - ${c.label}` : ""}`;
}

export function citationUrl(c: CfrCitation): string {
  return `https://www.ecfr.gov/current/title-${c.title}/part-${c.part}`;
}

interface VersionsResponse {
  content_versions?: Array<{
    identifier?: string;
    name?: string;
    amendment_date?: string;
    issue_date?: string;
  }>;
}

export class EcfrClient {
  constructor(private fetchImpl: typeof fetch = fetch) {}

  /** Version history for one CFR part, newest amendment first. */
  async partSnapshot(citation: CfrCitation): Promise<PartSnapshot> {
    const url = `${BASE}/versions/title-${citation.title}.json?part=${encodeURIComponent(citation.part)}`;
    const res = await this.fetchImpl(url, {
      headers: { accept: "application/json", "user-agent": "LunairWorld/0.1 (+https://lunair-world.com)" },
    });
    if (!res.ok) throw new Error(`ecfr HTTP ${res.status} for ${citationLabel(citation)}`);

    const body = (await res.json()) as VersionsResponse;
    const sections: SectionVersion[] = (body.content_versions ?? [])
      .filter((v) => v.identifier && v.amendment_date)
      .map((v) => ({
        identifier: v.identifier!,
        name: (v.name ?? "").replace(/\s+/g, " ").trim(),
        amendmentDate: v.amendment_date!,
        issueDate: v.issue_date ?? "",
      }));

    return {
      title: citation.title,
      part: citation.part,
      sections,
      latestAmendment: latestAmendmentOf(sections),
    };
  }
}

/** Most recent amendment date across sections, or null when there are none. */
export function latestAmendmentOf(sections: SectionVersion[]): string | null {
  let latest: string | null = null;
  for (const s of sections) {
    if (!latest || s.amendmentDate > latest) latest = s.amendmentDate;
  }
  return latest;
}

/**
 * Sections amended since a known date, newest first, one entry per section.
 * eCFR returns a row per version, so a section amended twice appears twice -
 * we keep only its most recent amendment.
 */
export function sectionsAmendedSince(snapshot: PartSnapshot, since: string | null): SectionVersion[] {
  if (!since) return [];
  const newest = new Map<string, SectionVersion>();
  for (const s of snapshot.sections) {
    if (s.amendmentDate <= since) continue;
    const prev = newest.get(s.identifier);
    if (!prev || s.amendmentDate > prev.amendmentDate) newest.set(s.identifier, s);
  }
  return [...newest.values()].sort((a, b) => b.amendmentDate.localeCompare(a.amendmentDate));
}

/** Stable key for storing a part snapshot in source_docs. */
export function partKey(c: Pick<CfrCitation, "title" | "part">): string {
  return `title-${c.title}/part-${c.part}`;
}
