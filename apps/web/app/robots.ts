import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Signed-in surfaces and internal previews. /api is disallowed to keep
      // crawlers off endpoints that do real work, not as an access control.
      disallow: ["/app/", "/api/", "/demo/", "/signin/", "/unsubscribe"],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
