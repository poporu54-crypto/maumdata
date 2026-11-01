import { NextRequest, NextResponse } from "next/server";
import { getEditRequestById, updateEditRequestStatus, query } from "@/lib/db";
import { isAdminRequest, sanitizeHttpUrl } from "@/lib/sessionAuth";

function normalizeHomepageInput(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme =
    /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const sanitized = sanitizeHttpUrl(withScheme);
  return sanitized || null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const requestId = parseInt(resolvedParams.id, 10);
    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: "유효하지 않은 요청 ID입니다." },
        { status: 400 }
      );
    }

    if (!isAdminRequest(req)) {
      return NextResponse.json(
        { error: "권한이 없습니다. 관리자 로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "유효하지 않은 액션입니다." },
        { status: 400 }
      );
    }

    const reqData = await getEditRequestById(requestId);
    if (!reqData) {
      return NextResponse.json(
        { error: "해당 수정 제안을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (reqData.status !== "pending") {
      return NextResponse.json(
        { error: "이미 승인 혹은 거절 처리가 완료된 건입니다." },
        { status: 400 }
      );
    }

    if (action === "reject") {
      await updateEditRequestStatus(requestId, "rejected");
      return NextResponse.json({ success: true, message: "수정 제안이 반려되었습니다." });
    }

    const safeHomepage = normalizeHomepageInput(reqData.proposedHomepage);
    const safeBrandName = (reqData.proposedBrandName || "").trim().slice(0, 300) || null;
    const safeDescription = (reqData.proposedDescription || "").trim().slice(0, 4000) || null;
    const safeBusinessName = (reqData.proposedBusinessName || "").trim().slice(0, 200) || null;

    await query(
      `
      UPDATE businesses 
      SET brand_name = COALESCE($1, brand_name),
          homepage = COALESCE($2, homepage),
          description = COALESCE($3, description),
          b_nm = COALESCE($5, b_nm)
      WHERE b_no = $4
    `,
      [safeBrandName, safeHomepage, safeDescription, reqData.b_no, safeBusinessName]
    );

    if (reqData.proposedTimeline && Array.isArray(reqData.proposedTimeline)) {
      for (const ev of reqData.proposedTimeline) {
        if (!ev?.date || !ev?.title || !ev?.desc) continue;
        const cleanDate = String(ev.date).replace(/[^0-9]/g, "");
        if (cleanDate.length !== 8) continue;

        await query(
          `
          INSERT INTO business_timeline (b_no, event_date, event_title, event_description)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (b_no, event_date, event_title) DO UPDATE SET
            event_description = EXCLUDED.event_description
        `,
          [
            reqData.b_no,
            cleanDate,
            String(ev.title).trim().slice(0, 200),
            String(ev.desc).trim().slice(0, 1000),
          ]
        );
      }
    }

    await updateEditRequestStatus(requestId, "approved");

    return NextResponse.json({
      success: true,
      message: "수정 제안이 승인되었으며, 기업 상세 데이터에 반영되었습니다.",
    });
  } catch (error) {
    console.error("Failed to process request action:", error);
    return NextResponse.json(
      { error: "수정 제안 액션 처리 중 에러가 발생했습니다." },
      { status: 500 }
    );
  }
}
