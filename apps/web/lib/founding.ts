import { and, eq, isNotNull, lte, sql } from "drizzle-orm";
import { schema, FOUNDING_SPOTS, foundingSpotsLeft, isFoundingMember } from "@lunair/core";
import { db, hasDb } from "./db";

/** Live count of founding spots remaining, shared by the waitlist API and the pricing page. */
export async function foundingSpotsRemaining(): Promise<number> {
  if (!hasDb()) return FOUNDING_SPOTS;
  const [{ claimed = 0 } = {}] = await db()
    .select({ claimed: sql<number>`count(*)::int` })
    .from(schema.newsletterSubscribers)
    .where(
      and(
        isNotNull(schema.newsletterSubscribers.waitlistPosition),
        lte(schema.newsletterSubscribers.waitlistPosition, FOUNDING_SPOTS),
      ),
    );
  return foundingSpotsLeft(claimed);
}

/** Whether an email address holds one of the first FOUNDING_SPOTS waitlist positions. */
export async function isEmailFoundingMember(email: string): Promise<boolean> {
  const [row] = await db()
    .select({ position: schema.newsletterSubscribers.waitlistPosition })
    .from(schema.newsletterSubscribers)
    .where(
      and(
        eq(schema.newsletterSubscribers.email, email.toLowerCase()),
        isNotNull(schema.newsletterSubscribers.waitlistPosition),
        lte(schema.newsletterSubscribers.waitlistPosition, FOUNDING_SPOTS),
      ),
    )
    .limit(1);
  return isFoundingMember(row?.position);
}
