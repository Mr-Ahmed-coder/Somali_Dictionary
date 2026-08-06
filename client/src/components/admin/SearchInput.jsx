"use client";

import { Search } from "lucide-react";

export function SearchInput({ value, onChange }) {
  return (
    <label className="adminSearchInput">
      <Search size={18} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search English, Somali, category, or type"
        aria-label="Search dictionary words"
      />
    </label>
  );
}
