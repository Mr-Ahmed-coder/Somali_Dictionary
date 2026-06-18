import { getWords } from "@/lib/api";

export default async function WordsPage() {
  const result = await getWords().catch(() => ({ items: [] }));

  return (
    <main className="pageShell">
      <header className="pageHeader">
        <a href="/">← Home</a>
        <h1>Dictionary Entries</h1>
        <p>Published English and Somali entries with definitions and examples.</p>
      </header>

      <section className="wordGrid">
        {result.items.map((word) => (
          <article className="wordCard" key={word._id}>
            <div>
              <h2>{word.english}</h2>
              <span>{word.partOfSpeech}</span>
            </div>
            <strong>{word.somali}</strong>
            <p>{word.definitions?.english?.[0] || "Definition pending."}</p>
            {word.examples?.[0] && (
              <blockquote>
                {word.examples[0].english}
                <span>{word.examples[0].somali}</span>
              </blockquote>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
