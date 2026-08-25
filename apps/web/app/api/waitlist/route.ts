import { NextResponse } from "next/server";
import { createDb, schema, FOUNDING_SPOTS, isFoundingMember } from "@lunair/core";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { foundingSpotsRemaining } from "@/lib/founding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WAITLIST_SOURCE = "waitlist-prelaunch";

/**
 * Pre-launch waitlist. Assigns a join position from a Postgres sequence, so
 * concurrent signups can never claim the same founding-member number.
 * Positions 1..FOUNDING_SPOTS earn 50% off the first year of an annual plan.
 *
 * Re-submitting an address returns the position already held rather than
 * consuming another one.
 */
export async function POST(req: Request) {
  // Cheap to serve, but it writes rows and moves the founding-50 counter.
  const limited = rateLimit(clientKey(req, "waitlist"), 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "retry-after": String(limited.retryAfterSeconds) } },
    );
  }

  let email: unknown;
  try {
    ({ email } = (await req.json()) as { email?: unknown });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: "invalid email" }, { status: 400 });
  }
  const normalized = email.trim().toLowerCase();

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[waitlist] no DATABASE_URL, skipping persist:", normalized);
    return NextResponse.json({ ok: true, stored: false, position: null, founding: false });
  }

  const db = createDb(url);

  const findExisting = async () =>
    (
      await db
        .select({ position: schema.newsletterSubscribers.waitlistPosition })
        .from(schema.newsletterSubscribers)
        .where(eq(schema.newsletterSubscribers.email, normalized))
        .limit(1)
    )[0];

  // Look first, insert second. Postgres evaluates nextval() before it detects a
  // duplicate-key conflict, so inserting blindly would burn a founding spot every
  // time someone re-submits their address.
  let position = (await findExisting())?.position ?? null;

  if (position === null) {
    const [row] = await db
      .insert(schema.newsletterSubscribers)
      .values({
        id: randomUUID(),
        email: normalized,
        source: WAITLIST_SOURCE,
        waitlistPosition: sql`nextval('waitlist_position_seq')`,
      })
      .onConflictDoNothing({ target: schema.newsletterSubscribers.email })
      .returning({ position: schema.newsletterSubscribers.waitlistPosition });

    // onConflictDoNothing returns nothing if a concurrent request won the race.
    position = row?.position ?? (await findExisting())?.position ?? null;
  }

  return NextResponse.json({
    ok: true,
    stored: true,
    position,
    founding: isFoundingMember(position),
    foundingSpots: FOUNDING_SPOTS,
  });
}

/** Live count of founding spots remaining, for the landing page and /pricing. */
export async function GET() {
  return NextResponse.json({
    spotsLeft: await foundingSpotsRemaining(),
    foundingSpots: FOUNDING_SPOTS,
  });
}
