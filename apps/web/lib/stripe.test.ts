import { describe, expect, it } from "vitest";
import { planForPriceId, planForSubscription } from "./stripe";

const ENV = {
  STRIPE_PRICE_VOYAGE_MONTHLY: "price_vm",
  STRIPE_PRICE_VOYAGE_ANNUAL: "price_va",
  STRIPE_PRICE_FLEET_MONTHLY: "price_fm",
  STRIPE_PRICE_FLEET_ANNUAL: "price_fa",
  STRIPE_PRICE_LIGHTHOUSE_MONTHLY: "price_lm",
  STRIPE_PRICE_LIGHTHOUSE_ANNUAL: "price_la",
} as unknown as NodeJS.ProcessEnv;

describe("planForPriceId", () => {
  it("maps every configured price to its plan", () => {
    expect(planForPriceId("price_vm", ENV)).toBe("voyage");
    expect(planForPriceId("price_va", ENV)).toBe("voyage");
    expect(planForPriceId("price_fm", ENV)).toBe("fleet");
    expect(planForPriceId("price_la", ENV)).toBe("lighthouse");
  });

  it("returns null for an unknown price rather than guessing", () => {
    expect(planForPriceId("price_someone_elses", ENV)).toBeNull();
  });

  it("does not match when the env var is unset", () => {
    expect(planForPriceId("", {} as NodeJS.ProcessEnv)).toBeNull();
    expect(planForPriceId("price_vm", {} as NodeJS.ProcessEnv)).toBeNull();
  });
});

describe("planForSubscription", () => {
  it("grants the plan while the subscription is in good standing", () => {
    expect(planForSubscription("active", "price_fm", ENV)).toBe("fleet");
    expect(planForSubscription("trialing", "price_vm", ENV)).toBe("voyage");
    // past_due keeps access during Stripe's retry window rather than punishing
    // someone whose card expired.
    expect(planForSubscription("past_due", "price_la", ENV)).toBe("lighthouse");
  });

  it("drops to the free plan when the subscription is not in good standing", () => {
    for (const status of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"]) {
      expect(planForSubscription(status, "price_fm", ENV)).toBe("harbor");
    }
  });

  it("drops to free when there is no price on the subscription", () => {
    expect(planForSubscription("active", null, ENV)).toBe("harbor");
    expect(planForSubscription("active", undefined, ENV)).toBe("harbor");
  });

  it("never grants a plan from an unrecognised price", () => {
    expect(planForSubscription("active", "price_unknown", ENV)).toBe("harbor");
  });
});
