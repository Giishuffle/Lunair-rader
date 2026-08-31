import { describe, expect, it } from "vitest";
import { csvField, csvRow, toCsv, csvFilename } from "../src/csv.js";

describe("csvField", () => {
  it("passes ordinary values through untouched", () => {
    expect(csvField("Night light")).toBe("Night light");
    expect(csvField(1200)).toBe("1200");
  });

  it("renders null and undefined as empty, not as the words", () => {
    expect(csvField(null)).toBe("");
    expect(csvField(undefined)).toBe("");
  });

  it("quotes commas, quotes and newlines so the file still parses", () => {
    expect(csvField("Toys, games")).toBe('"Toys, games"');
    expect(csvField('He said "hi"')).toBe('"He said ""hi"""');
    expect(csvField("line one\nline two")).toBe('"line one\nline two"');
  });

  /**
   * Product names come from the seller, and the file is opened in Excel. A cell
   * starting with = is executed there, so a name like =HYPERLINK(...) would run
   * in whoever opens the export.
   */
  it("defuses spreadsheet formulas in user-supplied text", () => {
    expect(csvField("=1+1")).toBe("'=1+1");
    expect(csvField("+41 555")).toBe("'+41 555");
    expect(csvField("-lead")).toBe("'-lead");
    expect(csvField("@handle")).toBe("'@handle");
    // Still quoted when it also contains a comma.
    expect(csvField("=SUM(A1,A2)")).toBe('"\'=SUM(A1,A2)"');
  });

  it("leaves a formula character that is not leading alone", () => {
    expect(csvField("A=B")).toBe("A=B");
  });
});

describe("toCsv", () => {
  it("writes a BOM and CRLF endings so Excel reads UTF-8 correctly", () => {
    const out = toCsv(["a", "b"], [[1, 2]]);
    expect(out.startsWith("﻿")).toBe(true);
    expect(out).toContain("\r\n");
    expect(out).toBe("﻿a,b\r\n1,2\r\n");
  });

  it("handles an empty result set without producing a broken file", () => {
    expect(toCsv(["a", "b"], [])).toBe("﻿a,b\r\n");
  });
});

describe("csvRow", () => {
  it("joins fields with the escaping applied per cell", () => {
    expect(csvRow(["plain", "with, comma", null])).toBe('plain,"with, comma",');
  });
});

describe("csvFilename", () => {
  it("builds a safe filename", () => {
    expect(csvFilename("lunair-products", "2026-08-29")).toBe("lunair-products-2026-08-29.csv");
  });

  it("strips anything that could break the Content-Disposition header", () => {
    expect(csvFilename('bad"name;here', "2026-08-29")).toBe("bad-name-here-2026-08-29.csv");
    expect(csvFilename("../../etc/passwd", "2026-08-29")).toBe("etc-passwd-2026-08-29.csv");
  });

  it("falls back rather than producing a nameless file", () => {
    expect(csvFilename("!!!", "2026-08-29")).toBe("export-2026-08-29.csv");
  });
});
