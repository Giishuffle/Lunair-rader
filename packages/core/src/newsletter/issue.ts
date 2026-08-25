/**
 * The weekly "Lunar Tide" issue: a structured payload, not free-form markdown.
 *
 * The AI returns JSON matching NewsletterDraft, which we then render ourselves.
 * That means the model never emits HTML - so nothing it writes can inject
 * markup - and the rendering stays identical issue to issue.
 */

export interface NewsletterItem {
  headline: string;
  body: string;
  sourceTitle: string;
  sourceUrl: string;
}

export interface NewsletterDraft {
  subject: string;
  intro: string;
  items: NewsletterItem[];
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Only http(s) links survive rendering - never a javascript: or data: URL from model output. */
function safeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function parseNewsletterDraft(text: string): NewsletterDraft | null {
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const raw = JSON.parse(cleaned) as Record<string, unknown>;
    const subject = typeof raw.subject === "string" ? raw.subject.trim() : "";
    const intro = typeof raw.intro === "string" ? raw.intro.trim() : "";
    if (!subject || !intro || !Array.isArray(raw.items)) return null;

    const items: NewsletterItem[] = [];
    for (const entry of raw.items) {
      if (typeof entry !== "object" || entry === null) continue;
      const e = entry as Record<string, unknown>;
      const headline = typeof e.headline === "string" ? e.headline.trim() : "";
      const body = typeof e.body === "string" ? e.body.trim() : "";
      const sourceTitle = typeof e.sourceTitle === "string" ? e.sourceTitle.trim() : "";
      const sourceUrl = typeof e.sourceUrl === "string" ? safeUrl(e.sourceUrl) : null;
      if (!headline || !body || !sourceUrl) continue;
      items.push({ headline, body, sourceTitle: sourceTitle || sourceUrl, sourceUrl });
    }
    if (items.length === 0) return null;
    return { subject, intro, items };
  } catch {
    return null;
  }
}

/** What the owner reads when approving. Plain markdown, no styling to wade through. */
export function renderIssueMarkdown(draft: NewsletterDraft): string {
  const lines = [`# ${draft.subject}`, "", draft.intro, ""];
  for (const item of draft.items) {
    lines.push(`## ${item.headline}`, "", item.body, "", `Source: [${item.sourceTitle}](${item.sourceUrl})`, "");
  }
  return lines.join("\n");
}

export interface RenderOptions {
  unsubscribeUrl: string;
  appUrl: string;
}

export function renderIssueHtml(draft: NewsletterDraft, opts: RenderOptions): string {
  const items = draft.items
    .map(
      (item) => `
      <div style="margin:0 0 26px">
        <h2 style="margin:0 0 8px;font-size:17px;line-height:1.35;color:#F4F6FB">${esc(item.headline)}</h2>
        <p style="margin:0 0 8px;color:#B9C4D9;line-height:1.6;font-size:15px">${esc(item.body)}</p>
        <a href="${esc(item.sourceUrl)}" style="color:#FFC461;font-size:13.5px">${esc(item.sourceTitle)}</a>
      </div>`,
    )
    .join("");

  return `<!doctype html><html><body style="margin:0;padding:32px;background:#0A1730;font-family:system-ui,-apple-system,sans-serif;color:#F4F6FB">
  <div style="max-width:600px;margin:0 auto;background:#12244A;border:1px solid #263B66;border-radius:12px;overflow:hidden">
    <div style="height:3px;background:#F5A623"></div>
    <div style="padding:28px 32px">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8493AE;font-weight:600">Lunair World &middot; the Lunar Tide</p>
      <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3">${esc(draft.subject)}</h1>
      <p style="margin:0 0 28px;color:#B9C4D9;line-height:1.6;font-size:15px">${esc(draft.intro)}</p>
      ${items}
      <a href="${esc(opts.appUrl)}/app" style="display:inline-block;background:#F5A623;color:#0B1B33;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;font-size:15px">Open your radar</a>
      <p style="margin:26px 0 0;color:#8493AE;font-size:12px;line-height:1.6">
        Informational only, built on public US government sources. Not legal,
        customs-brokerage, or professional advice.<br>
        Wershuffle Inc, 169 Madison Avenue, Suite 11073, New York, NY 10016<br>
        <a href="${esc(opts.unsubscribeUrl)}" style="color:#8493AE">Unsubscribe</a>
      </p>
    </div>
  </div>
</body></html>`;
}

export function renderIssueText(draft: NewsletterDraft, opts: RenderOptions): string {
  const lines = [draft.subject, "", draft.intro, ""];
  for (const item of draft.items) {
    lines.push(`## ${item.headline}`, item.body, `Source: ${item.sourceTitle} - ${item.sourceUrl}`, "");
  }
  lines.push(
    `Open your radar: ${opts.appUrl}/app`,
    "",
    "Informational only, built on public US government sources. Not legal,",
    "customs-brokerage, or professional advice.",
    "Wershuffle Inc, 169 Madison Avenue, Suite 11073, New York, NY 10016",
    `Unsubscribe: ${opts.unsubscribeUrl}`,
  );
  return lines.join("\n");
}
