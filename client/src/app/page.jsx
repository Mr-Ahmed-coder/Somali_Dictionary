import { HomeHero } from "@/components/HomeHero";
import { JsonLd } from "@/components/JsonLd";
import { WordOfTheDay } from "@/components/WordOfTheDay";
import { absoluteUrl, buildMetadata, DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "English to Somali & Somali to English Dictionary",
  description: DEFAULT_DESCRIPTION,
  path: "/",
  keywords: [
    "Somali dictionary",
    "English Somali dictionary",
    "English to Somali dictionary",
    "Somali to English dictionary",
    "Somali translation",
    "Somali words"
  ]
});

export default function HomePage() {
  return (
    <main className="homePage">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          alternateName: "English Somali Dictionary",
          url: absoluteUrl("/"),
          description: DEFAULT_DESCRIPTION,
          inLanguage: ["en", "so"],
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            url: absoluteUrl("/"),
            logo: absoluteUrl("/Logo.png")
          }
        }}
      />
      <HomeHero />
      <WordOfTheDay />
    </main>
  );
}
