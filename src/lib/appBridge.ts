"use client";

import { useEffect, useRef } from "react";

/**
 * 마음데이타 웹 - 안드로이드 앱 하이브리드 브릿지 (v1.2+)
 * 앱 환경(AndroidBridge)에서는 네이티브 기능(인쇄/PDF저장, 파일다운로드, ML Kit OCR 스캔,
 * 크롬 커스텀탭 OAuth, 시스템 공유창, 뒤로가기 모달 제어, 당겨서 새로고침 잠금, 상태바 테마 동기화)을 호출하고,
 * 일반 웹 브라우저 환경에서는 표준 웹 API로 자연스럽게 폴백(Fallback)합니다.
 */

export interface NativeOcrResult {
  success: boolean;
  cancelled?: boolean;
  bNo?: string;
  rawText?: string;
  previewDataUrl?: string;
  error?: string;
}

declare global {
  interface Window {
    AndroidBridge?: {
      isNativeApp?: () => boolean;
      getAppVersion?: () => string;
      sharePdf?: (title: string, base64Data: string, filename: string) => void;
      shareText?: (title: string, text: string, url: string) => void;
      saveOrShareFile?: (
        base64Data: string,
        fileName: string,
        mimeType: string,
        mode: string
      ) => void;
      printCurrentPage?: (jobName: string) => void;
      openExternalAuth?: (url: string) => void;
      setPullToRefreshLocked?: (locked: boolean) => void;
      setThemeStyle?: (theme: string) => void;
      openNativeOcrScanner?: (source: string) => void;
      showToast?: (message: string) => void;
      vibrate?: (durationMs: number) => void;
      openCameraScanner?: () => void;
    };
    MaumDataApp?: {
      isNativeApp?: () => boolean;
      platform?: string;
    };
    __handleMaumAppBack?: () => boolean;
    __onMaumNativeOcrResult?: (jsonStr: string) => void;
  }
}

/**
 * 국세청 사업자등록번호(10자리) 공식 체크섬 검증
 * 명함 내 휴대폰번호·팩스번호·계좌번호와 실제 사업자번호를 정확히 구분합니다.
 */
export function isValidKoreanBizNo(raw: string): boolean {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length !== 10) return false;
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(digits[i]) * weights[i];
  }
  sum += Math.floor((Number(digits[8]) * 5) / 10);
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number(digits[9]);
}

/**
 * OCR 추출 텍스트에서 최적의 사업자등록번호(10자리)를 추출
 */
export function extractBizNoFromText(text: string): string {
  if (!text) return "";
  // OCR 오인식 문자 보정 (하이픈 주변 O/o -> 0, I/l/| -> 1)
  const normalized = text.replace(/(\d)[Oo](\d)/g, "$10$2").replace(/(\d)[Il|](\d)/g, "$11$2");

  const candidates: string[] = [];

  // 1순위: 000-00-00000 형태 (공백·특수 하이픈 허용)
  const hyphenRegex = /(\d{3})\s*[-–—~·.]\s*(\d{2})\s*[-–—~·.]\s*(\d{5})/g;
  let match: RegExpExecArray | null;
  while ((match = hyphenRegex.exec(normalized)) !== null) {
    const joined = `${match[1]}${match[2]}${match[3]}`;
    if (!candidates.includes(joined)) candidates.push(joined);
  }

  // 2순위: 연속 10자리 숫자 (앞뒤 숫자와 붙지 않은 경우, 010 휴대폰 번호 제외)
  const tenDigitRegex = /(?:^|[^\d])(\d{10})(?:$|[^\d])/g;
  while ((match = tenDigitRegex.exec(normalized)) !== null) {
    const joined = match[1];
    if (!joined.startsWith("010") && !candidates.includes(joined)) {
      candidates.push(joined);
    }
  }

  // 국세청 공식 체크섬을 통과하는 실제 사업자번호 최우선 반환
  for (const c of candidates) {
    if (isValidKoreanBizNo(c)) return c;
  }

  // 체크섬 미통과 시에도 000-00-00000 명시 패턴이 있으면 후보로 반환 (사용자가 1글자 오인식 수정 가능)
  return candidates[0] || "";
}

