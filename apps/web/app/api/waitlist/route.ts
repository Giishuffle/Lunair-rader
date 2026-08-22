import { NextResponse } from "next/server";
import { createDb, schema } from "@lunair/core";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

/**
 * Pre-launch waitlist capture. Stores into newsletter_subscribers (double opt-in
 * confirmation flow lands with the newsletter engine, Phase 2 item 11).
 * Without DATABASE_URL (local preview) it accepts and logs only.
 */
export async function POST(req: Request) {
  let email: unknown;
  try {
    ({ email } = (await req.json()) as { email?: unknown });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid email" }, { status: 400 });
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[waitlist] no DATABASE_URL, skipping persist:", email);
    return NextResponse.json({ ok: true, stored: false });
  }

  const db = createDb(url);
  await db
    .insert(schema.newsletterSubscribers)
    .values({ id: randomUUID(), email: email.toLowerCase(), source: "waitlist-prelaunch" })
    .onConflictDoNothing();
  return NextResponse.json({ ok: true, stored: true });
}
