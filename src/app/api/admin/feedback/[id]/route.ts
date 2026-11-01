import { NextRequest, NextResponse } from "next/server";
import { updateFeedbackStatus, deleteFeedback } from "@/lib/db";
import { isAdminRequest } from "@/lib/sessionAuth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 1. 상태 변경 (해결 완료 / 대기 중)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "관리자 인증 실패" }, { status: 403 });
    }

    const { id } = await params;
    const feedbackId = parseInt(id, 10);
    if (isNaN(feedbackId)) {
      return NextResponse.json({ error: "유효하지 않은 피드백 ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const status = body?.status === "RESOLVED" ? "RESOLVED" : "PENDING";

    const updated = await updateFeedbackStatus(feedbackId, status);
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("Failed to update feedback status:", error);
    return NextResponse.json({ error: "상태 변경 실패" }, { status: 500 });
  }
}

// 2. 피드백 삭제
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "관리자 인증 실패" }, { status: 403 });
    }

    const { id } = await params;
    const feedbackId = parseInt(id, 10);
    if (isNaN(feedbackId)) {
      return NextResponse.json({ error: "유효하지 않은 피드백 ID" }, { status: 400 });
    }

    await deleteFeedback(feedbackId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete feedback:", error);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
