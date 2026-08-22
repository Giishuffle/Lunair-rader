import { readFileSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";

/**
 * Legal pages render from docs/legal/*.md so there is exactly one source of
 * truth: the file the lawyer reviews is the file users read.
 *
 * Two kinds of internal annotation are stripped before publishing:
 *  - the "STATUS: DRAFT PENDING ATTORNEY REVIEW" blockquote at the top
 *  - inline **[COUNSEL: ...]** notes addressed to the attorney
 * They stay in the repo (that's who they're for) and never reach the public page.
 */

const LEGAL_DIR = join(process.cwd(), "..", "..", "docs", "legal");

export type LegalSlug = "terms-of-service" | "privacy-policy";

export function stripCounselNotes(markdown: string): string {
  return (
    markdown
      // leading "> STATUS: DRAFT ..." blockquote, however many lines it runs
      .replace(/^>[^\n]*\n(?:>[^\n]*\n)*/gm, (block) => (/STATUS:\s*DRAFT/i.test(block) ? "" : block))
      // inline **[COUNSEL: ...]** notes, including ones spanning line breaks
      .replace(/\*\*\[COUNSEL:[\s\S]*?\]\*\*/g, "")
      // tidy blank runs and any now-empty table cells left behind
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

export interface LegalDoc {
  html: string;
  lastUpdated: string;
}

export function loadLegalDoc(slug: LegalSlug): LegalDoc {
  const raw = readFileSync(join(LEGAL_DIR, `${slug}.md`), "utf8");
  const cleaned = stripCounselNotes(raw);
  const lastUpdated = /\*\*Last updated:\*\*\s*(.+)/.exec(cleaned)?.[1]?.trim() ?? "";
  const html = marked
    .parse(cleaned, { async: false })
    // tables must scroll inside their own container, never the page body
    .replace(/<table>/g, '<div class="legal-table-wrap"><table>')
    .replace(/<\/table>/g, "</table></div>");
  return { html, lastUpdated };
}
