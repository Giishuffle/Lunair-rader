export type Plan = "harbor" | "voyage" | "fleet" | "lighthouse";

export interface PlanLimits {
  products: number;
  teamSeats: number;
  fullAudit: boolean;
  realtimeAlerts: boolean;
  csvExport: boolean;
  clientWorkspaces: number;
}

/** Tier gates (master-plan §2.2). Enforce server-side everywhere. */
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  harbor: { products: 1, teamSeats: 1, fullAudit: false, realtimeAlerts: false, csvExport: false, clientWorkspaces: 0 },
  voyage: { products: 10, teamSeats: 1, fullAudit: true, realtimeAlerts: true, csvExport: false, clientWorkspaces: 0 },
  fleet: { products: 50, teamSeats: 3, fullAudit: true, realtimeAlerts: true, csvExport: true, clientWorkspaces: 0 },
  lighthouse: { products: 50, teamSeats: 3, fullAudit: true, realtimeAlerts: true, csvExport: true, clientWorkspaces: 10 },
};

/** Words banned in all UI, emails, and marketing (master-plan §7.3). */
export const BANNED_COPY = ["guaranteed", "certified", "legal advice", "we ensure compliance"] as const;

/**
 * Strict check for UI, marketing, and alert copy: the banned phrases must not
 * appear at all. Use this for anything that reads as a claim.
 */
export function containsBannedCopy(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of BANNED_COPY) {
    if (lower.includes(phrase)) return phrase;
  }
  return null;
}

const NEGATION =
  /\b(not|never|no|none|nothing|neither|nor|without|cannot|can't|don't|doesn't|disclaim\w*|denies|deny|excludes?|exclusion|other than)\b/;

/** How far back to look for a negating stem. Covers a sentence plus a list stem. */
const LOOKBACK_CHARS = 400;

/**
 * Relaxed check for legal documents, which must be able to say "this is NOT
 * legal advice" and "we do NOT guarantee". Flags a banned phrase only when it
 * reads as an affirmative claim - no negation in the sentence leading up to it.
 *
 * The lookback stops at a sentence boundary rather than a comma or colon,
 * because banned phrases legitimately appear as bullet items under a negating
 * stem ("The Service is not: legal advice; tax advice; ...").
 */
export function findUnhedgedBannedCopy(text: string): { phrase: string; context: string } | null {
  const lower = text.toLowerCase();
  for (const phrase of BANNED_COPY) {
    let from = 0;
    for (;;) {
      const at = lower.indexOf(phrase, from);
      if (at === -1) break;
      const window = lower.slice(Math.max(0, at - LOOKBACK_CHARS), at);
      // Start of the sentence containing the phrase: after the last ". " or blank line.
      const sentenceStart = Math.max(window.lastIndexOf(". "), window.lastIndexOf("\n\n"));
      const lead = sentenceStart === -1 ? window : window.slice(sentenceStart);
      if (!NEGATION.test(lead)) {
        return { phrase, context: text.slice(Math.max(0, at - 80), at + phrase.length + 40).trim() };
      }
      from = at + phrase.length;
    }
  }
  return null;
}
