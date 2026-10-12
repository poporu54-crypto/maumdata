import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "akdmaepdlxk#1";

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();

    if (key === ADMIN_PASSWORD) {
      return NextResponse.json({ success: true, message: "관리자 인증 성공" });
    } else {
      return NextResponse.json({ success: false, error: "관리자 비밀번호가 일치하지 않습니다." }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: "인증 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
