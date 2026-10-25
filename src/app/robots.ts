import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/sign/", "/search"],
      },
    ],
    sitemap: "https://www.maumdata.com/sitemap.xml",
  };
}
