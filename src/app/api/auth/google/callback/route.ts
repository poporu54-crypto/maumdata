import { NextResponse, NextRequest } from "next/server";
import { upsertContractUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "";
  const host = request.headers.get("host") || "www.maumdata.com";
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  if (!code) {
    return NextResponse.redirect(`${protocol}://${host}/contracts`);
  }

  try {
    const clientId =
      process.env.GOOGLE_CLIENT_ID ||
      "370947680580-jhif5cev0i9h7fd6do2gijcev3tsjfm3.apps.googleusercontent.com";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

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

    const googleId = String(userData.id);
    const name = userData.name || "구글 회원";
    const email = userData.email || `google_${googleId}@maumdata.user`;

    const saved = await upsertContractUser({
      id: `google_${googleId}`,
      provider: "google",
      email,
      name,
    });

    const userPayload = Buffer.from(
      JSON.stringify({
        id: saved.id,
        email: saved.email,
        name: saved.name || name,
        company: saved.company || "",
        provider: "google",
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
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(`${protocol}://${host}/contracts?auth_notice=oauth_failed`);
  }
}
