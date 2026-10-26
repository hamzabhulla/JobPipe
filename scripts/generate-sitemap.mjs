/**
 * Regenerate public/sitemap.xml from the list of indexable pages.
 *
 * Only static, public pages are listed. /app is NOT listed: it is a
 * private dashboard with a noindex meta tag (see robots.txt for why
 * it is also not disallowed there).
 *
 * Run: npm run generate:sitemap
 * Also runs automatically as part of `npm run build`.
 *
 * SITE_URL is duplicated here on purpose: this script runs in Node
 * before the Vite build and cannot import src/lib/site.ts (TypeScript).
 * If the placeholder domain changes, change it in BOTH places:
 *   - src/lib/site.ts (SITE_URL)
 *   - this file (SITE_URL below)
 * and in the static HTML canonical/OG URLs.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://jobpipe.vercel.app";

const PAGES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/privacy", changefreq: "monthly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/changelog", changefreq: "monthly", priority: "0.6" },
];

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildSitemap(today = new Date().toISOString().slice(0, 10)) {
  const urls = PAGES.map(
    (page) =>
      `  <url>\n    <loc>${escapeXml(SITE_URL + page.path)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "sitemap.xml"), buildSitemap());
console.log(`Wrote public/sitemap.xml (${PAGES.length} URLs)`);
