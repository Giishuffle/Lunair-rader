import { describe, expect, it } from "vitest";
import { FOUNDING_SPOTS, foundingSpotsLeft, isFoundingMember } from "../src/plans.js";

describe("founding member offer", () => {
  it("includes positions 1 through the cap", () => {
    expect(isFoundingMember(1)).toBe(true);
    expect(isFoundingMember(FOUNDING_SPOTS)).toBe(true);
  });

  it("excludes anyone past the cap and anyone without a position", () => {
    expect(isFoundingMember(FOUNDING_SPOTS + 1)).toBe(false);
    expect(isFoundingMember(0)).toBe(false);
    expect(isFoundingMember(null)).toBe(false);
    expect(isFoundingMember(undefined)).toBe(false);
  });

  it("counts remaining spots and never goes negative", () => {
    expect(foundingSpotsLeft(0)).toBe(FOUNDING_SPOTS);
    expect(foundingSpotsLeft(13)).toBe(FOUNDING_SPOTS - 13);
    expect(foundingSpotsLeft(FOUNDING_SPOTS)).toBe(0);
    expect(foundingSpotsLeft(FOUNDING_SPOTS + 25)).toBe(0);
  });
});