/**
 * 현재 실행 환경이 마음데이타 네이티브 앱(안드로이드/iOS WebView)인지 확인
 */
export function isAppEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  if (window.AndroidBridge && typeof window.AndroidBridge.isNativeApp === "function") {
    return window.AndroidBridge.isNativeApp();
  }
  if (window.MaumDataApp && typeof window.MaumDataApp.isNativeApp === "function") {
    return window.MaumDataApp.isNativeApp();
  }
  return navigator.userAgent.includes("MAUMDATA_APP");
}

/**
 * 현재 실행 환경이 마음데이타 iOS 네이티브 앱인지 확인
 */
export function isIOSAppEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  if (window.MaumDataApp?.platform === "ios") return true;
  const ua = navigator.userAgent || "";
  if (ua.includes("MAUMDATA_IOS")) return true;
  return isAppEnvironment() && /iPhone|iPad|iPod/i.test(ua);
}

/**
 * 안드로이드 네이티브 온디바이스 OCR 스캐너 지원 여부 (앱 v1.2.0+)
 */
export function hasNativeOcrScanner(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.AndroidBridge?.openNativeOcrScanner === "function";
}

/**
 * 햅틱 진동 피드백 (버튼 터치, 완료, 경고 등)
 */
export function vibrateDevice(durationMs: number = 30): void {
  if (typeof window === "undefined") return;

  if (window.AndroidBridge?.vibrate) {
    try {
      window.AndroidBridge.vibrate(durationMs);
      return;
    } catch (e) {
      console.warn("AndroidBridge vibrate failed", e);
    }
  }

  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // ignore
    }
  }
}

/**
 * 알림 토스트 (앱 네이티브 Toast 또는 웹 플로팅 토스트 배너)
 */
let webToastTimer: ReturnType<typeof setTimeout> | null = null;

export function showAppToast(message: string): void {
  if (typeof window === "undefined" || !message) return;

  if (window.AndroidBridge?.showToast) {
    try {
      window.AndroidBridge.showToast(message);
      return;
    } catch (e) {
      console.warn("AndroidBridge showToast failed", e);
    }
  }

  // 일반 웹 브라우저용 비차단 미니 토스트 렌더링
  try {
    let el = document.getElementById("maumdata-web-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "maumdata-web-toast";
      Object.assign(el.style, {
        position: "fixed",
        left: "50%",
        bottom: "92px",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        color: "#ffffff",
        padding: "10px 18px",
        borderRadius: "999px",
        fontSize: "0.86rem",
        fontWeight: "700",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
        zIndex: "20000",
        pointerEvents: "none",
        maxWidth: "calc(100vw - 32px)",
        textAlign: "center",
        wordBreak: "keep-all",
        transition: "opacity 0.2s ease",
      });
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.style.opacity = "1";
    if (webToastTimer) clearTimeout(webToastTimer);
    webToastTimer = setTimeout(() => {
      if (el) el.style.opacity = "0";
    }, 2400);
  } catch {
    // ignore
  }
}

// ============================================================================
// 안드로이드 당겨서 새로고침(SwipeRefreshLayout) 잠금 & 물리 뒤로가기 모달 스택 제어
// ============================================================================
const modalBackStack: Array<{ id: number; onBack: () => void }> = [];
let nextBackId = 1;
let manualPtrLockCount = 0;

function syncNativePullToRefreshLock() {
  if (typeof window === "undefined") return;
  const shouldLock = modalBackStack.length > 0 || manualPtrLockCount > 0;
  try {
    window.AndroidBridge?.setPullToRefreshLocked?.(shouldLock);
  } catch {
    // ignore
  }
}

function ensureGlobalBackDispatcher() {
  if (typeof window === "undefined") return;
  if (!window.__handleMaumAppBack) {
    window.__handleMaumAppBack = () => {
      if (modalBackStack.length > 0) {
        const top = modalBackStack[modalBackStack.length - 1];
        try {
          top.onBack();
        } catch (e) {
          console.warn("Modal back handler error", e);
        }
        return true;
      }
      return false;
    };
  }
}

/**
 * 지도 드래그·서명 캔버스 등에서 네이티브 당겨서 새로고침 오작동을 수동 잠금
 */
export function lockAppPullToRefresh(): () => void {
  manualPtrLockCount += 1;
  syncNativePullToRefreshLock();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    manualPtrLockCount = Math.max(0, manualPtrLockCount - 1);
    syncNativePullToRefreshLock();
  };
}

