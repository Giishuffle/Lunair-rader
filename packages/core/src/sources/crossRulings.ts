/**
 * CBP CROSS - the public archive of Customs rulings. Verified 2026-08-23:
 * GET https://rulings.cbp.gov/api/search?term=…&collection=ALL&pageSize=N&page=1
 * Free JSON, no key. Public ruling pages live at https://rulings.cbp.gov/ruling/{number}.
 *
 * Why this source matters more than the others: it is CBP's own published
 * decisions. Citing a ruling lets the product say "CBP classified a product like
 * yours this way, here is the ruling" instead of offering our own classification
 * opinion - more accurate for the user, and a materially safer legal posture.
 *
 * Two correctness rules enforced here:
 *  1. Revoked or superseded rulings are never presented as current precedent.
 *  2. CROSS relevance ranking is loose (a "bluetooth speaker" search returns a
 *     plastic water bottle), so results are re-scored against the product text
 *     and weak matches are dropped rather than shown.
 */

const BASE = "https://rulings.cbp.gov/api/search";
export const RULING_URL = (rulingNumber: string) => `https://rulings.cbp.gov/ruling/${rulingNumber}`;

export interface CrossRulingRaw {
  rulingNumber: string;
  subject: string;
  categories: string;
  rulingDate: string;
  tariffs: string[];
  collection: string;
  revokedBy: string[];
  modifiedBy: string[];
  operationallyRevoked: boolean;
}

export interface CrossRuling {
  rulingNumber: string;
  subject: string;
  date: string;
  tariffs: string[];
  url: string;
  /** 0..1 overlap between the product's words and the ruling subject. */
  relevance: number;
}

