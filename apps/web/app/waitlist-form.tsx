"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p style={{ color: "var(--good)", fontSize: 18 }}>
        You&apos;re on the radar. We&apos;ll write when the tide comes in. ⚓
      </p>
    );
  }

  return (
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
      {state === "error" && (
        <p style={{ color: "var(--bad)", width: "100%" }}>Something went wrong - try again.</p>
      )}
    </form>
  );
}
