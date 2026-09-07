import "server-only";
import { apiFetch } from "@/lib/api";

export async function getSeoWords({ page = 1, limit = 1000 } = {}) {
  const token = process.env.SEO_INDEX_TOKEN?.trim();
  if (!token) throw new Error("SEO_INDEX_TOKEN is required for sitemap generation");

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiFetch(`/words/seo-index?${params.toString()}`, {
    next: { revalidate: 3600 },
    headers: { "X-SEO-Index-Token": token }
  });
}
