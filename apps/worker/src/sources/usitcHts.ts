import { createHash } from "node:crypto";
import type { SourceAdapter, SourceDocInput } from "@lunair/core";
import { fetchWithRetry } from "@lunair/core";

/**
 * USITC HTS adapter. Verified 2026-08-22 (docs/data-access.md):
 * GET https://hts.usitc.gov/reststop/exportList?format=JSON&from=X&to=Y&styles=false
 * returns the tariff lines for the range as JSON. The `styles=false` param is
 * required - without it the endpoint returns HTTP 400.
 *
 * Snapshot model: each polled range produces one SourceDocInput whose externalId
 * embeds a content hash of the rate-bearing fields. Unchanged content hashes to
 * the same id and dedupes at the source_docs unique index; a changed rate makes
 * a new row, and the diff job compares the latest two snapshots per range.
 */

const BASE = "https://hts.usitc.gov/reststop/exportList";

/**
 * Ranges to watch. Chapter 99 (9903) is where §301 / IEEPA / §232 additional
 * duties live as cross-references - watching it is how we catch stacked-rate
 * changes (docs/plan-critique.md #3). The rest cover rule-library categories;
 * Phase 2 extends this to the HTS codes users actually monitor.
 */
export const DEFAULT_RANGES: Array<{ from: string; to: string }> = [
  { from: "9503", to: "9506" }, // toys
  { from: "8471", to: "8543" }, // electronics
  { from: "9405", to: "9405" }, // lighting
  { from: "9903", to: "9903" }, // Ch. 99: 301/IEEPA/232 additional duties
];

export interface HtsLine {
  htsno: string;
  indent: string;
  description: string;
  general: string;
  special: string;
  other: string;
  footnotes: unknown[];
}

export interface HtsRateChange {
  htsno: string;
  description: string;
  kind: "changed" | "added" | "removed";
  before?: Pick<HtsLine, "general" | "special" | "other">;
  after?: Pick<HtsLine, "general" | "special" | "other">;
}

function rateKey(l: HtsLine): string {
  return JSON.stringify([l.general ?? "", l.special ?? "", l.other ?? ""]);
}

/** Pure diff over rate-bearing numbered lines (blank htsno = heading rows, skipped). */
export function diffHtsLines(prev: HtsLine[], next: HtsLine[]): HtsRateChange[] {
  const byCode = (lines: HtsLine[]) => {
    const m = new Map<string, HtsLine>();
    for (const l of lines) if (l.htsno) m.set(l.htsno, l);
    return m;
  };
  const a = byCode(prev);
  const b = byCode(next);
  const changes: HtsRateChange[] = [];
  for (const [code, line] of b) {
    const old = a.get(code);
    if (!old) {
      changes.push({ htsno: code, description: line.description, kind: "added", after: pick(line) });
    } else if (rateKey(old) !== rateKey(line)) {
      changes.push({ htsno: code, description: line.description, kind: "changed", before: pick(old), after: pick(line) });
    }
  }
  for (const [code, line] of a) {
    if (!b.has(code)) changes.push({ htsno: code, description: line.description, kind: "removed", before: pick(line) });
  }
  return changes;
}

function pick(l: HtsLine) {
  return { general: l.general ?? "", special: l.special ?? "", other: l.other ?? "" };
}

export function snapshotHash(lines: HtsLine[]): string {
  const canonical = lines
    .filter((l) => l.htsno)
    .map((l) => `${l.htsno}|${rateKey(l)}`)
    .sort()
    .join("\n");
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}

export class UsitcHtsAdapter implements SourceAdapter {
  readonly source = "usitc_hts" as const;

  constructor(
    private ranges: Array<{ from: string; to: string }> = DEFAULT_RANGES,
    private fetchImpl: typeof fetch = fetch,
  ) {}

  async fetchSince(_since: Date | null): Promise<SourceDocInput[]> {
    const docs: SourceDocInput[] = [];
    for (const range of this.ranges) {
      const url = `${BASE}?format=JSON&from=${range.from}&to=${range.to}&styles=false`;
      const res = await fetchWithRetry(
        url,
        { headers: { "user-agent": "LunairWorld/0.1 (compliance radar; guy@wershuffle.com)" } },
        this.fetchImpl,
      );
      if (!res.ok) throw new Error(`usitc_hts HTTP ${res.status} for ${range.from}-${range.to}`);
      const lines = (await res.json()) as HtsLine[];
      const hash = snapshotHash(lines);
      docs.push({
        source: "usitc_hts",
        externalId: `${range.from}-${range.to}:${hash}`,
        title: `HTS snapshot ${range.from}-${range.to} (${lines.filter((l) => l.htsno).length} lines)`,
        url,
        publishedAt: null, // snapshot time is source_docs insertion time
        raw: { range, lines },
      });
      await new Promise((r) => setTimeout(r, 1500)); // polite pacing
    }
    return docs;
  }
}
