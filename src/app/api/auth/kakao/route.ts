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

  const clientId = (process.env.KAKAO_CLIENT_ID || "").trim();
  const redirectUri = `${baseOrigin}/api/auth/kakao/callback`;

  if (!clientId) {
    return NextResponse.redirect(`${baseOrigin}/contracts?auth_error=kakao_not_configured`);
  }

  const signedState = createSignedOAuthState({ source, returnTo });
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&state=${encodeURIComponent(signedState)}`;

  return NextResponse.redirect(kakaoAuthUrl);
}
