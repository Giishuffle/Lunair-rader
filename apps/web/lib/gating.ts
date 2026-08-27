import { PLAN_LIMITS, type Plan } from "@lunair/core";

/**
 * Plan gating for audit detail.
 *
 * Lives outside products.ts because that file is "use server" - every export
 * there must be an async server action, which a pure helper should not be.
 */

export const LOCKED_RATIONALE =
  "The requirements and citations behind this are part of the full audit.";

export interface Lockable {
  rationale: string;
  sources: Array<{ title: string; url: string }>;
  impactNote?: string;
}

/**
 * Free tier sees that a finding exists and what it is called, but not the
 * reasoning or the citations behind it - that is what the paid audit is.
 *
 * Redaction happens on the server rather than by hiding elements in the browser:
 * a gate you can defeat with dev tools is not a gate, and the promise made on
 * the pricing page has to be literally true.
 */
export function lockForPlan<T extends Lockable>(w: T, plan: Plan): T & { locked: boolean } {
  if (PLAN_LIMITS[plan].fullAudit) return { ...w, locked: false };
  return { ...w, rationale: LOCKED_RATIONALE, sources: [], impactNote: undefined, locked: true };
}
