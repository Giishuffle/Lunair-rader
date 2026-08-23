/**
 * Worker-side email. Resend in production; without a key the message prints to
 * the console, so the alert loop is fully exercisable locally without sending
 * anything to a real inbox.
 */

const FROM = process.env.EMAIL_FROM ?? "Lunair World <hello@lunair-world.com>";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(msg: EmailMessage, fetchImpl: typeof fetch = fetch): Promise<{ sent: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`\n[email:dev] to=${msg.to}\n[email:dev] subject=${msg.subject}\n${msg.text}\n`);
    return { sent: false };
  }
  const res = await fetchImpl("https://api.resend.com/emails", {
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