const STOPWORDS = new Set([
  "the", "a", "an", "of", "for", "from", "with", "and", "or", "in", "on", "to", "by",
  "classification", "tariff", "ruling", "revocation", "modification", "application",
  "further", "review", "protest", "request", "reconsideration", "no", "heading", "item",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * Share of the product's distinctive words that appear in the ruling subject.
 * Deliberately simple and inspectable - a smarter scorer that we cannot explain
 * to a reviewer is worse than a dumb one we can.
 */
export function scoreRelevance(productText: string, subject: string): number {
  const want = new Set(tokenize(productText));
  if (want.size === 0) return 0;
  const have = new Set(tokenize(subject));
  let hits = 0;
  for (const w of want) if (have.has(w)) hits += 1;
  return hits / want.size;
}

export function isSuperseded(r: Pick<CrossRulingRaw, "revokedBy" | "modifiedBy" | "operationallyRevoked">): boolean {
  return r.operationallyRevoked || r.revokedBy.length > 0 || r.modifiedBy.length > 0;
}

/**
 * CROSS appears to AND its search terms, so a long query returns nothing at all:
 * "night light" finds three on-point rulings, while the full product blurb finds
 * zero. Queries must therefore be short noun phrases drawn from the product.
 *
 * Ordering, best first:
 *  1. a two-word phrase appearing verbatim in BOTH the name and the description
 *  2. a phrase from one whose *both* words appear in the other - this is what
 *     catches "bluetooth speaker" from a description when the name reads
 *     "Bluetooth Fishing Speaker"
 *  3. the trailing phrase of the name minus its first word, since English puts
 *     the head noun last and the first word is usually the brand
 *  4. remaining description phrases
 */
export function buildQueries(name: string, description?: string | null, limit = 4): string[] {
  const bigrams = (words: string[]): string[] =>
    words.slice(0, -1).map((w, i) => `${w} ${words[i + 1]}`);

  const nameWords = tokenize(name);
  // Drop the leading word of the name: almost always the brand, never in a ruling.
  const nameBody = nameWords.length > 2 ? nameWords.slice(1) : nameWords;
  const descWords = tokenize(description ?? "");

  const nameBigrams = bigrams(nameBody);
  const descBigrams = bigrams(descWords);
  const descSet = new Set(descBigrams);
  const nameTokens = new Set(nameWords);
  const descTokens = new Set(descWords);

  const bothWordsIn = (bigram: string, vocab: Set<string>) =>
    bigram.split(" ").every((w) => vocab.has(w));

  const ranked: string[] = [
    // verbatim in both
    ...nameBigrams.filter((b) => descSet.has(b)),
    // description phrase whose words all appear in the name (and vice versa)
    ...descBigrams.filter((b) => bothWordsIn(b, nameTokens)),
    ...nameBigrams.filter((b) => bothWordsIn(b, descTokens)),
    // head-noun end of the name
    ...nameBigrams.slice().reverse(),
    ...descBigrams,
  ];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of ranked) {
    if (seen.has(q)) continue;
    seen.add(q);
    out.push(q);
    if (out.length >= limit) break;
  }
  // Last resort for a one-word product name.
  if (out.length === 0 && nameBody.length > 0) out.push(nameBody[nameBody.length - 1]!);
  return out;
}

export interface CrossSearchOptions {
  /** Drop results scoring below this. Default 0.15. */
  minRelevance?: number;
  /** How many raw results to request per query. Default 20. */
  pageSize?: number;
}

export class CrossRulingsClient {
  constructor(private fetchImpl: typeof fetch = fetch) {}

  async search(productText: string, opts: CrossSearchOptions = {}): Promise<CrossRuling[]> {
    const { minRelevance = 0.15, pageSize = 20 } = opts;
    const params = new URLSearchParams({
      term: productText,
      collection: "ALL",
      pageSize: String(pageSize),
      page: "1",
      sortBy: "RELEVANCE",
    });

    const res = await this.fetchImpl(`${BASE}?${params.toString()}`, {
      headers: {
        // CBP fronts this with bot protection that rejects default agents.
        "user-agent": "Mozilla/5.0 (compatible; LunairWorld/0.1; +https://lunair-world.com)",
        accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`cross_rulings HTTP ${res.status}`);

    const body = (await res.json()) as { rulings?: CrossRulingRaw[] };
    const queryTokens = tokenize(productText);

    return (body.rulings ?? [])
      // classification rulings only, and only ones that actually name a code
      .filter((r) => r.categories?.includes("Classification") && r.tariffs?.length > 0)
      // never present superseded precedent as current
      .filter((r) => !isSuperseded(r))
      // CROSS ranking is loose - searching "bluetooth speaker" returns a plastic
      // water bottle. Require the subject to actually mention what we searched for.
      .filter((r) => {
        const subject = new Set(tokenize(r.subject));
        return queryTokens.some((t) => subject.has(t));
      })
      .map((r) => ({
        rulingNumber: r.rulingNumber,
        subject: r.subject,
        date: r.rulingDate?.slice(0, 10) ?? "",
        tariffs: r.tariffs,
        url: RULING_URL(r.rulingNumber),
        relevance: scoreRelevance(productText, r.subject),
      }))
      .filter((r) => r.relevance >= minRelevance)
      .sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Search CROSS for a product, trying short noun-phrase queries in order until
   * enough on-point rulings accumulate. Results are merged and de-duplicated,
   * each keeping its best relevance score across queries.
   */
  async searchForProduct(
    name: string,
    description?: string | null,
    opts: CrossSearchOptions & { maxQueries?: number; stopAfter?: number; pauseMs?: number } = {},
  ): Promise<CrossRuling[]> {
    const { maxQueries = 4, stopAfter = 6, pauseMs = 800 } = opts;
    const queries = buildQueries(name, description, maxQueries);
    const merged = new Map<string, CrossRuling>();

    for (const [i, q] of queries.entries()) {
      if (i > 0) await new Promise((r) => setTimeout(r, pauseMs)); // polite pacing
      let batch: CrossRuling[];
      try {
        batch = await this.search(q, opts);
      } catch {
        continue; // one weak query should not sink the whole lookup
      }
      for (const r of batch) {
        const existing = merged.get(r.rulingNumber);
        if (!existing || r.relevance > existing.relevance) merged.set(r.rulingNumber, r);
      }
      if (merged.size >= stopAfter) break;
    }

    return [...merged.values()].sort((a, b) => b.relevance - a.relevance);
  }
}

export interface HtsCandidate {
  /** Normalised to the 6-digit subheading, which is what duty watching keys on. */
  htsPrefix: string;
  /** Full codes CBP used, longest form retained for display. */
  fullCodes: string[];
  rulings: CrossRuling[];
  /** How strongly CROSS supports this code for this product, 0..1. */
  support: number;
}

/**
 * Collapse rulings into candidate codes. Several rulings pointing at the same
 * subheading is the strongest signal CROSS can give us.
 */
export function candidatesFromRulings(rulings: CrossRuling[], limit = 3): HtsCandidate[] {
  const byPrefix = new Map<string, { codes: Set<string>; rulings: CrossRuling[] }>();

  for (const r of rulings) {
    for (const code of r.tariffs) {
      const digits = code.replace(/\D/g, "");
      if (digits.length < 6) continue;
      // Chapter 99 codes carry additional duties (§301, IEEPA, §232) and often
      // appear alongside the real code in a ruling. They are not a product's
      // classification, so they never belong in the candidate list - the
      // origin-tariff watch covers that exposure instead.
      if (digits.startsWith("99")) continue;
      const prefix = digits.slice(0, 6);
      const entry = byPrefix.get(prefix) ?? { codes: new Set<string>(), rulings: [] };
      entry.codes.add(code);
      if (!entry.rulings.some((x) => x.rulingNumber === r.rulingNumber)) entry.rulings.push(r);
      byPrefix.set(prefix, entry);
    }
  }

  const total = rulings.length || 1;
  return [...byPrefix.entries()]
    .map(([htsPrefix, e]) => {
      const best = Math.max(...e.rulings.map((r) => r.relevance));
      const breadth = e.rulings.length / total;
      return {
        htsPrefix,
        fullCodes: [...e.codes].sort(),
        rulings: e.rulings.sort((a, b) => b.relevance - a.relevance).slice(0, 3),
        // Mostly "how well does the best ruling match", nudged by agreement.
        support: Math.min(1, best * 0.75 + breadth * 0.25),
      };
    })
    .sort((a, b) => b.support - a.support)
    .slice(0, limit);
}
