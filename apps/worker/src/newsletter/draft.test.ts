import { describe, expect, it } from "vitest";
import { weekOf } from "./draft.js";

describe("weekOf", () => {
  it("returns the Monday of the containing week at UTC midnight", () => {
    // 2026-08-25 is a Tuesday; its week starts Monday 2026-08-24.
    expect(weekOf(new Date("2026-08-25T14:32:00Z")).toISOString()).toBe("2026-08-24T00:00:00.000Z");
  });

  it("treats Monday as the start of its own week", () => {
    expect(weekOf(new Date("2026-08-24T00:30:00Z")).toISOString()).toBe("2026-08-24T00:00:00.000Z");
  });

  it("puts Sunday in the week that began the previous Monday", () => {
    expect(weekOf(new Date("2026-08-30T23:00:00Z")).toISOString()).toBe("2026-08-24T00:00:00.000Z");
  });

  it("is stable across every day of one week", () => {
    const days = ["24", "25", "26", "27", "28", "29", "30"].map((d) => weekOf(new Date(`2026-08-${d}T12:00:00Z`)).toISOString());
    expect(new Set(days).size).toBe(1);
  });
});
