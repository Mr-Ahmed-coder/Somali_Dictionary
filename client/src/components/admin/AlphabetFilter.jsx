"use client";

const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

export function AlphabetFilter({ selectedLetter = "all", counts = [], onSelect }) {
  const countByLetter = new Map(counts.map((item) => [item.letter?.toLowerCase(), item.count || 0]));

  return (
    <section className="adminSurface alphabetSurface" aria-label="Alphabet navigation">
      <div className="surfaceHeader">
        <div>
          <h2>Alphabet Navigation</h2>
          <p>Jump directly to a letter group.</p>
        </div>
        <button className={selectedLetter === "all" ? "active" : ""} onClick={() => onSelect("all")} type="button">
          All
        </button>
      </div>
      <div className="alphabetGrid">
        {alphabet.map((letter) => {
          const active = selectedLetter === letter;
          const label = `${letter.toUpperCase()}${letter}`;
          return (
            <button className={active ? "active" : ""} key={letter} onClick={() => onSelect(letter)} type="button">
              <strong>{label}</strong>
              <span>{countByLetter.get(letter) || 0}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
