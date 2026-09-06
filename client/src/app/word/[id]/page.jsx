import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, BookOpen, Languages, Quote, Share2, Tag } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { JsonLd } from "@/components/JsonLd";
import { RecentSearchRecorder } from "@/components/RecentSearchRecorder";
import { WordShareActions } from "@/components/WordShareActions";
import { getWordByIdentifier } from "@/lib/api";
import { absoluteUrl, buildMetadata, getWordPath, SITE_NAME } from "@/lib/seo";

export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const word = await getWordByIdentifier(id);
    const englishWord = word.englishWord || word.english || "Word";
    const somaliWord = word.somaliWord || word.somali || "Somali translation";
    const categoryName = word.category?.name || word.categories?.[0]?.name;
    const partOfSpeech = word.partOfSpeech || "word";
    const isPublished = word.status === undefined || word.status === "published";
    const canonicalPath = isPublished ? getWordPath(word) : `/word/${encodeURIComponent(id)}`;
    const description = `${englishWord} means ${somaliWord} in Somali. View its ${partOfSpeech} details${
      categoryName ? ` in the ${categoryName} category` : ""
    }, definitions, and examples.`;

    return buildMetadata({
      title: `${englishWord} in Somali: ${somaliWord}`,
      description,
      path: canonicalPath,
      index: isPublished,
      type: "article",
      keywords: [englishWord, somaliWord, `${englishWord} in Somali`, `${somaliWord} in English`]
    });
  } catch {
    return {
      title: "Word Not Found",
      description: "The requested English or Somali dictionary word could not be found.",
      robots: { index: false, follow: false }
    };
  }
}

