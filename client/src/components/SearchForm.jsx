"use client";

import { Search } from "lucide-react";

export function SearchForm({ query, direction, loading, onQueryChange, onDirectionChange, onSubmit }) {
  return (
    <form className="dictionarySearchForm" onSubmit={onSubmit}>
      <label htmlFor="dictionary-query">Search dictionary</label>
      <div className="dictionarySearchRow">
        <input
          id="dictionary-query"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search English or Somali words"
          autoComplete="off"
        />
        <button disabled={loading || !query.trim()} type="submit" aria-label="Search words">
          <Search size={18} />
          <span>Search</span>
        </button>
      </div>

      <div className="directionControl" aria-label="Search direction">
        {[
          ["auto", "Auto"],
          ["english-to-somali", "English to Somali"],
          ["somali-to-english", "Somali to English"]
        ].map(([value, label]) => (
          <button
            className={direction === value ? "active" : ""}
            key={value}
            onClick={() => onDirectionChange(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
    </form>
  );
}
