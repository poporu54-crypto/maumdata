import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSessionToken,
  isAdminRequest,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/sessionAuth";
import { guardApiRequest } from "@/lib/apiBotGuard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { authenticated: isAdminRequest(req) },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const blocked = guardApiRequest(req, {
      bucket: "admin_login",
      maxRequests: 10,
      windowMs: 5 * 60 * 1000,
      mode: "same-origin",
      rateLimitMessage: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
    });
    if (blocked) return blocked;

    if (!(process.env.ADMIN_PASSWORD || "").trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "서버에 관리자 비밀번호 환경변수(ADMIN_PASSWORD)가 설정되지 않았습니다.",
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const inputKey = typeof body?.key === "string" ? body.key : body?.password;

    if (typeof inputKey === "string" && verifyAdminPassword(inputKey)) {
      const token = createAdminSessionToken();
      const response = NextResponse.json({
        success: true,
        message: "관리자 인증 성공",
      });
      setAdminSessionCookie(response, token);
      return response;
    }

    return NextResponse.json(
      { success: false, error: "관리자 비밀번호가 일치하지 않습니다." },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: "인증 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
