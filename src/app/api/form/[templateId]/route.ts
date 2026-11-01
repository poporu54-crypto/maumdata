import { NextRequest, NextResponse } from "next/server";
import { getTemplateByIdFromDB } from "@/lib/db";
import { getTemplateById } from "../../../form/templatesData";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
};

// DB 서식 조회 API 엔드포인트
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await props.params;

    if (!templateId) {
      return NextResponse.json({ success: false, error: "Missing templateId" }, { status: 400 });
    }

    // 1. 먼저 로컬 정적 데이터에서 조회
    const localTemplate = getTemplateById(templateId);
    if (localTemplate) {
      return NextResponse.json({ success: true, data: localTemplate }, { headers: CACHE_HEADERS });
    }

    // 2. 로컬에 없을 경우 데이터베이스에서 조회 (하이브리드)
    const dbTemplate = await getTemplateByIdFromDB(templateId);
    if (dbTemplate) {
      return NextResponse.json({ success: true, data: dbTemplate }, { headers: CACHE_HEADERS });
    }

    return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
  } catch (err: unknown) {
    console.error("API GET Template Error:", err);
    return NextResponse.json(
      { success: false, error: "서식 정보를 불러오는 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
