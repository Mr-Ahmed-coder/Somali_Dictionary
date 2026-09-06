import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { getCategoryBySlug } from "@/lib/api";
import { absoluteUrl, buildMetadata, getWordPath } from "@/lib/seo";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await getCategoryBySlug(slug).catch(() => null);

  if (!result?.item) {
    return { title: "Category Not Found", robots: { index: false, follow: false } };
  }

  const count = Number(result.item.wordCount ?? result.words?.length ?? 0);
  return buildMetadata({
    title: `${result.item.name} English–Somali Words`,
    description:
      result.item.description ||
      `Browse ${count} ${result.item.name} words with English and Somali translations.`,
    path: `/categories/${encodeURIComponent(result.item.slug)}`,
    index: count > 0
  });
}

export default async function CategoryDetailPage({ params }) {
  const { slug } = await params;
  const result = await getCategoryBySlug(slug).catch((error) => {
    if (error.status === 404) notFound();
    throw error;
  });
  if (!result.item) notFound();
  const canonicalPath = `/categories/${encodeURIComponent(result.item.slug)}`;

  return (
    <main className="pageShell">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${result.item.name} English–Somali Words`,
          description: result.item.description || `English and Somali words in ${result.item.name}.`,
          url: absoluteUrl(canonicalPath),
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
        <p>{result.item?.description || "Words in this category."}</p>
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
    </main>
  );
}
