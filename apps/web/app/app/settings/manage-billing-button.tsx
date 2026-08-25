"use client";

import { useState } from "react";

/** Opens Stripe's Customer Portal - card updates, plan switches, invoices, and cancellation. */
export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!data.ok || !data.url) {
        setError(data.error ?? "Could not open billing. Try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not reach billing. Try again in a moment.");
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className="btn-amber" onClick={open} disabled={loading}>
        {loading ? "Opening..." : "Manage billing"}
      </button>
      {error && <p style={{ color: "var(--bad)", marginTop: 12, fontSize: 14 }}>{error}</p>}
    </>
  );
}
