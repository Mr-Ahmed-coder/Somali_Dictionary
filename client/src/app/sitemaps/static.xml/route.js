import { getCategories } from "@/lib/api";
import { sitemapUrl, renderUrlSet, xmlResponse } from "@/lib/sitemap";

export const revalidate = 3600;

const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
const publicPages = ["/", "/words", "/categories", "/about"];

export async function GET() {
  const result = await getCategories().catch(() => ({ items: [] }));
  const categoryPaths = (result.items || [])
    .filter((category) => category.slug && Number(category.wordCount || 0) > 0)
    .map((category) => `/categories/${encodeURIComponent(category.slug)}`);
  const entries = [
    ...publicPages.map((path) => ({ url: sitemapUrl(path) })),
    ...alphabet.map((letter) => ({ url: sitemapUrl(`/words/${letter}`) })),
    ...categoryPaths.map((path) => ({ url: sitemapUrl(path) }))
  ];

  return xmlResponse(renderUrlSet(entries));
}
