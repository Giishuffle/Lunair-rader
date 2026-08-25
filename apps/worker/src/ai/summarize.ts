import { findUnhedgedBannedCopy } from "@lunair/core";
import { anthropic } from "./anthropic.js";

const MODEL = "claude-sonnet-5";

/** Event types where the change is plausibly a duty-rate move worth a dollar estimate. */
const DUTY_RELEVANT_TYPES = new Set(["duty_change", "tariff_change", "origin_tariff_change", "adcvd_order"]);

export interface SummarizeInput {
  eventType: string;
  rawSummary: string;
  effectiveDate: Date | null;
  productName: string;
  productDescription: string | null;
  annualImportValue: number | null;
}

export interface AlertSummary {
  summary: string;
  dollarImpact: string | null;
  /** False whenever the raw source text is being shown verbatim instead of an AI rewrite. */
  aiGenerated: boolean;
}

/** A single text completion call, injectable so tests never need a real API key or network. */
export type Complete = (prompt: string) => Promise<string | null>;

async function defaultComplete(prompt: string): Promise<string | null> {
  const res = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });
  const block = res.content.find((b) => b.type === "text");
  return block && "text" in block ? block.text.trim() : null;
}

/**
 * Turns a watcher's raw source text into the plain-English, product-specific
 * summary the design system calls for - falling back to the raw text on any
 * failure, since a worse-written alert beats a missed one.
 */
export async function summarizeEventForAlert(
  input: SummarizeInput,
  complete: Complete = defaultComplete,
): Promise<AlertSummary> {
  const fallback: AlertSummary = { summary: input.rawSummary, dollarImpact: null, aiGenerated: false };
  const wantsDollarImpact = DUTY_RELEVANT_TYPES.has(input.eventType) && Boolean(input.annualImportValue);

  try {
    const text = await complete(buildPrompt(input, wantsDollarImpact));
    if (!text) return fallback;

    const parsed = parseResponse(text);
    if (!parsed || !parsed.summary) return fallback;

    // AI output must clear the same bar as anything else we publish (master-plan §7.3).
    const flagged = findUnhedgedBannedCopy(parsed.summary) ?? (parsed.dollarImpact ? findUnhedgedBannedCopy(parsed.dollarImpact) : null);
    if (flagged) {
      console.error(`[ai-summary] rejected model output, unhedged "${flagged.phrase}"`);
      return fallback;
    }

    return { summary: parsed.summary, dollarImpact: parsed.dollarImpact, aiGenerated: true };
  } catch (err) {
    console.error("[ai-summary] Anthropic call failed, falling back to raw summary", err);
    return fallback;
  }
}

function buildPrompt(input: SummarizeInput, wantsDollarImpact: boolean): string {
  const when = input.effectiveDate
    ? input.effectiveDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "an unspecified date";

  return `You write short alert copy for Lunair World, a US import-compliance monitoring
service. A US e-commerce seller is about to be told that a government source changed in
a way that might affect one of their products. Write for someone who is not a customs
professional and is a little anxious about surprise costs or blocked shipments.

Rules, no exceptions:
- 2-4 sentences. Plain English, no customs jargon left unexplained.
- Hedge every claim about applicability - phrasing like "appears to" or "may" - never
  state as certain that this affects their specific product, since you were not given
  enough information to classify it definitively. Write for a reader who only sees your
  summary, not the raw source text, so never refer to "the text below" or similar.
- Never use the words "guaranteed", "certified", "legal advice", or the phrase "we ensure
  compliance", even in a negation.
- Do not invent facts not present in the raw source text below. If the raw text is thin,
  say less rather than padding with a plausible-sounding guess.
- Do not tell the seller what to do next; that is handled elsewhere in the email.

Product: "${input.productName}"${input.productDescription ? ` - ${input.productDescription}` : ""}
Change type: ${input.eventType}
Effective: ${when}
Raw source text:
"""
${input.rawSummary}
"""
${
  wantsDollarImpact
    ? `\nThis seller reports roughly $${input.annualImportValue?.toLocaleString("en-US")}/year in imports of this product. If, and only if, the raw text above states an actual duty-rate figure (old rate, new rate, or a delta), give a rough estimated dollar range for this seller's annual import value, explicitly labeled as an estimate. If the raw text does not contain an actual rate, set dollar_impact to null rather than guessing.`
    : `\nSet dollar_impact to null - this change type is not a duty-rate move.`
}

Respond with ONLY a JSON object, no markdown fences, matching exactly:
{"summary": "...", "dollar_impact": "..." or null}`;
}

function parseResponse(text: string): { summary: string; dollarImpact: string | null } | null {
  try {
    // Models occasionally wrap JSON in a fenced code block despite instructions not to.
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as { summary?: unknown; dollar_impact?: unknown };
    if (typeof parsed.summary !== "string" || !parsed.summary.trim()) return null;
    const dollarImpact = typeof parsed.dollar_impact === "string" ? parsed.dollar_impact.trim() : null;
    return { summary: parsed.summary.trim(), dollarImpact: dollarImpact || null };
  } catch {
    return null;
  }
}