/**
 * 모달이 열려 있을 때:
 * 1) 안드로이드 물리 '뒤로가기' 버튼 입력 시 페이지 이탈 대신 열린 모달만 닫음
 * 2) 모달 내부 스크롤·서명 중 '당겨서 새로고침'이 발동해 작성 데이터가 날아가는 현상 원천 차단
 */
export function useAppModalBack(isOpen: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    ensureGlobalBackDispatcher();

    const id = nextBackId++;
    modalBackStack.push({
      id,
      onBack: () => onCloseRef.current(),
    });
    syncNativePullToRefreshLock();

    return () => {
      const idx = modalBackStack.findIndex((item) => item.id === id);
      if (idx !== -1) {
        modalBackStack.splice(idx, 1);
      }
      syncNativePullToRefreshLock();
    };
  }, [isOpen]);
}

/**
 * 앱 상태바/내비게이션바 다크·라이트 테마 아이콘 색상 동기화
 */
export function syncAppTheme(theme: "light" | "dark"): void {
  if (typeof window === "undefined") return;
  try {
    window.AndroidBridge?.setThemeStyle?.(theme);
  } catch {
    // ignore
  }
}

/**
 * 문서 인쇄 및 PDF 저장 (안드로이드 네이티브 PrintManager 연결 / 웹 window.print)
 */
export function printDocument(jobTitle?: string): void {
  if (typeof window === "undefined") return;
  vibrateDevice(25);

  const safeTitle = (jobTitle || document.title || "마음데이타_문서").trim();

  if (window.AndroidBridge?.printCurrentPage) {
    try {
      window.AndroidBridge.printCurrentPage(safeTitle);
      return;
    } catch (e) {
      console.warn("AndroidBridge printCurrentPage failed", e);
    }
  }

  window.print();
}

/**
 * Blob 파일 다운로드 (앱에서는 다운로드 폴더 즉시 저장, 웹에서는 표준 다운로드)
 */
export async function saveOrDownloadBlob({
  blob,
  fileName,
  mimeType,
}: {
  blob: Blob;
  fileName: string;
  mimeType: string;
}): Promise<void> {
  if (typeof window === "undefined") return;
  vibrateDevice(30);

  if (window.AndroidBridge?.saveOrShareFile) {
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("파일 변환 실패"));
        reader.readAsDataURL(blob);
      });
      window.AndroidBridge.saveOrShareFile(base64Data, fileName, mimeType, "save");
      return;
    } catch (e) {
      console.warn("AndroidBridge saveOrShareFile failed, falling back to link download", e);
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * 일반 텍스트 / 링크 공유 (안드로이드 네이티브 공유창 -> Web Share -> 클립보드 복사 순)
 */
export async function shareTextOrUrl({
  title,
  text,
  url,
}: {
  title: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  if (typeof window === "undefined") return false;
  vibrateDevice(35);

  const shareUrl = url || window.location.href;
  const shareBody = text || `${title}`;

  if (window.AndroidBridge?.shareText) {
    try {
      window.AndroidBridge.shareText(title, shareBody, shareUrl);
      return true;
    } catch (e) {
      console.warn("AndroidBridge shareText failed", e);
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text: shareBody,
        url: shareUrl,
      });
      return true;
    } catch (err: any) {
      if (err?.name === "AbortError") return false;
    }
  }

  // 클립보드 복사 폴백 (무반응 현상 100% 방지)
  try {
    const copyPayload = shareBody.includes(shareUrl) ? shareBody : `${shareBody}\n${shareUrl}`;
    await navigator.clipboard.writeText(copyPayload);
    showAppToast("공유 링크가 클립보드에 복사되었습니다!");
    return true;
  } catch {
    return false;
  }
}

