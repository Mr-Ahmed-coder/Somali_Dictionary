import { API_URL } from "./config";
import { readJsonResponse, reliableFetch } from "./reliableFetch";

export { API_URL };

export async function apiFetch(path, options = {}) {
  const { next, cache, headers, retries, timeoutMs, ...fetchOptions } = options;
  const method = (fetchOptions.method || "GET").toUpperCase();
  const hasJsonBody = fetchOptions.body !== undefined && method !== "GET" && method !== "HEAD";
  const response = await reliableFetch(`${API_URL}${path}`, {
    ...fetchOptions,
    ...(cache ? { cache } : {}),
    ...(next ? { next } : {}),
    retries: retries ?? (method === "GET" ? 1 : 0),
    timeoutMs: timeoutMs ?? (method === "GET" ? 30000 : 10000),
    headers: {
      ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
      ...(headers || {})
    }
  });

  return readJsonResponse(response);
}

export async function searchWords({ query, direction = "auto", page = 1, limit = 12 }) {
  const params = new URLSearchParams({
    q: query.trim(),
    direction,
    page: String(page),
    limit: String(limit)
  });

  return apiFetch(`/words/search?${params.toString()}`, { cache: "no-store" });
}

export async function getSearchSuggestions({ query, limit = 8, signal }) {
  const params = new URLSearchParams({
    q: query.trim(),
    limit: String(limit)
  });

  return apiFetch(`/words/suggestions?${params.toString()}`, { cache: "no-store", signal });
}

export async function trackMissingSearch(query) {
  return apiFetch("/analytics/missing-search", {
    method: "POST",
    body: JSON.stringify({ query: query.trim() }),
    cache: "no-store",
    timeoutMs: 4000
  });
}

export async function trackPopularSearch(wordId) {
  return apiFetch("/analytics/popular-search", {
    method: "POST",
    body: JSON.stringify({ wordId }),
    cache: "no-store",
    keepalive: true,
    timeoutMs: 4000
  });
}

export async function submitWordSuggestion(payload) {
  return apiFetch("/suggestions", {
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store"
  });
}

export async function getCategories() {
  return apiFetch("/categories", { next: { revalidate: 60 } });
}

export async function getCategoryBySlug(slug, { page = 1, limit = 50, ...options } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiFetch(`/categories/${encodeURIComponent(slug)}?${params.toString()}`, {
    next: { revalidate: 300 },
    ...options
  });
}

export async function getWords({ page = 1, limit = 24, letter, sort = "alphabetical" } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort
  });

  if (letter) params.set("letter", letter);
  return apiFetch(`/words?${params.toString()}`, { next: { revalidate: 300 } });
}

export async function getWordOfTheDay({ date, signal }) {
  const params = new URLSearchParams({ date });
  return apiFetch(`/words/word-of-the-day?${params.toString()}`, {
    cache: "no-store",
    signal
  });
}

export async function getWordById(id) {
  const result = await apiFetch(`/words/${encodeURIComponent(id)}`, { cache: "no-store" });
  return result.item || result.word || result.data || result;
}

export async function getWordByIdentifier(identifier) {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
  const path = isObjectId
    ? `/words/${encodeURIComponent(identifier)}`
    : `/words/lookup/${encodeURIComponent(identifier)}`;
  const result = await apiFetch(path, isObjectId ? { cache: "no-store" } : { next: { revalidate: 300 } });
  return result.item || result.word || result.data || result;
}
