import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { schema } from "@lunair/core";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ManageBillingButton } from "./manage-billing-button";

export const metadata: Metadata = { title: "Account settings - Lunair World", robots: { index: false } };
export const dynamic = "force-dynamic";

const PLAN_NAME: Record<string, string> = {
  harbor: "Harbor", voyage: "Voyage", fleet: "Fleet", lighthouse: "Lighthouse",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null; // AppLayout already redirects unauthenticated visitors.

  const [user] = await db()
    .select({
      email: schema.users.email,
      plan: schema.users.plan,
      stripeCustomerId: schema.users.stripeCustomerId,
      stripeStatus: schema.users.stripeStatus,
      planRenewsAt: schema.users.planRenewsAt,
      cancelAtPeriodEnd: schema.users.cancelAtPeriodEnd,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);

  if (!user) return null;

  const planLabel = PLAN_NAME[user.plan] ?? user.plan;
  const onPaidPlan = user.plan !== "harbor";

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>Account settings</h1>
          <p className="sub">{user.email}</p>
        </div>
      </div>

      <div className="facts">
        <div className="fact">
          <span className="fact-k">Plan</span>
          <span className="fact-v">{planLabel}</span>
        </div>
        {user.planRenewsAt && (
          <div className="fact">
            <span className="fact-k">{user.cancelAtPeriodEnd ? "Access ends" : "Renews"}</span>
            <span className="fact-v">
              {user.planRenewsAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
        )}
        {user.stripeStatus && (
          <div className="fact">
            <span className="fact-k">Status</span>
            <span className="fact-v">
              {user.cancelAtPeriodEnd ? "Cancels at period end" : user.stripeStatus}
            </span>
          </div>
        )}
      </div>

      {onPaidPlan ? (
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
          <ManageBillingButton />
          <p className="quota-note">
            Update your card, switch plans, download invoices, or cancel - all self-serve in
            Stripe's billing portal. Cancelling keeps access until the date above. Questions or a
            refund within 14 days of a new subscription? Email{" "}
            <a href="mailto:guy@wershuffle.com">guy@wershuffle.com</a>.
          </p>
        </div>
      ) : (
        <p className="quota-note" style={{ marginTop: 28 }}>
          You're on the free Harbor plan. <Link href="/pricing">Upgrade</Link> for more products,
          a full baseline audit, and real-time alerts.
        </p>
      )}
    </main>
  );
}
