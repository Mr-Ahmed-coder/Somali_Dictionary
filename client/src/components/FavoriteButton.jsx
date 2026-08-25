"use client";

import { Heart, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";

export function FavoriteButton({ word }) {
  const { ready, isFavorite, toggleFavorite } = useFavorites();
  const [feedback, setFeedback] = useState("");
  const saved = ready && isFavorite(word?._id);

  useEffect(() => {
    if (!feedback) return undefined;

    const timeout = window.setTimeout(() => setFeedback(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  function handleToggle() {
    const result = toggleFavorite(word);
    setFeedback(result.saved ? "Word saved." : "Word removed.");
  }

  return (
    <div className="favoriteAction">
      <button
        className={`favoriteButton ${saved ? "favoriteButtonSaved" : ""}`}
        disabled={!ready}
        onClick={handleToggle}
        type="button"
        aria-pressed={saved}
      >
        {!ready ? (
          <Loader2 className="spin" size={18} aria-hidden="true" />
        ) : (
          <Heart fill={saved ? "currentColor" : "none"} size={18} aria-hidden="true" />
        )}
        {saved ? "Saved" : "Save Word"}
      </button>
      {feedback && (
        <span className="favoriteFeedback" role="status">
          {feedback}
        </span>
      )}
    </div>
  );
}
