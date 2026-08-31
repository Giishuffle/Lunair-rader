"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Route-level errors. global-error.tsx only catches failures in the root
 * layout itself, so without this an ordinary page error shows the raw Next.js
 * screen in production.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center",
                   justifyContent: "center", gap: 20, padding: "64px 24px", textAlign: "center" }}>
      <p className="label">Lunair World</p>
      <h1 style={{ fontSize: "clamp(27px, 4vw, 34px)", fontWeight: 700 }}>Something went wrong on our side</h1>
      <p style={{ color: "var(--ink-2)", maxWidth: "48ch" }}>
        We&apos;ve been told about it automatically. Your products and alerts are unaffected -
        this was a problem drawing the page, not a problem with your data.
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
        <button type="button" className="btn-amber" onClick={reset}>Try again</button>
        <a href="mailto:guy@wershuffle.com" style={{ color: "var(--muted)", alignSelf: "center" }}>Tell us about it</a>
      </div>
      {error.digest && (
        <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>
          Reference <code>{error.digest}</code>
        </p>
      )}
    </main>
  );
}
