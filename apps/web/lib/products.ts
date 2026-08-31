"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  schema,
  PLAN_LIMITS,
  crossReferenceProduct,
  type Plan,
  type ProductProfile,
  type RuleCategoryLike,
  type WatchCandidate,
} from "@lunair/core";
import { loadRuleLibrary } from "@lunair/rules";
import { lockForPlan } from "./gating";
import { auth } from "./auth";
import { db } from "./db";

/**
 * Product persistence for signed-in sellers.
 *
 * Tier limits are enforced here, server-side. The UI also hides the button, but
 * that is decoration - this is the check that actually counts.
 */

export interface SavedProduct {
  id: string;
  name: string;
  description: string | null;
  htsCode: string | null;
  originCountry: string | null;
  passportStatus: "draft" | "complete";
  watchCount: number;
  createdAt: Date;
}

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  return { id: session.user.id, plan: (session.user.plan ?? "harbor") as Plan };
}

/** Everyone gets one workspace implicitly; partner tiers add more later. */
async function defaultWorkspaceId(userId: string): Promise<string> {
  const database = db();
  const [existing] = await database
    .select({ id: schema.workspaces.id })
    .from(schema.workspaces)
    .where(eq(schema.workspaces.ownerUserId, userId))
    .limit(1);
  if (existing) return existing.id;

  const id = randomUUID();
  await database.insert(schema.workspaces).values({ id, ownerUserId: userId, name: "My products", type: "seller" });
  return id;
}

export async function listProducts(): Promise<SavedProduct[]> {
  const user = await requireUser();
  const workspaceId = await defaultWorkspaceId(user.id);

  const database = db();

  const rows = await database
    .select({
      id: schema.products.id,
      name: schema.products.name,
      description: schema.products.description,
      htsCode: schema.products.htsCode,
      originCountry: schema.products.originCountry,
      passportStatus: schema.products.passportStatus,
      createdAt: schema.products.createdAt,
    })
    .from(schema.products)
    .where(eq(schema.products.workspaceId, workspaceId))
    .orderBy(desc(schema.products.createdAt));

  if (rows.length === 0) return [];

  // Counted with a plain grouped query rather than a correlated subquery inside
  // a sql`` template: the template form silently returned 0 because of how the
  // outer table gets aliased, and a wrong count here is invisible in testing.
  const counts = await database
    .select({
      productId: schema.productWatches.productId,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.productWatches)
    .where(eq(schema.productWatches.enabled, true))
    .groupBy(schema.productWatches.productId);

  const byProduct = new Map(counts.map((c) => [c.productId, c.count]));

  return rows.map((r) => ({ ...r, watchCount: byProduct.get(r.id) ?? 0 })) as SavedProduct[];
}

export interface QuotaState {
  used: number;
  limit: number;
  canAddMore: boolean;
  plan: Plan;
}

export async function productQuota(): Promise<QuotaState> {
  const user = await requireUser();
  const workspaceId = await defaultWorkspaceId(user.id);
  const [{ count = 0 } = {}] = await db()
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.products)
    .where(eq(schema.products.workspaceId, workspaceId));

  const limit = PLAN_LIMITS[user.plan].products;
  return { used: count, limit, canAddMore: count < limit, plan: user.plan };
}

export interface PassportInput {
  name: string;
  description?: string;
  materials?: string[];
  ageBand?: "under_3" | "3_to_12" | "13_plus" | "not_for_children";
  hasBattery?: boolean;
  hasPlug?: boolean;
  hasButtonCell?: boolean;
  isToy?: boolean;
  hasRadio?: boolean;
  isDigitalDevice?: boolean;
  originCountry?: string;
  annualImportValue?: number;
}

/** A candidate as the browser sees it: a saved row id, plus display fields. */
export interface WatchOption {
  /** The product_watches row id - the only thing the client sends back. */
  id: string;
  type: WatchCandidate["type"];
  label: string;
  rationale: string;
  sources: Array<{ title: string; url: string }>;
  impactNote?: string;
  recommended: boolean;
  /** True when detail was withheld because this plan has no full audit. */
  locked: boolean;
}

