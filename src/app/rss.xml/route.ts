import { NextResponse } from "next/server";
import { buildRssXml, getRssFeedItems } from "@/lib/seoFeeds";

export const revalidate = 86400;

export async function GET() {
  const items = await getRssFeedItems();
  const xml = buildRssXml(items);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
