import Link from "next/link";
import { ArrowLeft, BookOpen, Languages, Quote, Tag } from "lucide-react";
import { getWordById } from "@/lib/api";

export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const word = await getWordById(id);
    const englishWord = word.englishWord || word.english || "Word";
    const somaliWord = word.somaliWord || word.somali || "Somali translation";

    return {
      title: `${englishWord} - ${somaliWord}`,
      description: `English Somali dictionary details for ${englishWord}.`
    };
  } catch {
    return {
      title: "Word Details",
      description: "English Somali dictionary word details."
    };
  }
}

export default async function WordDetailPage({ params }) {
  const { id } = await params;
  const word = await getWordById(id);
  const englishWord = word.englishWord || word.english;
  const somaliWord = word.somaliWord || word.somali;
  const englishDefinition = word.englishDefinition || word.definitions?.english?.[0];
  const somaliDefinition = word.somaliDefinition || word.definitions?.somali?.[0];
  const englishExample = word.englishExample || word.examples?.[0]?.english;
  const somaliExample = word.somaliExample || word.examples?.[0]?.somali;
  const categoryName = word.category?.name || word.categories?.[0]?.name;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e9f7f3_0%,#f8fbfa_44%,#eef4f1_100%)] text-ink">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
        <Link className="flex items-center gap-2 text-sm font-black text-forest sm:text-base" href="/">
          <span className="grid size-10 place-items-center rounded-2xl bg-white text-ocean shadow-sm ring-1 ring-black/5">
            <Languages size={21} />
          </span>
          <span>English Somali</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-bold text-muted sm:gap-6">
          <Link className="transition hover:text-forest" href="/search">
            Search
          </Link>
          <Link className="transition hover:text-forest" href="/words">
            Words
          </Link>
          <Link className="transition hover:text-forest" href="/about">
            About
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
              {categoryName && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#dce8e3] bg-white px-3 py-1 text-xs font-black text-muted">
                  <Tag size={13} />
                  {categoryName}
                </span>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <WordHeroPanel label="English" value={englishWord} tone="green" />
              <WordHeroPanel label="Somali" value={somaliWord} tone="amber" />
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
          </div>
        </article>
      </section>
    </main>
  );
}

function WordHeroPanel({ label, value, tone }) {
  const toneClass = tone === "amber" ? "bg-[#fff8f1] border-[#f1dcc0]" : "bg-[#f0faf7] border-[#cfe5df]";

  return (
    <div className={`rounded-3xl border p-5 ${toneClass}`}>
      <span className="text-xs font-black uppercase text-muted">{label}</span>
      <h1 className="mt-2 break-words text-4xl font-black leading-tight text-ink sm:text-5xl">{value}</h1>
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
