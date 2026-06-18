import { API_URL } from "./config";

const TOKEN_KEY = "dictionary_admin_key";

export function getAdminToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) || "";
}

export function setAdminToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function adminFetch(path, options = {}) {
  const token = getAdminToken();
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { "x-admin-key": token } : {}),
      ...(options.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Request failed with ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function loginAdmin(apiKey) {
  const result = await fetch(`${API_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey })
  });

  if (!result.ok) {
    const errorBody = await result.json().catch(() => ({}));
    throw new Error(errorBody.message || "Unable to sign in");
  }

  const data = await result.json();
  setAdminToken(data.token);
  return data;
}

export function getAdminStats() {
  return adminFetch("/admin/stats");
}

export function getAdminCategories() {
  return adminFetch("/categories");
}

export function getAdminWords({ page, limit, q, category = "all", partOfSpeech = "all", status = "all" }) {
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

    return adminFetch(`/words/search?${params.toString()}`).then(normalizeWordsResponse);
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status,
    sort: "newest"
  });

  if (category !== "all") params.set("category", category);
  if (partOfSpeech !== "all") params.set("partOfSpeech", partOfSpeech);

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
