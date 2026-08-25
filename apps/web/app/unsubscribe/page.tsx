import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { schema, verifyUnsubscribeToken } from "@lunair/core";
import { db, hasDb } from "@/lib/db";

export const metadata: Metadata = { title: "Unsubscribe - Lunair World", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe from the newsletter, reached from the footer of every issue.
 *
 * The signed token is the authorization - no sign-in, because requiring a login
 * to stop email is exactly the pattern anti-spam law exists to prevent. Product
 * alerts are separate and unaffected.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email, token } = await searchParams;
  const secret = process.env.AUTH_SECRET;

  let state: "done" | "invalid" | "unconfigured" = "invalid";

  if (!secret || !hasDb()) {
    state = "unconfigured";
  } else if (email && token && verifyUnsubscribeToken(email, token, secret)) {
    await db()
      .update(schema.newsletterSubscribers)
      .set({ unsubscribedAt: new Date() })
      .where(eq(schema.newsletterSubscribers.email, email.toLowerCase()));
    state = "done";
  }

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "64px 24px" }}>
      <div style={{ maxWidth: 460, textAlign: "center", display: "flex", flexDirection: "column", gap: 14 }}>
        <p className="label">Lunair World</p>
        {state === "done" ? (
          <>
            <h1 style={{ fontSize: 27, fontWeight: 700 }}>You're unsubscribed</h1>
            <p style={{ color: "var(--ink-2)" }}>
              You won't get the weekly newsletter again. Alerts about products on your radar are
              separate and still on - you can change those in your account.
            </p>
          </>
        ) : state === "unconfigured" ? (
          <>
            <h1 style={{ fontSize: 27, fontWeight: 700 }}>Something's not right</h1>
            <p style={{ color: "var(--ink-2)" }}>
              We couldn't process that here. Email{" "}
              <a href="mailto:guy@wershuffle.com" style={{ color: "var(--amber-2)" }}>
                guy@wershuffle.com
              </a>{" "}
              and we'll take you off the list by hand.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 27, fontWeight: 700 }}>That link didn't work</h1>
            <p style={{ color: "var(--ink-2)" }}>
              It may have been altered in transit. Email{" "}
              <a href="mailto:guy@wershuffle.com" style={{ color: "var(--amber-2)" }}>
                guy@wershuffle.com
              </a>{" "}
              and we'll take you off the list by hand.
            </p>
          </>
        )}
        <p style={{ marginTop: 8 }}>
          <Link href="/" style={{ color: "var(--muted)" }}>
            Back to Lunair World
          </Link>
        </p>
      </div>
    </main>
  );
}
