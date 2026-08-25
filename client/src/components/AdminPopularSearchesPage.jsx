"use client";

import { BookOpen, ExternalLink, Loader2, LogOut, Search, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Pagination } from "@/components/admin/Pagination";
import { getAdminPopularSearches, getAdminProfile, logoutAdmin } from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/errorMessage";

const initialPagination = { page: 1, limit: 25, total: 0, pages: 1 };
const numberFormatter = new Intl.NumberFormat("en");

export function AdminPopularSearchesPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("most-searched");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function validateSession() {
      try {
        await getAdminProfile();
        setAuthenticated(true);
      } catch {
        window.location.replace("/admin");
      } finally {
        setAuthChecked(true);
      }
    }

    void validateSession();
  }, []);

  useEffect(() => {
    if (!authenticated) return undefined;

    const controller = new AbortController();
    const timeout = window.setTimeout(
      async () => {
        setLoading(true);
        setError("");

        try {
          const result = await getAdminPopularSearches({
            page: pagination.page,
            limit: 25,
            q: query,
            sort,
            signal: controller.signal
          });
          const totalPages = result.totalPages || 1;

          setRecords(result.records || []);
          setPagination({
            page: Math.min(result.currentPage || 1, totalPages),
            limit: result.limit || 25,
            total: result.totalRecords || 0,
            pages: totalPages
          });
        } catch (requestError) {
          if (requestError.name === "AbortError") return;
          if (requestError?.status === 401 || requestError?.status === 403) {
            window.location.replace("/admin");
            return;
          }
          setError(getErrorMessage(requestError, "Could not load popular search analytics."));
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
      query.trim() ? 250 : 0
    );

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [authenticated, pagination.page, query, sort]);

  function updateQuery(value) {
    setQuery(value);
    setPagination((current) => ({ ...current, page: 1 }));
  }

  function updateSort(value) {
    setSort(value);
    setPagination((current) => ({ ...current, page: 1 }));
  }

  async function handleLogout() {
    await logoutAdmin().catch(() => {});
    window.location.replace("/admin");
  }

  if (!authChecked || !authenticated) {
    return (
      <main className="adminAuth">
        <section className="authPanel adminSessionCheck">
          <Loader2 className="spin" size={32} />
          <h1>Checking admin session</h1>
          <p>Preparing successful search analytics.</p>
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
          <a href="/admin#overview">Overview</a>
          <a href="/admin#alphabet">Alphabet</a>
          <a href="/admin#missing-searches">Missing Searches</a>
          <a className="active" href="/admin/popular-searches">Popular Searches</a>
          <a href="/admin/suggestions">Word Suggestions</a>
          <a href="/admin#words">Words</a>
          <a href="/admin#editor">Editor</a>
          <a href="/admin/import">Import</a>
        </nav>
        <button className="ghostButton" onClick={handleLogout} type="button">
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <section className="adminMain">
        <header className="adminTopbar">
          <div>
            <p className="eyebrow">Search intelligence</p>
            <h1>Popular Searches</h1>
            <p className="suggestionsIntro">See which published dictionary entries users intentionally open from search.</p>
          </div>
          <span className="suggestionTotal">
            <TrendingUp size={18} />
            {numberFormatter.format(pagination.total)} tracked words
          </span>
        </header>

        {error && <div className="adminNotice noticeError">{error}</div>}

        <section className="adminSurface popularSearchSurface">
          <div className="popularSearchFilters">
            <label className="popularSearchField">
              <span>Search analytics</span>
              <Search size={17} />
              <input
                aria-label="Search popular words by English or Somali"
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="Search English or Somali"
                type="search"
                value={query}
              />
            </label>

            <label>
              <span>Sort by</span>
              <select aria-label="Sort popular searches" onChange={(event) => updateSort(event.target.value)} value={sort}>
                <option value="most-searched">Most searched</option>
                <option value="least-searched">Least searched</option>
                <option value="most-recent">Most recent</option>
                <option value="oldest">Oldest</option>
                <option value="a-z">English A-Z</option>
                <option value="z-a">English Z-A</option>
              </select>
            </label>
          </div>

          <PopularSearchTable loading={loading} query={query} records={records} />

          <Pagination
            loading={loading}
            pagination={pagination}
            onPageChange={(page) => setPagination((current) => ({ ...current, page }))}
          />
        </section>
      </section>
    </main>
  );
}

function PopularSearchTable({ records, loading, query }) {
  return (
    <div className="popularSearchTableWrap">
      <table className="popularSearchTable">
        <thead>
          <tr>
            <th>Rank</th>
            <th>English</th>
            <th>Somali</th>
            <th>Search Count</th>
            <th>Last Searched</th>
            <th>First Searched</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td className="popularSearchEmpty" colSpan={7}>
                <Loader2 className="spin" size={20} /> Loading popular searches
              </td>
            </tr>
          )}
          {!loading && records.length === 0 && (
            <tr>
              <td className="popularSearchEmpty" colSpan={7}>
                <TrendingUp size={20} />
                {query.trim() ? "No tracked words match this search." : "No successful searches have been tracked yet."}
              </td>
            </tr>
          )}
          {!loading && records.map((record) => (
            <tr key={record.wordId}>
              <td><span className="popularSearchRank">{record.rank}</span></td>
              <td><strong>{record.english}</strong></td>
              <td>{record.somali}</td>
              <td><strong className="popularSearchCount">{numberFormatter.format(record.count)}</strong></td>
              <td>{formatDateTime(record.lastSearchedAt)}</td>
              <td>{formatDateTime(record.firstSearchedAt)}</td>
              <td>
                <a className="suggestionWordLink" href={`/word/${record.wordId}`}>
                  <ExternalLink size={16} />
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
