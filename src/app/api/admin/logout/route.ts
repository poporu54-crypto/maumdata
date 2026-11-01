import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/sessionAuth";

export async function POST() {
  try {
    const res = NextResponse.json({ success: true });
    clearAdminSessionCookie(res);
    return res;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "로그아웃 처리 중 에러가 발생했습니다." },
      { status: 500 }
    );
  }
}
