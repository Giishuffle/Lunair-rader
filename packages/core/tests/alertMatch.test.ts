import { describe, expect, it } from "vitest";
import {
  AUTO_SEND_CONFIDENCE,
  htsMatches,
  isSendable,
  matchWatches,
  watchMatchesEvent,
  type EventLike,
  type WatchLike,
} from "../src/alerts/match.js";

const ev = (o: Partial<EventLike> = {}): EventLike => ({
  id: "e1",
  type: "duty_change",
  affectedHts: null,
  affectedCategories: null,
  confidence: 0.9,
  ...o,
});

const w = (o: Partial<WatchLike> = {}): WatchLike => ({
  id: "w1",
  productId: "p1",
  type: "hts_duty",
  watchKey: "851821",
  enabled: true,
  ...o,
});

/**
 * Regression: rejection used to be encoded as "rejected:<email>" in reviewedBy,
 * and isSendable() treats any reviewer as an approval - so rejecting an event
 * made it sendable. A separate column, checked first, is the fix.
 */
describe("isSendable - rejection outranks everything", () => {
  const base = { id: "e1", type: "recall", affectedHts: null, affectedCategories: null };

  it("holds a low-confidence event with no reviewer", () => {
    expect(isSendable({ ...base, confidence: 0.5 })).toBe(false);
  });

  it("sends once a human approves it", () => {
    expect(isSendable({ ...base, confidence: 0.5, reviewedBy: "guy@wershuffle.com" })).toBe(true);
  });

  it("never sends a rejected event, even with a reviewer stamped on it", () => {
    expect(
      isSendable({ ...base, confidence: 0.5, reviewedBy: "guy@wershuffle.com", rejectedAt: new Date() }),
    ).toBe(false);
  });

  it("never sends a rejected event that would otherwise clear the gate on score", () => {
    expect(isSendable({ ...base, confidence: 0.99, rejectedAt: new Date() })).toBe(false);
  });
});

describe("confidence gate", () => {
  it("blocks low-confidence events from reaching anyone", () => {
    expect(isSendable(ev({ confidence: 0.5 }))).toBe(false);
    expect(matchWatches(ev({ confidence: 0.5, affectedHts: ["851821"] }), [w()])).toEqual([]);
  });

  it("lets a human override the gate by reviewing", () => {
    expect(isSendable(ev({ confidence: 0.4, reviewedBy: "guy" }))).toBe(true);
  });

  it("sends at or above the threshold", () => {
    expect(isSendable(ev({ confidence: AUTO_SEND_CONFIDENCE }))).toBe(true);
  });
});

describe("htsMatches", () => {
  it("matches a watched subheading against a fuller event code", () => {
    expect(htsMatches("851821", ["8518.21.0000"])).toBe(true);
  });
  it("matches a watched code against a broader event heading", () => {
    expect(htsMatches("851821", ["8518"])).toBe(true);
  });
  it("ignores punctuation differences", () => {
    expect(htsMatches("8518.21", ["851821"])).toBe(true);
  });
  it("does not match a different heading", () => {
    expect(htsMatches("851821", ["9405.40.6000"])).toBe(false);
  });
  it("does not match on empty input", () => {
    expect(htsMatches("", ["8518"])).toBe(false);
    expect(htsMatches("851821", [])).toBe(false);
  });
});

describe("event type gating", () => {
  it("never crosses unrelated watch types even when the keys collide", () => {
    // A recall in category "CN" must not fire an origin-tariff watch on CN.
    const recall = ev({ type: "recall", affectedCategories: ["CN"] });
    expect(watchMatchesEvent(w({ type: "origin_tariff", watchKey: "CN" }), recall)).toBe(false);
  });

  it("routes a regulation amendment only to agency watches", () => {
    const amended = ev({ type: "regulation_amended", affectedCategories: ["electronics_consumer"] });
    expect(watchMatchesEvent(w({ type: "agency_requirement", watchKey: "electronics_consumer" }), amended)).toBe(true);
    expect(watchMatchesEvent(w({ type: "recall", watchKey: "electronics_consumer" }), amended)).toBe(false);
  });

  it("ignores an unknown event type rather than fanning out", () => {
    expect(matchWatches(ev({ type: "something_new", affectedHts: ["8518"] }), [w()])).toEqual([]);
  });
});

describe("per-type matching", () => {
  it("matches origin tariffs case-insensitively", () => {
    const e = ev({ type: "origin_tariff_change", affectedCategories: ["vn"] });
    expect(watchMatchesEvent(w({ type: "origin_tariff", watchKey: "VN" }), e)).toBe(true);
  });

  it("matches AD/CVD on either the origin or one of its codes", () => {
    const watch = w({ type: "adcvd", watchKey: "CN:851821,851762" });
    expect(watchMatchesEvent(watch, ev({ type: "adcvd_order", affectedCategories: ["CN"] }))).toBe(true);
    expect(watchMatchesEvent(watch, ev({ type: "adcvd_order", affectedHts: ["8517.62"] }))).toBe(true);
    expect(watchMatchesEvent(watch, ev({ type: "adcvd_order", affectedCategories: ["VN"], affectedHts: ["6301"] }))).toBe(false);
  });

  it("never matches a disabled watch", () => {
    const e = ev({ affectedHts: ["8518.21.0000"] });
    expect(watchMatchesEvent(w({ enabled: false }), e)).toBe(false);
  });
});

describe("matchWatches", () => {
  it("returns only the watches that actually match", () => {
    const e = ev({ type: "regulation_amended", affectedCategories: ["toys_children"] });
    const watches = [
      w({ id: "a", type: "agency_requirement", watchKey: "toys_children" }),
      w({ id: "b", type: "agency_requirement", watchKey: "electronics_consumer" }),
      w({ id: "c", type: "hts_duty", watchKey: "950300" }),
    ];
    expect(matchWatches(e, watches).map((x) => x.id)).toEqual(["a"]);
  });
});
