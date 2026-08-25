import { describe, expect, it } from "vitest";
import { summarizeEventForAlert, type SummarizeInput } from "./summarize.js";

const BASE_INPUT: SummarizeInput = {
  eventType: "regulation_amended",
  rawSummary: "49 CFR 173 was amended to update lithium battery packaging thresholds.",
  effectiveDate: null,
  productName: "Kids' night light",
  productDescription: "A plug-in night light with a battery backup",
  annualImportValue: null,
};

describe("summarizeEventForAlert", () => {
  it("returns the model's summary when the response is well-formed", async () => {
    const fake = async () => JSON.stringify({ summary: "This appears to affect your product.", dollar_impact: null });
    const result = await summarizeEventForAlert(BASE_INPUT, fake);
    expect(result).toEqual({ summary: "This appears to affect your product.", dollarImpact: null, aiGenerated: true });
  });

  it("strips a markdown fence the model wasn't supposed to add", async () => {
    const fake = async () => '```json\n{"summary": "Fenced but valid.", "dollar_impact": null}\n```';
    const result = await summarizeEventForAlert(BASE_INPUT, fake);
    expect(result.summary).toBe("Fenced but valid.");
    expect(result.aiGenerated).toBe(true);
  });

  it("passes through a dollar_impact string when the model provides one", async () => {
    const fake = async () => JSON.stringify({ summary: "Rates changed.", dollar_impact: "roughly $200-400/yr" });
    const result = await summarizeEventForAlert(
      { ...BASE_INPUT, eventType: "duty_change", annualImportValue: 50_000 },
      fake,
    );
    expect(result.dollarImpact).toBe("roughly $200-400/yr");
  });

  it("falls back to the raw summary when the completion throws", async () => {
    const fake = async () => {
      throw new Error("network error");
    };
    const result = await summarizeEventForAlert(BASE_INPUT, fake);
    expect(result).toEqual({ summary: BASE_INPUT.rawSummary, dollarImpact: null, aiGenerated: false });
  });

  it("falls back when the model returns unparseable text", async () => {
    const fake = async () => "not json at all";
    const result = await summarizeEventForAlert(BASE_INPUT, fake);
    expect(result.aiGenerated).toBe(false);
    expect(result.summary).toBe(BASE_INPUT.rawSummary);
  });

  it("falls back when the model returns null", async () => {
    const fake = async () => null;
    const result = await summarizeEventForAlert(BASE_INPUT, fake);
    expect(result.aiGenerated).toBe(false);
  });

  it("rejects and falls back when the summary contains unhedged banned copy", async () => {
    const fake = async () =>
      JSON.stringify({ summary: "This is guaranteed to affect your product.", dollar_impact: null });
    const result = await summarizeEventForAlert(BASE_INPUT, fake);
    expect(result.aiGenerated).toBe(false);
    expect(result.summary).toBe(BASE_INPUT.rawSummary);
  });

  it("rejects and falls back when the dollar_impact contains unhedged banned copy", async () => {
    const fake = async () =>
      JSON.stringify({ summary: "Rates changed.", dollar_impact: "we ensure compliance with the new rate" });
    const result = await summarizeEventForAlert(
      { ...BASE_INPUT, eventType: "duty_change", annualImportValue: 50_000 },
      fake,
    );
    expect(result.aiGenerated).toBe(false);
  });

  it("allows banned words when hedged with a negation", async () => {
    const fake = async () =>
      JSON.stringify({ summary: "This is not guaranteed to affect your product.", dollar_impact: null });
    const result = await summarizeEventForAlert(BASE_INPUT, fake);
    expect(result.aiGenerated).toBe(true);
  });
});
