import type { Metadata } from "next";
import Link from "next/link";
import { listProducts, productQuota } from "@/lib/products";
import { RadarBoard } from "./radar-board";

const PLAN_NAME: Record<string, string> = {
  harbor: "Harbor", voyage: "Voyage", fleet: "Fleet", lighthouse: "Lighthouse",
};

export const metadata: Metadata = { title: "Your radar - Lunair World", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AppHome() {
  const [products, quota] = await Promise.all([listProducts(), productQuota()]);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>Your radar</h1>
          <p className="sub">
            {products.length === 0
              ? "Nothing on the radar yet. Add your first product and we'll start watching."
              : `Watching ${products.length} product${products.length === 1 ? "" : "s"} across four US government sources.`}
          </p>
        </div>
        {quota.canAddMore ? (
          <Link href="/app/passport/new" className="btn-amber">Add a product</Link>
        ) : (
          <Link href="/pricing" className="btn-amber">Upgrade to add more</Link>
        )}
      </div>

      <RadarBoard products={products} />

      {!quota.canAddMore && (
        <p className="quota-note">
          Your {PLAN_NAME[quota.plan] ?? quota.plan} plan covers {quota.limit} product
          {quota.limit === 1 ? "" : "s"}.
          Upgrading raises the limit and unlocks real-time alerts.
        </p>
      )}
    </main>
  );
}
