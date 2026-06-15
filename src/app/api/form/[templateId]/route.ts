import { NextRequest, NextResponse } from "next/server";
import { getTemplateByIdFromDB } from "@/lib/db";
import { getTemplateById } from "../../../form/templatesData";

// DB 서식 조회 API 엔드포인트
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await props.params;

    if (!templateId) {
      return NextResponse.json({ error: "Missing templateId" }, { status: 400 });
    }

    // 1. 먼저 로컬 정적 데이터에서 조회
    const localTemplate = getTemplateById(templateId);
    if (localTemplate) {
      return NextResponse.json({ success: true, data: localTemplate });
    }

    // 2. 로컬에 없을 경우 데이터베이스에서 조회 (하이브리드)
    const dbTemplate = await getTemplateByIdFromDB(templateId);
    if (dbTemplate) {
      return NextResponse.json({ success: true, data: dbTemplate });
    }

    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  } catch (err: any) {
    console.error("API GET Template Error:", err);
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
