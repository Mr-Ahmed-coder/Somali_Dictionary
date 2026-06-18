import { AlertCircle, Loader2, SearchX } from "lucide-react";

export function SearchLoadingState() {
  return (
    <div className="searchState">
      <Loader2 className="spin" size={24} />
      <strong>Searching dictionary</strong>
      <span>Checking English and Somali entries.</span>
    </div>
  );
}

export function SearchEmptyState({ query }) {
  return (
    <div className="searchState">
      <SearchX size={26} />
      <strong>No results found</strong>
      <span>No dictionary entries matched "{query}".</span>
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
