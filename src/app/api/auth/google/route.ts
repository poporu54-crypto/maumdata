import { NextResponse, NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    "370947680580-jhif5cev0i9h7fd6do2gijcev3tsjfm3.apps.googleusercontent.com";
  const host = request.headers.get("host") || "www.maumdata.com";
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  if (!clientId) {
    return NextResponse.redirect(`${protocol}://${host}/contracts?auth_notice=google_not_configured`);
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent("openid email profile")}`;

  return NextResponse.redirect(googleAuthUrl);
}
