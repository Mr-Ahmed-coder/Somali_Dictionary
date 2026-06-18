import { BookOpen, Languages } from "lucide-react";
import { DictionarySearch } from "@/components/DictionarySearch";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e9f7f3_0%,#f8fbfa_42%,#eef4f1_100%)] text-ink">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
        <a className="flex items-center gap-2 text-sm font-black text-forest sm:text-base" href="/">
          <span className="grid size-10 place-items-center rounded-2xl bg-white text-ocean shadow-sm ring-1 ring-black/5">
            <Languages size={21} />
          </span>
          <span>English Somali</span>
        </a>

        <nav className="flex items-center gap-4 text-sm font-bold text-muted sm:gap-6">
          <a className="transition hover:text-forest" href="/search">
            Search
          </a>
          <a className="transition hover:text-forest" href="/words">
            Words
          </a>
          <a className="transition hover:text-forest" href="/about">
            About
          </a>
          <a className="transition hover:text-forest" href="/admin">
            Admin
          </a>
        </nav>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-152px)] w-full max-w-5xl flex-col items-center justify-center px-5 py-10 text-center sm:px-8">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-forest shadow-sm ring-1 ring-black/5">
          <BookOpen size={16} />
          Fast bilingual word search
        </div>

        <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-normal text-ink sm:text-6xl lg:text-7xl">
          English {"\u2194"} Somali Dictionary
        </h1>
        <p className="mt-5 text-base font-semibold text-muted sm:text-xl">
          Search English or Somali words instantly.
        </p>

        <div className="mt-10 w-full">
          <DictionarySearch variant="home" />
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-center px-5 pb-6 text-center text-sm font-semibold text-muted sm:px-8">
        <span>English {"\u2194"} Somali Dictionary</span>
      </footer>
    </main>
  );
}
