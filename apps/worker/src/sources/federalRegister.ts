import type { SourceAdapter, SourceDocInput } from "@lunair/core";
import { fetchWithRetry } from "@lunair/core";

/**
 * Federal Register API adapter. Verified empirically 2026-08-22 (docs/data-access.md):
 * free JSON API, no key, paginated, filterable by agency + document type.
 */

const BASE = "https://www.federalregister.gov/api/v1/documents.json";

// Agency slugs per master-plan §9.4
const AGENCIES = [
  "trade-representative-office-of-united-states",
  "u-s-customs-and-border-protection",
  "international-trade-administration",
  "commerce-department",
  "consumer-product-safety-commission",
  "food-and-drug-administration",
  "federal-communications-commission",
];

const DOC_TYPES = ["RULE", "PRORULE", "NOTICE", "PRESDOCU"];

interface FrDocument {
  document_number: string;
  title: string;
  type: string;
  abstract: string | null;
  html_url: string;
  pdf_url: string;
  publication_date: string;
  agencies: Array<{ name?: string; slug?: string }>;
}

interface FrResponse {
  count: number;
  next_page_url: string | null;
  results?: FrDocument[];
}

export function toSourceDoc(doc: FrDocument): SourceDocInput {
  return {
    source: "federal_register",
    externalId: doc.document_number,
    title: doc.title,
    url: doc.html_url,
    publishedAt: doc.publication_date ? new Date(`${doc.publication_date}T12:00:00Z`) : null,
    raw: doc,
  };
}

export class FederalRegisterAdapter implements SourceAdapter {
  readonly source = "federal_register" as const;

  constructor(private fetchImpl: typeof fetch = fetch) {}

  async fetchSince(since: Date | null): Promise<SourceDocInput[]> {
    const sinceDate = since ?? new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const gte = sinceDate.toISOString().slice(0, 10);

    const params = new URLSearchParams({ per_page: "100", order: "newest" });
    for (const a of AGENCIES) params.append("conditions[agencies][]", a);
    for (const t of DOC_TYPES) params.append("conditions[type][]", t);
    params.append("conditions[publication_date][gte]", gte);

    const docs: SourceDocInput[] = [];
    let url: string | null = `${BASE}?${params.toString()}`;
    let pages = 0;

    while (url && pages < 10) {
      const res = await fetchWithRetry(url, { headers: { "user-agent": "LunairWorld/0.1 (compliance radar; guy@wershuffle.com)" } }, this.fetchImpl);
      if (!res.ok) throw new Error(`federal_register HTTP ${res.status}`);
      const body = (await res.json()) as FrResponse;
      for (const d of body.results ?? []) docs.push(toSourceDoc(d));
      url = body.next_page_url;
      pages += 1;
      if (url) await new Promise((r) => setTimeout(r, 1000)); // polite pacing
    }
    return docs;
  }
}
