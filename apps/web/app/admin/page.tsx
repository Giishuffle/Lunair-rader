import type { Metadata } from "next";
import { adminOverview, pendingReview } from "@/lib/admin";
import { ReviewActions } from "./review-actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const fmtDate = (d: Date | null) =>
  d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";

function hoursAgo(d: Date | null): string {
  if (!d) return "never";
  const h = Math.round((Date.now() - d.getTime()) / 3.6e6);
  return h < 1 ? "just now" : h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

export default async function AdminPage() {
  const [overview, queue] = await Promise.all([adminOverview(), pendingReview()]);

  return (
    <main className="page" style={{ maxWidth: 1000 }}>
      <div className="page-head">
        <div>
          <h1>Admin</h1>
          <p className="sub">
            {overview.pendingReview === 0
              ? "Nothing waiting on you."
              : `${overview.pendingReview} event${overview.pendingReview === 1 ? "" : "s"} held below the confidence gate, waiting for a decision.`}
          </p>
        </div>
      </div>

      <div className="facts">
        <div className="fact"><span className="fact-k">Accounts</span><span className="fact-v">{overview.users}</span></div>
        <div className="fact"><span className="fact-k">Paying</span><span className="fact-v">{overview.paidUsers}</span></div>
        <div className="fact"><span className="fact-k">Products</span><span className="fact-v">{overview.products}</span></div>
        <div className="fact"><span className="fact-k">Active watches</span><span className="fact-v">{overview.activeWatches}</span></div>
        <div className="fact"><span className="fact-k">Alerts sent (7d)</span><span className="fact-v">{overview.alertsSent7d}</span></div>
        <div className="fact">
          <span className="fact-k">Delivery failures</span>
          <span className="fact-v" style={overview.alertsFailed > 0 ? { color: "var(--bad)" } : undefined}>
            {overview.alertsFailed}
          </span>
        </div>
      </div>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 21, fontWeight: 700, marginBottom: 6 }}>Review queue</h2>
        <p className="sub" style={{ marginBottom: 16 }}>
          These scored below {Math.round(0.8 * 100)}% confidence, so they were never sent
          automatically. Approving lets the dispatcher send them; rejecting retires them
          without sending.
        </p>

        {queue.length === 0 ? (
          <p className="quota-note">Queue is empty.</p>
        ) : (
          <ul className="watch-list">
            {queue.map((e) => (
              <li key={e.id} className="watch-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span className="chip">{e.type}</span>
                  <span className="chip">{Math.round(e.confidence * 100)}% confidence</span>
                  <span className="chip">
                    {e.wouldReach} seller{e.wouldReach === 1 ? "" : "s"} watching
                  </span>
                  <span style={{ color: "var(--muted)", fontSize: 13 }}>{fmtDate(e.createdAt)}</span>
                </div>
                <p style={{ color: "var(--ink-2)", lineHeight: 1.6, fontSize: 14.5 }}>{e.summary}</p>
                {(e.affectedCategories?.length || e.affectedHts?.length) && (
                  <p style={{ color: "var(--muted)", fontSize: 13 }}>
                    {e.affectedCategories?.length ? `Categories: ${e.affectedCategories.join(", ")}. ` : ""}
                    {e.affectedHts?.length ? `HTS: ${e.affectedHts.slice(0, 8).join(", ")}` : ""}
                  </p>
                )}
                <ReviewActions eventId={e.id} wouldReach={e.wouldReach} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 21, fontWeight: 700, marginBottom: 12 }}>Sources</h2>
        <ul className="watch-list">
          {overview.sources.length === 0 && <p className="quota-note">No source has reported yet.</p>}
          {overview.sources.map((s) => (
            <li key={s.source} className="watch-item" style={{ alignItems: "center" }}>
              <span
                className="status-dot"
                style={{ background: s.status === "ok" ? "var(--good)" : s.status === "degraded" ? "var(--warn)" : "var(--bad)" }}
              />
              <div className="watch-item-body" style={{ flex: 1 }}>
                <strong>{s.source}</strong>
                <span className="product-meta">
                  last success {hoursAgo(s.lastSuccessAt)}
                  {s.errorStreak > 0 ? ` · ${s.errorStreak} consecutive failures` : ""}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 21, fontWeight: 700, marginBottom: 12 }}>Recent newsletters</h2>
        {overview.newsletter.length === 0 ? (
          <p className="quota-note">No issue drafted yet.</p>
        ) : (
          <ul className="watch-list">
            {overview.newsletter.map((n) => (
              <li key={n.id} className="watch-item" style={{ alignItems: "center" }}>
                <div className="watch-item-body" style={{ flex: 1 }}>
                  <strong>Week of {fmtDate(n.weekOf)}</strong>
                  <span className="product-meta">
                    {n.status}
                    {n.sentAt ? ` · sent ${fmtDate(n.sentAt)}` : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
