import { NextResponse, NextRequest } from "next/server";
import { upsertContractUser } from "@/lib/db";
import {
  createSignedUserSessionToken,
  getSafeBaseOrigin,
  setUserSessionCookie,
  verifySignedOAuthState,
} from "@/lib/sessionAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const rawState = searchParams.get("state") || "";
  const baseOrigin = getSafeBaseOrigin(request);
  const redirectUri = `${baseOrigin}/api/auth/kakao/callback`;

  const stateInfo = verifySignedOAuthState(rawState);

  if (!code) {
    return NextResponse.redirect(`${baseOrigin}${stateInfo.returnTo}`);
  }

  if (!stateInfo.valid) {
    return NextResponse.redirect(`${baseOrigin}/contracts?auth_error=oauth_state_invalid`);
  }

  try {
    const clientId = (process.env.KAKAO_CLIENT_ID || "").trim();
    const clientSecret = (process.env.KAKAO_CLIENT_SECRET || "").trim();

    if (!clientId) {
      return NextResponse.redirect(`${baseOrigin}/contracts?auth_error=kakao_not_configured`);
    }

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

    const kakaoId = String(userData.id || "");
    if (!kakaoId) {
      throw new Error("카카오 사용자 식별자 누락");
    }
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

    const userPayload = {
      id: saved.id,
      email: saved.email,
      name: saved.name || nickname,
      company: saved.company || "",
      provider: "kakao" as const,
    };
    const signedSessionToken = createSignedUserSessionToken(userPayload);
    const separator = stateInfo.returnTo.includes("?") ? "&" : "?";

    // 모바일 네이티브 앱 딥링크 전용: 60초 단기 교환 토큰만 전달 (장기 세션 토큰 URL 노출 차단)
    if (stateInfo.source === "ios") {
      const shortExchangeToken = encodeURIComponent(createSignedUserSessionToken(userPayload, 60));
      return NextResponse.redirect(`maumdata://oauth?oauth_session=${shortExchangeToken}`);
    }

    if (stateInfo.source === "app") {
      const shortExchangeToken = encodeURIComponent(createSignedUserSessionToken(userPayload, 60));
      const fallbackUrl = `${baseOrigin}${stateInfo.returnTo}${separator}oauth_login=1`;
      const appIntentUrl = `intent://oauth?oauth_session=${shortExchangeToken}#Intent;scheme=maumdata;package=com.maumdata.dataapp;S.browser_fallback_url=${encodeURIComponent(
        fallbackUrl
      )};end`;
      const res = NextResponse.redirect(appIntentUrl);
      setUserSessionCookie(res, signedSessionToken);
      return res;
    }

    // 일반 웹 로그인: HttpOnly 쿠키로만 세션 전달 (URL 쿼리스트링 토큰 유출 원천 차단)
    const webTargetUrl = `${baseOrigin}${stateInfo.returnTo}${separator}oauth_login=1`;
    const res = NextResponse.redirect(webTargetUrl);
    setUserSessionCookie(res, signedSessionToken);
    return res;
  } catch (err) {
    console.error("Kakao OAuth error:", err);
    return NextResponse.redirect(`${baseOrigin}/contracts?auth_error=oauth_failed`);
  }
}
