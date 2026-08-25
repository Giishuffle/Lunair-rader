/**
 * The same alert as the email, cut to what reads well on a phone: what moved,
 * whether it costs money, when, and one link. Telegram HTML supports a small
 * tag set only - b, i, a, code - so there is no styling to carry over.
 */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export interface AlertTelegramInput {
  productName: string;
  eventSummary: string;
  dollarImpact?: string | null;
  watchLabel: string;
  effectiveDate: Date | null;
  sources: Array<{ title: string; url: string }>;
  appUrl: string;
  productId: string;
}

export function alertTelegramMessage(input: AlertTelegramInput): string {
  const { productName, eventSummary, dollarImpact, watchLabel, effectiveDate, sources, appUrl, productId } = input;
  const when = effectiveDate
    ? effectiveDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const lines = [
    `📡 <b>${esc(productName)}</b>`,
    "",
    esc(eventSummary),
  ];
  if (dollarImpact) lines.push("", `💵 <b>Estimated impact:</b> ${esc(dollarImpact)}`);
  if (when) lines.push("", `🗓 <b>Effective:</b> ${esc(when)}`);
  lines.push("", `<i>You're watching: ${esc(watchLabel)}</i>`);

  // One source is enough on a phone; the product page has the rest.
  const first = sources[0];
  if (first) lines.push("", `<a href="${esc(first.url)}">${esc(first.title)}</a>`);
  lines.push(
    "",
    `<a href="${esc(appUrl)}/app/product/${esc(productId)}">Open in Lunair</a>`,
    "",
    "<i>Informational only, from public US government sources - not legal or customs advice. /stop to turn these off.</i>",
  );

  return lines.join("\n");
}
