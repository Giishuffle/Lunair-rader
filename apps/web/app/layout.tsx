import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { appUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });

const DESCRIPTION =
  "Describe your product once. See every US import requirement that appears to apply, and get pinged the moment anything changes. Informational radar, never legal advice.";

export const metadata: Metadata = {
  // Makes every relative image and canonical resolve against the real origin,
  // which is what the opengraph-image route needs to produce absolute URLs.
  metadataBase: new URL(appUrl()),
  title: {
    default: "Lunair World - your radar for US import rules",
    // Page titles read "Pricing - Lunair World" without repeating it by hand.
    template: "%s - Lunair World",
  },
  description: DESCRIPTION,
  applicationName: "Lunair World",
  openGraph: {
    type: "website",
    siteName: "Lunair World",
    title: "Lunair World - your radar for US import rules",
    description: DESCRIPTION,
    url: appUrl(),
  },
  twitter: {
    card: "summary_large_image",
    title: "Lunair World - your radar for US import rules",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
