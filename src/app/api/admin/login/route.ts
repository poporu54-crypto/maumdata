import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    const correctPassword = process.env.ADMIN_PASSWORD || "akdmaepdlxj#1";

    if (password === correctPassword) {
      const cookieStore = await cookies();
      cookieStore.set("admin_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 2, // 2시간 세션 유효
        path: "/"
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "로그인 처리 중 에러가 발생했습니다." },
      { status: 500 }
    );
  }
}
