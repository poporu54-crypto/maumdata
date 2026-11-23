import { NextResponse } from "next/server";
import { buildSitemapIndexXml, getSitemapIndexEntries } from "@/lib/seoFeeds";

export const revalidate = 86400;

export async function GET() {
  const entries = await getSitemapIndexEntries();
  const xml = buildSitemapIndexXml(entries);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
