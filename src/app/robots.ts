import type { MetadataRoute } from "next";

const DISALLOWED_PATHS = ["/api/", "/admin/", "/sign/", "/search"];

const AI_SEARCH_BOTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "Google-Extended",
  "Applebot-Extended",
  "DuckAssistBot",
  "MistralAI-User",
];

const BLOCKED_BOTS = [
  "Bytespider",
  "PetalBot",
  "Baiduspider",
  "Baiduspider-render",
  "Sogou web spider",
  "YisouSpider",
  "360Spider",
  "AIWebIndex",
  "Amazonbot",
  "SemrushBot",
  "AhrefsBot",
  "MJ12bot",
  "DotBot",
  "BLEXBot",
  "DataForSeoBot",
  "Barkrowler",
  "CCBot",
  "Diffbot",
  "ImagesiftBot",
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.maumdata.com").replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: AI_SEARCH_BOTS,
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: BLOCKED_BOTS,
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
