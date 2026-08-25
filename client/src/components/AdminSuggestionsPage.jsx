"use client";

import {
  BookCheck,
  BookOpen,
  BookPlus,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  Loader2,
  LogOut,
  MessageSquareText,
  Search,
  X,
  XCircle
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Pagination } from "@/components/admin/Pagination";
import { SuggestionConversionDialog } from "@/components/admin/SuggestionConversionDialog";
import {
  createWordFromAdminSuggestion,
  getAdminCategories,
  getAdminProfile,
  getAdminWordSuggestion,
  getAdminWordSuggestions,
  logoutAdmin,
  updateAdminWordSuggestionStatus
} from "@/lib/adminApi";
import { getErrorMessage } from "@/lib/errorMessage";

const suggestionTypes = ["noun", "verb", "adjective", "adverb", "phrase", "other"];
const initialPagination = { page: 1, limit: 25, total: 0, pages: 1 };

export function AdminSuggestionsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ status: "pending", type: "all", sort: "newest" });
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [moderating, setModerating] = useState(false);
  const [categories, setCategories] = useState([]);
  const [conversionOpen, setConversionOpen] = useState(false);
  const [conversionSuggestion, setConversionSuggestion] = useState(null);
  const [conversionBusy, setConversionBusy] = useState(false);
  const [preparingSuggestionId, setPreparingSuggestionId] = useState("");

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
    if (!authenticated) return;

    getAdminCategories()
      .then((result) => {
        const storedCategories = (result.items || []).filter(
          (category) => !category.virtual && /^[0-9a-fA-F]{24}$/.test(category._id)
        );
        setCategories(storedCategories);
      })
      .catch((error) => handleAdminError(error, "Could not load categories for publication."));
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return undefined;

    const controller = new AbortController();
    const timeout = window.setTimeout(
      async () => {
        setLoading(true);

        try {
          const result = await getAdminWordSuggestions({
            page: pagination.page,
            limit: 25,
            q: query,
            ...filters,
            signal: controller.signal
          });
          const totalPages = result.totalPages || 1;

          setSuggestions(result.suggestions || []);
          setPagination({
            page: Math.min(result.currentPage || 1, totalPages),
            limit: result.limit || 25,
            total: result.totalRecords || 0,
            pages: totalPages
          });
        } catch (error) {
          if (error.name === "AbortError") return;
          handleAdminError(error, "Could not load word suggestions.");
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
  }, [authenticated, filters, pagination.page, query, reloadKey]);

  function handleAdminError(error, fallback) {
    setNotice({ type: "error", text: getErrorMessage(error, fallback) });
    if (error?.status === 401 || error?.status === 403) window.location.replace("/admin");
  }

  function updateQuery(value) {
    setQuery(value);
    setPagination((current) => ({ ...current, page: 1 }));
  }

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  }

  async function openDetails(id) {
    setSelectedSuggestion(null);
    setDetailsOpen(true);
    setDetailsLoading(true);
    setNotice(null);

    try {
      const result = await getAdminWordSuggestion(id);
      setSelectedSuggestion(result.suggestion);
    } catch (error) {
      setDetailsOpen(false);
      handleAdminError(error, "Could not load suggestion details.");
    } finally {
      setDetailsLoading(false);
    }
  }

  async function moderateSuggestion(status) {
    if (!selectedSuggestion?._id || moderating) return false;
    setModerating(true);

    try {
      const result = await updateAdminWordSuggestionStatus(selectedSuggestion._id, status);
      setNotice({ type: "success", text: result.message });
      setDetailsOpen(false);
      setSelectedSuggestion(null);
      setReloadKey((current) => current + 1);
      return true;
    } catch (error) {
      handleAdminError(error, "Could not moderate this suggestion.");
      setDetailsOpen(false);
      return false;
    } finally {
      setModerating(false);
    }
  }

  async function startConversion(suggestionOrId) {
    const id = typeof suggestionOrId === "string" ? suggestionOrId : suggestionOrId?._id;
    if (!id || preparingSuggestionId) return;
    setPreparingSuggestionId(id);
    setNotice(null);

    try {
      const result = await getAdminWordSuggestion(id);
      const suggestion = result.suggestion;

      if (suggestion.status !== "approved") {
        throw new Error("Only approved suggestions can be added to the dictionary.");
      }
      if (suggestion.convertedToWord || getSuggestionWordId(suggestion)) {
        throw new Error("Suggestion has already been added to the dictionary.");
      }

      setDetailsOpen(false);
      setConversionSuggestion(suggestion);
      setConversionOpen(true);
    } catch (error) {
      handleAdminError(error, "Could not prepare this suggestion for publication.");
    } finally {
      setPreparingSuggestionId("");
    }
  }

  async function convertSuggestion(payload) {
    if (!conversionSuggestion?._id || conversionBusy) return;
    setConversionBusy(true);

    try {
      const result = await createWordFromAdminSuggestion(conversionSuggestion._id, payload);
      setNotice({
        type: "success",
        text: result.analyticsWarning
          ? `${result.message} ${result.analyticsWarning}`
          : result.message
      });
      setConversionOpen(false);
      setConversionSuggestion(null);
      setSelectedSuggestion(null);
      setReloadKey((current) => current + 1);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        handleAdminError(error, "Your admin session has expired.");
      }
      throw error;
    } finally {
      setConversionBusy(false);
    }
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
          <p>Preparing the suggestion review workspace.</p>
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
          <a href="/admin/popular-searches">Popular Searches</a>
          <a className="active" href="/admin/suggestions">Word Suggestions</a>
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
            <p className="eyebrow">Community moderation</p>
            <h1>Word Suggestions</h1>
            <p className="suggestionsIntro">Review submissions and deliberately publish approved entries.</p>
          </div>
          <span className="suggestionTotal">
            <MessageSquareText size={18} />
            {pagination.total} suggestions
          </span>
        </header>

        {notice && (
          <div className={`adminNotice ${notice.type === "error" ? "noticeError" : "noticeSuccess"}`}>
            <span>{notice.text}</span>
            <button aria-label="Dismiss message" onClick={() => setNotice(null)} type="button">
              <X size={16} />
            </button>
          </div>
        )}

        <section className="adminSurface suggestionsSurface">
          <div className="suggestionFilters">
            <label className="suggestionSearchField">
              <span>Search suggestions</span>
              <Search size={17} />
              <input
                aria-label="Search English or Somali suggestions"
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="Search English or Somali"
                type="search"
                value={query}
              />
            </label>

            <SuggestionSelect
              label="Status"
              options={[
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
                { value: "all", label: "All statuses" }
              ]}
              value={filters.status}
              onChange={(value) => updateFilter("status", value)}
            />

            <SuggestionSelect
              label="Type"
              options={[
                { value: "all", label: "All types" },
                ...suggestionTypes.map((type) => ({ value: type, label: capitalize(type) }))
              ]}
              value={filters.type}
              onChange={(value) => updateFilter("type", value)}
            />

            <SuggestionSelect
              label="Sort by"
              options={[
                { value: "newest", label: "Newest" },
                { value: "oldest", label: "Oldest" }
              ]}
              value={filters.sort}
              onChange={(value) => updateFilter("sort", value)}
            />
          </div>

          <SuggestionTable
            emptyMessage={getEmptyMessage(filters, query)}
            loading={loading}
            onConvert={startConversion}
            onView={openDetails}
            preparingSuggestionId={preparingSuggestionId}
            suggestions={suggestions}
          />

          <Pagination
            loading={loading}
            pagination={pagination}
            onPageChange={(page) => setPagination((current) => ({ ...current, page }))}
          />
        </section>
      </section>

      <SuggestionReviewDialog
        busy={moderating}
        loading={detailsLoading}
        onClose={() => setDetailsOpen(false)}
        onModerate={moderateSuggestion}
        onStartConversion={startConversion}
        open={detailsOpen}
        suggestion={selectedSuggestion}
      />

      <SuggestionConversionDialog
        busy={conversionBusy}
        categories={categories}
        onClose={() => setConversionOpen(false)}
        onConfirm={convertSuggestion}
        open={conversionOpen}
        suggestion={conversionSuggestion}
      />
    </main>
  );
}

