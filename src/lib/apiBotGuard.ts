import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp, isAdminRequest } from "@/lib/sessionAuth";

/**
 * `/api/*` 엔드포인트에 접근해서는 안 되는 CLI·스크래퍼·헤드리스 브라우저·크롤러 UA 패턴.
 * 주의: 카카오톡 인앱 브라우저(`KAKAOTALK`), 네이버 인앱(`NAVER(inapp`), 모바일 WebView 등은
 * 일반 사용자 브라우저이므로 절대 매칭되지 않도록 정확한 봇 식별자만 포함합니다.
 */
const AUTOMATED_API_BOT_UA_PATTERNS: readonly RegExp[] = [
  // CLI 및 HTTP 라이브러리
  /\b(?:curl|wget|httpie|pycurl|libwww-perl|lwp-trivial)\b/i,
  /\b(?:python-requests|python-urllib|python-httpx|aiohttp|httpx|go-http-client)\b/i,
  /\b(?:apache-httpclient|okhttp|java\/|axios\/|node-fetch|undici|got\/|superagent|guzzlehttp|restsharp|dart:io)\b/i,
  /\b(?:postmanruntime|insomnia\/)\b/i,

  // 헤드리스 브라우저 · 자동화 수집기 · 취약점 스캐너
  /\b(?:scrapy|headlesschrome|phantomjs|playwright|puppeteer|selenium|webdriver|httrack)\b/i,
  /\b(?:sqlmap|nikto|nmap|nuclei|zgrab|masscan|gobuster|dirbuster|ffuf|wfuzz)\b/i,

  // 검색엔진 · AI 수집기 · 해외 SEO/스크래퍼 봇 (`/api/*` 호출 불필요)
  /\b(?:bytespider|petalbot|baiduspider|sogou|yisouspider|360spider)\b/i,
  /\b(?:semrushbot|ahrefsbot|mj12bot|dotbot|blexbot|dataforseobot|barkrowler|ccbot|diffbot|imagesiftbot|aiwebindex|amazonbot)\b/i,
  /\b(?:gptbot|oai-searchbot|chatgpt-user|claudebot|claude-user|claude-searchbot|perplexitybot|perplexity-user|google-extended|applebot-extended|duckassistbot|mistralai-user)\b/i,
  /\b(?:googlebot|bingbot|yandexbot|slurp|duckduckbot|yeti\/|kakaotalk-scrap|facebookexternalhit|twitterbot|discordbot|telegrambot|slackbot)\b/i,
];

const FIRST_PARTY_HOST_RE = /^(?:[a-z0-9-]+\.)*maumdata\.com$/i;

function isTrustedFirstPartyHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  if (!host) return false;
  if (FIRST_PARTY_HOST_RE.test(host)) return true;
  if (host.endsWith(".vercel.app")) return true;
  if (host === "localhost" || host === "127.0.0.1") return true;
  return false;
}

