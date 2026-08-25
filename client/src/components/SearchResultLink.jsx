"use client";

import Link from "next/link";
import { useRef } from "react";
import { trackPopularSearch } from "@/lib/api";

export function SearchResultLink({ wordId, onClick, children, ...linkProps }) {
  const lastTrackedAtRef = useRef(0);

  function handleClick(event) {
    onClick?.(event);
    const now = Date.now();
    if (event.defaultPrevented || now - lastTrackedAtRef.current < 1000) return;

    lastTrackedAtRef.current = now;
    void trackPopularSearch(wordId).catch(() => {});
  }

  return (
    <Link {...linkProps} onClick={handleClick}>
      {children}
    </Link>
  );
}
