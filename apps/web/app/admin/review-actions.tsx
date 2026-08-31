"use client";

import { useState, useTransition } from "react";
import { approveEvent, rejectEvent } from "@/lib/admin";

/**
 * Approving sends real email to real sellers, so the button asks once first.
 * The count in the prompt is the point - "12 sellers" reads differently from
 * an unlabelled Approve.
 */
export function ReviewActions({ eventId, wouldReach }: { eventId: string; wouldReach: number }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (fn: (id: string) => Promise<void>) =>
    startTransition(async () => {
      setError(null);
      try {
        await fn(eventId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "That did not work.");
      }
    });

  if (confirming) {
    return (
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>
          {wouldReach === 0
            ? "No seller is watching this - approving sends nothing."
            : `Send to ${wouldReach} watching seller${wouldReach === 1 ? "" : "s"}?`}
        </span>
        <button type="button" className="btn-amber" disabled={pending} onClick={() => run(approveEvent)}>
          {pending ? "Approving..." : "Yes, approve"}
        </button>
        <button type="button" className="linkish" onClick={() => setConfirming(false)}>Cancel</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <button type="button" className="btn-amber" disabled={pending} onClick={() => setConfirming(true)}>
        Approve
      </button>
      <button type="button" className="linkish danger" disabled={pending} onClick={() => run(rejectEvent)}>
        {pending ? "Working..." : "Reject"}
      </button>
      {error && <span style={{ color: "var(--bad)", fontSize: 13 }}>{error}</span>}
    </div>
  );
}
