import { NextRequest, NextResponse } from "next/server";
import { searchTemplatesFromDB } from "@/lib/db";

// DB 서식 대량 검색 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const tag = searchParams.get("tag") || null;

    // DB에서 검색 수행
    const dbResults = await searchTemplatesFromDB(q, tag);

    return NextResponse.json({
      success: true,
      data: dbResults
    });
  } catch (err: any) {
    console.error("API Search Templates Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: err.message },
      { status: 500 }
    );
  }
}
