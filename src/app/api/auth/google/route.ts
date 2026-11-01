import { NextResponse, NextRequest } from "next/server";
import {
  createSignedOAuthState,
  getSafeBaseOrigin,
  sanitizeReturnToPath,
} from "@/lib/sessionAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") || "";
  const returnTo = sanitizeReturnToPath(searchParams.get("returnTo"));
  const baseOrigin = getSafeBaseOrigin(request);

  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const redirectUri = `${baseOrigin}/api/auth/google/callback`;

  if (!clientId) {
    return NextResponse.redirect(`${baseOrigin}/contracts?auth_error=google_not_configured`);
  }

  const signedState = createSignedOAuthState({ source, returnTo });
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(
    "openid email profile"
  )}&state=${encodeURIComponent(signedState)}`;

  return NextResponse.redirect(googleAuthUrl);
}
