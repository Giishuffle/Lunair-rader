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

/**
 * First contact after signing up.
 *
 * Without it a new account hears nothing until a regulation they watch actually
 * changes, which can be weeks - so the first impression of an alerting product
 * is silence. Deliberately short, tells them the one thing to do next, and sets
 * the expectation that quiet means nothing moved rather than nothing works.
 */
export function welcomeTemplate(appUrl: string): { subject: string; html: string; text: string } {
  const subject = "Welcome to Lunair World - add your first product";
  const start = `${appUrl}/app/passport/new`;

  const text = [
    "Welcome to Lunair World.",
    "",
    "One thing to do next: describe your first product in plain English. No customs",
    "vocabulary needed - we ask what it is, who it's for and what's in it.",
    "",
    `Start here: ${start}`,
    "",
    "You'll get back the customs codes CBP has used for products like yours, each",
    "with the ruling behind it, and the US import requirements that appear to apply.",
    "You choose what we watch. We never subscribe you to anything silently.",
    "",
    "After that, expect quiet. We email you when something actually changes in the",
    "regulations behind your products - not on a schedule. Quiet means nothing moved.",
    "",
    "Reply to this email if anything is unclear. A person reads it.",
    "",
    "Lunair World is an informational monitoring service built on official US",
    "government sources. It is not legal, customs-brokerage, or professional advice.",
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;padding:32px;background:#0A1730;font-family:system-ui,-apple-system,sans-serif;color:#F4F6FB">
  <div style="max-width:520px;margin:0 auto;background:#12244A;border:1px solid #263B66;border-radius:12px;overflow:hidden">
    <div style="height:3px;background:#F5A623"></div>
    <div style="padding:32px">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8493AE;font-weight:600">Lunair World</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">Welcome aboard</h1>

      <p style="margin:0 0 20px;color:#B9C4D9;line-height:1.6;font-size:15px">
        One thing to do next: describe your first product in plain English. No customs
        vocabulary needed - we ask what it is, who it's for, and what's in it.
      </p>

      <a href="${start}" style="display:inline-block;background:#F5A623;color:#0B1B33;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;font-size:15px">Add your first product</a>

      <p style="margin:24px 0 20px;color:#B9C4D9;line-height:1.6;font-size:15px">
        You'll get back the customs codes CBP has used for products like yours, each with
        the ruling behind it, and the US import requirements that appear to apply. You pick
        what we watch - we never subscribe you to anything silently.
      </p>

      <p style="margin:0 0 24px;padding:14px 16px;background:rgba(245,166,35,.08);border:1px solid #263B66;border-radius:8px;color:#B9C4D9;line-height:1.6;font-size:14px">
        <strong style="color:#FFC461">Then expect quiet.</strong> We email you when something
        actually changes in the regulations behind your products, not on a schedule. Quiet
        means nothing moved.
      </p>

      <p style="margin:0;color:#8493AE;font-size:13px;line-height:1.6">
        Reply to this email if anything is unclear - a person reads it.<br><br>
        Informational monitoring built on official US government sources. Not legal,
        customs-brokerage, or professional advice.<br>
        Wershuffle Inc, 169 Madison Avenue, Suite 11073, New York, NY 10016
      </p>
    </div>
  </div>
</body></html>`;

  return { subject, html, text };
}
