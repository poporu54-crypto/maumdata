import { NextResponse } from "next/server";
import {
  buildUrlsetXml,
  getCoreSitemapEntries,
  getFormsSitemapEntries,
  getTier1CompanySitemapEntries,
} from "@/lib/seoFeeds";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ section: string }> }
) {
  const { section } = await params;

  let entries;
  if (section === "core.xml") {
    entries = await getCoreSitemapEntries();
  } else if (section === "forms.xml") {
    entries = await getFormsSitemapEntries();
  } else if (section === "companies.xml") {
    entries = await getTier1CompanySitemapEntries();
  } else {
    return new NextResponse("Not Found", { status: 404 });
  }

  const xml = buildUrlsetXml(entries);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
