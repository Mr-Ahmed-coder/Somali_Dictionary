import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ALPHABET, WordDirectory } from "@/components/WordDirectory";
import { getWords } from "@/lib/api";
import { absoluteUrl, buildMetadata, getWordPath } from "@/lib/seo";

const PAGE_SIZE = 48;

export async function generateMetadata({ params, searchParams }) {
  const { letter: rawLetter } = await params;
  const { page } = await searchParams;
  const letter = rawLetter.toLowerCase();

  if (!ALPHABET.includes(letter)) {
    return { title: "Dictionary Letter Not Found", robots: { index: false, follow: false } };
  }

  const pageNumber = parsePage(page);
  const basePath = `/words/${letter}`;
  const path = pageNumber > 1 ? `${basePath}?page=${pageNumber}` : basePath;
  const letterLabel = letter.toUpperCase();

  return buildMetadata({
    title: `${letterLabel} Words in the English–Somali Dictionary${pageNumber > 1 ? `, Page ${pageNumber}` : ""}`,
    description: `Browse English words beginning with ${letterLabel} and their Somali translations, definitions, categories, and word types.`,
    path
  });
}

export default async function LetterPage({ params, searchParams }) {
  const { letter: rawLetter } = await params;
  const { page } = await searchParams;
  const letter = rawLetter.toLowerCase();
  if (!ALPHABET.includes(letter)) notFound();

  const pageNumber = parsePage(page);
  const result = await getWords({
    page: pageNumber,
    limit: PAGE_SIZE,
    letter,
    sort: "alphabetical"
  }).catch(() => ({
    items: [],
    pagination: { page: pageNumber, pages: 1, total: 0, limit: PAGE_SIZE }
  }));
  const pagination = result.pagination || { page: pageNumber, pages: 1, total: result.items?.length || 0 };
  if (pageNumber > 1 && pageNumber > pagination.pages) notFound();

  return (
    <main className="pageShell">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${letter.toUpperCase()} Words: English to Somali`,
          url: absoluteUrl(pageNumber > 1 ? `/words/${letter}?page=${pageNumber}` : `/words/${letter}`),
          mainEntity: {
            "@type": "ItemList",
            itemListElement: (result.items || []).map((word, index) => ({
              "@type": "ListItem",
              position: (pageNumber - 1) * PAGE_SIZE + index + 1,
              name: `${word.englishWord || word.english} – ${word.somaliWord || word.somali}`,
              url: absoluteUrl(getWordPath(word))
            }))
          }
        }}
      />
      <header className="pageHeader">
        <Link href="/words">← Dictionary A–Z</Link>
        <h1>{letter.toUpperCase()} Words: English to Somali</h1>
        <p>
          Browse {pagination.total || 0} published English {letter.toUpperCase()} words and their Somali translations.
        </p>
      </header>
      <WordDirectory
        activeLetter={letter}
        basePath={`/words/${letter}`}
        items={result.items || []}
        pagination={pagination}
      />
    </main>
  );
}

function parsePage(value) {
  const page = Number(value || 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
