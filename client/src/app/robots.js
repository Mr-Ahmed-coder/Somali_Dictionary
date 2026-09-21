import { SITE_URL } from "@/lib/seo";

const privatePaths = ["/admin", "/admin/"];

export default function robots() {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: privatePaths
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: privatePaths
      },
      {
        userAgent: "Claude-SearchBot",
        allow: "/",
        disallow: privatePaths
      },
      {
        userAgent: "GPTBot",
        disallow: "/"
      },
      {
        userAgent: "Google-Extended",
        disallow: "/"
      },
      {
        userAgent: "ClaudeBot",
        disallow: "/"
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
