"use client";

import {
  BarChart3,
  BookOpen,
  Edit3,
  FolderTree,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/errorMessage";
import {
  clearAdminToken,
  createAdminCategory,
  createAdminWord,
  deleteAdminWord,
  getAdminCategories,
  getAdminProfile,
  getAdminStats,
  getAdminToken,
  getAdminWords,
  loginAdmin,
  updateAdminWord
} from "@/lib/adminApi";

const initialForm = {
  englishWord: "",
  somaliWord: "",
  partOfSpeech: "noun",
  englishDefinition: "",
  somaliDefinition: "",
  englishExample: "",
  somaliExample: "",
  category: "",
  searchKeywords: "",
  status: "published",
  source: "human"
};

const partsOfSpeech = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "pronoun",
  "conjunction",
  "interjection",
  "phrase",
  "other"
];

export function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [words, setWords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ category: "all", partOfSpeech: "all", status: "all" });
  const [editingWord, setEditingWord] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    async function validateSession() {
      const token = getAdminToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await getAdminProfile();
        setAuthenticated(true);
      } catch {
        clearAdminToken();
      } finally {
        setLoading(false);
      }
    }

    void validateSession();
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    void hydrateDashboard();
  }, [authenticated]);

  const categoryOptions = useMemo(() => categories || [], [categories]);

  async function hydrateDashboard() {
    const importNotice = window.localStorage.getItem("dictionary_import_success");
    const defaultFilters = { category: "all", partOfSpeech: "all", status: "all" };

    if (importNotice) {
      setFilters(defaultFilters);
      setQuery("");
    }

    await loadDashboard(1, importNotice ? "" : query, importNotice ? defaultFilters : filters);

    if (importNotice) {
      window.localStorage.removeItem("dictionary_import_success");
      const parsed = safeParseImportNotice(importNotice);
      setMessage({
        type: "success",
        text: `Import complete. ${parsed.importedRows || 0} new words are shown first.`
      });
    }
  }

  async function loadDashboard(page = pagination.page, searchTerm = query, nextFilters = filters) {
    setLoading(true);
    setMessage(null);
    try {
      const [statsResult, categoriesResult, wordsResult] = await Promise.all([
        getAdminStats(),
        getAdminCategories(),
        getAdminWords({ page, limit: pagination.limit, q: searchTerm, ...nextFilters })
      ]);

      setStats(statsResult);
      setCategories(categoriesResult.items || []);
      setWords(wordsResult.items || []);
      setPagination(
        wordsResult.pagination || {
          page,
          limit: pagination.limit,
          total: wordsResult.items?.length || 0,
          pages: 1
        }
      );

      if (!form.category && categoriesResult.items?.[0]?._id) {
        setForm((current) => ({ ...current, category: categoriesResult.items[0]._id }));
      }
    } catch (error) {
      const text = getErrorMessage(error, "Could not load the admin dashboard.");
      setMessage({ type: "error", text });
      if (text.toLowerCase().includes("admin")) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    setLoginError("");
    try {
      await loginAdmin(credentials);
      setAuthenticated(true);
    } catch (error) {
      setLoginError(getErrorMessage(error, "Unable to sign in."));
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    clearAdminToken();
    setAuthenticated(false);
    setCredentials({ email: "", password: "" });
    setStats(null);
    setWords([]);
  }

  function startEdit(word) {
    setEditingWord(word);
    setForm({
      englishWord: word.englishWord || word.english || "",
      somaliWord: word.somaliWord || word.somali || "",
      partOfSpeech: word.partOfSpeech || "noun",
      englishDefinition: word.englishDefinition || word.definitions?.english?.[0] || "",
      somaliDefinition: word.somaliDefinition || word.definitions?.somali?.[0] || "",
      englishExample: word.englishExample || word.examples?.[0]?.english || "",
      somaliExample: word.somaliExample || word.examples?.[0]?.somali || "",
      category: word.category?._id || word.category || categoryOptions[0]?._id || "",
      searchKeywords: (word.searchKeywords || []).join(", "),
      status: word.status || "published",
      source: word.source || "human"
    });
  }

  function resetForm() {
    setEditingWord(null);
    setForm({ ...initialForm, category: categoryOptions[0]?._id || "" });
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function buildPayload() {
    return {
      ...form,
      searchKeywords: form.searchKeywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean)
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      if (editingWord?._id) {
        await updateAdminWord(editingWord._id, buildPayload());
        await loadDashboard(1);
        setMessage({ type: "success", text: "Word updated successfully." });
      } else {
        await createAdminWord(buildPayload());
        await loadDashboard(1);
        setMessage({ type: "success", text: "Word created successfully." });
      }
      resetForm();
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not save the word.") });
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    setMessage(null);
    try {
      await deleteAdminWord(deleteTarget._id);
      setDeleteTarget(null);
      await loadDashboard(pagination.page);
      setMessage({ type: "success", text: "Word deleted successfully." });
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not delete the word.") });
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateCategory(event) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await createAdminCategory(categoryForm);
      setCategoryForm({ name: "", description: "" });
      await loadDashboard(pagination.page);
      setMessage({ type: "success", text: "Category created successfully." });
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not create the category.") });
    } finally {
      setBusy(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadDashboard(1, query);
  }

  async function handleFilterChange(field, value) {
    const nextFilters = { ...filters, [field]: value };
    setFilters(nextFilters);
    await loadDashboard(1, query, nextFilters);
  }

  async function refreshWords() {
    await loadDashboard(1, query, filters);
  }

  if (!authenticated) {
    return (
      <main className="adminAuth">
        <section className="authPanel">
          <div className="authBadge">
            <ShieldCheck size={20} />
          </div>
          <h1>Admin Dashboard</h1>
          <p>Sign in with your admin email and password to manage dictionary entries and categories.</p>
          <form onSubmit={handleLogin}>
            <label htmlFor="admin-email">Admin email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={credentials.email}
              onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
              placeholder="admin@example.com"
            />
            <label htmlFor="admin-password">Admin password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
              placeholder="Enter admin password"
            />
            {loginError && <p className="formError">{loginError}</p>}
            <button className="primaryButton" disabled={busy} type="submit">
              {busy ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}
              Sign in
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="adminShell">
      <aside className="adminSidebar">
        <a className="adminBrand" href="/">
          <BookOpen size={22} />
          <span>Dictionary Admin</span>
        </a>
        <nav>
          <a href="#overview">Overview</a>
          <a href="#words">Words</a>
          <a href="#editor">Editor</a>
          <a href="/admin/import">Import</a>
        </nav>
        <button className="ghostButton" onClick={handleLogout} type="button">
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <section className="adminMain">
        <header className="adminTopbar" id="overview">
          <div>
            <p className="eyebrow">English ↔ Somali</p>
            <h1>Admin Dashboard</h1>
          </div>
          <button className="primaryButton" onClick={resetForm} type="button">
            <Plus size={18} />
            New word
          </button>
        </header>

        {message && (
          <div className={`adminNotice ${message.type === "error" ? "noticeError" : "noticeSuccess"}`}>
            <span>{message.text}</span>
            <button aria-label="Dismiss message" onClick={() => setMessage(null)} type="button">
              <X size={16} />
            </button>
          </div>
        )}

        <section className="metricGrid">
          <Metric icon={<BookOpen />} label="Total words" value={stats?.totals?.words ?? 0} />
          <Metric icon={<ShieldCheck />} label="Published" value={stats?.totals?.published ?? 0} />
          <Metric icon={<Edit3 />} label="Drafts" value={stats?.totals?.drafts ?? 0} />
          <Metric icon={<FolderTree />} label="Categories" value={stats?.totals?.categories ?? 0} />
        </section>

        <section className="dashboardGrid">
          <div className="adminSurface" id="words">
            <div className="surfaceHeader">
              <div>
                <h2>Dictionary Words</h2>
                <p>Search, edit, and delete English ↔ Somali entries.</p>
              </div>
              <form className="adminSearch" onSubmit={handleSearch}>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search words"
                  aria-label="Search words"
                />
                <button aria-label="Search" type="submit">
                  <Search size={18} />
                </button>
              </form>
            </div>

            <div className="wordToolbar">
              <span>{pagination.total || words.length} words found</span>
              <button className="ghostButton" disabled={loading} onClick={refreshWords} type="button">
                <RefreshCw className={loading ? "spin" : ""} size={18} />
                Refresh
              </button>
            </div>

            <div className="adminFilters">
              <label>
                <span>Category</span>
                <select value={filters.category} onChange={(event) => handleFilterChange("category", event.target.value)}>
                  <option value="all">All categories</option>
                  {categoryOptions.map((category) => (
                    <option value={category._id} key={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Part of speech</span>
                <select
                  value={filters.partOfSpeech}
                  onChange={(event) => handleFilterChange("partOfSpeech", event.target.value)}
                >
                  <option value="all">All parts</option>
                  {partsOfSpeech.map((part) => (
                    <option value={part} key={part}>
                      {part}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select value={filters.status} onChange={(event) => handleFilterChange("status", event.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>

            <div className="wordTable">
              <div className="tableHead">
                <span>English</span>
                <span>Somali</span>
                <span>Category</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {loading ? (
                <div className="emptyState">
                  <Loader2 className="spin" />
                  Loading dashboard
                </div>
              ) : (
                words.map((word) => (
                  <article className="tableRow" key={word._id}>
                    <span>
                      <strong>{word.englishWord || word.english}</strong>
                      <small>{word.partOfSpeech}</small>
                    </span>
                    <span>{word.somaliWord || word.somali}</span>
                    <span>{word.category?.name || "Uncategorized"}</span>
                    <span>
                      <small className={`statusPill status-${word.status || "published"}`}>{word.status || "published"}</small>
                    </span>
                    <span className="rowActions">
                      <button aria-label="Edit word" onClick={() => startEdit(word)} type="button">
                        <Edit3 size={16} />
                      </button>
                      <button aria-label="Delete word" onClick={() => setDeleteTarget(word)} type="button">
                        <Trash2 size={16} />
                      </button>
                    </span>
                  </article>
                ))
              )}
              {!loading && words.length === 0 && <div className="emptyState">No words found.</div>}
            </div>

            <div className="paginationBar">
              <button
                className="ghostButton"
                disabled={pagination.page <= 1 || loading}
                onClick={() => loadDashboard(pagination.page - 1, query, filters)}
                type="button"
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.pages || 1}
              </span>
              <button
                className="ghostButton"
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => loadDashboard(pagination.page + 1, query, filters)}
                type="button"
              >
                Next
              </button>
            </div>
          </div>

          <form className="adminSurface editorSurface" id="editor" onSubmit={handleSubmit}>
            <div className="surfaceHeader">
              <div>
                <h2>{editingWord ? "Edit Word" : "Add New Word"}</h2>
                <p>Maintain definitions, examples, categories, and search keywords.</p>
              </div>
            </div>

            <div className="formGrid">
              <Field label="English word" value={form.englishWord} onChange={(value) => updateForm("englishWord", value)} />
              <Field label="Somali word" value={form.somaliWord} onChange={(value) => updateForm("somaliWord", value)} />
              <SelectField
                label="Part of speech"
                value={form.partOfSpeech}
                options={partsOfSpeech}
                onChange={(value) => updateForm("partOfSpeech", value)}
              />
              <SelectField
                label="Category"
                value={form.category}
                options={categoryOptions.map((category) => ({ value: category._id, label: category.name }))}
                onChange={(value) => updateForm("category", value)}
              />
              <TextArea
                label="English definition"
                value={form.englishDefinition}
                onChange={(value) => updateForm("englishDefinition", value)}
              />
              <TextArea
                label="Somali definition"
                value={form.somaliDefinition}
                onChange={(value) => updateForm("somaliDefinition", value)}
              />
              <TextArea
                label="English example"
                value={form.englishExample}
                onChange={(value) => updateForm("englishExample", value)}
              />
              <TextArea
                label="Somali example"
                value={form.somaliExample}
                onChange={(value) => updateForm("somaliExample", value)}
              />
              <Field
                label="Search keywords"
                value={form.searchKeywords}
                onChange={(value) => updateForm("searchKeywords", value)}
                placeholder="comma, separated, keywords"
              />
              <SelectField
                label="Status"
                value={form.status}
                options={["published", "draft", "archived"]}
                onChange={(value) => updateForm("status", value)}
              />
            </div>

            <div className="formActions">
              {editingWord && (
                <button className="ghostButton" onClick={resetForm} type="button">
                  Cancel
                </button>
              )}
              <button className="primaryButton" disabled={busy || categoryOptions.length === 0} type="submit">
                {busy ? <Loader2 className="spin" size={18} /> : <Plus size={18} />}
                {editingWord ? "Save changes" : "Add word"}
              </button>
            </div>
          </form>
        </section>

        <section className="adminSurface insightSurface">
          <div className="surfaceHeader">
            <div>
              <h2>Categories and Insights</h2>
              <p>Manage word categories and review editorial activity.</p>
            </div>
            <BarChart3 />
          </div>
          <div className="insightGrid threeColumn">
            <div className="categoryManager">
              <h3>Word categories</h3>
              <form onSubmit={handleCreateCategory}>
                <input
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Category name"
                  required
                />
                <input
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Description"
                />
                <button className="primaryButton" disabled={busy} type="submit">
                  <Plus size={18} />
                  Add category
                </button>
              </form>
              <div className="categoryChips">
                {categoryOptions.map((category) => (
                  <span key={category._id}>{category.name}</span>
                ))}
              </div>
            </div>
            <InsightList title="Latest words" items={stats?.latestWords || []} />
            <InsightList title="Popular words" items={stats?.popularWords || []} />
          </div>
        </section>
      </section>

      {deleteTarget && (
        <ConfirmDialog
          busy={busy}
          title="Delete word"
          description={`Are you sure you want to delete "${deleteTarget.englishWord || deleteTarget.english}"? This will archive it for offline sync safety.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </main>
  );
}

function safeParseImportNotice(value) {
  try {
    return JSON.parse(value);
  } catch {
    return { importedRows: 0 };
  }
}

function Metric({ icon, label, value }) {
  return (
    <article className="metricCard">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Field({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="adminField">
      <span>{label}</span>
      <input required value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="adminField wideField">
      <span>{label}</span>
      <textarea required value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="adminField">
      <span>{label}</span>
      <select required value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="" disabled>
          Select
        </option>
        {options.map((option) => {
          const item = typeof option === "string" ? { value: option, label: option } : option;
          return (
            <option value={item.value} key={item.value}>
              {item.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function InsightList({ title, items }) {
  return (
    <div className="insightList">
      <h3>{title}</h3>
      {items.length === 0 && <p>No entries yet.</p>}
      {items.map((item) => (
        <div key={item._id}>
          <strong>{item.englishWord}</strong>
          <span>{item.somaliWord}</span>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({ title, description, busy, onCancel, onConfirm }) {
  return (
    <div className="confirmOverlay" role="presentation">
      <section className="confirmDialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <p>{description}</p>
        <div>
          <button className="ghostButton" disabled={busy} onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="dangerButton" disabled={busy} onClick={onConfirm} type="button">
            {busy ? <Loader2 className="spin" size={18} /> : <Trash2 size={18} />}
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}


