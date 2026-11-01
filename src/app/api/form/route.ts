import { NextRequest, NextResponse } from "next/server";
import { searchTemplatesFromDB } from "@/lib/db";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
};

// DB 서식 대량 검색 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const tag = searchParams.get("tag") || null;
    const category = searchParams.get("category") || null;

    // DB에서 검색 수행
    const dbResults = await searchTemplatesFromDB(q, tag, category);

    return NextResponse.json(
      {
        success: true,
        data: dbResults,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (err: unknown) {
    console.error("API Search Templates Error:", err);
    return NextResponse.json(
      { success: false, error: "서식 목록을 불러오는 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
