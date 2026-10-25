/**
 * 마음데이터 웹 - 안드로이드 앱 하이브리드 브릿지
 * 앱 환경(AndroidBridge)에서는 네이티브 기능을 호출하고,
 * 웹 브라우저 환경에서는 표준 웹 API(Web Share, Vibration API 등)로 자연스럽게 폴백(Fallback)합니다.
 */

declare global {
  interface Window {
    AndroidBridge?: {
      isNativeApp?: () => boolean;
      sharePdf?: (title: string, base64Data: string, filename: string) => void;
      showToast?: (message: string) => void;
      vibrate?: (durationMs: number) => void;
      openCameraScanner?: () => void;
    };
    MaumDataApp?: {
      isNativeApp?: () => boolean;
    };
  }
}

/**
 * 현재 실행 환경이 마음데이터 네이티브 앱(안드로이드/iOS WebView)인지 확인
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

  // 모바일 브라우저 표준 진동 API
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // ignore
    }
  }
}

/**
 * 알림 토스트 (앱 네이티브 Toast 또는 화면 알림)
 */
export function showAppToast(message: string): void {
  if (typeof window === "undefined") return;

  if (window.AndroidBridge?.showToast) {
    try {
      window.AndroidBridge.showToast(message);
      return;
    } catch (e) {
      console.warn("AndroidBridge showToast failed", e);
    }
  }

  // 웹 브라우저 기본 알림 (필요 시 Alert 또는 커스텀 토스트로 처리)
  // alert(message);
}

/**
 * PDF 문서 공유 (안드로이드 카카오톡/시스템 공유창 or 웹 Web Share API)
 */
export async function shareDocumentPdf({
  title,
  text,
  base64Data,
  fileName = "마음데이터_서식.pdf",
  fileBlob
}: {
  title: string;
  text?: string;
  base64Data?: string;
  fileName?: string;
  fileBlob?: Blob;
}): Promise<boolean> {
  if (typeof window === "undefined") return false;

  vibrateDevice(40);

  // 1. 안드로이드 앱 브릿지 연동
  if (window.AndroidBridge?.sharePdf && base64Data) {
    try {
      window.AndroidBridge.sharePdf(title, base64Data, fileName);
      return true;
    } catch (e) {
      console.warn("AndroidBridge sharePdf failed", e);
    }
  }

  // 2. 모바일 브라우저 Web Share API (파일 첨부 지원 시)
  if (navigator.share && fileBlob) {
    try {
      const file = new File([fileBlob], fileName, { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title,
          text: text || `${title} 문서를 공유합니다.`
        });
        return true;
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("Web Share API files failed, falling back to url/text share", err);
      } else {
        return false;
      }
    }
  }

  // 3. 텍스트/URL 기본 Web Share
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text: text || `${title} 문서를 확인하세요.`,
        url: window.location.href
      });
      return true;
    } catch {
      // ignore abort
    }
  }

  return false;
}
