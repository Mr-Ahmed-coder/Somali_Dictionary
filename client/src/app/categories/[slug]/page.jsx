import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PublicPagination } from "@/components/PublicPagination";
import { getCategoryBySlug } from "@/lib/api";
import { absoluteUrl, buildMetadata, getWordPath } from "@/lib/seo";

const PAGE_SIZE = 48;

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const { page } = await searchParams;
  const pageNumber = parsePage(page);
  const result = await getCategoryBySlug(slug, { page: 1, limit: 1 }).catch(() => null);

  if (!result?.item) {
    return { title: "Category Not Found", robots: { index: false, follow: false } };
  }

  const count = Number(result.item.wordCount ?? result.words?.length ?? 0);
  return buildMetadata({
    title: `${result.item.name} English–Somali Words${pageNumber > 1 ? `, Page ${pageNumber}` : ""}`,
    description:
      result.item.description ||
      `Browse ${count} ${result.item.name} words with English and Somali translations.`,
    path: `/categories/${encodeURIComponent(result.item.slug)}${pageNumber > 1 ? `?page=${pageNumber}` : ""}`,
    index: count > 0
  });
}

export default async function CategoryDetailPage({ params, searchParams }) {
  const { slug } = await params;
  const { page } = await searchParams;
  const pageNumber = parsePage(page);
  const result = await getCategoryBySlug(slug, { page: pageNumber, limit: PAGE_SIZE }).catch((error) => {
    if (error.status === 404) notFound();
    throw error;
  });
  if (!result.item) notFound();
  const pagination = result.pagination || { page: pageNumber, pages: 1, total: result.words?.length || 0, limit: PAGE_SIZE };
  if (pageNumber > 1 && pageNumber > pagination.pages) notFound();
  const basePath = `/categories/${encodeURIComponent(result.item.slug)}`;
  const canonicalPath = pageNumber > 1 ? `${basePath}?page=${pageNumber}` : basePath;

  return (
    <main className="pageShell">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${result.item.name} English–Somali Words`,
          description: result.item.description || `English and Somali words in ${result.item.name}.`,
          url: absoluteUrl(canonicalPath),
          mainEntity: {
            "@type": "ItemList",
            itemListElement: (result.words || []).map((word, index) => ({
              "@type": "ListItem",
              position: (pageNumber - 1) * PAGE_SIZE + index + 1,
              name: `${word.englishWord || word.english} - ${word.somaliWord || word.somali}`,
              url: absoluteUrl(getWordPath(word))
            }))
          },
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "Categories", item: absoluteUrl("/categories") },
              { "@type": "ListItem", position: 3, name: result.item.name, item: absoluteUrl(canonicalPath) }
            ]
          }
        }}
      />
      <header className="pageHeader">
        <Link href="/categories">← Categories</Link>
        <h1>{result.item?.name || "Category"}</h1>
        <p>
          {result.item?.description || "Words in this category."} {pagination.total || 0} published words.
        </p>
      </header>

      <section className="wordGrid">
        {result.words.length === 0 && (
          <article className="wordCard">
            <h2>No words available in this category.</h2>
            <p>Browse another category to continue exploring the dictionary.</p>
          </article>
        )}
        {result.words.map((word) => (
          <article className="wordCard" key={word._id}>
            <div>
              <h2>
                <Link href={getWordPath(word)}>{word.englishWord || word.english}</Link>
              </h2>
              <span>{word.partOfSpeech}</span>
            </div>
            <strong lang="so">{word.somaliWord || word.somali}</strong>
            <p>
              {word.englishDefinition ||
                word.definitions?.english?.[0] ||
                `${word.englishWord || word.english} translates to ${word.somaliWord || word.somali} in Somali.`}
            </p>
            <Link className="font-black text-forest" href={getWordPath(word)}>
              View word details
            </Link>
          </article>
        ))}
      </section>
      <PublicPagination basePath={basePath} pagination={pagination} />
    </main>
  );
}

function parsePage(value) {
  const page = Number(value || 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
