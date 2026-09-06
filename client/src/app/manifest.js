import { SITE_NAME } from "@/lib/seo";

export default function manifest() {
  return {
    name: "English ↔ Somali Dictionary",
    short_name: SITE_NAME,
    description: "Search English and Somali words, translations, definitions, and examples.",
    start_url: "/",
    display: "standalone",
    background_color: "#07111f",
    theme_color: "#07111f",
    lang: "en",
    icons: [
      {
        src: "/Logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
