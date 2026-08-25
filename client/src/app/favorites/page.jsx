import Link from "next/link";
import { Heart, Languages } from "lucide-react";
import { FavoritesList } from "@/components/FavoritesList";

export const metadata = {
  title: "Saved Words - English Somali Dictionary",
  description: "View English and Somali dictionary words saved in your browser."
};

export default function FavoritesPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e9f7f3_0%,#f8fbfa_44%,#eef4f1_100%)] text-ink">
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
          <Link className="transition hover:text-forest" href="/categories">
            Categories
          </Link>
          <Link className="transition hover:text-forest" href="/recent">
            Recent
          </Link>
          <Link className="transition hover:text-forest" href="/about">
            About
          </Link>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 pb-14 pt-8 sm:px-8 lg:pt-14">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-forest shadow-sm ring-1 ring-black/5">
          <Heart size={16} />
          Favorites
        </div>
        <h1 className="max-w-4xl text-4xl font-black leading-[1.04] text-ink sm:text-6xl">
          Your saved dictionary words.
        </h1>
        <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-muted sm:text-lg">
          Keep useful English and Somali words close for quick review. Favorites stay in this browser.
        </p>

        <FavoritesList />
      </section>
    </main>
  );
}
