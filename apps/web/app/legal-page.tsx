import Link from "next/link";
import { loadLegalDoc, type LegalSlug } from "@/lib/legal";
import "./legal.css";

/** Shared shell for /terms and /privacy. */
export function LegalPage({ slug }: { slug: LegalSlug }) {
  const { html, lastUpdated } = loadLegalDoc(slug);

  return (
    <main className="legal">
      <p className="legal-notice">
        These terms are in effect for the Lunair World beta. We are a small team and we
        review this wording with counsel as the product grows - if anything here is
        unclear, email <a href="mailto:guy@wershuffle.com">guy@wershuffle.com</a> and we
        will explain it in plain English.
      </p>

      {/* Content is our own markdown from docs/legal, not user input. */}
      <div dangerouslySetInnerHTML={{ __html: html }} />

      <div className="legal-footer">
        <Link href="/">Home</Link>
        <Link href="/terms">Terms of Service</Link>
        <Link href="/privacy">Privacy Policy</Link>
        {lastUpdated && <span>Last updated {lastUpdated}</span>}
      </div>
    </main>
  );
}
