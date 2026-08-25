import Anthropic from "@anthropic-ai/sdk";

/**
 * Built lazily so importing this module never requires ANTHROPIC_API_KEY -
 * same reason apps/web builds Stripe and the Auth.js adapter lazily.
 */
let client: Anthropic | null = null;

export function anthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  client ??= new Anthropic({ apiKey });
  return client;
}
