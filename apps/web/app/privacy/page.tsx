import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy - Lunair World",
  description: "What personal information Lunair World collects, how it is used, and the choices you have.",
};

export default function PrivacyPage() {
  return <LegalPage slug="privacy-policy" />;
}
