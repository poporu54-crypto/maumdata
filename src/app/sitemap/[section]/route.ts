import { NextResponse } from "next/server";
import {
  buildUrlsetXml,
  getCoreSitemapEntries,
  getDirectorySitemapEntries,
  getFormsSitemapEntries,
  getTier1CompanySitemapEntries,
} from "@/lib/seoFeeds";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { section: "core.xml" },
    { section: "directory.xml" },
    { section: "forms.xml" },
    { section: "companies.xml" },
  ];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ section: string }> }
) {
  const { section } = await params;

  let entries;
  if (section === "core.xml") {
    entries = await getCoreSitemapEntries();
  } else if (section === "directory.xml") {
    entries = await getDirectorySitemapEntries();
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
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
