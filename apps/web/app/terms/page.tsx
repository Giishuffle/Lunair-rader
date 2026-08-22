import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Terms of Service - Lunair World",
  description: "The terms that govern use of Lunair World, an informational US import-compliance monitoring service.",
};

export default function TermsPage() {
  return <LegalPage slug="terms-of-service" />;
}
