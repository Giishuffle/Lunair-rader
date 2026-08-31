import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center",
                   justifyContent: "center", gap: 20, padding: "64px 24px", textAlign: "center" }}>
      <p className="label">Lunair World</p>
      <h1 style={{ fontSize: "clamp(27px, 4vw, 34px)", fontWeight: 700 }}>Nothing on the radar here</h1>
      <p style={{ color: "var(--ink-2)", maxWidth: "46ch" }}>
        That page doesn&apos;t exist, or it moved. Nothing is wrong with your account.
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
        <Link href="/" className="btn-amber" style={{ textDecoration: "none" }}>Back to the start</Link>
        <Link href="/app" style={{ color: "var(--muted)", alignSelf: "center" }}>Your radar</Link>
      </div>
    </main>
  );
}
