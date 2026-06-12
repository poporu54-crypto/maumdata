import { NextRequest, NextResponse } from "next/server";
import { addEditRequest } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ b_no: string }> }
) {
  try {
    const resolvedParams = await params;
    const bNo = resolvedParams.b_no;
    const cleanBNo = bNo.replace(/[^0-9]/g, "");

    const body = await req.json();
    const {
      requesterType,
      requesterEmail,
      proposedBrandName,
      proposedHomepage,
      proposedDescription,
      proposedTimeline,
      proposedBusinessName
    } = body;

    if (!requesterType || !requesterEmail) {
      return NextResponse.json(
        { error: "이메일 및 신청자 구분은 필수 항목입니다." },
        { status: 400 }
      );
    }

    const id = await addEditRequest({
      b_no: cleanBNo,
      requester_type: requesterType,
      requester_email: requesterEmail,
      proposed_brand_name: proposedBrandName,
      proposed_homepage: proposedHomepage,
      proposed_description: proposedDescription,
      proposed_timeline: proposedTimeline,
      proposed_b_nm: proposedBusinessName
    });

    return NextResponse.json({ success: true, requestId: id });
  } catch (error: any) {
    console.error("Failed to insert edit request:", error);
    return NextResponse.json(
      { error: "수정 제안 등록에 실패했습니다. 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
