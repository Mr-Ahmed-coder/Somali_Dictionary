import { API_URL } from "./config";

export { API_URL };

export async function apiFetch(path, options = {}) {
  const { next, cache, headers, ...fetchOptions } = options;
  const timeoutSignal =
    typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined;
  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    ...(cache ? { cache } : {}),
    ...(next ? { next } : {}),
    signal: fetchOptions.signal || timeoutSignal,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {})
    }
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.message || `API request failed: ${response.status}`);
    error.status = response.status;
    error.details = errorBody.details;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
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
    cache: "no-store"
  });
}

export async function trackPopularSearch(wordId) {
  return apiFetch("/analytics/popular-search", {
    method: "POST",
    body: JSON.stringify({ wordId }),
    cache: "no-store",
    keepalive: true
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

export async function getCategoryBySlug(slug, options = {}) {
  return apiFetch(`/categories/${encodeURIComponent(slug)}`, {
    cache: "no-store",
    ...options
  });
}

export async function getWords() {
  return apiFetch("/words", { next: { revalidate: 60 } });
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
