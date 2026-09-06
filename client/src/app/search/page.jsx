import { DictionarySearch } from "@/components/DictionarySearch";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Search English and Somali Words",
  description: "Search English and Somali words, definitions, examples, and categories.",
  path: "/search",
  index: false
});

export default function SearchPage() {
  return (
    <main className="searchPage">
      <nav className="searchNav">
        <a className="brand darkBrand" href="/">
          English Somali Dictionary
        </a>
        <div>
          <a href="/words">Words</a>
          <a href="/categories">Categories</a>
          <a href="/favorites">Favorites</a>
          <a href="/recent">Recent</a>
          <a href="/about">About</a>
          <a href="/admin">Admin</a>
        </div>
      </nav>

      <header className="searchHero">
        <p className="eyebrow">Dictionary search</p>
        <h1>Find English and Somali words fast.</h1>
        <p>
          Search translations, definitions, example sentences, categories, and keywords from the
          Express API.
        </p>
      </header>

      <DictionarySearch />
    </main>
  );
}
