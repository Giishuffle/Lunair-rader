import type { Metadata } from "next";
import { CrossRefDemo } from "./crossref-demo";

export const metadata: Metadata = {
  title: "Passport cross-reference - Lunair World",
  robots: { index: false, follow: false },
};

/**
 * Internal demo of the Passport -> Radar handoff. Lets the team drive the
 * cross-reference engine against live CBP data before the real wizard exists.
 * Not linked from anywhere public and marked noindex.
 */
export default function PassportDemoPage() {
  return <CrossRefDemo />;
}
