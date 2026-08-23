import { describe, expect, it } from "vitest";
import {
  EcfrClient,
  citationLabel,
  citationUrl,
  latestAmendmentOf,
  partKey,
  sectionsAmendedSince,
  type SectionVersion,
} from "../src/sources/ecfr.js";

const sec = (identifier: string, amendmentDate: string): SectionVersion => ({
  identifier,
  name: `§ ${identifier}`,
  amendmentDate,
  issueDate: amendmentDate,
});

describe("citations", () => {
  it("renders a readable label and a real ecfr URL", () => {
    const c = { title: 16, part: "1110", label: "Certificates of Compliance" };
    expect(citationLabel(c)).toBe("16 CFR Part 1110 - Certificates of Compliance");
    expect(citationUrl(c)).toBe("https://www.ecfr.gov/current/title-16/part-1110");
    expect(partKey(c)).toBe("title-16/part-1110");
  });
});

describe("latestAmendmentOf", () => {
  it("takes the newest date across sections", () => {
    expect(latestAmendmentOf([sec("1.1", "2016-10-02"), sec("1.2", "2026-07-08")])).toBe("2026-07-08");
  });
  it("returns null for an empty part", () => {
    expect(latestAmendmentOf([])).toBeNull();
  });
});

describe("sectionsAmendedSince", () => {
  it("returns only sections newer than the baseline, newest first", () => {
    const snap = { title: 49, part: "173", sections: [sec("173.6", "2026-08-19"), sec("173.5", "2020-01-01")], latestAmendment: "2026-08-19" };
    expect(sectionsAmendedSince(snap, "2026-01-01").map((s) => s.identifier)).toEqual(["173.6"]);
  });

  it("collapses repeated versions of one section to its newest", () => {
    // eCFR returns a row per version; 173.7 amended twice must appear once.
    const snap = {
      title: 49, part: "173",
      sections: [sec("173.7", "2026-03-01"), sec("173.7", "2026-08-19"), sec("173.64", "2026-08-19")],
      latestAmendment: "2026-08-19",
    };
    const out = sectionsAmendedSince(snap, "2026-01-01");
    expect(out.map((s) => s.identifier).sort()).toEqual(["173.64", "173.7"]);
    expect(out.find((s) => s.identifier === "173.7")?.amendmentDate).toBe("2026-08-19");
  });

  it("returns nothing without a baseline, so a first run never fires a false change", () => {
    const snap = { title: 16, part: "1110", sections: [sec("1110.1", "2026-07-08")], latestAmendment: "2026-07-08" };
    expect(sectionsAmendedSince(snap, null)).toEqual([]);
  });
});

describe("EcfrClient.partSnapshot", () => {
  const body = {
    content_versions: [
      { identifier: "1110.1", name: "§ 1110.1  Purpose and scope.", amendment_date: "2026-07-08", issue_date: "2026-07-08" },
      { identifier: "1110.11", name: "§ 1110.11  Content.", amendment_date: "2016-10-02", issue_date: "2016-12-22" },
      { identifier: "1110.99", name: "no date" },
    ],
  };

  it("parses versions and computes the latest amendment", async () => {
    const fake = (async () => new Response(JSON.stringify(body), { status: 200 })) as typeof fetch;
    const snap = await new EcfrClient(fake).partSnapshot({ title: 16, part: "1110" });
    expect(snap.sections).toHaveLength(2); // the undated row is dropped
    expect(snap.latestAmendment).toBe("2026-07-08");
  });

  it("throws with the citation named, so source_health records something useful", async () => {
    const fake = (async () => new Response("nope", { status: 500 })) as typeof fetch;
    await expect(new EcfrClient(fake).partSnapshot({ title: 16, part: "1110" })).rejects.toThrow(
      /ecfr HTTP 500 for 16 CFR Part 1110/,
    );
  });
});
