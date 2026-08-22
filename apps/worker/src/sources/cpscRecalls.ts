import type { SourceAdapter, SourceDocInput } from "@lunair/core";

/**
 * CPSC Recall API adapter. Verified 2026-08-22 (docs/data-access.md):
 * GET https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=YYYY-MM-DD
 * Free, no key, returns JSON array of recalls with products and remedies.
 * Differentiator: none of the competitor tariff trackers alert on recalls in
 * the seller's product category.
 */

const BASE = "https://www.saferproducts.gov/RestWebServices/Recall";

interface CpscRecall {
  RecallID: number;
  RecallNumber: string;
  RecallDate: string;
  Description: string;
  URL: string;
  Title: string;
  Products?: Array<{ Name?: string; Type?: string; CategoryID?: string }>;
  Hazards?: Array<{ Name?: string }>;
}

export function toSourceDoc(recall: CpscRecall): SourceDocInput {
  return {
    source: "cpsc_recalls",
    externalId: String(recall.RecallID),
    title: recall.Title || `CPSC recall ${recall.RecallNumber}`,
    url: recall.URL,
    publishedAt: recall.RecallDate ? new Date(recall.RecallDate) : null,
    raw: recall,
  };
}

export class CpscRecallsAdapter implements SourceAdapter {
  readonly source = "cpsc_recalls" as const;

  constructor(private fetchImpl: typeof fetch = fetch) {}

  async fetchSince(since: Date | null): Promise<SourceDocInput[]> {
    const start = since ?? new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const url = `${BASE}?format=json&RecallDateStart=${start.toISOString().slice(0, 10)}`;
    const res = await this.fetchImpl(url, {
      headers: { "user-agent": "LunairWorld/0.1 (compliance radar; guy@wershuffle.com)" },
    });
    if (!res.ok) throw new Error(`cpsc_recalls HTTP ${res.status}`);
    const recalls = (await res.json()) as CpscRecall[];
    return recalls.map(toSourceDoc);
  }
}
