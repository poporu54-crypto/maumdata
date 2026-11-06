import { NextResponse, NextRequest } from "next/server";
import { getContractUserByEmail, upsertContractUser, deleteContractUser } from "@/lib/db";
import crypto from "crypto";
import {
  checkRateLimit,
  clearUserSessionCookie,
  createSignedUserSessionToken,
  getAuthenticatedContractUser,
  getClientIp,
  hashPasswordScrypt,
  setUserSessionCookie,
  verifySignedUserSessionToken,
  verifyUserPassword,
} from "@/lib/sessionAuth";
import { guardApiRequest } from "@/lib/apiBotGuard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const blocked = guardApiRequest(request, {
    bucket: "auth_session_get",
    maxRequests: 60,
    windowMs: 60_000,
    mode: "public-read",
  });
  if (blocked) return blocked;

  const user = getAuthenticatedContractUser(request);
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }
  const token = createSignedUserSessionToken(user);
  return NextResponse.json({
    authenticated: true,
    user: { ...user, sessionToken: token },
  });
}

export async function POST(request: NextRequest) {
  try {
    const blocked = guardApiRequest(request, {
      bucket: "auth_session_post",
      maxRequests: 25,
      windowMs: 60_000,
      mode: "same-origin",
    });
    if (blocked) return blocked;
    const body = await request.json().catch(() => ({}));
    const { action } = body || {};

    // 1. 로그아웃 요청 처리
    if (action === "logout") {
      const res = NextResponse.json({ success: true });
      clearUserSessionCookie(res);
      return res;
    }

    // 2. OAuth 서명 토큰 교환 및 HttpOnly 쿠키 동기화 (웹·모바일 앱 브릿지 공통)
    if (action === "exchange_oauth") {
      const rawToken = typeof body.oauthToken === "string" ? body.oauthToken.trim() : "";
      const verified = verifySignedUserSessionToken(rawToken);
      if (!verified) {
        return NextResponse.json(
          { error: "유효하지 않거나 만료된 소셜 인증 세션입니다." },
          { status: 401 }
        );
      }
      const freshToken = createSignedUserSessionToken(verified);
      const res = NextResponse.json({
        success: true,
        user: { ...verified, sessionToken: freshToken },
      });
      setUserSessionCookie(res, freshToken);
      return res;
    }

    // 3. 이메일 · 비밀번호 기반 간편 로그인 / 신규 가입 (브루트포스 방어 적용)
    const ip = getClientIp(request);
    const limit = checkRateLimit(`auth_login:${ip}`, 15, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `로그인 시도가 너무 많습니다. ${limit.retryAfterSec}초 후 다시 시도해 주세요.` },
        { status: 429 }
      );
    }

    const { email, password, name, company } = body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "올바른 이메일 주소를 입력해 주세요." },
        { status: 400 }
      );
    }

    const rawPassword = typeof password === "string" ? password.trim() : "";
    if (rawPassword.length < 4) {
      return NextResponse.json(
        { error: "보안 비밀번호(4자리 이상, 신규 가입 시 6자리 이상 권장)를 입력해 주세요." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase().slice(0, 200);
    const safeName = typeof name === "string" ? name.trim().slice(0, 80) : "";
    const safeCompany = typeof company === "string" ? company.trim().slice(0, 100) : "";

    const existing = await getContractUserByEmail(cleanEmail);

    if (existing) {
      // 소셜 로그인 전용 계정(password_hash 없음)에 대한 비밀번호 덮어쓰기 공격 원천 차단
      if (!existing.password_hash || String(existing.password_hash).trim() === "") {
        const providerLabel =
          existing.provider === "kakao"
            ? "카카오"
            : existing.provider === "google"
            ? "구글"
            : "소셜";
        return NextResponse.json(
          {
            error: `${providerLabel} 간편로그인으로 가입된 계정입니다. 상단의 ${providerLabel} 시작하기 버튼을 이용해 주세요.`,
          },
          { status: 403 }
        );
      }

      const pwCheck = verifyUserPassword(rawPassword, existing.password_hash);
      if (!pwCheck.valid) {
        return NextResponse.json(
          { error: "비밀번호가 일치하지 않습니다. 처음 설정하신 비밀번호를 입력해 주세요." },
          { status: 401 }
        );
      }

      const nextHash = pwCheck.needsUpgrade
        ? hashPasswordScrypt(rawPassword)
        : existing.password_hash;

      const updated = await upsertContractUser({
        id: existing.id,
        provider: existing.provider || "quick",
        email: cleanEmail,
        name: safeName || existing.name,
        company: safeCompany || existing.company,
        passwordHash: nextHash,
      });

      const userPayload = {
        id: updated.id,
        email: updated.email,
        name: updated.name || cleanEmail.split("@")[0],
        company: updated.company || "",
        provider: (updated.provider || "quick") as "kakao" | "google" | "quick",
      };
      const sessionToken = createSignedUserSessionToken(userPayload);

      const res = NextResponse.json({
        success: true,
        isNewUser: false,
        user: { ...userPayload, sessionToken },
      });
      setUserSessionCookie(res, sessionToken);
      return res;
    } else {
      if (rawPassword.length < 6) {
        return NextResponse.json(
          { error: "신규 가입 시 보안 비밀번호는 6자리 이상으로 설정해 주세요." },
          { status: 400 }
        );
      }

      const newUserId = `usr_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
      const scryptHash = hashPasswordScrypt(rawPassword);
      const created = await upsertContractUser({
        id: newUserId,
        provider: "quick",
        email: cleanEmail,
        name: safeName || cleanEmail.split("@")[0],
        company: safeCompany,
        passwordHash: scryptHash,
      });

      const userPayload = {
        id: created.id,
        email: created.email,
        name: created.name || cleanEmail.split("@")[0],
        company: created.company || "",
        provider: "quick" as const,
      };
      const sessionToken = createSignedUserSessionToken(userPayload);

      const res = NextResponse.json({
        success: true,
        isNewUser: true,
        user: { ...userPayload, sessionToken },
      });
      setUserSessionCookie(res, sessionToken);
      return res;
    }
  } catch (err) {
    console.error("Auth session error:", err);
    return NextResponse.json(
      { error: "로그인 처리 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const blocked = guardApiRequest(request, {
    bucket: "auth_session_del",
    maxRequests: 5,
    windowMs: 60_000,
    mode: "same-origin",
  });
  if (blocked) return blocked;

  try {
    const authUser = getAuthenticatedContractUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "본인 인증 세션이 만료되었습니다. 다시 로그인한 후 탈퇴를 진행해 주세요." },
        { status: 401 }
      );
    }

    await deleteContractUser(authUser.id, authUser.email);
    const res = NextResponse.json({ success: true });
    clearUserSessionCookie(res);
    return res;
  } catch (err) {
    console.error("Account delete error:", err);
    return NextResponse.json(
      { error: "계정 탈퇴 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
