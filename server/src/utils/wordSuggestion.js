export function cleanSuggestionText(value = "") {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function normalizeSuggestionText(value = "") {
  return cleanSuggestionText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function escapeSuggestionRegExp(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
