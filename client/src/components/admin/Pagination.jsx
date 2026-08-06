"use client";

export function Pagination({ pagination, loading, onPageChange }) {
  const currentPage = pagination.page || 1;
  const totalPages = pagination.pages || 1;

  return (
    <div className="paginationBar">
      <button
        className="ghostButton"
        disabled={currentPage <= 1 || loading}
        onClick={() => onPageChange(currentPage - 1)}
        type="button"
      >
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button
        className="ghostButton"
        disabled={currentPage >= totalPages || loading}
        onClick={() => onPageChange(currentPage + 1)}
        type="button"
      >
        Next
      </button>
    </div>
  );
}
