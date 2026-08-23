/**
 * Outbound email. Resend in production; without a key the message is printed to
 * the server console, which keeps sign-in fully working locally with no
 * third-party dependency.
 */

const FROM = process.env.EMAIL_FROM ?? "Lunair World <tide@mail.lunair-world.com>";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(msg: EmailMessage): Promise<{ sent: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`\n[email:dev] to=${msg.to}\n[email:dev] subject=${msg.subject}\n${msg.text}\n`);
    return { sent: false };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`resend HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return { sent: true };
}

/** Dark-friendly, plain, no tracking pixels - matches the newsletter compliance posture. */
export function magicLinkTemplate(url: string): { subject: string; html: string; text: string } {
  const subject = "Your Lunair World sign-in link";
  const text = [
    "Sign in to Lunair World",
    "",
    `Open this link to sign in: ${url}`,
    "",
    "The link works once and expires in 15 minutes.",
    "If you did not request it, you can ignore this email.",
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;padding:32px;background:#0A1730;font-family:system-ui,-apple-system,sans-serif;color:#F4F6FB">
  <div style="max-width:480px;margin:0 auto;background:#12244A;border:1px solid #263B66;border-radius:12px;padding:32px">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8493AE;font-weight:600">Lunair World</p>
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">Sign in</h1>
    <p style="margin:0 0 24px;color:#B9C4D9;line-height:1.6">Open the link below and you're in. It works once and expires in 15 minutes.</p>
    <a href="${url}" style="display:inline-block;background:#F5A623;color:#0B1B33;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px">Sign in to Lunair World</a>
    <p style="margin:24px 0 0;color:#8493AE;font-size:13px;line-height:1.6">If you didn't request this, ignore it and nothing happens.</p>
  </div>
</body></html>`;

  return { subject, html, text };
}

export async function sendMagicLink(to: string, url: string): Promise<void> {
  const { subject, html, text } = magicLinkTemplate(url);
  await sendEmail({ to, subject, html, text });
}
