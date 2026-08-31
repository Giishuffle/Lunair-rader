"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@lunair/core";

type PaidPlan = Exclude<Plan, "harbor">;
type Interval = "monthly" | "annual";

interface Tier {
  plan: Plan;
  name: string;
  tagline: string;
  monthly: number | null;
  annual: number | null;
  features: string[];
  /**
   * Sold by conversation, not by card. Lighthouse's white-label feed and client
   * workspaces are still being built, and taking $199 up front for them through
   * self-serve checkout would be selling something that does not exist yet.
   */
  contactOnly?: boolean;
}

const TIERS: Tier[] = [
  {
    plan: "harbor",
    name: "Harbor",
    tagline: "Try it on one product",
    monthly: 0,
    annual: 0,
    features: [
      "1 product",
      "Candidate customs codes, each with the CBP ruling behind it",
      "See which requirements appear to apply - names only",
      "Weekly newsletter",
    ],
  },
  {
    plan: "voyage",
    name: "Voyage",
    tagline: "For a seller running their own catalog",
    monthly: 29,
    annual: 290,
    features: [
      "10 products",
      "The full audit: every requirement, unlocked, with its citation",
      "Real-time alerts by email and Telegram",
      "Estimated dollar impact when a duty rate moves",
      "We read the regulations themselves, daily",
    ],
  },
  {
    plan: "fleet",
    name: "Fleet",
    tagline: "For a bigger catalog you need to report on",
    monthly: 79,
    annual: 790,
    features: [
      "50 products",
      "Everything in Voyage",
      "CSV export of every product and watch",
    ],
  },
  {
    plan: "lighthouse",
    name: "Lighthouse",
    tagline: "For brokers, forwarders & sourcing agents",
    monthly: 199,
    annual: 1990,
    contactOnly: true,
    features: [
      "Everything in Fleet",
      "White-label alerts for your client book",
      "Client workspaces",
    ],
  },
];

const PLAN_NAME: Record<string, string> = TIERS.reduce(
  (acc, t) => ({ ...acc, [t.plan]: t.name }),
  {} as Record<string, string>,
);

export function PricingCards({
  signedIn,
  currentPlan,
  founding,
}: {
  signedIn: boolean;
  currentPlan: string | null;
  founding: boolean;
}) {
  const [interval, setInterval] = useState<Interval>("annual");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function choose(plan: PaidPlan) {
    if (!signedIn) {
      router.push("/signin?callbackUrl=/pricing");
      return;
    }
    setError(null);
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!data.ok || !data.url) {
        setError(data.error ?? "Could not start checkout. Try again.");
        setLoadingPlan(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not reach billing. Try again in a moment.");
      setLoadingPlan(null);
    }
  }

  async function manageBilling() {
    setError(null);
    setLoadingPlan("__portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!data.ok || !data.url) {
        setError(data.error ?? "No billing account yet.");
        setLoadingPlan(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not reach billing. Try again in a moment.");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="pricing-body">
      <div className="interval-toggle" role="group" aria-label="Billing interval">
        <button
          type="button"
          className={interval === "monthly" ? "active" : ""}
          onClick={() => setInterval("monthly")}
        >
          Monthly
        </button>
        <button
          type="button"
          className={interval === "annual" ? "active" : ""}
          onClick={() => setInterval("annual")}
        >
          Annual <span className="save-chip">2 months free</span>
        </button>
      </div>

      {error && <p className="pricing-error">{error}</p>}

      <div className="tiers">
        {TIERS.map((tier) => {
          const isCurrent = currentPlan === tier.plan;
          const price = interval === "annual" ? tier.annual : tier.monthly;
          const perMonthEquivalent =
            interval === "annual" && tier.annual ? Math.round(tier.annual / 12) : null;

          return (
            <div key={tier.plan} className={`tier${tier.plan === "voyage" ? " tier-featured" : ""}`}>
              {tier.plan === "voyage" && <span className="tier-badge">Most popular</span>}
              <p className="label">{tier.name}</p>
              <p className="tier-tagline">{tier.tagline}</p>
              <p className="tier-price">
                {price === 0 ? (
                  "Free"
                ) : (
                  <>
                    {tier.contactOnly && <span className="tier-from">from </span>}
                    ${interval === "annual" ? perMonthEquivalent : price}
                    <span className="tier-per">/mo</span>
                  </>
                )}
              </p>
              {price !== 0 && interval === "annual" && !tier.contactOnly && (
                <p className="tier-billed">${price}/yr, billed annually</p>
              )}
              {tier.contactOnly && (
                <p className="tier-billed">Being built with our first partners - talk to us.</p>
              )}
              {tier.plan === "voyage" && founding && interval === "annual" && (
                <p className="tier-founding">Founding-50 discount applies at checkout</p>
              )}

              <ul className="tier-features">
                {tier.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>

              {tier.contactOnly ? (
                <a
                  className="btn-tier"
                  href="mailto:guy@wershuffle.com?subject=Lunair%20World%20Lighthouse%20(partner%20tier)&body=Tell%20us%20roughly%20how%20many%20clients%20you%20look%20after%20and%20what%20you%20would%20want%20them%20to%20see."
                >
                  Talk to us
                </a>
              ) : tier.plan === "harbor" ? (
                isCurrent ? (
                  <span className="tier-current">Your current plan</span>
                ) : (
                  <a href={signedIn ? "/app" : "/signin?callbackUrl=/app"} className="btn-tier">
                    {signedIn ? "Go to your radar" : "Start free"}
                  </a>
                )
              ) : isCurrent ? (
                <button type="button" className="btn-tier" onClick={manageBilling} disabled={loadingPlan !== null}>
                  {loadingPlan === "__portal" ? "Opening..." : "Manage billing"}
                </button>
              ) : currentPlan && currentPlan !== "harbor" ? (
                // Already on a paid plan: route through the Portal so Stripe updates the
                // existing subscription (with proration) instead of starting a second one.
                <button type="button" className="btn-tier btn-tier-amber" onClick={manageBilling} disabled={loadingPlan !== null}>
                  {loadingPlan === "__portal" ? "Opening..." : `Switch to ${tier.name}`}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-tier btn-tier-amber"
                  onClick={() => choose(tier.plan as PaidPlan)}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === tier.plan ? "Starting checkout..." : `Choose ${tier.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {currentPlan && currentPlan !== "harbor" && (
        <p className="pricing-manage-note">
          Already on {PLAN_NAME[currentPlan] ?? currentPlan}? Use the plan card above to switch, or{" "}
          <button type="button" className="linkish" onClick={manageBilling}>
            manage billing
          </button>{" "}
          to update your card or cancel.
        </p>
      )}
    </div>
  );
}
