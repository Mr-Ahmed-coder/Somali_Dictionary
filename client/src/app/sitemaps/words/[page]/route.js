import { getSeoWords } from "@/lib/api";
import { getWordPath } from "@/lib/seo";
import {
  renderUrlSet,
  sitemapUrl,
  WORDS_PER_SITEMAP,
  xmlResponse
} from "@/lib/sitemap";

export const revalidate = 3600;

export async function GET(_request, { params }) {
  const { page: rawPage } = await params;
  const page = Number(String(rawPage).replace(/\.xml$/i, ""));

  if (!Number.isInteger(page) || page < 1) {
    return xmlResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><error>Not found</error>", 404);
  }

  const result = await getSeoWords({ page, limit: WORDS_PER_SITEMAP }).catch(() => null);

  if (!result || (page > 1 && (result.items || []).length === 0)) {
    return xmlResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><error>Not found</error>", 404);
  }

  const entries = (result.items || []).map((word) => ({
    url: sitemapUrl(getWordPath(word)),
    lastModified: word.updatedAt
  }));

  return xmlResponse(renderUrlSet(entries));
}
