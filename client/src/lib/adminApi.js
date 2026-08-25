import { API_URL } from "./config";

export async function adminFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    },
    credentials: "include",
    cache: "no-store"
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.message || `Request failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function loginAdmin({ email, password }) {
  const result = await fetch(`${API_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password })
  });

  if (!result.ok) {
    const errorBody = await result.json().catch(() => ({}));
    throw new Error(errorBody.message || "Unable to sign in");
  }

  return result.json();
}

export async function logoutAdmin() {
  const response = await fetch(`${API_URL}/admin/logout`, {
    method: "POST",
    credentials: "include",
    cache: "no-store"
  });

  if (!response.ok && response.status !== 401) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Unable to sign out");
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
