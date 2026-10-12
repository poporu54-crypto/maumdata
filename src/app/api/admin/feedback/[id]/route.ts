import { NextRequest, NextResponse } from "next/server";
import { updateFeedbackStatus, deleteFeedback } from "@/lib/db";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "akdmaepdlxk#1";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 1. 상태 변경 (해결 완료 / 대기 중)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, adminKey } = body;

    const requestKey = adminKey || req.headers.get("x-admin-key");
    if (requestKey !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "관리자 인증 실패" }, { status: 403 });
    }

    const updated = await updateFeedbackStatus(parseInt(id, 10), status);
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("Failed to update feedback status:", error);
    return NextResponse.json({ error: "상태 변경 실패" }, { status: 500 });
  }
}

// 2. 피드백 삭제
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const adminKey = searchParams.get("adminKey") || req.headers.get("x-admin-key");

    if (adminKey !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "관리자 인증 실패" }, { status: 403 });
    }

    await deleteFeedback(parseInt(id, 10));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete feedback:", error);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
