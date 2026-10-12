import { NextRequest, NextResponse } from "next/server";
import { createFeedback, getAllFeedbacks } from "@/lib/db";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "akdmaepdlxj#1";

// 1. 피드백 제출 (사용자)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, url, userAgent, userId, category } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "피드백 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const created = await createFeedback({
      message: message.trim(),
      url: url || "",
      userAgent: userAgent || "",
      userId: userId || "",
      category: category || "suggestion",
    });

    return NextResponse.json({
      success: true,
      message: "소중한 피드백이 성공적으로 접수되었습니다.",
      feedback: created,
    });
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return NextResponse.json(
      { error: "피드백 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 2. 피드백 목록 조회 (관리자 전용)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminKey = searchParams.get("adminKey") || req.headers.get("x-admin-key");
    const status = searchParams.get("status") || "ALL";

    if (adminKey !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "관리자 인증에 실패했습니다." },
        { status: 403 }
      );
    }

    const feedbacks = await getAllFeedbacks(status);
    return NextResponse.json({
      success: true,
      feedbacks,
    });
  } catch (error) {
    console.error("Failed to fetch feedbacks:", error);
    return NextResponse.json(
      { error: "피드백 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
