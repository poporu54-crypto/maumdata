import { MetadataRoute } from "next";
import { getAllBusinesses } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.maumdata.com";
  
  // 기본 정적 페이지들
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/insights`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stats/market-area`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
  ];

  // 상권 분석 롱테일 SEO 페이지들
  const marketDongs = ["1168064000", "1168065000", "2635010500", "1159062000", "2726051000"];
  const marketRoutes = marketDongs.map((dongCd) => ({
    url: `${baseUrl}/stats/market-area/${dongCd}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  // Neon DB 내 사업자 번호 동적 크롤링 경로 수집
  try {
    const list = await getAllBusinesses();

    const bizRoutes = list.map((item) => ({
      url: `${baseUrl}/biz/${item.b_no.replace(/[^0-9]/g, "")}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

    return [...routes, ...marketRoutes, ...bizRoutes];
  } catch (error) {
    console.error("Failed to generate dynamic sitemap routes:", error);
    return [...routes, ...marketRoutes];
  }
}
