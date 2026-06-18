import { DictionarySearch } from "@/components/DictionarySearch";

export const metadata = {
  title: "Search English Somali Dictionary",
  description: "Search English and Somali words, definitions, examples, and categories."
};

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
