"use client";

import {
  BookOpen,
  FolderTree,
  Loader2,
  LogOut,
  Plus,
  ShieldCheck,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AlphabetFilter } from "@/components/admin/AlphabetFilter";
import { CategorySidebar } from "@/components/admin/CategorySidebar";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { FilterBar } from "@/components/admin/FilterBar";
import { MissingSearchesPanel } from "@/components/admin/MissingSearchesPanel";
import { Pagination } from "@/components/admin/Pagination";
import { WordTable } from "@/components/admin/WordTable";
import { getErrorMessage } from "@/lib/errorMessage";
import {
  createAdminCategory,
  createAdminWord,
  deleteAdminWord,
  getAdminCategories,
  getAdminProfile,
  getAdminStats,
  getAdminWords,
  loginAdmin,
  logoutAdmin,
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

const initialFilters = {
  category: "all",
  partOfSpeech: "all",
  status: "all",
  letter: "all",
  sort: "newest"
};

export function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(true);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [words, setWords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [editingWord, setEditingWord] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    async function validateSession() {
      try {
        await getAdminProfile();
        setAuthenticated(true);
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    void validateSession();
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    const importNotice = window.localStorage.getItem("dictionary_import_success");
    if (importNotice) {
      setQuery("");
      setFilters(initialFilters);
      setMessage({
        type: "success",
        text: `Import complete. ${safeParseImportNotice(importNotice).importedRows || 0} new words are shown first.`
      });
      window.localStorage.removeItem("dictionary_import_success");
    }

    void loadMeta();
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return;

    const timeout = window.setTimeout(() => {
      void loadWords(pagination.page, query, filters);
    }, query.trim() ? 250 : 0);

    return () => window.clearTimeout(timeout);
  }, [authenticated, filters, pagination.page, query]);

  const categoryOptions = useMemo(() => {
    const countByCategory = new Map((stats?.categoryCounts || []).map((item) => [String(item.category), item.count]));
    return categories.map((category) => ({
      ...category,
      adminWordCount: category.virtual ? 0 : countByCategory.get(String(category._id)) ?? category.wordCount ?? 0
    }));
  }, [categories, stats]);

  async function loadMeta() {
    setLoading(true);
    try {
      const [statsResult, categoriesResult] = await Promise.all([getAdminStats(), getAdminCategories()]);
      setStats(statsResult);
      setCategories(categoriesResult.items || []);

      if (!form.category && categoriesResult.items?.[0]?._id) {
        setForm((current) => ({ ...current, category: categoriesResult.items[0]._id }));
      }
    } catch (error) {
      handleAdminError(error, "Could not load dashboard summary.");
    } finally {
      setLoading(false);
    }
  }

  async function loadWords(page = 1, searchTerm = query, nextFilters = filters) {
    setWordsLoading(true);
    try {
      const wordsResult = await getAdminWords({
        page,
        limit: 25,
        q: searchTerm,
        ...nextFilters
      });

      setWords(wordsResult.items || []);
      setPagination(
        wordsResult.pagination || {
          page,
          limit: 25,
          total: wordsResult.items?.length || 0,
          pages: 1
        }
      );
    } catch (error) {
      handleAdminError(error, "Could not load words.");
    } finally {
      setWordsLoading(false);
    }
  }

  function handleAdminError(error, fallback) {
    const text = getErrorMessage(error, fallback);
    setMessage({ type: "error", text });
    if (error?.status === 401 || text.toLowerCase().includes("admin") || text.toLowerCase().includes("401")) {
      handleLogout();
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

  async function handleLogout() {
    await logoutAdmin().catch(() => {});
    setAuthenticated(false);
    setCredentials({ email: "", password: "" });
    setStats(null);
    setWords([]);
  }

  function updateQuery(value) {
    setQuery(value);
    setPagination((current) => ({ ...current, page: 1 }));
  }

  function handleFilterChange(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  }

  function handleCategorySelect(category) {
    handleFilterChange("category", category);
  }

  function handleLetterSelect(letter) {
    handleFilterChange("letter", letter);
  }

  function handleMissingSearchChanged({ resolved }) {
    setStats((current) => {
      if (!current) return current;
      const missingSearches = current.totals?.missingSearches || 0;

      return {
        ...current,
        totals: {
          ...current.totals,
          missingSearches: Math.max(0, missingSearches + (resolved ? -1 : 1))
        }
      };
    });
  }

  async function refreshDashboard() {
    await Promise.all([loadMeta(), loadWords(1, query, filters)]);
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
        setMessage({ type: "success", text: "Word updated successfully." });
      } else {
        await createAdminWord(buildPayload());
        setMessage({ type: "success", text: "Word created successfully." });
      }
      resetForm();
      await refreshDashboard();
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
      await refreshDashboard();
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
      await loadMeta();
      setMessage({ type: "success", text: "Category created successfully." });
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Could not create the category.") });
    } finally {
      setBusy(false);
    }
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

  const emptyMessage =
    filters.category !== "all" || filters.letter !== "all"
      ? "No words available in this category."
      : "No words match the current filters.";

  return (
    <main className="adminShell">
      <aside className="adminSidebar">
        <a className="adminBrand" href="/">
          <BookOpen size={22} />
          <span>Dictionary Admin</span>
        </a>
        <nav>
          <a href="#overview">Overview</a>
          <a href="#alphabet">Alphabet</a>
          <a href="#missing-searches">Missing Searches</a>
          <a href="/admin/popular-searches">Popular Searches</a>
          <a href="/admin/suggestions">Word Suggestions</a>
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
            <p className="eyebrow">English &lt;-&gt; Somali</p>
            <h1>Dictionary Management System</h1>
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

        <DashboardStats totals={stats?.totals} />
        <AlphabetFilter selectedLetter={filters.letter} counts={stats?.alphabetCounts || []} onSelect={handleLetterSelect} />
        <MissingSearchesPanel onChanged={handleMissingSearchChanged} onError={handleAdminError} />

        <section className="adminManagementGrid">
          <CategorySidebar categories={categoryOptions} selectedCategory={filters.category} onSelect={handleCategorySelect} />

          <div className="adminSurface wordManagementSurface" id="words">
            <div className="surfaceHeader">
              <div>
                <h2>Dictionary Words</h2>
                <p>Manage 25 entries per page with server-side filtering and sorting.</p>
              </div>
              <span className="resultCount">{pagination.total || 0} words</span>
            </div>

            <FilterBar
              query={query}
              filters={filters}
              categories={categoryOptions}
              partsOfSpeech={partsOfSpeech}
              loading={wordsLoading}
              onQueryChange={updateQuery}
              onFilterChange={handleFilterChange}
              onRefresh={refreshDashboard}
            />

            <WordTable
              words={words}
              loading={loading || wordsLoading}
              emptyMessage={emptyMessage}
              onEdit={startEdit}
              onDelete={setDeleteTarget}
            />

            <Pagination
              pagination={pagination}
              loading={wordsLoading}
              onPageChange={(nextPage) => setPagination((current) => ({ ...current, page: nextPage }))}
            />
          </div>
        </section>

        <section className="dashboardGrid">
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
                label="Type"
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

          <section className="adminSurface categoryManager">
            <div className="surfaceHeader">
              <div>
                <h2>Category Tools</h2>
                <p>Create category groups used by imports and word records.</p>
              </div>
              <FolderTree />
            </div>
            <form onSubmit={handleCreateCategory}>
              <input
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Category name"
                required
              />
              <input
                value={categoryForm.description}
                onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Description"
              />
              <button className="primaryButton" disabled={busy} type="submit">
                <Plus size={18} />
                Add category
              </button>
            </form>
          </section>
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
