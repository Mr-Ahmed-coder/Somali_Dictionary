export const SITE_NAME = "Somali Dictionary";
export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.somali-dictionary.com"
);

export const DEFAULT_DESCRIPTION =
  "Search English to Somali and Somali to English translations, definitions, word types, categories, and example sentences.";

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function slugifyTerm(value = "") {
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

export function getWordSlug(word = {}) {
  const english = slugifyTerm(word.englishWord || word.english);
  const somali = slugifyTerm(word.somaliWord || word.somali);
  const id = String(word._id || word.id || "");

  if (english && somali && id) return `${english}--${somali}--${id}`;
  if (english && id) return `${english}--${id}`;
  return english || somali || id || "word";
}

export function getWordPath(word) {
  return `/word/${encodeURIComponent(getWordSlug(word))}`;
}

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  index = true,
  type = "website",
  keywords
}) {
  const canonical = absoluteUrl(path);
  const socialTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1
          }
        }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      type,
      url: canonical,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      locale: "en_US",
      alternateLocale: "so_SO",
      images: [
        {
          url: absoluteUrl("/homepage-study-bg.jpg"),
          width: 1717,
          height: 916,
          alt: "English and Somali Dictionary"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [absoluteUrl("/homepage-study-bg.jpg")]
    }
  };
}

function normalizeSiteUrl(value) {
  return value.trim().replace(/\/+$/, "");
}