function SuggestionTable({
  suggestions,
  loading,
  emptyMessage,
  onView,
  onConvert,
  preparingSuggestionId
}) {
  return (
    <div className="suggestionTableWrap">
      <table className="suggestionTable">
        <thead>
          <tr>
            <th>English</th>
            <th>Somali</th>
            <th>Type</th>
            <th>Status</th>
            <th>Submitted Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td className="suggestionTableEmpty" colSpan={6}>
                <Loader2 className="spin" size={20} /> Loading suggestions
              </td>
            </tr>
          )}
          {!loading && suggestions.length === 0 && (
            <tr>
              <td className="suggestionTableEmpty" colSpan={6}>
                <MessageSquareText size={20} /> {emptyMessage}
              </td>
            </tr>
          )}
          {!loading &&
            suggestions.map((suggestion) => (
              <tr key={suggestion._id}>
                <td><strong>{suggestion.english}</strong></td>
                <td>{suggestion.somali}</td>
                <td><span className="typePill">{suggestion.type}</span></td>
                <td>
                  <SuggestionStatus converted={suggestion.convertedToWord} status={suggestion.status} />
                </td>
                <td>{formatDate(suggestion.submittedAt)}</td>
                <td>
                  <div className="suggestionRowActions">
                    <button
                      aria-label={`View suggestion ${suggestion.english}`}
                      className="suggestionViewButton"
                      onClick={() => onView(suggestion._id)}
                      type="button"
                    >
                      <Eye size={16} />
                      View
                    </button>
                    {suggestion.status === "approved" && !suggestion.convertedToWord && (
                      <button
                        className="suggestionConvertButton"
                        disabled={preparingSuggestionId === suggestion._id}
                        onClick={() => onConvert(suggestion._id)}
                        type="button"
                      >
                        {preparingSuggestionId === suggestion._id
                          ? <Loader2 className="spin" size={16} />
                          : <BookPlus size={16} />}
                        Add
                      </button>
                    )}
                    {suggestion.convertedToWord && getSuggestionWordId(suggestion) && (
                      <a className="suggestionWordLink" href={`/word/${getSuggestionWordId(suggestion)}`}>
                        <ExternalLink size={16} />
                        Word
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function SuggestionReviewDialog({
  open,
  loading,
  suggestion,
  busy,
  onClose,
  onModerate,
  onStartConversion
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const [confirmStatus, setConfirmStatus] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      setConfirmStatus("");
      window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function closeDialog() {
    if (!busy) dialogRef.current?.close();
  }

  const actionLabel = confirmStatus === "approved" ? "Approve" : "Reject";

  return (
    <dialog
      aria-labelledby="suggestion-review-title"
      className="suggestionReviewDialog"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        if (!busy) onClose();
      }}
      ref={dialogRef}
    >
      <div className="suggestionReviewShell">
        <header className="suggestionReviewHeader">
          <div>
            <span>Admin review</span>
            <h2 id="suggestion-review-title">
              {confirmStatus ? `${actionLabel} suggestion?` : "Suggestion details"}
            </h2>
          </div>
          <button aria-label="Close suggestion details" disabled={busy} onClick={closeDialog} ref={closeButtonRef} type="button">
            <X size={20} />
          </button>
        </header>

        {loading && <div className="suggestionDetailsLoading"><Loader2 className="spin" /> Loading details</div>}

        {!loading && suggestion && confirmStatus && (
          <div className="suggestionConfirmation" role="alertdialog">
            <p>
              Confirm that you want to {actionLabel.toLowerCase()} <strong>{suggestion.english}</strong> as a moderation decision.
            </p>
            <span>This will not add the suggestion to the dictionary.</span>
            <div>
              <button className="ghostButton" disabled={busy} onClick={() => setConfirmStatus("")} type="button">
                Cancel
              </button>
              <button
                className={confirmStatus === "approved" ? "primaryButton" : "dangerButton"}
                disabled={busy}
                onClick={() => onModerate(confirmStatus)}
                type="button"
              >
                {busy ? <Loader2 className="spin" size={18} /> : confirmStatus === "approved" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                {actionLabel}
              </button>
            </div>
          </div>
        )}

        {!loading && suggestion && !confirmStatus && (
          <>
            <dl className="suggestionDetails">
              <DetailItem label="English" value={suggestion.english} />
              <DetailItem label="Somali" value={suggestion.somali} />
              <DetailItem label="Type" value={capitalize(suggestion.type)} />
              <DetailItem
                label="Status"
                value={<SuggestionStatus converted={suggestion.convertedToWord} status={suggestion.status} />}
              />
              <DetailItem label="Submitted" value={formatDateTime(suggestion.submittedAt)} />
              <DetailItem label="Last updated" value={formatDateTime(suggestion.updatedAt)} />
              {suggestion.reviewedAt && <DetailItem label="Reviewed" value={formatDateTime(suggestion.reviewedAt)} />}
              {suggestion.reviewedBy?.name && <DetailItem label="Reviewed by" value={suggestion.reviewedBy.name} />}
              {suggestion.convertedAt && <DetailItem label="Added" value={formatDateTime(suggestion.convertedAt)} />}
              {suggestion.convertedBy?.name && <DetailItem label="Added by" value={suggestion.convertedBy.name} />}
              <DetailItem full label="Note" value={suggestion.note || "No note provided."} />
            </dl>

            <div className="suggestionReviewActions">
              <button className="ghostButton" onClick={closeDialog} type="button">Close</button>
              {suggestion.status === "pending" && (
                <>
                  <button className="dangerButton" onClick={() => setConfirmStatus("rejected")} type="button">
                    <XCircle size={18} /> Reject
                  </button>
                  <button className="primaryButton" onClick={() => setConfirmStatus("approved")} type="button">
                    <CheckCircle2 size={18} /> Approve
                  </button>
                </>
              )}
              {suggestion.status === "approved" && !suggestion.convertedToWord && (
                <button className="primaryButton" onClick={() => onStartConversion(suggestion)} type="button">
                  <BookPlus size={18} />
                  Add to Dictionary
                </button>
              )}
              {suggestion.convertedToWord && getSuggestionWordId(suggestion) && (
                <a className="primaryButton" href={`/word/${getSuggestionWordId(suggestion)}`}>
                  <ExternalLink size={18} />
                  View Word
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}

function DetailItem({ label, value, full = false }) {
  return (
    <div className={full ? "full" : ""}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function SuggestionStatus({ status, converted = false }) {
  const Icon = converted ? BookCheck : status === "approved" ? CheckCircle2 : status === "rejected" ? XCircle : Clock3;
  const label = converted ? "Added" : capitalize(status);
  return (
    <span className={`suggestionStatus suggestionStatus-${converted ? "converted" : status}`}>
      <Icon size={14} /> {label}
    </span>
  );
}

function SuggestionSelect({ label, value, options, onChange }) {
  return (
    <label>
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function getEmptyMessage(filters, query) {
  if (query.trim() || filters.type !== "all") return "No suggestions match your filters.";
  if (filters.status === "pending") return "No pending suggestions.";
  if (filters.status === "approved") return "No approved suggestions.";
  if (filters.status === "rejected") return "No rejected suggestions.";
  return "No suggestions available.";
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function capitalize(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getSuggestionWordId(suggestion) {
  if (!suggestion?.wordId) return "";
  return typeof suggestion.wordId === "object" ? suggestion.wordId._id || "" : suggestion.wordId;
}
