import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { WordDirectory } from "@/components/WordDirectory";
import { getWords } from "@/lib/api";
import { absoluteUrl, buildMetadata, getWordPath } from "@/lib/seo";

const PAGE_SIZE = 48;

export async function generateMetadata({ searchParams }) {
  const { page } = await searchParams;
  const pageNumber = parsePage(page);
  const path = pageNumber > 1 ? `/words?page=${pageNumber}` : "/words";

  return buildMetadata({
    title: pageNumber > 1 ? `English–Somali Words, Page ${pageNumber}` : "Browse English–Somali Words A–Z",
    description: "Browse published English words with Somali translations, definitions, categories, and parts of speech.",
    path
  });
}

export default async function WordsPage({ searchParams }) {
  const { page } = await searchParams;
  const pageNumber = parsePage(page);
  const result = await getWords({ page: pageNumber, limit: PAGE_SIZE, sort: "alphabetical" }).catch(() => ({
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
          name: "English–Somali Dictionary A–Z",
          url: absoluteUrl(pageNumber > 1 ? `/words?page=${pageNumber}` : "/words"),
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
        <Link href="/">← Home</Link>
        <h1>English–Somali Dictionary A–Z</h1>
        <p>Browse published English words with Somali translations, definitions, and word types.</p>
      </header>
      <WordDirectory items={result.items || []} pagination={pagination} />
    </main>
  );
}

function parsePage(value) {
  const page = Number(value || 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
