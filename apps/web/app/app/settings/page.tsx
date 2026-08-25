import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { schema, telegramLinkPayload } from "@lunair/core";
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
      telegramChatId: schema.users.telegramChatId,
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

  const botName = process.env.TELEGRAM_BOT_USERNAME ?? "lunairworldbot";
  const secret = process.env.AUTH_SECRET;
  const telegramUrl = secret
    ? `https://t.me/${botName}?start=${telegramLinkPayload(session.user.id, secret)}`
    : null;

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

      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>Telegram alerts</h2>
        {user.telegramChatId ? (
          <p className="quota-note">
            Connected. Alerts go to Telegram as well as email. To stop them, send{" "}
            <code>/stop</code> to the bot - it won't affect your email alerts.
          </p>
        ) : onPaidPlan ? (
          <>
            <p className="quota-note" style={{ marginBottom: 12 }}>
              Get the same alerts on your phone, alongside email. Opening this link connects
              this account - it takes one tap and nothing is sent until you do.
            </p>
            {telegramUrl ? (
              <a href={telegramUrl} className="btn-amber" target="_blank" rel="noopener noreferrer">
                Connect Telegram
              </a>
            ) : (
              <p className="quota-note">Telegram isn't configured on this deployment yet.</p>
            )}
          </>
        ) : (
          <p className="quota-note">
            Telegram alerts come with the paid plans. <Link href="/pricing">See plans</Link>.
          </p>
        )}
      </section>

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