export interface PassportResult {
  productId: string;
  htsCandidates: Awaited<ReturnType<typeof crossReferenceProduct>>["htsCandidates"];
  watches: WatchOption[];
  degraded: string[];
  /** How many findings carry detail this plan cannot see. */
  lockedCount: number;
}

/**
 * Create a product from a completed Passport and cross-reference it.
 * Returns the alert candidates for the seller to choose from - nothing is
 * watched until they pick (see saveWatches).
 */
export async function completePassport(input: PassportInput): Promise<PassportResult> {
  const user = await requireUser();
  const workspaceId = await defaultWorkspaceId(user.id);

  const quota = await productQuota();
  if (!quota.canAddMore) {
    throw new Error(
      `Your ${quota.plan} plan covers ${quota.limit} product${quota.limit === 1 ? "" : "s"}. Upgrade to add more.`,
    );
  }

  const name = input.name.trim().slice(0, 200);
  if (name.length < 2) throw new Error("Give the product a name");

  const profile: ProductProfile = {
    name,
    description: input.description?.slice(0, 1000) ?? null,
    materials: input.materials?.slice(0, 20) ?? null,
    ageBand: input.ageBand ?? null,
    // Derived, not asked twice: the rules written against the coarse
    // kids/adults distinction keep working, and the age band refines the ones
    // that turn on a specific threshold.
    audience: input.ageBand
      ? input.ageBand === "under_3" || input.ageBand === "3_to_12"
        ? "kids"
        : "adults"
      : null,
    hasBattery: input.hasBattery ?? null,
    hasPlug: input.hasPlug ?? null,
    hasButtonCell: input.hasButtonCell ?? null,
    isToy: input.isToy ?? null,
    hasRadio: input.hasRadio ?? null,
    isDigitalDevice: input.isDigitalDevice ?? null,
    originCountry: input.originCountry?.toUpperCase().slice(0, 2) ?? null,
    annualImportValue: Number.isFinite(input.annualImportValue) ? input.annualImportValue : null,
  };

  const library = loadRuleLibrary() as RuleCategoryLike[];
  const result = await crossReferenceProduct({ product: profile, library });

  const productId = randomUUID();
  await db().insert(schema.products).values({
    id: productId,
    workspaceId,
    name: profile.name,
    description: profile.description,
    materials: profile.materials,
    audience: profile.audience,
    ageBand: profile.ageBand,
    hasBattery: profile.hasBattery,
    hasPlug: profile.hasPlug,
    hasButtonCell: profile.hasButtonCell,
    isToy: profile.isToy,
    hasRadio: profile.hasRadio,
    isDigitalDevice: profile.isDigitalDevice,
    originCountry: profile.originCountry,
    annualImportValue: profile.annualImportValue,
    // The seller confirms their own code on the next screen; we never assume one.
    htsCode: null,
    htsConfidence: result.htsCandidates[0]?.support ?? null,
    passportStatus: "draft",
  });

  // Persist every candidate up front, switched off. The browser then only ever
  // sends back ids of rows we wrote ourselves, so the label, sources and
  // confidence in the audit trail cannot be authored by the client.
  const rows = result.watches.map((w) => ({
    id: randomUUID(),
    productId,
    type: w.type,
    watchKey: w.watchKey,
    label: w.label,
    sources: w.sources,
    confidence: w.confidence,
    enabled: false,
  }));
  if (rows.length > 0) await db().insert(schema.productWatches).values(rows);

  const plan = user.plan;
  const watches: WatchOption[] = result.watches.map((w, i) =>
    lockForPlan(
      {
        id: rows[i]!.id,
        type: w.type,
        label: w.label,
        rationale: w.rationale,
        sources: w.sources,
        impactNote: w.impactNote,
        recommended: w.recommended,
      },
      plan,
    ),
  );

  return {
    productId,
    htsCandidates: result.htsCandidates,
    watches,
    degraded: result.degraded,
    lockedCount: watches.filter((w) => w.locked).length,
  };
}

