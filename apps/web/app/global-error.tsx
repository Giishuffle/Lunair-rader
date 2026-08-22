"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Catches React render errors that escape the normal boundaries and reports
 * them to Sentry. Must render its own <html>/<body> - it replaces the layout.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          background: "#0A1730",
          color: "#F4F6FB",
          fontFamily: "system-ui, sans-serif",
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          margin: 0,
        }}
      >
        <h1 style={{ fontSize: 25, fontWeight: 700 }}>The radar lost signal</h1>
        <p style={{ color: "#B9C4D9", maxWidth: "50ch" }}>
          Something broke on our side and we&apos;ve been notified. Reload the page, and if it
          keeps happening email guy@wershuffle.com.
        </p>
        <a
          href="/"
          style={{
            background: "#F5A623",
            color: "#0B1B33",
            borderRadius: 8,
            padding: "12px 24px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Back to safe harbor
        </a>
      </body>
    </html>
  );
}
