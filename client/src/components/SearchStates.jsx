import { AlertCircle, BookOpen, Loader2 } from "lucide-react";

export function SearchLoadingState() {
  return (
    <div className="searchState">
      <Loader2 className="spin" size={24} />
      <strong>Searching dictionary</strong>
      <span>Checking English and Somali entries.</span>
    </div>
  );
}

export function SearchEmptyState() {
  return (
    <div className="searchState emptySearchState" role="status" aria-live="polite">
      <span className="emptySearchIcon" aria-hidden="true">
        <BookOpen size={30} />
      </span>
      <strong>Ereygan lama helin.</strong>
      <span>Dhawaan ayaan ku soo dari doonnaa.</span>
    </div>
  );
}

export function SearchErrorState({ message }) {
  return (
    <div className="searchState errorState">
      <AlertCircle size={26} />
      <strong>Search unavailable</strong>
      <span>{message || "Could not connect to the dictionary API."}</span>
    </div>
  );
}
