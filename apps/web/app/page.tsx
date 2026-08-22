import Link from "next/link";
import { WaitlistForm } from "./waitlist-form";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
        padding: "64px 24px",
        textAlign: "center",
      }}
    >
      <div className="radar" aria-hidden="true">
        <span className="dot good" style={{ top: "30%", left: "62%" }} />
        <span className="dot good" style={{ top: "58%", left: "38%" }} />
        <span className="dot warn" style={{ top: "44%", left: "72%" }} />
        <span className="ping" style={{ top: "44%", left: "72%" }} />
        <span className="dot good" style={{ top: "68%", left: "60%" }} />
      </div>

      <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>
        <p className="label">Lunair World</p>
        <h1 style={{ fontSize: "clamp(31px, 5vw, 39px)", fontWeight: 700 }}>
          See every rule change before it hits your cargo.
        </h1>
        <p style={{ color: "var(--ink-2)", fontSize: 20, maxWidth: "58ch", margin: "0 auto" }}>
          Describe your product once. Lunair World shows every US import requirement that
          appears to apply - duties, agency rules, labeling - and pings you the moment
          anything changes.
        </p>
      </div>

      <WaitlistForm />

      <footer style={{ color: "var(--muted)", fontSize: 14, maxWidth: "60ch" }}>
        <p>
          Lunair World is an informational monitoring service built on official US government
          sources. It is not legal, customs-brokerage, or professional advice - always verify
          decisions with your licensed customs broker.
        </p>
        <p style={{ marginTop: 8 }}>A Wershuffle Inc product.</p>
        <p style={{ marginTop: 12, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/terms" style={{ color: "var(--muted)" }}>
            Terms
          </Link>
          <Link href="/privacy" style={{ color: "var(--muted)" }}>
            Privacy
          </Link>
          <a href="mailto:guy@wershuffle.com" style={{ color: "var(--muted)" }}>
            Contact
          </a>
        </p>
      </footer>
    </main>
  );
}
