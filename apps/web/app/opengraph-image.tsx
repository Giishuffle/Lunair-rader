import { ImageResponse } from "next/og";

/**
 * The card that appears when a link is shared. Generated rather than a static
 * file so it stays in step with the palette, and drawn with the same radar
 * sweep as the product itself.
 */
export const runtime = "nodejs";
export const alt = "Lunair World - your radar for US import rules";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "72px 80px", background: "#0A1730",
          fontFamily: "sans-serif", position: "relative",
        }}
      >
        {/* Radar rings, bled off the right edge so the text keeps the weight. */}
        <div style={{ position: "absolute", right: -140, top: 95, width: 440, height: 440, borderRadius: 440, border: "2px solid #263B66", display: "flex" }} />
        <div style={{ position: "absolute", right: -30, top: 205, width: 220, height: 220, borderRadius: 220, border: "2px solid #263B66", display: "flex" }} />
        <div style={{ position: "absolute", right: 138, top: 373, width: 24, height: 24, borderRadius: 24, background: "#F5A623", display: "flex" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <div style={{ width: 26, height: 26, borderRadius: 26, background: "#F5A623", display: "flex" }} />
          <div style={{ fontSize: 25, color: "#8493AE", letterSpacing: 5, fontWeight: 600 }}>LUNAIR WORLD</div>
        </div>

        <div style={{ fontSize: 68, color: "#F4F6FB", fontWeight: 700, lineHeight: 1.15, maxWidth: 820, display: "flex" }}>
          See every rule change before it hits your cargo.
        </div>

        <div style={{ fontSize: 29, color: "#B9C4D9", marginTop: 30, maxWidth: 760, lineHeight: 1.4, display: "flex" }}>
          US import requirements for your product, with the CBP rulings and regulations behind each one.
        </div>
      </div>
    ),
    size,
  );
}
