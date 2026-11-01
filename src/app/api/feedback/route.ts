import { NextRequest, NextResponse } from "next/server";
import { createFeedback, getAllFeedbacks } from "@/lib/db";
import {
  checkRateLimit,
  getClientIp,
  isAdminRequest,
  sanitizeHttpUrl,
} from "@/lib/sessionAuth";

const ALLOWED_CATEGORIES = new Set(["suggestion", "bug", "data_error", "inquiry"]);

// 1. 피드백 제출 (사용자)
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`feedback_submit:${ip}`, 10, 5 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `피드백 접수가 너무 빈번합니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { message, url, userAgent, userId, category } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "피드백 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim().slice(0, 3000);
    const safeUrl = sanitizeHttpUrl(typeof url === "string" ? url : "");
    const safeCategory =
      typeof category === "string" && ALLOWED_CATEGORIES.has(category)
        ? category
        : "suggestion";

    const created = await createFeedback({
      message: trimmedMessage,
      url: safeUrl,
      userAgent: typeof userAgent === "string" ? userAgent.trim().slice(0, 500) : "",
      userId: typeof userId === "string" ? userId.trim().slice(0, 200) : "",
      category: safeCategory,
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
    if (!isAdminRequest(req)) {
      return NextResponse.json(
        { error: "관리자 인증에 실패했습니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";

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
