import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { productQuota } from "@/lib/products";
import { PassportWizard } from "./wizard";

export const metadata: Metadata = { title: "Product Passport - Lunair World", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NewPassportPage() {
  const quota = await productQuota();
  if (!quota.canAddMore) redirect("/app");
  return <PassportWizard />;
}