export default async function WordDetailPage({ params }) {
  const { id } = await params;
  let word;

  try {
    word = await getWordByIdentifier(id);
  } catch (error) {
    if (error.status === 404 || error.status === 400) notFound();
    throw error;
  }

  const englishWord = word.englishWord || word.english;
  const somaliWord = word.somaliWord || word.somali;
  const englishDefinition = word.englishDefinition || word.definitions?.english?.[0];
  const somaliDefinition = word.somaliDefinition || word.definitions?.somali?.[0];
  const englishExample = word.englishExample || word.examples?.[0]?.english;
  const somaliExample = word.somaliExample || word.examples?.[0]?.somali;
  const categoryName = word.category?.name || word.categories?.[0]?.name;
  const categorySlug = word.category?.slug || word.categories?.[0]?.slug;
  const isPublished = word.status === undefined || word.status === "published";
  const canonicalPath = getWordPath(word);
  const requestedPath = `/word/${encodeURIComponent(id)}`;

  if (isPublished && requestedPath !== canonicalPath) {
    permanentRedirect(canonicalPath);
  }

  const browserWord = {
    _id: word._id,
    english: englishWord,
    somali: somaliWord,
    category: categoryName,
    type: word.partOfSpeech || "word"
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e9f7f3_0%,#f8fbfa_44%,#eef4f1_100%)] text-ink">
      {isPublished && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: `${englishWord} in Somali: ${somaliWord}`,
            url: absoluteUrl(canonicalPath),
            inLanguage: ["en", "so"],
            isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: "Words", item: absoluteUrl("/words") },
                { "@type": "ListItem", position: 3, name: englishWord, item: absoluteUrl(canonicalPath) }
              ]
            },
            mainEntity: {
              "@type": "DefinedTerm",
              name: englishWord,
              alternateName: somaliWord,
              description:
                englishDefinition || `${englishWord} translates to ${somaliWord} in the Somali language.`,
              inDefinedTermSet: {
                "@type": "DefinedTermSet",
                name: "English–Somali Dictionary",
                url: absoluteUrl("/words")
              }
            }
          }}
        />
      )}
      <RecentSearchRecorder word={browserWord} />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
        <Link className="flex items-center gap-2 text-sm font-black text-forest sm:text-base" href="/">
          <span className="grid size-10 place-items-center rounded-2xl bg-white text-ocean shadow-sm ring-1 ring-black/5">
            <Languages size={21} />
          </span>
          <span>English Somali</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-3 text-sm font-bold text-muted sm:gap-6">
          <Link className="transition hover:text-forest" href="/search">
            Search
          </Link>
          <Link className="transition hover:text-forest" href="/words">
            Words
          </Link>
          <Link className="transition hover:text-forest" href="/about">
            About
          </Link>
          <Link className="transition hover:text-forest" href="/favorites">
            Favorites
          </Link>
          <Link className="transition hover:text-forest" href="/recent">
            Recent
          </Link>
          <Link className="transition hover:text-forest" href="/admin">
            Admin
          </Link>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-5xl px-5 pb-14 pt-6 sm:px-8 lg:pt-12">
        <Link
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-forest shadow-sm ring-1 ring-black/5 transition hover:text-ocean"
          href="/search"
        >
          <ArrowLeft size={17} />
          Back to search
        </Link>

        <article className="overflow-hidden rounded-[2rem] bg-white shadow-search ring-1 ring-black/5">
          <div className="border-b border-[#e4ece8] bg-[#f7fbfa] p-5 sm:p-8">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#e7f4f1] px-3 py-1 text-xs font-black uppercase text-forest">
                {word.partOfSpeech || "word"}
              </span>
              {categoryName && (categorySlug ? (
                <Link className="inline-flex items-center gap-1 rounded-full border border-[#dce8e3] bg-white px-3 py-1 text-xs font-black text-muted" href={`/categories/${categorySlug}`}>
                  <Tag size={13} />
                  {categoryName}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#dce8e3] bg-white px-3 py-1 text-xs font-black text-muted">
                  <Tag size={13} />
                  {categoryName}
                </span>
              ))}
              <FavoriteButton word={browserWord} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <WordHeroPanel heading label="English" language="en" value={englishWord} tone="green" />
              <WordHeroPanel label="Somali" language="so" value={somaliWord} tone="amber" />
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:p-8">
            {(englishDefinition || somaliDefinition) && (
              <section className="rounded-3xl border border-[#e4ece8] p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase text-forest">
                  <BookOpen size={18} />
                  Definitions
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {englishDefinition && <DetailBlock label="English definition" text={englishDefinition} />}
                  {somaliDefinition && <DetailBlock label="Somali definition" text={somaliDefinition} />}
                </div>
              </section>
            )}

            {(englishExample || somaliExample) && (
              <section className="rounded-3xl border border-[#e4ece8] bg-[#fffaf3] p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase text-[#9a6200]">
                  <Quote size={18} />
                  Examples
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {englishExample && <DetailBlock label="English example" text={englishExample} />}
                  {somaliExample && <DetailBlock label="Somali example" text={somaliExample} />}
                </div>
              </section>
            )}

            <section className="wordShareSection" aria-labelledby="word-share-title">
              <h2 className="wordShareHeading" id="word-share-title">
                <Share2 size={19} aria-hidden="true" />
                Share this entry
              </h2>
              <WordShareActions word={browserWord} />
            </section>
          </div>
        </article>
      </section>
    </main>
  );
}

function WordHeroPanel({ heading = false, label, language, value, tone }) {
  const toneClass = tone === "amber" ? "bg-[#fff8f1] border-[#f1dcc0]" : "bg-[#f0faf7] border-[#cfe5df]";
  const Heading = heading ? "h1" : "h2";

  return (
    <div className={`rounded-3xl border p-5 ${toneClass}`}>
      <span className="text-xs font-black uppercase text-muted">{label}</span>
      <Heading className="mt-2 break-words text-4xl font-black leading-tight text-ink sm:text-5xl" lang={language}>
        {value}
      </Heading>
    </div>
  );
}

function DetailBlock({ label, text }) {
  return (
    <div>
      <span className="text-xs font-black uppercase text-muted">{label}</span>
      <p className="mt-2 text-base font-semibold leading-7 text-ink">{text}</p>
    </div>
  );
}
