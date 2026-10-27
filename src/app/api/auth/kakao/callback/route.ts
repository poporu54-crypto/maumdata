import { NextResponse, NextRequest } from "next/server";
import { upsertContractUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "";
  const host = request.headers.get("host") || "www.maumdata.com";
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const redirectUri = `${protocol}://${host}/api/auth/kakao/callback`;

  if (!code) {
    return NextResponse.redirect(`${protocol}://${host}/contracts`);
  }

  try {
    const clientId = process.env.KAKAO_CLIENT_ID || "83c099e699aebea20f572b85a32bfab5";
    const clientSecret = process.env.KAKAO_CLIENT_SECRET || "";

    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
    });
    if (clientSecret) {
      tokenParams.append("client_secret", clientSecret);
    }

    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: tokenParams.toString(),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error("카카오 토큰 발급 실패");
    }

    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    const kakaoId = String(userData.id);
    const nickname =
      userData.kakao_account?.profile?.nickname ||
      userData.properties?.nickname ||
      "카카오 회원";
    const email =
      userData.kakao_account?.email || `kakao_${kakaoId}@maumdata.user`;

    const saved = await upsertContractUser({
      id: `kakao_${kakaoId}`,
      provider: "kakao",
      email,
      name: nickname,
    });

    const userPayload = Buffer.from(
      JSON.stringify({
        id: saved.id,
        email: saved.email,
        name: saved.name || nickname,
        company: saved.company || "",
        provider: "kakao",
      })
    ).toString("base64");

    const encodedSession = encodeURIComponent(userPayload);
    const webTargetUrl = `${protocol}://${host}/contracts?oauth_session=${encodedSession}`;

    // iOS ASWebAuthenticationSession 복귀 스킴
    if (state === "ios") {
      return NextResponse.redirect(`maumdata://oauth?oauth_session=${encodedSession}`);
    }

    // 안드로이드 네이티브 앱(Custom Tabs)에서 호출된 경우 앱 내부로 즉시 세션 복귀
    if (state === "app") {
      const appIntentUrl = `intent://oauth?oauth_session=${encodedSession}#Intent;scheme=maumdata;package=com.maumdata.dataapp;S.browser_fallback_url=${encodeURIComponent(
        webTargetUrl
      )};end`;
      return NextResponse.redirect(appIntentUrl);
    }

    return NextResponse.redirect(webTargetUrl);
  } catch (err) {
    console.error("Kakao OAuth error:", err);
    return NextResponse.redirect(`${protocol}://${host}/contracts?auth_notice=oauth_failed`);
  }
}
