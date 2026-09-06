import { SITE_URL } from "@/lib/seo";

export const WORDS_PER_SITEMAP = 10000;

export function xmlResponse(xml, status = 200) {
  return new Response(xml, {
    status,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}

export function sitemapUrl(path) {
  return `${SITE_URL}${path}`;
}

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderUrlSet(entries) {
  const urls = entries
    .map(
      ({ url, lastModified }) => `  <url>\n    <loc>${escapeXml(url)}</loc>${
        lastModified ? `\n    <lastmod>${escapeXml(new Date(lastModified).toISOString())}</lastmod>` : ""
      }\n  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export function renderSitemapIndex(urls) {
  const sitemaps = urls
    .map((url) => `  <sitemap>\n    <loc>${escapeXml(url)}</loc>\n  </sitemap>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps}\n</sitemapindex>`;
}
