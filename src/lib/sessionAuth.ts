import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "admin_session";
export const USER_COOKIE_NAME = "md_user_session";

export interface SessionUserPayload {
  id: string;
  email: string;
  name: string;
  company?: string;
  provider: "kakao" | "google" | "quick";
}

function getSigningSecret(namespace: "admin" | "user" | "oauth"): string {
  const base =
    process.env.SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.KAKAO_CLIENT_SECRET ||
    process.env.DATABASE_URL ||
    "maumdata_local_dev_fallback_secret_only";
  return crypto
    .createHash("sha256")
    .update(`maumdata::${namespace}::v2::${base}`)
    .digest("hex");
}

function hmacSign(payloadB64: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

export function safeStringEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(String(a)).digest();
  const hashB = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB) && a.length === b.length;
}

// ============================================================================
// 1. 관리자(Admin) 서명 세션 토큰 발급 · 검증
// ============================================================================

export function createAdminSessionToken(ttlSeconds = 60 * 60 * 24 * 7): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    role: "admin",
    jti: crypto.randomBytes(12).toString("hex"),
    iat: now,
    exp: now + ttlSeconds,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = hmacSign(payloadB64, getSigningSecret("admin"));
  return `${payloadB64}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return false;

  const expectedSig = hmacSign(payloadB64, getSigningSecret("admin"));
  if (!safeStringEqual(sig, expectedSig)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (parsed?.role !== "admin" || typeof parsed?.exp !== "number" || parsed.exp < now) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function verifyAdminPassword(inputKey: string | null | undefined): boolean {
  const configured = (process.env.ADMIN_PASSWORD || "").trim();
  if (!configured || !inputKey) return false;
  return safeStringEqual(inputKey.trim(), configured);
}

export function isAdminRequest(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (verifyAdminSessionToken(cookieToken)) {
    return true;
  }
  const headerKey = req.headers.get("x-admin-key");
  if (headerKey && verifyAdminPassword(headerKey)) {
    return true;
  }
  return false;
}

export function setAdminSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAdminSessionCookie(res: NextResponse): void {
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
}

// ============================================================================
// 2. 전자계약 사용자(User) 서명 세션 토큰 발급 · 검증
// ============================================================================

export function createSignedUserSessionToken(
  user: SessionUserPayload,
  ttlSeconds = 60 * 60 * 24 * 30
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    id: String(user.id || ""),
    email: String(user.email || "").trim().toLowerCase(),
    name: String(user.name || ""),
    company: String(user.company || ""),
    provider: user.provider || "quick",
    iat: now,
    exp: now + ttlSeconds,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = hmacSign(payloadB64, getSigningSecret("user"));
  return `${payloadB64}.${sig}`;
}

export function verifySignedUserSessionToken(
  token: string | undefined | null
): SessionUserPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;

  const expectedSig = hmacSign(payloadB64, getSigningSecret("user"));
  if (!safeStringEqual(sig, expectedSig)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (!parsed?.id || !parsed?.email || typeof parsed?.exp !== "number" || parsed.exp < now) {
      return null;
    }
    return {
      id: String(parsed.id),
      email: String(parsed.email).trim().toLowerCase(),
      name: String(parsed.name || ""),
      company: String(parsed.company || ""),
      provider:
        parsed.provider === "google" || parsed.provider === "kakao"
          ? parsed.provider
          : "quick",
    };
  } catch {
    return null;
  }
}

export function getAuthenticatedContractUser(req: NextRequest): SessionUserPayload | null {
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    const verified = verifySignedUserSessionToken(bearerToken);
    if (verified) return verified;
  }

  const cookieToken = req.cookies.get(USER_COOKIE_NAME)?.value;
  if (cookieToken) {
    return verifySignedUserSessionToken(cookieToken);
  }

  return null;
}

export function setUserSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(USER_COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearUserSessionCookie(res: NextResponse): void {
  res.cookies.set(USER_COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
}

// ============================================================================
// 3. OAuth State 서명 · Open Redirect 방지
// ============================================================================

export function sanitizeReturnToPath(rawPath: string | null | undefined): string {
  if (!rawPath || typeof rawPath !== "string") return "/contracts";
  const trimmed = rawPath.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return "/contracts";
  }
  return trimmed;
}

export function getSafeBaseOrigin(req: NextRequest): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  if (configured && (configured.startsWith("https://") || configured.startsWith("http://"))) {
    return configured;
  }
  const host = (req.headers.get("host") || "www.maumdata.com").trim();
  const isLocal = host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
  if (isLocal) {
    return `http://${host}`;
  }
  if (host === "maumdata.com" || host === "www.maumdata.com" || host.endsWith(".vercel.app")) {
    return `https://${host}`;
  }
  return "https://www.maumdata.com";
}

