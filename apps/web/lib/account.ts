"use server";

import { eq, inArray } from "drizzle-orm";
import { schema } from "@lunair/core";
import { redirect } from "next/navigation";
import { auth, signOut } from "./auth";
import { db } from "./db";

/**
 * Erasure and portability.
 *
 * Not a feature - a legal obligation under GDPR and CCPA, so neither is gated
 * behind a plan and deletion is a real delete rather than a disabled flag.
 */

/** Everything we hold about one account, for the portability export. */
export async function collectAccountData(userId: string) {
  const database = db();

  const [user] = await database
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!user) throw new Error("No such account");

  const workspaces = await database
    .select()
    .from(schema.workspaces)
    .where(eq(schema.workspaces.ownerUserId, userId));
  const workspaceIds = workspaces.map((w) => w.id);

  const products = workspaceIds.length
    ? await database.select().from(schema.products).where(inArray(schema.products.workspaceId, workspaceIds))
    : [];
  const productIds = products.map((p) => p.id);

  const watches = productIds.length
    ? await database.select().from(schema.productWatches).where(inArray(schema.productWatches.productId, productIds))
    : [];

  const alerts = await database.select().from(schema.alerts).where(eq(schema.alerts.userId, userId));

  // Keyed by email rather than user id, so it has to be looked up separately -
  // and it is the row people most often forget when deleting an account.
  const newsletter = await database
    .select()
    .from(schema.newsletterSubscribers)
    .where(eq(schema.newsletterSubscribers.email, user.email.toLowerCase()));

  return {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      telegramConnected: Boolean(user.telegramChatId),
      createdAt: user.createdAt,
      // Stripe ids are deliberately omitted: they identify our billing records
      // rather than describing the person, and invoices come from Stripe itself.
    },
    products: products.map((p) => ({
      name: p.name,
      description: p.description,
      materials: p.materials,
      audience: p.audience,
      hasBattery: p.hasBattery,
      hasPlug: p.hasPlug,
      hasButtonCell: p.hasButtonCell,
      isToy: p.isToy,
      hasRadio: p.hasRadio,
      isDigitalDevice: p.isDigitalDevice,
      originCountry: p.originCountry,
      annualImportValue: p.annualImportValue,
      htsCode: p.htsCode,
      passportStatus: p.passportStatus,
      createdAt: p.createdAt,
      watches: watches
        .filter((w) => w.productId === p.id)
        .map((w) => ({ label: w.label, type: w.type, enabled: w.enabled, sources: w.sources, createdAt: w.createdAt })),
    })),
    alertsReceived: alerts.map((a) => ({ channel: a.channel, sentAt: a.sentAt, feedback: a.feedback })),
    newsletter: newsletter.map((n) => ({ email: n.email, waitlistPosition: n.waitlistPosition, source: n.source })),
  };
}

/**
 * Hard-delete the signed-in account and everything belonging to it.
 *
 * Child rows go first: only `accounts` and `sessions` cascade from users, so
 * everything else would otherwise block the delete on a foreign key. One
 * transaction, so a failure halfway cannot leave an account half-erased.
 */
export async function deleteAccount(confirmation: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) throw new Error("Not signed in");

  // Typing the address is the guard against a mis-click destroying real data.
  if (confirmation.trim().toLowerCase() !== session.user.email.toLowerCase()) {
    throw new Error("Type your email address exactly to confirm.");
  }

  const userId = session.user.id;
  const email = session.user.email.toLowerCase();
  const database = db();

  await database.transaction(async (tx) => {
    const workspaces = await tx
      .select({ id: schema.workspaces.id })
      .from(schema.workspaces)
      .where(eq(schema.workspaces.ownerUserId, userId));
    const workspaceIds = workspaces.map((w) => w.id);

    const products = workspaceIds.length
      ? await tx
          .select({ id: schema.products.id })
          .from(schema.products)
          .where(inArray(schema.products.workspaceId, workspaceIds))
      : [];
    const productIds = products.map((p) => p.id);

    if (productIds.length) {
      await tx.delete(schema.productRequirements).where(inArray(schema.productRequirements.productId, productIds));
      await tx.delete(schema.productWatches).where(inArray(schema.productWatches.productId, productIds));
    }

    // Alerts reference both the user and their products, so they must go before either.
    await tx.delete(schema.alerts).where(eq(schema.alerts.userId, userId));

    if (productIds.length) await tx.delete(schema.products).where(inArray(schema.products.id, productIds));
    if (workspaceIds.length) await tx.delete(schema.workspaces).where(inArray(schema.workspaces.id, workspaceIds));

    await tx.delete(schema.assistantThreads).where(eq(schema.assistantThreads.userId, userId));
    await tx.delete(schema.badges).where(eq(schema.badges.userId, userId));
    await tx.delete(schema.affiliates).where(eq(schema.affiliates.userId, userId));
    await tx.delete(schema.feedback).where(eq(schema.feedback.userId, userId));
    await tx.delete(schema.supportTickets).where(eq(schema.supportTickets.userId, userId));

    // Not linked by user id, so deleting the user would otherwise leave them on
    // the mailing list - the failure people actually notice, because they keep
    // receiving email from a service they deleted their account from.
    await tx.delete(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.email, email));

    // accounts and sessions cascade from this.
    await tx.delete(schema.users).where(eq(schema.users.id, userId));
  });

  console.log(`[account] deleted ${userId}`);
  await signOut({ redirect: false });
  redirect("/?deleted=1");
}
