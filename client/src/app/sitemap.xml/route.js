import { getSeoWords } from "@/lib/api";
import {
  renderSitemapIndex,
  sitemapUrl,
  WORDS_PER_SITEMAP,
  xmlResponse
} from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET() {
  const result = await getSeoWords({ page: 1, limit: 1 }).catch(() => ({
    pagination: { total: 0 }
  }));
  const totalWords = Number(result.pagination?.total || 0);
  const wordSitemapCount = Math.ceil(totalWords / WORDS_PER_SITEMAP);
  const sitemapUrls = [sitemapUrl("/sitemaps/static.xml")];

  for (let page = 1; page <= wordSitemapCount; page += 1) {
    sitemapUrls.push(sitemapUrl(`/sitemaps/words/${page}.xml`));
  }

  return xmlResponse(renderSitemapIndex(sitemapUrls));
}
