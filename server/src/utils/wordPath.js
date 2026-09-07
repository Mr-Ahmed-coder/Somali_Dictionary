export function getCanonicalWordPath(word = {}) {
  const english = slugifyTerm(word.englishWord || word.english);
  const somali = slugifyTerm(word.somaliWord || word.somali);
  const id = String(word._id || word.id || "");

  if (english && somali && id) return `/word/${english}--${somali}--${id}`;
  if (english && id) return `/word/${english}--${id}`;
  return `/word/${english || somali || id || "word"}`;
}

function slugifyTerm(value = "") {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}
