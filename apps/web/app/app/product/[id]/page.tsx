import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/products";
import { DeleteProductButton } from "./delete-button";

export const metadata: Metadata = { title: "Product - Lunair World", robots: { index: false } };
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  hts_duty: "Duty rate",
  origin_tariff: "Origin tariffs",
  agency_requirement: "Agency rules",
  recall: "Recalls",
  adcvd: "AD/CVD",
};

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) notFound();

  const facts = [
    p.htsCode ? ["Customs code", p.htsCode] : ["Customs code", "not confirmed yet"],
    p.originCountry ? ["Made in", p.originCountry] : null,
    p.audience ? ["Used by", p.audience] : null,
    p.hasBattery ? ["Battery", "yes"] : null,
    p.hasPlug ? ["Mains powered", "yes"] : null,
    p.annualImportValue ? ["Yearly import value", `$${p.annualImportValue.toLocaleString("en-US")}`] : null,
    p.materials?.length ? ["Materials", p.materials.join(", ")] : null,
  ].filter(Boolean) as Array<[string, string]>;

  return (
    <main className="page">
      <p className="label"><Link href="/app" className="muted">← Your radar</Link></p>
      <div className="page-head">
        <div>
          <h1>{p.name}</h1>
          {p.description && <p className="sub">{p.description}</p>}
        </div>
        <span className={`pill ${p.passportStatus === "complete" ? "good" : "draft"}`}>
          {p.passportStatus === "complete" ? "All clear" : "Passport unfinished"}
        </span>
      </div>

      <section className="facts">
        {facts.map(([k, v]) => (
          <div key={k} className="fact"><span className="fact-k">{k}</span><span className="fact-v">{v}</span></div>
        ))}
      </section>

      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>
          What we&apos;re watching ({p.watches.filter((w) => w.enabled).length})
        </h2>
        {p.watches.length === 0 ? (
          <p className="sub">Nothing selected yet for this product.</p>
        ) : (
          <ul className="watch-list">
            {p.watches.map((w) => (
              <li key={w.id} className="watch-item">
                <span className="chip">{TYPE_LABEL[w.type] ?? w.type}</span>
                <span className="watch-item-body">
                  <strong>{w.label}</strong>
                  {w.sources && w.sources.length > 0 ? (
                    <span className="sources">
                      {w.sources.slice(0, 3).map((s) => (
                        <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
                      ))}
                    </span>
                  ) : w.locked ? (
                    <span className="locked">Requirements and citations are part of the full audit.</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
        {p.auditLocked && p.watches.length > 0 && (
          <p className="upsell">
            You&apos;re seeing what we found. A paid plan adds the requirements and government
            citations behind each one, plus an alert the moment any of them change - right now
            you&apos;d have to check yourself. <Link href="/pricing">See plans</Link>
          </p>
        )}
      </section>

      <p className="disclaimer">
        Informational only, built on public US government sources. Not legal,
        customs-brokerage, or professional advice - verify with your licensed customs broker.
      </p>

      <DeleteProductButton productId={p.id} />
    </main>
  );
}
