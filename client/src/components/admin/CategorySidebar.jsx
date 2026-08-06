"use client";

import { FolderTree } from "lucide-react";

export function CategorySidebar({ categories = [], selectedCategory = "all", onSelect }) {
  const totalCount = categories.reduce((sum, category) => sum + (category.wordCount || category.adminWordCount || 0), 0);

  return (
    <aside className="categorySidebarPanel" aria-label="Category filters">
      <div className="categorySidebarTitle">
        <FolderTree size={18} />
        <span>Categories</span>
      </div>
      <button className={selectedCategory === "all" ? "active" : ""} onClick={() => onSelect("all")} type="button">
        <span>All categories</span>
        <strong>{totalCount}</strong>
      </button>
      {categories.map((category) => (
        <button
          className={selectedCategory === category._id ? "active" : ""}
          key={category._id}
          onClick={() => onSelect(category._id)}
          type="button"
        >
          <span>{category.name}</span>
          <strong>{category.adminWordCount ?? category.wordCount ?? 0}</strong>
        </button>
      ))}
    </aside>
  );
}
