import Link from "next/link";
import { BookOpen, Tag } from "lucide-react";

export function SearchResultCard({ word }) {
  const englishWord = word.englishWord || word.english;
  const somaliWord = word.somaliWord || word.somali;
  const englishDefinition = word.englishDefinition || word.definitions?.english?.[0];
  const somaliDefinition = word.somaliDefinition || word.definitions?.somali?.[0];
  const englishExample = word.englishExample || word.examples?.[0]?.english;
  const somaliExample = word.somaliExample || word.examples?.[0]?.somali;

  return (
    <Link
      className="searchResultCard transition hover:-translate-y-0.5 hover:border-[#9fc8c1] hover:shadow-search"
      href={`/word/${word._id}`}
      aria-label={`Open details for ${englishWord}`}
    >
      <div className="resultTopline">
        <span className="partBadge">{word.partOfSpeech || "word"}</span>
        {word.category?.name && (
          <span className="categoryBadge">
            <Tag size={14} />
            {word.category.name}
          </span>
        )}
      </div>

      <div className="translationPair">
        <div>
          <span>English</span>
          <strong>{englishWord}</strong>
        </div>
        <div>
          <span>Somali</span>
          <strong>{somaliWord}</strong>
        </div>
      </div>

      {(englishDefinition || somaliDefinition) && (
        <div className="definitionBlock">
          <BookOpen size={18} />
          <div>
            {englishDefinition && <p>{englishDefinition}</p>}
            {somaliDefinition && <p>{somaliDefinition}</p>}
          </div>
        </div>
      )}

      {(englishExample || somaliExample) && (
        <blockquote className="exampleBlock">
          {englishExample && <span>{englishExample}</span>}
          {somaliExample && <span>{somaliExample}</span>}
        </blockquote>
      )}
    </Link>
  );
}
