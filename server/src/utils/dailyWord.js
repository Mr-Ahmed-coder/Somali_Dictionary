export function getDailyWordIndex(dateKey, totalWords) {
  if (!Number.isInteger(totalWords) || totalWords < 1) return -1;

  let hash = 2166136261;

  for (let index = 0; index < dateKey.length; index += 1) {
    hash ^= dateKey.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) % totalWords;
}
