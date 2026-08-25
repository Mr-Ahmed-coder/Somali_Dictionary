"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const RECENT_SEARCHES_KEY = "dictionary_recent_searches";
const RECENT_SEARCHES_LIMIT = 20;
const recentSearchesChangedEvent = "dictionary:recent-searches-changed";

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRecentSearches(readRecentSearches());
    setReady(true);

    function handleChange() {
      setRecentSearches(readRecentSearches());
    }

    window.addEventListener("storage", handleChange);
    window.addEventListener(recentSearchesChangedEvent, handleChange);

    return () => {
      window.removeEventListener("storage", handleChange);
      window.removeEventListener(recentSearchesChangedEvent, handleChange);
    };
  }, []);

  const commitRecentSearches = useCallback((nextSearches) => {
    const storedSearches = writeRecentSearches(nextSearches);
    setRecentSearches(storedSearches);
    notifyRecentSearchesChanged();
  }, []);

  const addRecentSearch = useCallback(
    (word) => {
      const recentWord = normalizeRecentSearch({
        ...word,
        viewedAt: new Date().toISOString()
      });

      if (!recentWord?._id) return false;

      const withoutDuplicate = readRecentSearches().filter(
        (item) => item._id !== recentWord._id
      );
      commitRecentSearches([recentWord, ...withoutDuplicate]);
      return true;
    },
    [commitRecentSearches]
  );

  const removeRecentSearch = useCallback(
    (id) => {
      const nextSearches = readRecentSearches().filter((item) => item._id !== String(id));
      commitRecentSearches(nextSearches);
      return true;
    },
    [commitRecentSearches]
  );

  const clearRecentSearches = useCallback(() => {
    commitRecentSearches([]);
  }, [commitRecentSearches]);

  return useMemo(
    () => ({
      recentSearches,
      ready,
      getRecentSearches: readRecentSearches,
      addRecentSearch,
      removeRecentSearch,
      clearRecentSearches
    }),
    [addRecentSearch, clearRecentSearches, ready, recentSearches, removeRecentSearch]
  );
}

function readRecentSearches() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
    return Array.isArray(parsed) ? normalizeRecentSearches(parsed) : [];
  } catch {
    return [];
  }
}

function writeRecentSearches(searches) {
  if (typeof window === "undefined") return [];

  const normalized = normalizeRecentSearches(searches);
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(normalized));
  return normalized;
}

function notifyRecentSearchesChanged() {
  window.dispatchEvent(new Event(recentSearchesChangedEvent));
}

function normalizeRecentSearches(searches) {
  const byId = new Map();

  searches
    .map(normalizeRecentSearch)
    .filter((item) => item?._id)
    .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
    .forEach((item) => {
      if (!byId.has(item._id)) byId.set(item._id, item);
    });

  return [...byId.values()].slice(0, RECENT_SEARCHES_LIMIT);
}

function normalizeRecentSearch(word) {
  if (!word || typeof word !== "object") return null;

  const id = stringify(word._id || word.id);
  if (!id) return null;

  const category = word.category?.name || word.categories?.[0]?.name || word.category || "";
  const viewedAt = new Date(word.viewedAt);

  return {
    _id: id,
    english: stringify(word.englishWord || word.english),
    somali: stringify(word.somaliWord || word.somali),
    category: stringify(category),
    type: stringify(word.partOfSpeech || word.type || "word"),
    viewedAt: Number.isNaN(viewedAt.getTime()) ? new Date(0).toISOString() : viewedAt.toISOString()
  };
}

function stringify(value) {
  return value == null ? "" : String(value).trim();
}
