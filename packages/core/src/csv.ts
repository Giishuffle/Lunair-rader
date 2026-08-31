/**
 * CSV serialisation.
 *
 * Kept here rather than in the route because the escaping is the part that can
 * be quietly wrong, and quietly-wrong escaping in a file someone opens in Excel
 * is both a data bug and, with a leading formula character, a security one.
 */

/** Characters Excel and Sheets treat as the start of a formula. */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

/**
 * One CSV field.
 *
 * Two separate jobs. Quoting handles commas, quotes and newlines so the file
 * parses. Prefixing a formula character with a single quote stops a spreadsheet
 * executing a cell that came from user input - a product named "=cmd|..." is
 * otherwise a live formula in the recipient's spreadsheet.
 */
export function csvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (FORMULA_LEAD.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export function csvRow(cells: unknown[]): string {
  return cells.map(csvField).join(",");
}

/**
 * A full document. Excel needs the BOM to read UTF-8, and CRLF line endings are
 * what the CSV spec actually calls for.
 */
export function toCsv(header: string[], rows: unknown[][]): string {
  return "﻿" + [csvRow(header), ...rows.map(csvRow)].join("\r\n") + "\r\n";
}

/** Safe filename for a Content-Disposition header. */
export function csvFilename(base: string, isoDate: string): string {
  const clean = base.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "export";
  return `${clean}-${isoDate}.csv`;
}
