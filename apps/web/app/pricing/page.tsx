import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { foundingSpotsRemaining, isEmailFoundingMember } from "@/lib/founding";
import { PricingCards } from "./pricing-cards";
import "./pricing.css";

export const metadata: Metadata = {
  title: "Pricing - Lunair World",
  description: "Harbor free, Voyage, Fleet, and Lighthouse plans for US import-compliance monitoring.",
};
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const session = await auth();
  const currentPlan = session?.user?.plan ?? null;
  const [spotsLeft, founding] = await Promise.all([
    foundingSpotsRemaining(),
    session?.user?.email ? isEmailFoundingMember(session.user.email) : Promise.resolve(false),
  ]);

  return (
    <main className="pricing">
      <header className="pricing-top">
        <Link href={session?.user ? "/app" : "/"} className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Lunair World
        </Link>
        {!session?.user && (
          <Link href="/signin?callbackUrl=/pricing" className="linkish">
            Sign in
          </Link>
        )}
      </header>

      <div className="pricing-head">
        <p className="label">Pricing</p>
        <h1>One radar. Every tier gets the real thing, just more of it.</h1>
        <p className="sub">
          Cancel anytime, self-serve. 14-day no-questions refund on any paid plan.
        </p>
      </div>

      {spotsLeft > 0 && (
        <p className="founding-banner">
          {founding
            ? "You're a founding member - 50% off your first year is applied automatically on annual plans."
            : `${spotsLeft} founding-member spot${spotsLeft === 1 ? "" : "s"} left: the next ${spotsLeft} signups get 50% off the first year, annual plans only.`}
        </p>
      )}

      <PricingCards signedIn={Boolean(session?.user)} currentPlan={currentPlan} founding={founding} />

      <p className="pricing-disclaimer">
        Lunair World is an informational monitoring service built on official US government
        sources. It is not legal, customs-brokerage, or professional advice - always verify
        decisions with your licensed customs broker.
      </p>
    </main>
  );
}
