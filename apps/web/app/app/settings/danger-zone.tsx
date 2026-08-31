"use client";

import { useState } from "react";
import { deleteAccount } from "@/lib/account";

/**
 * Deletion is irreversible, so it asks for the account's own email typed out
 * rather than a single confirm button. The cost of a mis-click here is somebody
 * else's product data.
 */
export function DangerZone({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await deleteAccount(typed);
    } catch (e) {
      // A redirect from a server action surfaces as a thrown error; it is not a
      // failure and must not be shown as one.
      if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) return;
      setError(e instanceof Error ? e.message : "Could not delete the account.");
      setBusy(false);
    }
  }

  return (
    <section style={{ marginTop: 44, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
      <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>Delete your account</h2>
      <p className="quota-note" style={{ marginBottom: 12 }}>
        Removes your products, watches, alert history and your address from our mailing
        list. It cannot be undone, so download your data first if you want a copy. If you
        have a paid plan, cancel it in billing above - deleting here does not stop a
        Stripe subscription.
      </p>

      {!open ? (
        <button type="button" className="linkish danger" onClick={() => setOpen(true)}>
          Delete my account
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start", maxWidth: 420 }}>
          <label htmlFor="confirm-email" style={{ fontSize: 14, color: "var(--ink-2)" }}>
            Type <strong>{email}</strong> to confirm.
          </label>
          <input
            id="confirm-email"
            className="input"
            style={{ width: "100%" }}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            placeholder={email}
          />
          {error && <p style={{ color: "var(--bad)", fontSize: 14 }}>{error}</p>}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              type="button"
              className="btn-amber"
              style={{ background: "var(--bad)", color: "#fff" }}
              disabled={!matches || busy}
              onClick={confirm}
            >
              {busy ? "Deleting..." : "Permanently delete"}
            </button>
            <button type="button" className="linkish" onClick={() => { setOpen(false); setTyped(""); setError(null); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
