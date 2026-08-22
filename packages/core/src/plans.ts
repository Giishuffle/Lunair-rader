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

export function containsBannedCopy(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of BANNED_COPY) {
    if (lower.includes(phrase)) return phrase;
  }
  return null;
}