/** Persist the seller's alert choices and mark the passport complete. */
/**
 * Switch on the candidates the seller picked. Takes ids only: the rows were
 * written by completePassport, so nothing the browser sends can change what a
 * watch says it is watching or which sources it claims to rest on.
 */
export async function saveWatches(
  productId: string,
  chosenWatchIds: string[],
  confirmedHtsCode: string | null,
): Promise<void> {
  const user = await requireUser();
  const workspaceId = await defaultWorkspaceId(user.id);
  const database = db();

  // Ownership check: never trust a product id from the browser.
  const [owned] = await database
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(and(eq(schema.products.id, productId), eq(schema.products.workspaceId, workspaceId)))
    .limit(1);
  if (!owned) throw new Error("No such product");

  // Scoped to this product, so an id belonging to someone else's product
  // matches nothing rather than enabling anything.
  const chosen = new Set(chosenWatchIds);
  const existing = await database
    .select({ id: schema.productWatches.id })
    .from(schema.productWatches)
    .where(eq(schema.productWatches.productId, productId));

  for (const row of existing) {
    await database
      .update(schema.productWatches)
      .set({ enabled: chosen.has(row.id) })
      .where(eq(schema.productWatches.id, row.id));
  }

  await database
    .update(schema.products)
    .set({ passportStatus: "complete", htsCode: confirmedHtsCode })
    .where(eq(schema.products.id, productId));
}

export async function deleteProduct(productId: string): Promise<void> {
  const user = await requireUser();
  const workspaceId = await defaultWorkspaceId(user.id);
  const database = db();
  const [owned] = await database
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(and(eq(schema.products.id, productId), eq(schema.products.workspaceId, workspaceId)))
    .limit(1);
  if (!owned) throw new Error("No such product");
  await database.delete(schema.productWatches).where(eq(schema.productWatches.productId, productId));
  await database.delete(schema.products).where(eq(schema.products.id, productId));
}

export interface ProductDetail extends SavedProduct {
  materials: string[] | null;
  audience: string | null;
  hasBattery: boolean | null;
  hasPlug: boolean | null;
  annualImportValue: number | null;
  watches: Array<{
    id: string;
    type: string;
    label: string;
    sources: Array<{ title: string; url: string }> | null;
    enabled: boolean;
    locked: boolean;
  }>;
  /** Set when this plan cannot see the citations behind its own findings. */
  auditLocked: boolean;
}

export async function getProduct(productId: string): Promise<ProductDetail | null> {
  const user = await requireUser();
  const workspaceId = await defaultWorkspaceId(user.id);
  const database = db();

  const [p] = await database
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.id, productId), eq(schema.products.workspaceId, workspaceId)))
    .limit(1);
  if (!p) return null;

  const watches = await database
    .select({
      id: schema.productWatches.id,
      type: schema.productWatches.type,
      label: schema.productWatches.label,
      sources: schema.productWatches.sources,
      enabled: schema.productWatches.enabled,
    })
    .from(schema.productWatches)
    // Every candidate is stored, most of them switched off; this page is
    // "what we're watching", so only the ones actually switched on belong here.
    .where(and(eq(schema.productWatches.productId, productId), eq(schema.productWatches.enabled, true)));

  // Same rule as the reveal screen: the finding is visible, its citations are not.
  const fullAudit = PLAN_LIMITS[user.plan].fullAudit;
  const shown = watches.map((w) => ({
    ...w,
    sources: fullAudit ? w.sources : null,
    locked: !fullAudit,
  }));

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    htsCode: p.htsCode,
    originCountry: p.originCountry,
    passportStatus: p.passportStatus,
    createdAt: p.createdAt,
    watchCount: shown.filter((w) => w.enabled).length,
    materials: p.materials,
    audience: p.audience,
    hasBattery: p.hasBattery,
    hasPlug: p.hasPlug,
    annualImportValue: p.annualImportValue,
    watches: shown,
    auditLocked: !fullAudit,
  };
}
