"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Loader2, Search, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getCategoryBySlug } from "@/lib/api";
import { getErrorMessage } from "@/lib/errorMessage";
import { getWordPath } from "@/lib/seo";

export function CategoryBrowser({ categories, initialCategoryData = {} }) {
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug || "");
  const firstData = initialCategoryData[categories[0]?.slug] || {};
  const [category, setCategory] = useState(firstData.item || categories[0] || null);
  const [words, setWords] = useState(firstData.words || []);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(
    firstData.pagination || { page: 1, pages: 1, total: firstData.words?.length || 0, limit: 48 }
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!activeSlug) return;

    let ignore = false;
    setStatus("loading");
    setError("");

    const cached = page === 1 ? initialCategoryData[activeSlug] : null;
    if (cached) {
      setCategory(cached.item || categories.find((item) => item.slug === activeSlug) || null);
      setWords(cached.words || []);
      setPagination(cached.pagination || { page: 1, pages: 1, total: cached.words?.length || 0, limit: 48 });
      setStatus("success");
      return;
    }

    getCategoryBySlug(activeSlug, { page, limit: 48 })
      .then((result) => {
        if (ignore) return;
        setCategory(result.item || null);
        setWords(result.words || []);
        setPagination(result.pagination || { page, pages: 1, total: result.words?.length || 0, limit: 48 });
        setStatus("success");
      })
      .catch((fetchError) => {
        if (ignore) return;
        setCategory(categories.find((item) => item.slug === activeSlug) || null);
        setWords([]);
        setError(getErrorMessage(fetchError, "Could not load category words."));
        setStatus("error");
      });

    return () => {
      ignore = true;
    };
  }, [activeSlug, categories, initialCategoryData, page]);

  const filteredWords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return words;

    return words.filter((word) => {
      const english = word.englishWord || word.english || "";
      const somali = word.somaliWord || word.somali || "";
      const partOfSpeech = word.partOfSpeech || "";
      const definition = word.englishDefinition || word.definitions?.english?.[0] || "";
      return [english, somali, partOfSpeech, definition].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [query, words]);

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 px-5 pb-16 sm:px-8 lg:px-10">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((item) => {
          const active = item.slug === activeSlug;
          return (
            <Link
              className={`rounded-3xl border p-4 text-left transition ${
                active
                  ? "border-forest bg-forest text-white shadow-search"
                  : "border-[#dce8e3] bg-white text-ink shadow-sm hover:-translate-y-0.5 hover:border-[#9fc8c1]"
              }`}
              key={item.slug}
              href={`/categories/${item.slug}`}
              onClick={(event) => {
                if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                setActiveSlug(item.slug);
                setPage(1);
                setQuery("");
              }}
            >
              <span className={`mb-4 grid size-10 place-items-center rounded-2xl ${active ? "bg-white/15" : "bg-[#e7f4f1] text-forest"}`}>
                <Tag size={18} />
              </span>
              <strong className="block text-lg font-black">{item.name}</strong>
              <span className={`mt-1 block text-sm font-bold ${active ? "text-white/75" : "text-muted"}`}>
                {item.wordCount || 0} words
              </span>
            </Link>
          );
        })}
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-search ring-1 ring-black/5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="m-0 text-sm font-black uppercase text-ocean">Selected category</p>
            <h2 className="mt-2 text-3xl font-black text-ink sm:text-4xl">{category?.name || "Category"}</h2>
            {category?.description && <p className="mt-2 max-w-2xl font-semibold leading-7 text-muted">{category.description}</p>}
          </div>

          <label className="m-0 w-full lg:max-w-sm">
            <span className="mb-2 block text-xs font-black uppercase text-muted">Filter words</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                className="min-h-12 rounded-2xl border border-[#dce8e3] bg-[#f7fbfa] pl-11 pr-4 font-bold text-ink outline-none transition focus:bg-white focus:ring-2 focus:ring-ocean"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter this category"
              />
            </span>
          </label>
        </div>

        <div className="mt-6">
          {status === "loading" && (
            <div className="grid min-h-52 place-items-center rounded-3xl border border-dashed border-[#dce8e3] text-muted">
              <span className="inline-flex items-center gap-2 font-black">
                <Loader2 className="spin" size={20} />
                Loading words
              </span>
            </div>
          )}

          {status === "error" && (
            <div className="grid min-h-52 place-items-center rounded-3xl border border-dashed border-[#f4b8ae] bg-[#fff8f6] p-6 text-center font-bold text-[#b42318]">
              {error}
            </div>
          )}

          {status === "success" && filteredWords.length === 0 && (
            <div className="grid min-h-52 place-items-center rounded-3xl border border-dashed border-[#dce8e3] bg-[#f7fbfa] p-6 text-center">
              <div>
                <BookOpen className="mx-auto mb-3 text-ocean" size={28} />
                <strong className="block text-lg font-black text-ink">No words found</strong>
                <p className="mt-2 font-semibold text-muted">Try another category or clear the filter.</p>
              </div>
            </div>
          )}

          {status === "success" && filteredWords.length > 0 && (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredWords.map((word) => (
                  <CategoryWordCard word={word} key={word._id} />
                ))}
              </div>
              {pagination.pages > 1 && (
                <nav className="mt-7 flex items-center justify-between gap-4" aria-label="Selected category pagination">
                  <button
                    className="ghostButton"
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft size={17} aria-hidden="true" />
                    Previous
                  </button>
                  <span className="text-sm font-black text-muted">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    className="ghostButton"
                    type="button"
                    disabled={page >= pagination.pages}
                    onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
                  >
                    Next
                    <ChevronRight size={17} aria-hidden="true" />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function CategoryWordCard({ word }) {
  const english = word.englishWord || word.english;
  const somali = word.somaliWord || word.somali;
  const definition = word.englishDefinition || word.definitions?.english?.[0];

  return (
    <Link
      className="group grid gap-4 rounded-3xl border border-[#dce8e3] bg-[#fbfdfc] p-5 transition hover:-translate-y-0.5 hover:border-[#9fc8c1] hover:shadow-search"
      href={getWordPath(word)}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#e7f4f1] px-3 py-1 text-xs font-black uppercase text-forest">
          {word.partOfSpeech || "word"}
        </span>
        <ArrowRight className="text-muted transition group-hover:text-forest" size={18} />
      </div>
      <div>
        <span className="text-xs font-black uppercase text-muted">English</span>
        <strong className="mt-1 block break-words text-2xl font-black text-ink">{english}</strong>
      </div>
      <div>
        <span className="text-xs font-black uppercase text-muted">Somali</span>
        <strong className="mt-1 block break-words text-2xl font-black text-forest">{somali}</strong>
      </div>
      {definition && <p className="m-0 line-clamp-3 font-semibold leading-7 text-muted">{definition}</p>}
    </Link>
  );
}
