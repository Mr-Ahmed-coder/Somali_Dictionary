"use client";

import Link from "next/link";
import { BookOpen, Heart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";

export function FavoritesList() {
  const { favorites, ready, removeFavorite, clearFavorites } = useFavorites();
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!feedback) return undefined;

    const timeout = window.setTimeout(() => setFeedback(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  function handleRemove(id) {
    removeFavorite(id);
    setFeedback("Saved word removed.");
  }

  function handleClear() {
    clearFavorites();
    setFeedback("All saved words removed.");
  }

  if (!ready) {
    return (
      <section className="favoritesEmptyState">
        <BookOpen size={30} />
        <h2>Loading saved words...</h2>
      </section>
    );
  }

  if (favorites.length === 0) {
    return (
      <section className="favoritesEmptyState">
        <span>
          <Heart size={28} />
        </span>
        <h2>No saved words yet.</h2>
        <p>Open any word details page and choose Save Word to build your personal study list.</p>
      </section>
    );
  }

  return (
    <section className="favoritesPanel" aria-label="Saved dictionary words">
      <div className="favoritesToolbar">
        <div>
          <span className="eyebrow">Saved words</span>
          <h2>{favorites.length} saved {favorites.length === 1 ? "word" : "words"}</h2>
        </div>
        <button className="ghostButton" onClick={handleClear} type="button">
          <Trash2 size={17} />
          Clear all
        </button>
      </div>

      {feedback && (
        <div className="favoritesFeedback" role="status">
          {feedback}
        </div>
      )}

      <div className="favoritesGrid">
        {favorites.map((word) => (
          <article className="favoriteCard" key={word._id}>
            <Link className="favoriteCardLink" href={`/word/${word._id}`}>
              <span className="favoriteType">{word.type || "word"}</span>
              <div>
                <h3>{word.english || "Untitled word"}</h3>
                <strong>{word.somali || "Somali translation pending"}</strong>
              </div>
              <p>{word.category || "General"}</p>
            </Link>
            <button
              className="removeFavoriteButton"
              onClick={() => handleRemove(word._id)}
              type="button"
              aria-label={`Remove ${word.english || "word"} from favorites`}
            >
              <Trash2 size={16} />
              Remove
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
