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
  audience?: string;
  hasBattery?: boolean;
  hasPlug?: boolean;
  hasButtonCell?: boolean;
  isToy?: boolean;
  originCountry?: string;
  annualImportValue?: number;
}

export interface PassportResult {
  productId: string;
  htsCandidates: Awaited<ReturnType<typeof crossReferenceProduct>>["htsCandidates"];
  watches: WatchCandidate[];
  degraded: string[];
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
    audience: input.audience ?? null,
    hasBattery: input.hasBattery ?? null,
    hasPlug: input.hasPlug ?? null,
    hasButtonCell: input.hasButtonCell ?? null,
    isToy: input.isToy ?? null,
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
    hasBattery: profile.hasBattery,
    hasPlug: profile.hasPlug,
    hasButtonCell: profile.hasButtonCell,
    isToy: profile.isToy,
    originCountry: profile.originCountry,
    annualImportValue: profile.annualImportValue,
    // The seller confirms their own code on the next screen; we never assume one.
    htsCode: null,
    htsConfidence: result.htsCandidates[0]?.support ?? null,
    passportStatus: "draft",
  });

  return { productId, htsCandidates: result.htsCandidates, watches: result.watches, degraded: result.degraded };
}

/** Persist the seller's alert choices and mark the passport complete. */
export async function saveWatches(
  productId: string,
  chosen: Array<Pick<WatchCandidate, "id" | "type" | "watchKey" | "label" | "sources" | "confidence">>,
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

  await database.delete(schema.productWatches).where(eq(schema.productWatches.productId, productId));

  if (chosen.length > 0) {
    await database.insert(schema.productWatches).values(
      chosen.map((w) => ({
        id: randomUUID(),
        productId,
        type: w.type,
        watchKey: w.watchKey,
        label: w.label,
        // Snapshot the sources shown at opt-in time - an audit trail of what
        // the seller actually agreed to be watched on.
        sources: w.sources,
        confidence: w.confidence,
        enabled: true,
      })),
    );
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
  }>;
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
    .where(eq(schema.productWatches.productId, productId));

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    htsCode: p.htsCode,
    originCountry: p.originCountry,
    passportStatus: p.passportStatus,
    createdAt: p.createdAt,
    watchCount: watches.filter((w) => w.enabled).length,
    materials: p.materials,
    audience: p.audience,
    hasBattery: p.hasBattery,
    hasPlug: p.hasPlug,
    annualImportValue: p.annualImportValue,
    watches,
  };
}