export function createSignedOAuthState(params: {
  source?: string;
  returnTo?: string;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    s: params.source === "app" || params.source === "ios" ? params.source : "web",
    r: sanitizeReturnToPath(params.returnTo),
    n: crypto.randomBytes(10).toString("hex"),
    exp: now + 60 * 15,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = hmacSign(payloadB64, getSigningSecret("oauth"));
  return `${payloadB64}.${sig}`;
}

export function verifySignedOAuthState(rawState: string | null | undefined): {
  valid: boolean;
  source: "web" | "app" | "ios";
  returnTo: string;
} {
  if (!rawState) {
    return { valid: false, source: "web", returnTo: "/contracts" };
  }
  if (rawState === "app" || rawState === "ios") {
    return { valid: false, source: rawState, returnTo: "/contracts" };
  }
  const parts = rawState.split(".");
  if (parts.length !== 2) {
    return { valid: false, source: "web", returnTo: "/contracts" };
  }
  const [payloadB64, sig] = parts;
  const expectedSig = hmacSign(payloadB64, getSigningSecret("oauth"));
  if (!safeStringEqual(sig, expectedSig)) {
    return { valid: false, source: "web", returnTo: "/contracts" };
  }
  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (typeof parsed?.exp !== "number" || parsed.exp < now) {
      return { valid: false, source: "web", returnTo: "/contracts" };
    }
    const source = parsed.s === "app" || parsed.s === "ios" ? parsed.s : "web";
    return {
      valid: true,
      source,
      returnTo: sanitizeReturnToPath(parsed.r),
    };
  } catch {
    return { valid: false, source: "web", returnTo: "/contracts" };
  }
}

// ============================================================================
// 4. 비밀번호 해싱 (scrypt + 레거시 SHA-256 호환 마이그레이션)
// ============================================================================

export function hashPasswordScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyUserPassword(
  password: string,
  storedHash: string | null | undefined
): { valid: boolean; needsUpgrade: boolean } {
  if (!storedHash || typeof storedHash !== "string" || storedHash.trim().length === 0) {
    return { valid: false, needsUpgrade: false };
  }

  if (storedHash.startsWith("scrypt$")) {
    const parts = storedHash.split("$");
    if (parts.length !== 3) return { valid: false, needsUpgrade: false };
    const [, salt, hashHex] = parts;
    try {
      const derived = crypto.scryptSync(password, salt, 64);
      const storedBuf = Buffer.from(hashHex, "hex");
      if (derived.length !== storedBuf.length) {
        return { valid: false, needsUpgrade: false };
      }
      return {
        valid: crypto.timingSafeEqual(derived, storedBuf),
        needsUpgrade: false,
      };
    } catch {
      return { valid: false, needsUpgrade: false };
    }
  }

  // 기존 가입자 호환 (일치 시 scrypt로 자동 업그레이드)
  const legacyHash = crypto
    .createHash("sha256")
    .update(password + "_maumdata_salt_2026")
    .digest("hex");
  if (safeStringEqual(legacyHash, storedHash)) {
    return { valid: true, needsUpgrade: true };
  }

  return { valid: false, needsUpgrade: false };
}

// ============================================================================
// 5. 경량 Rate Limiter & 입력 새니타이저
// ============================================================================

interface RateBucket {
  count: number;
  resetAt: number;
}

const globalRateStore = globalThis as unknown as {
  __maumdataRateBuckets?: Map<string, RateBucket>;
};

export function getClientIp(req: NextRequest | Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim() || "127.0.0.1";
  }
  return req.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  if (!globalRateStore.__maumdataRateBuckets) {
    globalRateStore.__maumdataRateBuckets = new Map();
  }
  const store = globalRateStore.__maumdataRateBuckets;
  const now = Date.now();

  if (store.size > 2500) {
    for (const [k, v] of store.entries()) {
      if (v.resetAt <= now) store.delete(k);
    }
  }

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export function sanitizeHttpUrl(rawUrl: string | undefined | null): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim().slice(0, 1000);
  if (!trimmed) return "";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return "";
  } catch {
    return "";
  }
}

export function escapeHtml(raw: unknown): string {
  return String(raw ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
