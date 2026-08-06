"use client";

import { RefreshCw } from "lucide-react";
import { SearchInput } from "./SearchInput";

const sortOptions = [
  { value: "english-asc", label: "English A-Z" },
  { value: "english-desc", label: "English Z-A" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" }
];

export function FilterBar({
  query,
  filters,
  categories,
  partsOfSpeech,
  loading,
  onQueryChange,
  onFilterChange,
  onRefresh
}) {
  return (
    <div className="filterBar">
      <SearchInput value={query} onChange={onQueryChange} />
      <label>
        <span>Category</span>
        <select value={filters.category} onChange={(event) => onFilterChange("category", event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option value={category._id} key={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Type</span>
        <select value={filters.partOfSpeech} onChange={(event) => onFilterChange("partOfSpeech", event.target.value)}>
          <option value="all">All types</option>
          {partsOfSpeech.map((part) => (
            <option value={part} key={part}>
              {part}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Sort by</span>
        <select value={filters.sort} onChange={(event) => onFilterChange("sort", event.target.value)}>
          {sortOptions.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button className="ghostButton refreshButton" disabled={loading} onClick={onRefresh} type="button">
        <RefreshCw className={loading ? "spin" : ""} size={18} />
        Refresh
      </button>
    </div>
  );
}
