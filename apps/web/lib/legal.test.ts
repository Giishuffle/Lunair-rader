import { describe, expect, it } from "vitest";
import { stripCounselNotes } from "./legal";
import { loadLegalDoc } from "./legal";
import { findUnhedgedBannedCopy } from "@lunair/core";

describe("stripCounselNotes", () => {
  it("removes the draft-status blockquote", () => {
    const md = "> **STATUS: DRAFT PENDING ATTORNEY REVIEW.** Not reviewed.\n> Second line.\n\n# Terms\n\nBody.";
    const out = stripCounselNotes(md);
    expect(out).not.toContain("DRAFT");
    expect(out).not.toContain("Not reviewed");
    expect(out).toContain("# Terms");
  });

  it("removes inline counsel notes, including multi-line ones", () => {
    const md = "We cap liability. **[COUNSEL: confirm\nthis is enforceable.]** The cap is 12 months.";
    const out = stripCounselNotes(md);
    expect(out).not.toContain("COUNSEL");
    expect(out).not.toContain("enforceable");
    expect(out).toContain("We cap liability.");
    expect(out).toContain("The cap is 12 months.");
  });

  it("keeps ordinary blockquotes that are not status notes", () => {
    const md = "> A normal quote.\n\nBody.";
    expect(stripCounselNotes(md)).toContain("A normal quote.");
  });
});

describe("published legal pages", () => {
  const slugs = ["terms-of-service", "privacy-policy"] as const;

  it.each(slugs)("%s renders without internal annotations", (slug) => {
    const { html } = loadLegalDoc(slug);
    expect(html).not.toContain("COUNSEL");
    expect(html).not.toMatch(/STATUS:\s*DRAFT/i);
    expect(html.length).toBeGreaterThan(2000);
  });

  it.each(slugs)("%s never makes a banned claim", (slug) => {
    const { html } = loadLegalDoc(slug);
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    // Legal docs must be able to say "this is NOT legal advice", so banned
    // phrases are allowed inside a negation but never as an affirmative claim.
    expect(findUnhedgedBannedCopy(text)).toBeNull();
  });

  it.each(slugs)("%s still declares a last-updated date", (slug) => {
    expect(loadLegalDoc(slug).lastUpdated).toBeTruthy();
  });
});
