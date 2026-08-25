import { describe, expect, it } from "vitest";
import {
  parseNewsletterDraft,
  renderIssueMarkdown,
  renderIssueHtml,
  renderIssueText,
  type NewsletterDraft,
} from "../src/newsletter/issue.js";
import {
  unsubscribeToken,
  verifyUnsubscribeToken,
  approveToken,
  verifyApproveToken,
} from "../src/newsletter/token.js";
import * as tokens from "../src/newsletter/token.js";

const SECRET = "test-secret-value";

const DRAFT: NewsletterDraft = {
  subject: "Three tariff moves worth a look",
  intro: "A quieter week, but one rate change matters.",
  items: [
    {
      headline: "Lithium battery packaging rules amended",
      body: "49 CFR 173 was updated. This may affect you if you import anything with a battery.",
      sourceTitle: "eCFR: 49 CFR 173",
      sourceUrl: "https://www.ecfr.gov/current/title-49/part-173",
    },
  ],
};

describe("parseNewsletterDraft", () => {
  it("parses a well-formed draft", () => {
    const parsed = parseNewsletterDraft(JSON.stringify(DRAFT));
    expect(parsed).toEqual(DRAFT);
  });

  it("strips a markdown fence the model was told not to add", () => {
    const parsed = parseNewsletterDraft("```json\n" + JSON.stringify(DRAFT) + "\n```");
    expect(parsed?.subject).toBe(DRAFT.subject);
  });

  it("returns null when there are no usable items", () => {
    expect(parseNewsletterDraft(JSON.stringify({ subject: "s", intro: "i", items: [] }))).toBeNull();
  });

  it("returns null on unparseable text", () => {
    expect(parseNewsletterDraft("not json")).toBeNull();
  });

  it("drops an item whose source URL is not http(s)", () => {
    const bad = {
      ...DRAFT,
      items: [{ ...DRAFT.items[0], sourceUrl: "javascript:alert(1)" }],
    };
    expect(parseNewsletterDraft(JSON.stringify(bad))).toBeNull();
  });

  it("drops an item missing a headline but keeps the good ones", () => {
    const mixed = {
      ...DRAFT,
      items: [{ ...DRAFT.items[0], headline: "" }, DRAFT.items[0]],
    };
    expect(parseNewsletterDraft(JSON.stringify(mixed))?.items).toHaveLength(1);
  });

  it("falls back to the URL when sourceTitle is blank", () => {
    const noTitle = { ...DRAFT, items: [{ ...DRAFT.items[0], sourceTitle: "" }] };
    expect(parseNewsletterDraft(JSON.stringify(noTitle))?.items[0]!.sourceTitle).toBe(DRAFT.items[0]!.sourceUrl);
  });
});

describe("rendering", () => {
  const opts = { unsubscribeUrl: "https://example.com/unsub", appUrl: "https://www.lunair-world.com" };

  it("renders markdown with the subject and each item", () => {
    const md = renderIssueMarkdown(DRAFT);
    expect(md).toContain("# Three tariff moves worth a look");
    expect(md).toContain("## Lithium battery packaging rules amended");
    expect(md).toContain(DRAFT.items[0]!.sourceUrl);
  });

  it("escapes HTML in model-authored text", () => {
    const nasty: NewsletterDraft = {
      ...DRAFT,
      items: [{ ...DRAFT.items[0]!, headline: '<script>alert("x")</script>' }],
    };
    const html = renderIssueHtml(nasty, opts);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("includes the unsubscribe link in both html and text", () => {
    expect(renderIssueHtml(DRAFT, opts)).toContain(opts.unsubscribeUrl);
    expect(renderIssueText(DRAFT, opts)).toContain(opts.unsubscribeUrl);
  });
});

describe("signed tokens", () => {
  it("verifies a token it just issued", () => {
    const t = unsubscribeToken("Person@Example.com", SECRET);
    expect(verifyUnsubscribeToken("Person@Example.com", t, SECRET)).toBe(true);
  });

  it("ignores address casing so a rewritten link still works", () => {
    const t = unsubscribeToken("person@example.com", SECRET);
    expect(verifyUnsubscribeToken("PERSON@EXAMPLE.COM", t, SECRET)).toBe(true);
  });

  it("rejects a token for a different address", () => {
    const t = unsubscribeToken("a@example.com", SECRET);
    expect(verifyUnsubscribeToken("b@example.com", t, SECRET)).toBe(false);
  });

  it("rejects a token signed with a different secret", () => {
    const t = unsubscribeToken("a@example.com", SECRET);
    expect(verifyUnsubscribeToken("a@example.com", t, "other-secret")).toBe(false);
  });

  it("rejects a truncated token without throwing", () => {
    const t = unsubscribeToken("a@example.com", SECRET);
    expect(verifyUnsubscribeToken("a@example.com", t.slice(0, 8), SECRET)).toBe(false);
  });

  it("does not let an unsubscribe token approve an issue", () => {
    const t = tokens.issueToken(tokens.UNSUBSCRIBE_PURPOSE, "issue-1", SECRET);
    expect(verifyApproveToken("issue-1", t, SECRET)).toBe(false);
  });

  it("verifies an approval token for its own issue only", () => {
    const t = approveToken("issue-1", SECRET);
    expect(verifyApproveToken("issue-1", t, SECRET)).toBe(true);
    expect(verifyApproveToken("issue-2", t, SECRET)).toBe(false);
  });
});

describe("telegram deep-link payload", () => {
  const USER = "3f2a1b4c-5d6e-4f70-8a91-b2c3d4e5f607";

  it("round-trips the user id", () => {
    const payload = tokens.telegramLinkPayload(USER, SECRET);
    expect(tokens.userIdFromTelegramPayload(payload, SECRET)).toBe(USER);
  });

  it("fits Telegram's 64-char limit and its allowed alphabet", () => {
    const payload = tokens.telegramLinkPayload(USER, SECRET);
    expect(payload.length).toBeLessThanOrEqual(64);
    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("rejects a payload signed with another secret", () => {
    const payload = tokens.telegramLinkPayload(USER, SECRET);
    expect(tokens.userIdFromTelegramPayload(payload, "other")).toBeNull();
  });

  it("rejects a tampered user id", () => {
    const payload = tokens.telegramLinkPayload(USER, SECRET);
    const [, sig] = payload.split("_");
    const other = "ffffffffffffffffffffffffffffffff";
    expect(tokens.userIdFromTelegramPayload(`${other}_${sig}`, SECRET)).toBeNull();
  });

  it("rejects junk without throwing", () => {
    for (const bad of ["", "_", "nothex_abcdef", "abc", "____"]) {
      expect(tokens.userIdFromTelegramPayload(bad, SECRET)).toBeNull();
    }
  });
});
