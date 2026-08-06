"use client";

import Link from "next/link";
import { Edit3, Eye, Loader2, Trash2 } from "lucide-react";

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value));
}

export function WordTable({ words = [], loading, emptyMessage, onEdit, onDelete }) {
  return (
    <div className="wordTableWrap">
      <div className="wordTable dataTable">
        <div className="tableHead">
          <span>English</span>
          <span>Somali</span>
          <span>Category</span>
          <span>Type</span>
          <span>Created Date</span>
          <span>Actions</span>
        </div>
        {loading ? (
          <div className="emptyState tableEmptyState">
            <Loader2 className="spin" />
            Loading words
          </div>
        ) : (
          words.map((word) => (
            <article className="tableRow" key={word._id}>
              <span>
                <strong>{word.englishWord || word.english}</strong>
              </span>
              <span>{word.somaliWord || word.somali}</span>
              <span>{word.category?.name || "Uncategorized"}</span>
              <span>
                <small className="typePill">{word.partOfSpeech || "other"}</small>
              </span>
              <span>{formatDate(word.createdAt)}</span>
              <span className="rowActions">
                <Link aria-label="View word" href={`/word/${word._id}`}>
                  <Eye size={16} />
                </Link>
                <button aria-label="Edit word" onClick={() => onEdit(word)} type="button">
                  <Edit3 size={16} />
                </button>
                <button aria-label="Delete word" onClick={() => onDelete(word)} type="button">
                  <Trash2 size={16} />
                </button>
              </span>
            </article>
          ))
        )}
        {!loading && words.length === 0 && <div className="emptyState tableEmptyState">{emptyMessage}</div>}
      </div>
    </div>
  );
}
