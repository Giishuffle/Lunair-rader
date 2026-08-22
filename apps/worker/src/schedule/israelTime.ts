/**
 * Israel observes DST (UTC+3 summer, UTC+2 winter), so a fixed UTC cron would
 * drift by an hour twice a year. Founder-facing jobs (newsletter draft and send,
 * ops digest) therefore run hourly in UTC and gate on the real Israel local time.
 */

const TZ = "Asia/Jerusalem";

export interface IsraelClock {
  /** 0 = Sunday ... 6 = Saturday */
  weekday: number;
  hour: number;
}

export function israelClock(now: Date): IsraelClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);

  const weekdayName = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hourValue = parts.find((p) => p.type === "hour")?.value ?? "0";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return {
    weekday: Math.max(0, days.indexOf(weekdayName)),
    // Intl can render midnight as "24" in hour12:false
    hour: Number(hourValue) % 24,
  };
}

/** True when `now` falls in the given Israel-local weekday+hour window. */
export function isIsraelTime(now: Date, weekday: number, hour: number): boolean {
  const c = israelClock(now);
  return c.weekday === weekday && c.hour === hour;
}

export const SUNDAY = 0;
export const MONDAY = 1;

/** Founder-facing schedule (master-plan §11, confirmed by Guy 2026-08-22). */
export const NEWSLETTER_DRAFT_ISRAEL = { weekday: SUNDAY, hour: 9 }; // Sun 09:00 - Israeli workweek starts Sunday
export const NEWSLETTER_SEND_ISRAEL = { weekday: MONDAY, hour: 11 }; // Mon 11:00
