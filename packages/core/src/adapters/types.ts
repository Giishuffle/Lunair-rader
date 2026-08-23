/**
 * Every government data source implements this interface and reports to
 * source_health (CLAUDE.md hard rule). Adapters fetch and normalize only;
 * persistence and diffing live in the worker.
 */
export interface SourceDocInput {
  source: SourceName;
  externalId: string;
  title: string;
  url: string;
  publishedAt: Date | null;
  raw: unknown;
}

export type SourceName =
  | "federal_register"
  | "usitc_hts"
  | "cbp_csms"
  | "cpsc_recalls"
  | "ecfr"
  | "lawfirm_rss";

export interface SourceAdapter {
  readonly source: SourceName;
  /** Fetch docs published since `since` (null = adapter default lookback). Must rate-limit politely. */
  fetchSince(since: Date | null): Promise<SourceDocInput[]>;
}
