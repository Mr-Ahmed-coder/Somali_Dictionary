export async function copyWord(word) {
  return writeClipboardText(normalizeWord(word).english);
}

export async function copyTranslation(word) {
  return writeClipboardText(normalizeWord(word).somali);
}

export async function copyFullEntry(word) {
  return writeClipboardText(formatFullEntry(word));
}

export async function copyLink(url) {
  return writeClipboardText(normalizeText(url));
}

export async function shareWord(word, url) {
  const normalizedWord = normalizeWord(word);
  const normalizedUrl = normalizeText(url);
  const shareData = {
    title: normalizedWord.english
      ? `${normalizedWord.english} - English Somali Dictionary`
      : "English Somali Dictionary",
    text: formatShareText(normalizedWord),
    ...(normalizedUrl ? { url: normalizedUrl } : {})
  };

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(shareData);
      return { status: "shared", method: "native" };
    } catch (error) {
      if (isShareCancellation(error)) {
        return { status: "cancelled", method: "native" };
      }
    }
  }

  const fallbackText = [formatFullEntry(normalizedWord), normalizedUrl].filter(Boolean).join("\n");
  await writeClipboardText(fallbackText);
  return { status: "shared", method: "clipboard" };
}

export function formatFullEntry(word) {
  const normalizedWord = normalizeWord(word);
  const lines = [];

  if (normalizedWord.english && normalizedWord.somali) {
    lines.push(`${normalizedWord.english} \u2014 ${normalizedWord.somali}`);
  } else if (normalizedWord.english || normalizedWord.somali) {
    lines.push(normalizedWord.english || normalizedWord.somali);
  }

  if (normalizedWord.type) lines.push(`Type: ${normalizedWord.type}`);
  if (normalizedWord.category) lines.push(`Category: ${normalizedWord.category}`);

  return lines.join("\n");
}

export function formatShareText(word) {
  const normalizedWord = normalizeWord(word);
  const translation = [normalizedWord.english, normalizedWord.somali].filter(Boolean).join(" \u2014 ");
  return [translation, "English \u2194 Somali Dictionary"].filter(Boolean).join("\n");
}

async function writeClipboardText(value) {
  const text = normalizeText(value);
  if (!text) throw new Error("There is no text to copy");

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return text;
    } catch {
      // Continue to the browser-compatible fallback below.
    }
  }

  if (typeof document === "undefined" || typeof document.execCommand !== "function") {
    throw new Error("Clipboard access is unavailable");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    textarea.remove();
  }

  if (!copied) throw new Error("Clipboard permission was denied");
  return text;
}

function normalizeWord(word) {
  const category = word?.category?.name || word?.categories?.[0]?.name || word?.category;

  return {
    english: normalizeText(word?.englishWord || word?.english),
    somali: normalizeText(word?.somaliWord || word?.somali),
    category: normalizeText(category),
    type: normalizeText(word?.partOfSpeech || word?.type)
  };
}

function normalizeText(value) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function isShareCancellation(error) {
  return error?.name === "AbortError" || error?.name === "NotAllowedError" && /cancel|abort/i.test(error.message || "");
}
