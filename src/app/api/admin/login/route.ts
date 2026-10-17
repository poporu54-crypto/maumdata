import { NextRequest, NextResponse } from "next/server";

const VALID_PASSWORDS = [
  process.env.ADMIN_PASSWORD,
].filter(Boolean) as string[];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const inputKey = body.key || body.password;

    if (inputKey && VALID_PASSWORDS.some(p => p.trim() === inputKey.trim())) {
      const response = NextResponse.json({ success: true, message: "관리자 인증 성공" });
      
      // 관리자 세션 쿠키 설정 (보안 강화 및 라우트 호환)
      response.cookies.set("admin_session", "authenticated", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7일간 유지
      });

      return response;
    } else {
      return NextResponse.json(
        { success: false, error: "관리자 비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json({ error: "인증 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
