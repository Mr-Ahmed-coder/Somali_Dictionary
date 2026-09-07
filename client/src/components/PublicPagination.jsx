import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PublicPagination({ basePath, pagination }) {
  if (!pagination || pagination.pages <= 1) return null;

  return (
    <nav className="mt-8 flex items-center justify-between gap-4" aria-label="Pagination">
      {pagination.page > 1 ? (
        <Link className="ghostButton" href={pageHref(basePath, pagination.page - 1)} rel="prev">
          <ChevronLeft size={17} aria-hidden="true" />
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm font-black text-muted">
        Page {pagination.page} of {pagination.pages}
      </span>
      {pagination.page < pagination.pages ? (
        <Link className="ghostButton" href={pageHref(basePath, pagination.page + 1)} rel="next">
          Next
          <ChevronRight size={17} aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

function pageHref(basePath, page) {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}
