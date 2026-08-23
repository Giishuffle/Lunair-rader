import { NextResponse } from "next/server";
import { crossReferenceProduct, type ProductProfile, type RuleCategoryLike } from "@lunair/core";
import { loadRuleLibrary } from "@lunair/rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** CROSS lookups make several upstream calls with polite pacing. */
export const maxDuration = 60;

/**
 * Cross-reference a completed Product Passport against CBP rulings and the rule
 * library, and return the alert choices the seller can opt into.
 *
 * Returns candidates only - nothing is subscribed here. Saving the seller's
 * choices happens separately, once accounts exist (Phase 0 item 2).
 */
export async function POST(req: Request) {
  let body: Partial<ProductProfile>;
  try {
    body = (await req.json()) as Partial<ProductProfile>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }

  if (typeof body.name !== "string" || body.name.trim().length < 2) {
    return NextResponse.json({ ok: false, error: "a product name is required" }, { status: 400 });
  }

  const product: ProductProfile = {
    name: body.name.trim().slice(0, 200),
    description: typeof body.description === "string" ? body.description.slice(0, 1000) : null,
    materials: Array.isArray(body.materials) ? body.materials.slice(0, 20).map(String) : null,
    audience: typeof body.audience === "string" ? body.audience : null,
    hasBattery: typeof body.hasBattery === "boolean" ? body.hasBattery : null,
    hasPlug: typeof body.hasPlug === "boolean" ? body.hasPlug : null,
    originCountry: typeof body.originCountry === "string" ? body.originCountry.toUpperCase().slice(0, 2) : null,
    annualImportValue:
      typeof body.annualImportValue === "number" && Number.isFinite(body.annualImportValue)
        ? Math.max(0, Math.round(body.annualImportValue))
        : null,
    htsCode: typeof body.htsCode === "string" ? body.htsCode : null,
  };

  try {
    const library = loadRuleLibrary() as RuleCategoryLike[];
    const result = await crossReferenceProduct({ product, library });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[crossref] failed", err);
    return NextResponse.json({ ok: false, error: "cross-reference failed" }, { status: 500 });
  }
}
