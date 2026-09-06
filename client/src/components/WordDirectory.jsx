import Link from "next/link";
import { BookOpen, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { getWordPath } from "@/lib/seo";

export const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

export function WordDirectory({ items, pagination, activeLetter = "", basePath = "/words" }) {
  return (
    <>
      <nav className="mb-8 flex flex-wrap gap-2" aria-label="Browse dictionary by letter">
        <Link
          className={`grid min-h-11 min-w-11 place-items-center rounded-xl border px-3 text-sm font-black transition ${
            activeLetter
              ? "border-[#dce8e3] bg-white text-ink hover:border-[#9fc8c1]"
              : "border-forest bg-forest text-white"
          }`}
          href="/words"
        >
          All
        </Link>
        {ALPHABET.map((letter) => (
          <Link
            aria-current={activeLetter === letter ? "page" : undefined}
            className={`grid min-h-11 min-w-11 place-items-center rounded-xl border px-3 text-sm font-black uppercase transition ${
              activeLetter === letter
                ? "border-forest bg-forest text-white"
                : "border-[#dce8e3] bg-white text-ink hover:border-[#9fc8c1]"
            }`}
            href={`/words/${letter}`}
            key={letter}
          >
            {letter}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <section className="grid min-h-52 place-items-center rounded-3xl border border-dashed border-[#dce8e3] bg-white p-6 text-center">
          <div>
            <BookOpen className="mx-auto mb-3 text-ocean" size={28} aria-hidden="true" />
            <h2 className="text-xl font-black text-ink">No published words found</h2>
            <p className="mt-2 font-semibold text-muted">Try another letter or return to the full dictionary.</p>
          </div>
        </section>
      ) : (
        <section className="wordGrid" aria-label="Dictionary entries">
          {items.map((word) => {
            const english = word.englishWord || word.english;
            const somali = word.somaliWord || word.somali;
            const definition = word.englishDefinition || word.definitions?.english?.[0];
            const category = word.category?.name || word.categories?.[0]?.name;

            return (
              <article className="wordCard" key={word._id}>
                <div>
                  <h2>
                    <Link href={getWordPath(word)}>{english}</Link>
                  </h2>
                  <span>{word.partOfSpeech || "word"}</span>
                </div>
                <strong lang="so">{somali}</strong>
                {category && (
                  <p className="inline-flex items-center gap-1 text-sm">
                    <Tag size={14} aria-hidden="true" />
                    {category}
                  </p>
                )}
                <p>{definition || `${english} translates to ${somali} in Somali.`}</p>
                <Link className="font-black text-forest" href={getWordPath(word)}>
                  View {english}
                </Link>
              </article>
            );
          })}
        </section>
      )}

      {pagination.pages > 1 && (
        <nav className="mt-8 flex items-center justify-between gap-4" aria-label="Dictionary pagination">
          {pagination.page > 1 ? (
            <Link className="ghostButton" href={pageHref(basePath, pagination.page - 1)} rel="prev">
              <ChevronLeft size={17} aria-hidden="true" />
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm font-black text-muted">
            Page {pagination.page} of {pagination.pages}
          </span>
          {pagination.page < pagination.pages ? (
            <Link className="ghostButton" href={pageHref(basePath, pagination.page + 1)} rel="next">
              Next
              <ChevronRight size={17} aria-hidden="true" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}

function pageHref(basePath, page) {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}
