import { API_URL } from "./config";
import { readJsonResponse, reliableFetch } from "./reliableFetch";

export async function adminFetch(path, options = {}) {
  const { headers, retries, timeoutMs, ...fetchOptions } = options;
  const isFormData = typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;
  const method = (fetchOptions.method || "GET").toUpperCase();
  const hasJsonBody = !isFormData && fetchOptions.body !== undefined && method !== "GET" && method !== "HEAD";
  const response = await reliableFetch(`${API_URL}${path}`, {
    ...fetchOptions,
    retries: retries ?? (method === "GET" ? 1 : 0),
    timeoutMs: timeoutMs ?? (method === "GET" ? 30000 : 10000),
    headers: {
      ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
      ...(headers || {})
    },
    credentials: "include",
    cache: "no-store"
  });

  return readJsonResponse(response, "Request failed");
}

export async function loginAdmin({ email, password }) {
  return adminFetch("/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    timeoutMs: 65000
  });
}

export async function logoutAdmin() {
  const response = await reliableFetch(`${API_URL}/admin/logout`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    timeoutMs: 10000,
    retries: 0
  });

  if (!response.ok && response.status !== 401) {
    return readJsonResponse(response, "Unable to sign out");
  }

  return null;
}

export function getAdminProfile() {
  return adminFetch("/admin/me");
}

export function getAdminStats() {
  return adminFetch("/admin/stats");
}

export function getAdminMissingSearches({
  page = 1,
  limit = 25,
  q = "",
  status = "missing",
  sort = "most-searched",
  signal
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status,
    sort
  });

  if (q.trim()) params.set("q", q.trim());
  return adminFetch(`/admin/missing-searches?${params.toString()}`, { signal });
}

export function resolveAdminMissingSearch(id) {
  return adminFetch(`/admin/missing-searches/${encodeURIComponent(id)}/resolve`, {
    method: "PATCH"
  });
}

export function reopenAdminMissingSearch(id) {
  return adminFetch(`/admin/missing-searches/${encodeURIComponent(id)}/reopen`, {
    method: "PATCH"
  });
}

export function getAdminPopularSearches({
  page = 1,
  limit = 25,
  q = "",
  sort = "most-searched",
  signal
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort
  });

  if (q.trim()) params.set("q", q.trim());
  return adminFetch(`/admin/popular-searches?${params.toString()}`, { signal });
}

export function getAdminWordSuggestions({
  page = 1,
  limit = 25,
  q = "",
  status = "pending",
  type = "all",
  sort = "newest",
  signal
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status,
    type,
    sort
  });

  if (q.trim()) params.set("q", q.trim());
  return adminFetch(`/admin/suggestions?${params.toString()}`, { signal });
}

export function getAdminWordSuggestion(id, { signal } = {}) {
  return adminFetch(`/admin/suggestions/${encodeURIComponent(id)}`, { signal });
}

export function updateAdminWordSuggestionStatus(id, status) {
  return adminFetch(`/admin/suggestions/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function createWordFromAdminSuggestion(id, payload) {
  return adminFetch(`/admin/suggestions/${encodeURIComponent(id)}/create-word`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getAdminCategories() {
  return adminFetch("/categories");
}

export function getAdminWords({
  page,
  limit,
  q,
  category = "all",
  partOfSpeech = "all",
  status = "all",
  letter = "all",
  sort = "newest"
}) {
  if (q?.trim()) {
    const params = new URLSearchParams({
      q: q.trim(),
      direction: "auto",
      page: String(page),
      limit: String(limit),
      status
    });

    if (category !== "all") params.set("category", category);
    if (partOfSpeech !== "all") params.set("partOfSpeech", partOfSpeech);
    if (letter !== "all") params.set("letter", letter);

    return adminFetch(`/words/search?${params.toString()}`).then(normalizeWordsResponse);
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status,
    sort
  });

  if (category !== "all") params.set("category", category);
  if (partOfSpeech !== "all") params.set("partOfSpeech", partOfSpeech);
  if (letter !== "all") params.set("letter", letter);

  return adminFetch(`/words?${params.toString()}`).then(normalizeWordsResponse);
}

function normalizeWordsResponse(response) {
  const nestedWords = response.data?.words || response.data?.items || response.data;
  const words = response.words || response.items || nestedWords || [];
  return {
    items: Array.isArray(words) ? words : [],
    pagination: response.pagination || {
      page: 1,
      limit: Array.isArray(words) ? words.length : 0,
      total: response.count || (Array.isArray(words) ? words.length : 0),
      pages: 1
    }
  };
}

export function createAdminWord(payload) {
  return adminFetch("/words", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminWord(id, payload) {
  return adminFetch(`/words/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteAdminWord(id) {
  return adminFetch(`/words/${id}`, {
    method: "DELETE"
  });
}

export function createAdminCategory(payload) {
  return adminFetch("/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function previewWordImport(file) {
  const formData = new FormData();
  formData.append("file", file);

  return adminFetch("/admin/imports/preview", {
    method: "POST",
    body: formData
  });
}

export function commitWordImport(rows) {
  return adminFetch("/admin/imports/commit", {
    method: "POST",
    body: JSON.stringify({ rows })
  });
}
