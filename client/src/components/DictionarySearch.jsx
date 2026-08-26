"use client";

import { ArrowRightLeft, BookOpen, ChevronDown, Languages, Loader2, Search, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getSearchSuggestions, searchWords, trackMissingSearch } from "@/lib/api";
import { getErrorMessage } from "@/lib/errorMessage";
import { SearchEmptyState, SearchErrorState, SearchLoadingState } from "@/components/SearchStates";
import { SearchForm } from "@/components/SearchForm";
import { SearchResultCard } from "@/components/SearchResultCard";
import { SearchResultLink } from "@/components/SearchResultLink";
import { WordSuggestionDialog } from "@/components/WordSuggestionDialog";

export function DictionarySearch({ compact = false, variant = "default" }) {
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState("auto");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionStatus, setSuggestionStatus] = useState("idle");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [completedSearch, setCompletedSearch] = useState({ query: "", direction: "auto", missing: false });
  const activeSearchesRef = useRef(new Set());
  const isHome = variant === "home";
  const [pagination, setPagination] = useState({ page: 1, limit: compact || isHome ? 4 : 12, pages: 1, total: 0 });

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setSuggestions([]);
      setSuggestionStatus("idle");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSuggestionStatus("loading");

      try {
        const result = await getSearchSuggestions({
          query: trimmedQuery,
          limit: compact || isHome ? 6 : 8,
          signal: controller.signal
        });
        setSuggestions(result.suggestions || []);
        setSuggestionStatus("success");
      } catch (suggestionError) {
        if (suggestionError.name === "AbortError") return;
        setSuggestions([]);
        setSuggestionStatus("error");
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [compact, isHome, query]);

  async function runSearch(page = 1, nextQuery = query) {
    const trimmedQuery = nextQuery.trim();
    if (!trimmedQuery) return;

    const searchKey = `${direction}:${trimmedQuery.toLocaleLowerCase()}:${page}`;
    if (activeSearchesRef.current.has(searchKey)) return;
    activeSearchesRef.current.add(searchKey);

    setStatus("loading");
    setError("");
    setShowSuggestions(false);

    try {
      const result = await searchWords({
        query: trimmedQuery,
        direction,
        page,
        limit: pagination.limit
      });

      const resultItems = result.items || [];
      const totalResults = Number(result.pagination?.total ?? resultItems.length);

      setItems(resultItems);
      setPagination(result.pagination || { page, limit: pagination.limit, pages: 1, total: totalResults });
      setStatus("success");

      const missing = page === 1 && resultItems.length === 0 && totalResults === 0;
      setCompletedSearch({ query: trimmedQuery, direction, missing });

      if (missing) {
        void trackMissingSearch(trimmedQuery).catch(() => {});
      }
    } catch (searchError) {
      setItems([]);
      setError(getErrorMessage(searchError, "Could not connect to the dictionary API."));
      setStatus("error");
      setCompletedSearch({ query: "", direction, missing: false });
    } finally {
      activeSearchesRef.current.delete(searchKey);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    await runSearch(1);
  }

  function handleQueryChange(value) {
    setQuery(value);
    setShowSuggestions(Boolean(value.trim()));
  }

  async function handleSuggestionClick(suggestion) {
    const nextQuery = suggestion.englishWord || suggestion.somaliWord || suggestion.label;
    setQuery(nextQuery);
    setDirection("auto");
    setShowSuggestions(false);
    await runSearch(1, nextQuery);
  }

  if (isHome) {
    return (
      <section className="homeDictionarySearch">
        <form className="homeSearchForm" onSubmit={onSubmit}>
          <div className="homeSearchPrimary">
            <div className="homeSearchInputWrap">
              <Search
                className="homeSearchIcon"
                size={24}
                aria-hidden="true"
              />
              <input
                className="homeSearchInput"
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                onFocus={() => setShowSuggestions(Boolean(query.trim()))}
                placeholder="Search English or Somali words..."
                autoComplete="off"
                aria-label="Search English or Somali dictionary words"
              />
            </div>

            <label className="homeSearchDirection">
              <Languages size={19} aria-hidden="true" />
              <span className="sr-only">Search direction</span>
              <select value={direction} onChange={(event) => setDirection(event.target.value)} aria-label="Search direction">
                <option value="auto">Both languages</option>
                <option value="english-to-somali">English to Somali</option>
                <option value="somali-to-english">Somali to English</option>
              </select>
              <ChevronDown size={17} aria-hidden="true" />
            </label>

            <button
              className="homeSearchButton"
              disabled={status === "loading" || !query.trim()}
              type="submit"
            >
              {status === "loading" ? <Loader2 className="spin" size={20} /> : <Search size={20} />}
              Search
            </button>
          </div>
        </form>

        <SuggestionList
          home
          status={suggestionStatus}
          suggestions={suggestions}
          visible={showSuggestions && query.trim().length >= 2}
          onSelect={handleSuggestionClick}
        />

        <div className="mt-6 grid gap-3 text-left">
          {status === "loading" && <HomeSearchState icon={<Loader2 className="spin" size={22} />} title="Searching dictionary" />}
          {status === "error" && <HomeSearchState title="Search unavailable" description={error} />}
          {status === "success" && items.length === 0 && (
            <HomeSearchState
              empty
              icon={<BookOpen size={24} />}
              title="Ereygan lama helin."
              description="Dhawaan ayaan ku soo dari doonnaa."
            >
              {completedSearch.missing && (
                <WordSuggestionDialog query={completedSearch.query} direction={completedSearch.direction} />
              )}
            </HomeSearchState>
          )}
          {items.map((item) => (
            <HomeResultCard word={item} key={item._id} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={compact ? "searchPanel compactSearchPanel" : "searchExperience"}>
      <div className="panelTitle">
        <ArrowRightLeft />
        <span>Dictionary Search</span>
      </div>

      <SearchForm
        query={query}
        direction={direction}
        loading={status === "loading"}
        onQueryChange={handleQueryChange}
        onDirectionChange={setDirection}
        onSubmit={onSubmit}
      />

      <SuggestionList
        status={suggestionStatus}
        suggestions={suggestions}
        visible={showSuggestions && query.trim().length >= 2}
        onSelect={handleSuggestionClick}
      />

      <div className={compact ? "compactResults" : "searchResultsGrid"}>
        {status === "loading" && <SearchLoadingState />}
        {status === "error" && <SearchErrorState message={error} />}
        {status === "success" && items.length === 0 && (
          <SearchEmptyState>
            {completedSearch.missing && (
              <WordSuggestionDialog query={completedSearch.query} direction={completedSearch.direction} />
            )}
          </SearchEmptyState>
        )}
        {items.map((item) =>
          compact ? (
            <SearchResultLink
              className="wordResult block transition hover:-translate-y-0.5 hover:shadow-sm"
              href={`/word/${item._id}`}
              wordId={item._id}
              key={item._id}
              aria-label={`Open details for ${item.englishWord || item.english}`}
            >
              <div>
                <strong>{item.englishWord || item.english}</strong>
                <span>{item.partOfSpeech}</span>
              </div>
              <p>{item.somaliWord || item.somali}</p>
              {(item.englishDefinition || item.definitions?.english?.[0]) && (
                <small>{item.englishDefinition || item.definitions?.english?.[0]}</small>
              )}
            </SearchResultLink>
          ) : (
            <SearchResultCard word={item} key={item._id} />
          )
        )}
      </div>

      {!compact && status === "success" && pagination.pages > 1 && (
        <div className="searchPagination">
          <button disabled={pagination.page <= 1} onClick={() => runSearch(pagination.page - 1)} type="button">
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => runSearch(pagination.page + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}

function SuggestionList({ home = false, status, suggestions, visible, onSelect }) {
  if (!visible) return null;

  const shellClass = home
    ? "mx-auto mt-3 w-full max-w-4xl overflow-hidden rounded-3xl bg-white text-left shadow-search ring-1 ring-black/5"
    : "mt-3 overflow-hidden rounded-2xl border border-[#dce8e3] bg-white";

  return (
    <div className={shellClass}>
      {status === "loading" && (
        <div className="flex min-h-14 items-center gap-2 px-4 text-sm font-bold text-muted">
          <Loader2 className="spin" size={16} />
          Finding suggestions
        </div>
      )}

      {status === "success" && suggestions.length === 0 && (
        <div className="px-4 py-4 text-sm font-bold text-muted">No suggestions found.</div>
      )}

      {status === "error" && (
        <div className="px-4 py-4 text-sm font-bold text-[#b42318]">Suggestions are unavailable right now.</div>
      )}

      {suggestions.length > 0 && (
        <div className="grid divide-y divide-[#edf3f1]">
          {suggestions.map((suggestion) => (
            <button
              className="flex w-full items-center justify-between gap-4 bg-white px-4 py-3 text-left transition hover:bg-[#f6fbf9]"
              key={suggestion.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(suggestion)}
              type="button"
            >
              <span>
                <strong className="block text-sm font-black text-ink">{suggestion.englishWord}</strong>
                <span className="block text-sm font-semibold text-muted">{suggestion.somaliWord}</span>
              </span>
              <span className="shrink-0 rounded-full bg-[#e7f4f1] px-3 py-1 text-xs font-black uppercase text-forest">
                {suggestion.partOfSpeech || "word"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HomeResultCard({ word }) {
  const englishWord = word.englishWord || word.english;
  const somaliWord = word.somaliWord || word.somali;
  const englishDefinition = word.englishDefinition || word.definitions?.english?.[0];
  const somaliDefinition = word.somaliDefinition || word.definitions?.somali?.[0];

  return (
    <SearchResultLink
      className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-search"
      href={`/word/${word._id}`}
      wordId={word._id}
      aria-label={`Open details for ${englishWord}`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#e7f4f1] px-3 py-1 text-xs font-black uppercase text-forest">
          {word.partOfSpeech || "word"}
        </span>
        {word.category?.name && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#dce8e3] px-3 py-1 text-xs font-black text-muted">
            <Tag size={13} />
            {word.category.name}
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#f6fbf9] p-4">
          <span className="text-xs font-black uppercase text-muted">English</span>
          <strong className="mt-1 block text-2xl font-black text-ink">{englishWord}</strong>
        </div>
        <div className="rounded-2xl bg-[#fff8f1] p-4">
          <span className="text-xs font-black uppercase text-muted">Somali</span>
          <strong className="mt-1 block text-2xl font-black text-ink">{somaliWord}</strong>
        </div>
      </div>

      {(englishDefinition || somaliDefinition) && (
        <div className="mt-4 flex gap-3 border-t border-[#e4ece8] pt-4 text-sm leading-6 text-muted">
          <BookOpen className="mt-1 shrink-0 text-ocean" size={18} />
          <div>
            {englishDefinition && <p className="m-0">{englishDefinition}</p>}
            {somaliDefinition && <p className="m-0">{somaliDefinition}</p>}
          </div>
        </div>
      )}
    </SearchResultLink>
  );
}

function HomeSearchState({ empty = false, icon = null, title, description, children = null }) {
  const stateClass = empty
    ? "grid min-h-44 place-items-center rounded-3xl border border-[#cfe2dc] bg-[#f4fbf8] p-6 text-center text-muted shadow-sm"
    : "grid min-h-32 place-items-center rounded-3xl border border-dashed border-[#cfddd8] bg-white/70 p-6 text-center text-muted";
  const iconClass = empty
    ? "grid size-14 place-items-center rounded-2xl bg-white text-ocean shadow-sm ring-1 ring-[#dce8e3]"
    : "";

  return (
    <div className={stateClass}>
      <div className="grid max-w-md place-items-center gap-3">
        {icon && <span className={iconClass}>{icon}</span>}
        <strong className="text-base font-black text-ink">{title}</strong>
        {description && <p className="m-0 max-w-xl text-sm font-semibold leading-6">{description}</p>}
        {children}
      </div>
    </div>
  );
}
