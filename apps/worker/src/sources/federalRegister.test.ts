import { describe, expect, it } from "vitest";
import { FederalRegisterAdapter, toSourceDoc } from "./federalRegister.js";

const fixtureDoc = {
  document_number: "2026-12345",
  title: "Modification of Section 301 Action: China's Acts, Policies, and Practices",
  type: "Notice",
  abstract: "USTR is modifying the action in this Section 301 investigation.",
  html_url: "https://www.federalregister.gov/documents/2026/08/20/2026-12345/example",
  pdf_url: "https://www.govinfo.gov/content/pkg/FR-2026-08-20/pdf/2026-12345.pdf",
  publication_date: "2026-08-20",
  agencies: [{ name: "Office of the United States Trade Representative" }],
};

describe("FederalRegisterAdapter", () => {
  it("normalizes documents to SourceDocInput", () => {
    const doc = toSourceDoc(fixtureDoc);
    expect(doc.source).toBe("federal_register");
    expect(doc.externalId).toBe("2026-12345");
    expect(doc.publishedAt?.toISOString().slice(0, 10)).toBe("2026-08-20");
    expect(doc.url).toContain("federalregister.gov");
  });

  it("fetches and paginates", async () => {
    const pages = [
      { count: 2, next_page_url: "https://example.test/page2", results: [fixtureDoc] },
      { count: 2, next_page_url: null, results: [{ ...fixtureDoc, document_number: "2026-99999" }] },
    ];
    let call = 0;
    const fakeFetch = (async () => {
      const body = pages[call];
      call += 1;
      return new Response(JSON.stringify(body), { status: 200 });
    }) as typeof fetch;

    const adapter = new FederalRegisterAdapter(fakeFetch);
    const docs = await adapter.fetchSince(new Date("2026-08-15"));
    expect(docs).toHaveLength(2);
    expect(new Set(docs.map((d) => d.externalId)).size).toBe(2);
  }, 15000);

  it("throws on HTTP errors so source_health can record the failure", async () => {
    const fakeFetch = (async () => new Response("nope", { status: 500 })) as typeof fetch;
    const adapter = new FederalRegisterAdapter(fakeFetch);
    await expect(adapter.fetchSince(null)).rejects.toThrow("federal_register HTTP 500");
  });
});
