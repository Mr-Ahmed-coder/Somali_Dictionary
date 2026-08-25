"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const FAVORITES_KEY = "dictionary_favorites";
const favoritesChangedEvent = "dictionary:favorites-changed";

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavorites(readFavorites());
    setReady(true);

    function handleChange() {
      setFavorites(readFavorites());
    }

    window.addEventListener("storage", handleChange);
    window.addEventListener(favoritesChangedEvent, handleChange);

    return () => {
      window.removeEventListener("storage", handleChange);
      window.removeEventListener(favoritesChangedEvent, handleChange);
    };
  }, []);

  const commitFavorites = useCallback((nextFavorites) => {
    writeFavorites(nextFavorites);
    setFavorites(nextFavorites);
    notifyFavoritesChanged();
  }, []);

  const addFavorite = useCallback(
    (word) => {
      const favorite = normalizeFavorite(word);
      if (!favorite?._id) return false;

      const currentFavorites = readFavorites();
      if (currentFavorites.some((item) => item._id === favorite._id)) return false;

      commitFavorites([favorite, ...currentFavorites]);
      return true;
    },
    [commitFavorites]
  );

  const removeFavorite = useCallback(
    (id) => {
      const nextFavorites = readFavorites().filter((item) => item._id !== id);
      commitFavorites(nextFavorites);
      return true;
    },
    [commitFavorites]
  );

  const clearFavorites = useCallback(() => {
    commitFavorites([]);
  }, [commitFavorites]);

  const isFavorite = useCallback(
    (id) => favorites.some((item) => item._id === id),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (word) => {
      const favorite = normalizeFavorite(word);
      if (!favorite?._id) return { saved: false, changed: false };

      if (readFavorites().some((item) => item._id === favorite._id)) {
        removeFavorite(favorite._id);
        return { saved: false, changed: true };
      }

      const changed = addFavorite(favorite);
      return { saved: true, changed };
    },
    [addFavorite, removeFavorite]
  );

  return useMemo(
    () => ({
      favorites,
      ready,
      getFavorites: readFavorites,
      addFavorite,
      removeFavorite,
      isFavorite,
      toggleFavorite,
      clearFavorites
    }),
    [addFavorite, clearFavorites, favorites, isFavorite, ready, removeFavorite, toggleFavorite]
  );
}

function readFavorites() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed.map(normalizeFavorite).filter((item) => item?._id);
  } catch {
    return [];
  }
}

function writeFavorites(favorites) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(dedupeFavorites(favorites)));
}

function notifyFavoritesChanged() {
  window.dispatchEvent(new Event(favoritesChangedEvent));
}

function dedupeFavorites(favorites) {
  const byId = new Map();

  favorites.forEach((favorite) => {
    const normalized = normalizeFavorite(favorite);
    if (normalized?._id && !byId.has(normalized._id)) {
      byId.set(normalized._id, normalized);
    }
  });

  return [...byId.values()];
}

function normalizeFavorite(word) {
  if (!word || typeof word !== "object") return null;

  const id = stringify(word._id || word.id);
  if (!id) return null;

  const category = word.category?.name || word.categories?.[0]?.name || word.category || "";

  return {
    _id: id,
    english: stringify(word.englishWord || word.english),
    somali: stringify(word.somaliWord || word.somali),
    category: stringify(category),
    type: stringify(word.partOfSpeech || word.type || "word")
  };
}

function stringify(value) {
  return value == null ? "" : String(value).trim();
}
