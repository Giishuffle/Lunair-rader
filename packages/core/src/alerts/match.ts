import type { WatchType } from "../crossref.js";

/**
 * Deciding which sellers hear about a change.
 *
 * Kept pure and separately tested because the failure modes are asymmetric and
 * both are bad: a missed match is the product silently failing at its one job,
 * and a false match trains people to ignore us. Neither is visible from the
 * outside without checking.
 */

export interface EventLike {
  id: string;
  type: string;
  affectedHts: string[] | null;
  affectedCategories: string[] | null;
  confidence: number;
  reviewedBy?: string | null;
}

export interface WatchLike {
  id: string;
  productId: string;
  type: WatchType;
  watchKey: string;
  enabled: boolean;
}

/** Below this an event waits for human review rather than reaching anyone. */
export const AUTO_SEND_CONFIDENCE = 0.8;

export function isSendable(event: EventLike): boolean {
  return event.confidence >= AUTO_SEND_CONFIDENCE || Boolean(event.reviewedBy);
}

const digits = (s: string) => s.replace(/\D/g, "");

/**
 * HTS matching is prefix-based in both directions. A watch on the 6-digit
 * subheading 851821 must catch an event about the fuller code 8518.21.0000,
 * and an event about the whole heading 8518 must catch that watch too.
 */
export function htsMatches(watchKey: string, affected: string[]): boolean {
  const w = digits(watchKey);
  if (!w) return false;
  return affected.some((a) => {
    const x = digits(a);
    if (!x) return false;
    return w.startsWith(x) || x.startsWith(w);
  });
}

/**
 * Which watch types a given event type can reach. An event never matches a
 * watch of an unrelated kind, however well the keys line up - a category key
 * and an origin country could collide as bare strings otherwise.
 */
const EVENT_TO_WATCH: Record<string, WatchType[]> = {
  duty_change: ["hts_duty"],
  tariff_change: ["hts_duty", "origin_tariff"],
  origin_tariff_change: ["origin_tariff"],
  adcvd_order: ["adcvd", "hts_duty"],
  regulation_amended: ["agency_requirement"],
  new_rule: ["agency_requirement", "hts_duty"],
  proposed_rule: ["agency_requirement"],
  recall: ["recall"],
  notice: ["agency_requirement", "hts_duty"],
};

export function watchTypesFor(eventType: string): WatchType[] {
  return EVENT_TO_WATCH[eventType] ?? [];
}

export function watchMatchesEvent(watch: WatchLike, event: EventLike): boolean {
  if (!watch.enabled) return false;
  if (!watchTypesFor(event.type).includes(watch.type)) return false;

  const hts = event.affectedHts ?? [];
  const categories = event.affectedCategories ?? [];

  switch (watch.type) {
    case "hts_duty":
      return htsMatches(watch.watchKey, hts);

    case "origin_tariff":
      // watchKey is an ISO-2 country code; events name countries in categories.
      return categories.some((c) => c.toUpperCase() === watch.watchKey.toUpperCase());

    case "adcvd": {
      // watchKey is "CN:851821,851762" - origin, then the codes it was built from.
      const [origin, codes = ""] = watch.watchKey.split(":");
      const originHit = categories.some((c) => c.toUpperCase() === (origin ?? "").toUpperCase());
      const codeHit = codes.split(",").filter(Boolean).some((c) => htsMatches(c, hts));
      return originHit || codeHit;
    }

    case "agency_requirement":
    case "recall":
      return categories.includes(watch.watchKey);

    default:
      return false;
  }
}

/** Every watch an event reaches. Callers still apply tier gating and dedupe. */
export function matchWatches(event: EventLike, watches: WatchLike[]): WatchLike[] {
  if (!isSendable(event)) return [];
  return watches.filter((w) => watchMatchesEvent(w, event));
}
