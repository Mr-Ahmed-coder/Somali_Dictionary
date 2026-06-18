import { apiFetch } from "@/lib/api";

export default async function CategoryDetailPage({ params }) {
  const { slug } = await params;
  const result = await apiFetch(`/categories/${slug}`).catch(() => ({ item: null, words: [] }));

  return (
    <main className="pageShell">
      <header className="pageHeader">
        <a href="/categories">← Categories</a>
        <h1>{result.item?.name || "Category"}</h1>
        <p>{result.item?.description || "Words in this category."}</p>
      </header>

      <section className="wordGrid">
        {result.words.map((word) => (
          <article className="wordCard" key={word._id}>
            <div>
              <h2>{word.english}</h2>
              <span>{word.partOfSpeech}</span>
            </div>
            <strong>{word.somali}</strong>
            <p>{word.definitions?.english?.[0] || "Definition pending."}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
