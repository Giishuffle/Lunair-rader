"use client";

import { useEffect, useState } from "react";

interface SignupResult {
  position: number | null;
  founding: boolean;
  foundingSpots: number;
}

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [result, setResult] = useState<SignupResult | null>(null);
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);

  // Real count, not a fake countdown: the founding offer is genuinely capped.
  useEffect(() => {
    fetch("/api/waitlist")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSpotsLeft(d.spotsLeft))
      .catch(() => undefined);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setState("error");
        return;
      }
      setResult((await res.json()) as SignupResult);
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        <p style={{ color: "var(--good)", fontSize: 18 }}>
          You&apos;re on the radar. We&apos;ll write when the tide comes in. ⚓
        </p>
        {result?.founding && (
          <p style={{ color: "var(--amber-2)", fontSize: 16 }}>
            You&apos;re founding member #{result.position} — that&apos;s 50% off your first year
            when we open. We&apos;ll email your code.
          </p>
        )}
        {result && !result.founding && result.position && (
          <p style={{ color: "var(--ink-2)", fontSize: 15 }}>
            You&apos;re #{result.position} in line. The first {result.foundingSpots} founding spots
            are taken, but you&apos;ll get early access before we open publicly.
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
      <form onSubmit={submit} style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <input
          className="input"
          type="email"
          required
          placeholder="you@yourbrand.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
          style={{ width: 280 }}
        />
        <button className="btn-amber" type="submit" disabled={state === "busy"}>
          {state === "busy" ? "Adding…" : "Join the early crew"}
        </button>
      </form>

      {spotsLeft !== null && spotsLeft > 0 && (
        <p style={{ color: "var(--ink-2)", fontSize: 15 }}>
          First 50 get <strong style={{ color: "var(--amber-2)" }}>50% off their first year</strong>.{" "}
          {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left.
        </p>
      )}

      {state === "error" && (
        <p style={{ color: "var(--bad)" }}>That didn&apos;t go through - try again in a moment.</p>
      )}
    </div>
  );
}
