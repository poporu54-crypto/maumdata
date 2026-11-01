import { NextRequest, NextResponse } from "next/server";
import { getPendingEditRequests } from "@/lib/db";
import { isAdminRequest } from "@/lib/sessionAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json(
        { error: "권한이 없습니다. 먼저 로그인해 주세요." },
        { status: 401 }
      );
    }

    const list = await getPendingEditRequests();
    return NextResponse.json({ success: true, requests: list });
  } catch (error) {
    console.error("Failed to load requests:", error);
    return NextResponse.json(
      { error: "수정 제안 목록 로딩에 실패했습니다." },
      { status: 500 }
    );
  }
}
