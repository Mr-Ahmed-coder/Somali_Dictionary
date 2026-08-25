"use client";

import { CheckCircle2, Loader2, RotateCcw, Search, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { Pagination } from "@/components/admin/Pagination";
import {
  getAdminMissingSearches,
  reopenAdminMissingSearch,
  resolveAdminMissingSearch
} from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/errorMessage";

const initialPagination = { page: 1, limit: 25, total: 0, pages: 1 };
const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short"
});

export function MissingSearchesPanel({ onChanged, onError }) {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("missing");
  const [sort, setSort] = useState("most-searched");
  const [pagination, setPagination] = useState(initialPagination);
  const [totalSearches, setTotalSearches] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(
      async () => {
        setLoading(true);

        try {
          const result = await getAdminMissingSearches({
            page: pagination.page,
            limit: 25,
            q: query,
            status,
            sort,
            signal: controller.signal
          });

          setRecords(result.records || []);
          setTotalSearches(result.totalSearches || 0);
          const totalPages = result.totalPages || 1;
          const currentPage = result.currentPage || 1;

          setPagination({
            page: Math.min(currentPage, totalPages),
            limit: result.limit || 25,
            total: result.totalRecords || 0,
            pages: totalPages
          });
        } catch (error) {
          if (error.name === "AbortError") return;
          setFeedback({ type: "error", text: getErrorMessage(error, "Could not load missing searches.") });
          onError?.(error, "Could not load missing searches.");
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
  }, [pagination.page, query, reloadKey, sort, status]);

  function updateFilter(setter, value) {
    setter(value);
    setPagination((current) => ({ ...current, page: 1 }));
  }

  async function handleResolution(record) {
    setActionId(record._id);
    setFeedback(null);

    try {
      if (record.resolved) {
        await reopenAdminMissingSearch(record._id);
        setFeedback({ type: "success", text: `Reopened "${record.query}".` });
      } else {
        await resolveAdminMissingSearch(record._id);
        setFeedback({ type: "success", text: `Resolved "${record.query}".` });
      }

      setReloadKey((current) => current + 1);
      onChanged?.({ resolved: !record.resolved });
    } catch (error) {
      setFeedback({ type: "error", text: getErrorMessage(error, "Could not update this search.") });
      onError?.(error, "Could not update this search.");
    } finally {
      setActionId("");
    }
  }

  return (
    <section className="adminSurface missingSearchPanel" id="missing-searches">
      <div className="surfaceHeader">
        <div>
          <h2>Missing Search Analytics</h2>
          <p>Prioritize words people searched for but could not find.</p>
        </div>
        <span className="resultCount">
          {pagination.total} entries | {totalSearches} searches
        </span>
      </div>

      <div className="missingSearchFilters">
        <label className="missingSearchInput">
          <span>Search queries</span>
          <Search size={17} />
          <input
            aria-label="Filter missing search queries"
            onChange={(event) => updateFilter(setQuery, event.target.value)}
            placeholder="Filter by query"
            type="search"
            value={query}
          />
        </label>

        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => updateFilter(setStatus, event.target.value)}>
            <option value="missing">Missing</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </select>
        </label>

        <label>
          <span>Sort by</span>
          <select value={sort} onChange={(event) => updateFilter(setSort, event.target.value)}>
            <option value="most-searched">Most searched</option>
            <option value="least-searched">Least searched</option>
            <option value="most-recent">Most recent</option>
            <option value="oldest">Oldest activity</option>
            <option value="a-z">Query A-Z</option>
            <option value="z-a">Query Z-A</option>
          </select>
        </label>
      </div>

      {feedback && (
        <p
          className={`missingSearchFeedback ${feedback.type === "error" ? "missingSearchFeedbackError" : ""}`}
          role={feedback.type === "error" ? "alert" : "status"}
        >
          {feedback.text}
        </p>
      )}

      <div className="missingSearchTableWrap">
        <table className="missingSearchTable">
          <thead>
            <tr>
              <th>Query</th>
              <th>Searches</th>
              <th>First searched</th>
              <th>Last searched</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="missingSearchEmpty" colSpan={6}>
                  <Loader2 className="spin" size={20} /> Loading missing searches
                </td>
              </tr>
            )}

            {!loading && records.length === 0 && (
              <tr>
                <td className="missingSearchEmpty" colSpan={6}>
                  <SearchX size={20} /> No missing searches match these filters.
                </td>
              </tr>
            )}

            {!loading &&
              records.map((record) => (
                <tr key={record._id}>
                  <td>
                    <strong>{record.query}</strong>
                  </td>
                  <td>
                    <strong>{record.count}</strong>
                  </td>
                  <td>{formatDate(record.firstSearchedAt)}</td>
                  <td>{formatDate(record.lastSearchedAt)}</td>
                  <td>
                    <span className={`missingSearchStatus ${record.resolved ? "resolved" : "unresolved"}`}>
                      {record.resolved ? "Resolved" : "Missing"}
                    </span>
                  </td>
                  <td>
                    <button
                      aria-label={`${record.resolved ? "Reopen" : "Resolve"} missing search ${record.query}`}
                      className="missingSearchAction"
                      disabled={actionId === record._id}
                      onClick={() => handleResolution(record)}
                      type="button"
                    >
                      {actionId === record._id ? (
                        <Loader2 className="spin" size={16} />
                      ) : record.resolved ? (
                        <RotateCcw size={16} />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      {record.resolved ? "Reopen" : "Resolve"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Pagination
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination((current) => ({ ...current, page }))}
      />
    </section>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}
