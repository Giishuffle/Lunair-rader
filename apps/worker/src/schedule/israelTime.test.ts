import { describe, expect, it } from "vitest";
import { NEWSLETTER_SEND_ISRAEL, isIsraelTime, israelClock } from "./israelTime.js";

describe("israelClock", () => {
  it("handles summer time (UTC+3)", () => {
    // Monday 2026-08-24 08:00 UTC = 11:00 Israel (IDT)
    const c = israelClock(new Date("2026-08-24T08:00:00Z"));
    expect(c).toEqual({ weekday: 1, hour: 11 });
  });

  it("handles winter time (UTC+2)", () => {
    // Monday 2026-12-14 09:00 UTC = 11:00 Israel (IST)
    const c = israelClock(new Date("2026-12-14T09:00:00Z"));
    expect(c).toEqual({ weekday: 1, hour: 11 });
  });

  it("renders midnight as hour 0, not 24", () => {
    expect(israelClock(new Date("2026-08-23T21:00:00Z")).hour).toBe(0);
  });
});

describe("newsletter send window", () => {
  const { weekday, hour } = NEWSLETTER_SEND_ISRAEL;

  it("fires at Monday 11:00 Israel in both summer and winter", () => {
    expect(isIsraelTime(new Date("2026-08-24T08:00:00Z"), weekday, hour)).toBe(true);
    expect(isIsraelTime(new Date("2026-12-14T09:00:00Z"), weekday, hour)).toBe(true);
  });

  it("does not fire an hour either side, or on other days", () => {
    expect(isIsraelTime(new Date("2026-08-24T07:00:00Z"), weekday, hour)).toBe(false);
    expect(isIsraelTime(new Date("2026-08-24T09:00:00Z"), weekday, hour)).toBe(false);
    expect(isIsraelTime(new Date("2026-08-25T08:00:00Z"), weekday, hour)).toBe(false);
  });
});
