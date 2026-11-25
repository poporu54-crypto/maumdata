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
  const redirectUri = `${baseOrigin}/api/auth/google/callback`;

  const stateInfo = verifySignedOAuthState(rawState);

  if (!code) {
    return NextResponse.redirect(`${baseOrigin}${stateInfo.returnTo}`);
  }

  if (!stateInfo.valid) {
    return NextResponse.redirect(`${baseOrigin}/contracts?auth_error=oauth_state_invalid`);
  }

  try {
    const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${baseOrigin}/contracts?auth_error=google_not_configured`);
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error("구글 토큰 발급 실패");
    }

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    const googleId = String(userData.id || "");
    if (!googleId) {
      throw new Error("구글 사용자 식별자 누락");
    }
    const name = userData.name || "구글 회원";
    const email = userData.email || `google_${googleId}@maumdata.user`;

    const saved = await upsertContractUser({
      id: `google_${googleId}`,
      provider: "google",
      email,
      name,
    });

    const userPayload = {
      id: saved.id,
      email: saved.email,
      name: saved.name || name,
      company: saved.company || "",
      provider: "google" as const,
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
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(`${baseOrigin}/contracts?auth_error=oauth_failed`);
  }
}
