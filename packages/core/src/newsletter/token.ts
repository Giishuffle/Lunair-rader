import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless signed tokens for links we email out - unsubscribe, and the owner's
 * newsletter approval link.
 *
 * HMAC rather than a stored random token: no migration, no row to clean up, and
 * an unsubscribe link keeps working even if the subscriber row is rewritten.
 * The secret is AUTH_SECRET, which already exists and is already treated as
 * sensitive; a leak of one of these tokens reveals nothing but its own purpose.
 */

function sign(purpose: string, subject: string, secret: string): string {
  return createHmac("sha256", secret).update(`${purpose}:${subject}`).digest("hex").slice(0, 32);
}

export function issueToken(purpose: string, subject: string, secret: string): string {
  return sign(purpose, subject, secret);
}

export function verifyToken(purpose: string, subject: string, token: string, secret: string): boolean {
  const expected = sign(purpose, subject, secret);
  // Compare in constant time. Lengths must match first or timingSafeEqual throws.
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export const UNSUBSCRIBE_PURPOSE = "newsletter-unsubscribe";
export const APPROVE_PURPOSE = "newsletter-approve";

/** Unsubscribe is keyed on the lowercased address, so casing can never break the link. */
export function unsubscribeToken(email: string, secret: string): string {
  return issueToken(UNSUBSCRIBE_PURPOSE, email.toLowerCase(), secret);
}

export function verifyUnsubscribeToken(email: string, token: string, secret: string): boolean {
  return verifyToken(UNSUBSCRIBE_PURPOSE, email.toLowerCase(), token, secret);
}

export function approveToken(issueId: string, secret: string): string {
  return issueToken(APPROVE_PURPOSE, issueId, secret);
}

export function verifyApproveToken(issueId: string, token: string, secret: string): boolean {
  return verifyToken(APPROVE_PURPOSE, issueId, token, secret);
}
