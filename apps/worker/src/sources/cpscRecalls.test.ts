import { describe, expect, it } from "vitest";
import { CpscRecallsAdapter, toSourceDoc } from "./cpscRecalls.js";

const fixture = {
  RecallID: 10937,
  RecallNumber: "26716",
  RecallDate: "2026-08-20T00:00:00",
  Description: "This recall involves the CCM Hybrid Hockey Visors...",
  URL: "https://www.cpsc.gov/Recalls/2026/example",
  Title: "CCM Recalls Hybrid Hockey Visors Due to Impact Injury Hazard",
  Products: [{ Name: "Hockey visor", Type: "Sports equipment" }],
  Hazards: [{ Name: "Impact injury" }],
};

describe("CpscRecallsAdapter", () => {
  it("normalizes recalls with RecallID as the dedupe key", () => {
    const doc = toSourceDoc(fixture);
    expect(doc.source).toBe("cpsc_recalls");
    expect(doc.externalId).toBe("10937");
    expect(doc.publishedAt?.getFullYear()).toBe(2026);
    expect(doc.title).toContain("CCM");
  });

  it("passes RecallDateStart and parses the array response", async () => {
    let requested = "";
    const fakeFetch = (async (url: RequestInfo | URL) => {
      requested = String(url);
      return new Response(JSON.stringify([fixture]), { status: 200 });
    }) as typeof fetch;
    const adapter = new CpscRecallsAdapter(fakeFetch);
    const docs = await adapter.fetchSince(new Date("2026-07-01"));
    expect(requested).toContain("RecallDateStart=2026-07-01");
    expect(docs).toHaveLength(1);
  });
});
