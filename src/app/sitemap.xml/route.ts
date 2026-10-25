import { NextResponse } from "next/server";
import { buildSitemapIndexXml, getSitemapIndexEntries } from "@/lib/seoFeeds";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await getSitemapIndexEntries();
  const xml = buildSitemapIndexXml(entries);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
