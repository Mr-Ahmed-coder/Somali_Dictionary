"use client";

import Link from "next/link";
import { Clock3, History, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRecentSearches } from "@/hooks/useRecentSearches";

export function RecentSearchesList() {
  const { recentSearches, ready, removeRecentSearch, clearRecentSearches } = useRecentSearches();
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!feedback) return undefined;

    const timeout = window.setTimeout(() => setFeedback(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  function handleRemove(word) {
    removeRecentSearch(word._id);
    setFeedback(`${word.english || "Word"} removed from recent searches.`);
  }

  function handleClear() {
    const confirmed = window.confirm("Clear all recent search history? This cannot be undone.");
    if (!confirmed) return;

    clearRecentSearches();
    setFeedback("Recent search history cleared.");
  }

  if (!ready) {
    return (
      <section className="favoritesEmptyState" aria-live="polite">
        <Clock3 size={30} />
        <h2>Loading recent searches...</h2>
      </section>
    );
  }

  if (recentSearches.length === 0) {
    return (
      <section className="favoritesEmptyState">
        <span>
          <History size={28} />
        </span>
        <h2>No recent searches yet.</h2>
        <p>Open a dictionary word and it will appear here for quick access on this browser.</p>
        {feedback && (
          <div className="favoritesFeedback" role="status">
            {feedback}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="favoritesPanel" aria-label="Recently viewed dictionary words">
      <div className="favoritesToolbar">
        <div>
          <span className="eyebrow">Recent searches</span>
          <h2>{recentSearches.length} recent {recentSearches.length === 1 ? "word" : "words"}</h2>
        </div>
        <button className="ghostButton" onClick={handleClear} type="button">
          <Trash2 size={17} />
          Clear History
        </button>
      </div>

      {feedback && (
        <div className="favoritesFeedback" role="status">
          {feedback}
        </div>
      )}

      <div className="favoritesGrid">
        {recentSearches.map((word) => (
          <article className="favoriteCard" key={word._id}>
            <Link className="favoriteCardLink" href={`/word/${word._id}`}>
              <div className="recentCardTopline">
                <span className="favoriteType">{word.type || "word"}</span>
                <span className="recentViewedAt">
                  <Clock3 size={14} />
                  {formatViewedAt(word.viewedAt)}
                </span>
              </div>
              <div>
                <h3>{word.english || "Untitled word"}</h3>
                <strong>{word.somali || "Somali translation pending"}</strong>
              </div>
              <p>{word.category || "General"}</p>
            </Link>
            <button
              className="removeFavoriteButton"
              onClick={() => handleRemove(word)}
              type="button"
              aria-label={`Remove ${word.english || "word"} from recent searches`}
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

function formatViewedAt(value) {
  const viewedAt = new Date(value).getTime();
  if (!Number.isFinite(viewedAt)) return "Recently viewed";

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - viewedAt) / 60000));
  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays}d ago`;

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(viewedAt);
}
