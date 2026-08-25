/**
 * Alert email. Follows the alert anatomy in the design system: what changed in
 * one sentence, whether it hits you, when it takes effect, the official source,
 * and what to do - in that order, because that is the order a worried seller
 * reads in.
 */

export interface AlertEmailInput {
  productName: string;
  eventSummary: string;
  /** An AI-estimated dollar range, only ever set when the source text stated an actual rate. */
  dollarImpact?: string | null;
  watchLabel: string;
  effectiveDate: Date | null;
  sources: Array<{ title: string; url: string }>;
  appUrl: string;
  productId: string;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function alertEmail(input: AlertEmailInput): { subject: string; html: string; text: string } {
  const { productName, eventSummary, dollarImpact, watchLabel, effectiveDate, sources, appUrl, productId } = input;
  const when = effectiveDate
    ? effectiveDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;
  const productUrl = `${appUrl}/app/product/${productId}`;

  const subject = `Something moved on ${productName}`;

  const text = [
    `Something changed that appears to affect ${productName}.`,
    "",
    eventSummary,
    "",
    dollarImpact ? `Estimated dollar impact: ${dollarImpact}` : null,
    dollarImpact ? "" : null,
    `You asked us to watch: ${watchLabel}`,
    when ? `Effective: ${when}` : null,
    "",
    "Official sources:",
    ...sources.map((s) => `  ${s.title}: ${s.url}`),
    "",
    "What to do next:",
    "  1. Read the official source above and check whether it reaches your product.",
    "  2. If it does, confirm with your licensed customs broker before acting.",
    "",
    `See it in Lunair: ${productUrl}`,
    "",
    "This is informational only, built on public US government sources. It is not",
    "legal, customs-brokerage, or professional advice.",
  ]
    .filter((l) => l !== null)
    .join("\n");

  const html = `<!doctype html><html><body style="margin:0;padding:32px;background:#0A1730;font-family:system-ui,-apple-system,sans-serif;color:#F4F6FB">
  <div style="max-width:560px;margin:0 auto;background:#12244A;border:1px solid #263B66;border-radius:12px;overflow:hidden">
    <div style="height:3px;background:#F5A623"></div>
    <div style="padding:28px 32px">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8493AE;font-weight:600">Lunair World &middot; incoming change</p>
      <h1 style="margin:0 0 18px;font-size:21px;line-height:1.3">${esc(productName)}</h1>

      <p style="margin:0 0 18px;color:#B9C4D9;line-height:1.6;font-size:15px">${esc(eventSummary)}</p>

      ${
        dollarImpact
          ? `<p style="margin:0 0 18px;padding:10px 14px;background:rgba(245,166,35,.1);border:1px solid #263B66;border-radius:8px;color:#FFC461;font-size:14px"><strong>Estimated dollar impact:</strong> ${esc(dollarImpact)}</p>`
          : ""
      }

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <tr>
          <td style="padding:8px 0;border-top:1px solid #263B66;color:#8493AE;font-size:13px;width:120px">You're watching</td>
          <td style="padding:8px 0;border-top:1px solid #263B66;color:#F4F6FB;font-size:14px">${esc(watchLabel)}</td>
        </tr>
        ${when ? `<tr><td style="padding:8px 0;border-top:1px solid #263B66;color:#8493AE;font-size:13px">Effective</td><td style="padding:8px 0;border-top:1px solid #263B66;color:#FFC461;font-size:14px">${esc(when)}</td></tr>` : ""}
      </table>

      <p style="margin:0 0 8px;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#8493AE;font-weight:600">Official sources</p>
      <p style="margin:0 0 22px;line-height:1.9;font-size:14px">
        ${sources.map((s) => `<a href="${esc(s.url)}" style="color:#FFC461">${esc(s.title)}</a>`).join("<br>")}
      </p>

      <p style="margin:0 0 8px;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#8493AE;font-weight:600">What to do</p>
      <ol style="margin:0 0 24px;padding-left:20px;color:#B9C4D9;line-height:1.7;font-size:14px">
        <li>Read the official source and check whether it reaches your product.</li>
        <li>If it does, confirm with your licensed customs broker before acting.</li>
      </ol>

      <a href="${esc(productUrl)}" style="display:inline-block;background:#F5A623;color:#0B1B33;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;font-size:15px">Open in Lunair</a>

      <p style="margin:26px 0 0;color:#8493AE;font-size:12px;line-height:1.6">
        Informational only, built on public US government sources. Not legal,
        customs-brokerage, or professional advice.<br>
        Wershuffle Inc, 169 Madison Avenue, Suite 11073, New York, NY 10016
      </p>
    </div>
  </div>
</body></html>`;

  return { subject, html, text };
}