/**
 * PDF 문서 또는 서식 링크 공유
 */
export async function shareDocumentPdf({
  title,
  text,
  base64Data,
  fileName = "마음데이타_서식.pdf",
  fileBlob,
  url,
}: {
  title: string;
  text?: string;
  base64Data?: string;
  fileName?: string;
  fileBlob?: Blob;
  url?: string;
}): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // 1. 안드로이드 앱 PDF 첨부 공유 브릿지
  if (window.AndroidBridge?.sharePdf && base64Data) {
    vibrateDevice(40);
    try {
      window.AndroidBridge.sharePdf(title, base64Data, fileName);
      return true;
    } catch (e) {
      console.warn("AndroidBridge sharePdf failed", e);
    }
  }

  // 2. 모바일 브라우저 Web Share API (파일 첨부 지원 시)
  if (navigator.share && fileBlob) {
    vibrateDevice(40);
    try {
      const file = new File([fileBlob], fileName, { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title,
          text: text || `${title} 문서를 공유합니다.`,
        });
        return true;
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return false;
    }
  }

  // 3. 텍스트 / 링크 공유 (앱 네이티브 공유창 또는 클립보드 복사)
  return shareTextOrUrl({
    title,
    text: text || `[${title}] 마음데이타 무료 서식 문서입니다.`,
    url: url || window.location.href,
  });
}

/**
 * 소셜 로그인 실행 (안드로이드 WebView 내 Google 403 disallowed_useragent 원천 해결)
 */
export function startSocialLogin(provider: "kakao" | "google"): void {
  if (typeof window === "undefined") return;
  vibrateDevice(25);

  const origin = window.location.origin;

  if (isAppEnvironment()) {
    const sourceTag = isIOSAppEnvironment() ? "ios" : "app";
    const appAuthUrl = `${origin}/api/auth/${provider}?source=${sourceTag}`;
    if (window.AndroidBridge?.openExternalAuth) {
      try {
        window.AndroidBridge.openExternalAuth(appAuthUrl);
        return;
      } catch (e) {
        console.warn("openExternalAuth failed", e);
      }
    }

    // 구버전 앱(v1.1.0)에서도 Google OAuth가 403 차단되지 않도록 외부 크롬 인텐트로 우회 실행
    if (provider === "google") {
      const hostAndPath = appAuthUrl.replace(/^https?:\/\//, "");
      const scheme = appAuthUrl.startsWith("https") ? "https" : "http";
      window.location.href = `intent://${hostAndPath}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(
        `${origin}/api/auth/google`
      )};end`;
      return;
    }
  }

  window.location.href = `/api/auth/${provider}`;
}

/**
 * 안드로이드 네이티브 온디바이스 ML Kit OCR 스캐너 호출
 */
export function requestNativeOcrScan(source: "camera" | "gallery"): Promise<NativeOcrResult | null> {
  if (typeof window === "undefined" || !window.AndroidBridge?.openNativeOcrScanner) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    window.__onMaumNativeOcrResult = (jsonStr: string) => {
      try {
        const parsed = JSON.parse(jsonStr) as NativeOcrResult;
        resolve(parsed);
      } catch {
        resolve({ success: false, error: "인식 결과를 읽는 중 오류가 발생했습니다." });
      }
    };

    try {
      window.AndroidBridge?.openNativeOcrScanner?.(source);
    } catch (e: any) {
      resolve({ success: false, error: e?.message || "카메라 스캐너를 실행할 수 없습니다." });
    }
  });
}
