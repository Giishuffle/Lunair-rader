import { and, eq, desc } from "drizzle-orm";
import { PLAN_LIMITS, schema, toCsv, csvFilename, type Plan } from "@lunair/core";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * CSV of every product and the watches on it.
 *
 * The plan check is here, server-side, and it is the only one that counts - the
 * button is hidden for plans without export, but a hidden button is decoration.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Sign in first", { status: 401 });
  }

  const plan = (session.user.plan ?? "harbor") as Plan;
  if (!PLAN_LIMITS[plan].csvExport) {
    return new Response("CSV export is part of the Fleet plan.", { status: 402 });
  }

  const database = db();
  const [workspace] = await database
    .select({ id: schema.workspaces.id })
    .from(schema.workspaces)
    .where(eq(schema.workspaces.ownerUserId, session.user.id))
    .limit(1);

  if (!workspace) return new Response("No products yet", { status: 404 });

  // One row per watch, with the product repeated - the shape people actually
  // want in a spreadsheet, where they filter and pivot rather than read nesting.
  const rows = await database
    .select({
      productName: schema.products.name,
      description: schema.products.description,
      htsCode: schema.products.htsCode,
      originCountry: schema.products.originCountry,
      annualImportValue: schema.products.annualImportValue,
      audience: schema.products.audience,
      passportStatus: schema.products.passportStatus,
      productCreatedAt: schema.products.createdAt,
      watchLabel: schema.productWatches.label,
      watchType: schema.productWatches.type,
      watchEnabled: schema.productWatches.enabled,
      watchSources: schema.productWatches.sources,
    })
    .from(schema.products)
    .leftJoin(schema.productWatches, eq(schema.productWatches.productId, schema.products.id))
    .where(eq(schema.products.workspaceId, workspace.id))
    .orderBy(desc(schema.products.createdAt), schema.productWatches.label);

  const csv = toCsv(
    ["Product", "Description", "HTS code", "Origin", "Annual import value (USD)", "Intended user",
     "Passport status", "Added", "Watch", "Watch type", "Monitoring", "Sources"],
    rows.map((r) => [
      r.productName,
      r.description,
      r.htsCode,
      r.originCountry,
      r.annualImportValue,
      r.audience,
      r.passportStatus,
      r.productCreatedAt?.toISOString().slice(0, 10),
      r.watchLabel,
      r.watchType,
      r.watchLabel === null ? "" : r.watchEnabled ? "on" : "off",
      (r.watchSources ?? []).map((s) => s.url).join(" | "),
    ]),
  );

  const filename = csvFilename("lunair-products", new Date().toISOString().slice(0, 10));
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      // Contains the user's own commercial data; never let a proxy hold it.
      "cache-control": "no-store, private",
    },
  });
}
