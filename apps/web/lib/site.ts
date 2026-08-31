/**
 * The site's own canonical origin.
 *
 * Falls back to the production domain rather than localhost: these values end up
 * in robots.txt, the sitemap and OG tags, where a localhost URL that escaped
 * into a crawler or a shared link is worse than being slightly wrong in dev.
 */
export function appUrl(): string {
  return (process.env.APP_URL ?? "https://www.lunair-world.com").replace(/\/+$/, "");
}
