import { NextResponse, NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const clientId = process.env.KAKAO_CLIENT_ID || "83c099e699aebea20f572b85a32bfab5";
  const host = request.headers.get("host") || "www.maumdata.com";
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const redirectUri = `${protocol}://${host}/api/auth/kakao/callback`;

  if (!clientId) {
    return NextResponse.redirect(`${protocol}://${host}/contracts?auth_notice=kakao_not_configured`);
  }

  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

  return NextResponse.redirect(kakaoAuthUrl);
}
