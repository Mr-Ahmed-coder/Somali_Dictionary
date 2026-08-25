"use client";

import { useEffect } from "react";
import { useRecentSearches } from "@/hooks/useRecentSearches";

export function RecentSearchRecorder({ word }) {
  const { addRecentSearch } = useRecentSearches();

  useEffect(() => {
    addRecentSearch(word);
  }, [addRecentSearch, word]);

  return null;
}
