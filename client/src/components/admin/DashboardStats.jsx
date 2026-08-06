"use client";

import { BookOpen, CalendarPlus, FolderTree, Layers3, ListTree } from "lucide-react";

const statConfig = [
  { key: "words", label: "Total Words", icon: BookOpen },
  { key: "categories", label: "Total Categories", icon: FolderTree },
  { key: "wordTypes", label: "Total Word Types", icon: Layers3 },
  { key: "recentlyAddedToday", label: "Recently Added Today", icon: CalendarPlus },
  { key: "alphabetGroups", label: "Total Alphabet Groups", icon: ListTree }
];

export function DashboardStats({ totals = {} }) {
  return (
    <section className="dashboardStats" aria-label="Dictionary summary">
      {statConfig.map(({ key, label, icon: Icon }) => (
        <article className="dashboardStatCard" key={key}>
          <span className="dashboardStatIcon">
            <Icon size={20} />
          </span>
          <span>{label}</span>
          <strong>{totals[key] ?? 0}</strong>
        </article>
      ))}
    </section>
  );
}
