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

    const signedSessionToken = createSignedUserSessionToken({
      id: saved.id,
      email: saved.email,
      name: saved.name || name,
      company: saved.company || "",
      provider: "google",
    });

    const encodedSession = encodeURIComponent(signedSessionToken);
    const separator = stateInfo.returnTo.includes("?") ? "&" : "?";
    const webTargetUrl = `${baseOrigin}${stateInfo.returnTo}${separator}oauth_session=${encodedSession}`;

    if (stateInfo.source === "ios") {
      return NextResponse.redirect(`maumdata://oauth?oauth_session=${encodedSession}`);
    }

    if (stateInfo.source === "app") {
      const appIntentUrl = `intent://oauth?oauth_session=${encodedSession}#Intent;scheme=maumdata;package=com.maumdata.dataapp;S.browser_fallback_url=${encodeURIComponent(
        webTargetUrl
      )};end`;
      return NextResponse.redirect(appIntentUrl);
    }

    const res = NextResponse.redirect(webTargetUrl);
    setUserSessionCookie(res, signedSessionToken);
    return res;
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(`${baseOrigin}/contracts?auth_error=oauth_failed`);
  }
}
