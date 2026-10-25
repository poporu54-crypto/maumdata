import { NextResponse } from "next/server";
import { buildRssXml, getRssFeedItems } from "@/lib/seoFeeds";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getRssFeedItems();
  const xml = buildRssXml(items);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