function extractUrlHostname(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isAutomatedApiBot(userAgent: string | null): boolean {
  const ua = (userAgent || "").trim();
  if (!ua || ua.length < 8) {
    return true;
  }
  return AUTOMATED_API_BOT_UA_PATTERNS.some((pattern) => pattern.test(ua));
}

export function isExtensionOrigin(origin: string | null): boolean {
  if (!origin) return false;
  const lower = origin.trim().toLowerCase();
  return (
    lower.startsWith("chrome-extension://") ||
    lower.startsWith("moz-extension://") ||
    lower.startsWith("safari-web-extension://") ||
    lower.startsWith("edge-extension://")
  );
}

/**
 * 크롬/브라우저 확장프로그램(`popup.js`, `background.js`) 및 자사 웹 모달(`CompanySearchModal`, `BusinessCardScannerModal`)
 * 요청만 허용하고, 외부 제3자 웹사이트에서 임베드한 무단 크로스사이트 스크래핑 요청을 차단합니다.
 */
export function isTrustedExtensionOrFirstPartyRequest(req: NextRequest): boolean {
  const origin = req.headers.get("origin")?.trim() || "";
  const referer = req.headers.get("referer")?.trim() || "";
  const secFetchSite = (req.headers.get("sec-fetch-site") || "").trim().toLowerCase();

  if (origin) {
    if (isExtensionOrigin(origin)) return true;
    const originHost = extractUrlHostname(origin);
    return Boolean(originHost && isTrustedFirstPartyHost(originHost));
  }

  if (referer) {
    if (isExtensionOrigin(referer)) return true;
    const refererHost = extractUrlHostname(referer);
    if (!refererHost || !isTrustedFirstPartyHost(refererHost)) {
      return false;
    }
    return true;
  }

  // 외부 웹사이트의 cross-site 스크립트 호출 차단 (확장프로그램 백그라운드 서비스워커는 'none' 또는 미전송)
  if (secFetchSite === "cross-site") {
    return false;
  }

  // Origin/Referer 없는 요청(MV3 background service worker 등)은 실제 브라우저 계열 UA 형태인지 추가 검증
  const ua = (req.headers.get("user-agent") || "").trim();
  return ua.startsWith("Mozilla/5.0 ");
}

/**
 * 자사 웹 및 모바일 하이브리드 앱(Android WebView / iOS WKWebView) 전용 API 보호 검증
 */
export function isTrustedFirstPartyApiRequest(
  req: NextRequest,
  requireOriginEvidence: boolean
): boolean {
  const origin = req.headers.get("origin")?.trim() || "";
  const referer = req.headers.get("referer")?.trim() || "";
  const secFetchSite = (req.headers.get("sec-fetch-site") || "").trim().toLowerCase();

  if (secFetchSite === "cross-site") {
    return false;
  }

  if (origin) {
    const originHost = extractUrlHostname(origin);
    if (!originHost || !isTrustedFirstPartyHost(originHost)) {
      return false;
    }
    return true;
  }

  if (referer) {
    const refererHost = extractUrlHostname(referer);
    if (!refererHost || !isTrustedFirstPartyHost(refererHost)) {
      return false;
    }
    return true;
  }

  if (secFetchSite === "same-origin" || secFetchSite === "same-site") {
    return true;
  }

  const ua = req.headers.get("user-agent") || "";
  if (/MAUMDATA_APP|MAUMDATA_IOS/i.test(ua)) {
    return true;
  }

  return !requireOriginEvidence;
}

export function buildExtensionCorsHeaders(
  req?: NextRequest,
  extraHeaders?: Record<string, string>
): Record<string, string> {
  const origin = req?.headers.get("origin")?.trim() || "";
  let allowOrigin = "https://www.maumdata.com";

  if (!origin || isExtensionOrigin(origin)) {
    allowOrigin = origin || "*";
  } else {
    const host = extractUrlHostname(origin);
    if (host && isTrustedFirstPartyHost(host)) {
      allowOrigin = origin;
    }
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
    ...extraHeaders,
  };
}

export type ApiGuardMode = "same-origin" | "extension" | "public-read";

export interface GuardApiOptions {
  bucket: string;
  maxRequests: number;
  windowMs: number;
  mode?: ApiGuardMode;
  corsHeaders?: Record<string, string>;
  rateLimitMessage?: string;
}

/**
 * 통합 서버사이드 API 봇 방어 · 출처(Origin/Sec-Fetch) 검증 · IP 속도 제한 가드
 * 정상 요청이면 `null`을 반환하고, 차단 대상이면 즉시 반환 가능한 `NextResponse`를 반환합니다.
 */
export function guardApiRequest(
  req: NextRequest,
  options: GuardApiOptions
): NextResponse | null {
  // 서명된 관리자 쿠키 또는 유효한 x-admin-key 요청은 통과
  if (isAdminRequest(req)) {
    return null;
  }

  const mode: ApiGuardMode = options.mode || "same-origin";
  const baseErrorHeaders: Record<string, string> = {
    "Cache-Control": "private, no-store, max-age=0",
    ...(options.corsHeaders || {}),
  };

  // 1. 자동화 봇 · 스크래퍼 · 헤드리스 브라우저 · CLI UA 차단
  const ua = req.headers.get("user-agent");
  if (isAutomatedApiBot(ua)) {
    return NextResponse.json(
      { error: "자동화된 봇 또는 비정상 클라이언트의 API 접근이 차단되었습니다." },
      { status: 403, headers: baseErrorHeaders }
    );
  }

  // 2. 엔드포인트 모드별 출처(Origin / Referer / Sec-Fetch-Site) 무결성 검증
  const method = req.method.toUpperCase();
  const isStateChanging =
    method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";

  if (mode === "extension") {
    if (!isTrustedExtensionOrFirstPartyRequest(req)) {
      return NextResponse.json(
        { error: "허용되지 않은 외부 출처에서의 API 호출입니다." },
        { status: 403, headers: baseErrorHeaders }
      );
    }
  } else if (mode === "same-origin") {
    if (!isTrustedFirstPartyApiRequest(req, isStateChanging)) {
      return NextResponse.json(
        { error: "비정상적인 요청 출처(CSRF/외부 스크립트)가 감지되어 차단되었습니다." },
        { status: 403, headers: baseErrorHeaders }
      );
    }
  } else {
    // public-read: 브라우저 직접/내부 호출은 허용하되 외부 도메인의 무단 cross-site XHR 임베딩은 차단
    if (!isTrustedFirstPartyApiRequest(req, false)) {
      return NextResponse.json(
        { error: "허용되지 않은 외부 도메인 요청입니다." },
        { status: 403, headers: baseErrorHeaders }
      );
    }
  }

  // 3. 실제 클라이언트 IP(`cf-connecting-ip` 최우선) 기준 속도 제한
  const ip = getClientIp(req);
  const rate = checkRateLimit(`${options.bucket}:${ip}`, options.maxRequests, options.windowMs);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error:
          options.rateLimitMessage ||
          `요청 횟수가 너무 많습니다. ${rate.retryAfterSec}초 후 다시 시도해 주세요.`,
      },
      {
        status: 429,
        headers: {
          ...baseErrorHeaders,
          "Retry-After": String(rate.retryAfterSec),
        },
      }
    );
  }

  return null;
}
