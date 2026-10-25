"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isAppEnvironment, vibrateDevice } from "@/lib/appBridge";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.maumdata.dataapp";
// 추후 iOS 앱스토어 출시 시 아래 상수에 URL만 입력하면 아이폰/아이패드에도 자동 노출됩니다.
const IOS_STORE_URL = "";

const COOKIE_NAME = "md_hide_app_banner";
const STORAGE_KEY = "md_hide_app_banner_until";
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60; // 604,800초 (7일)
const SEVEN_DAYS_MS = SEVEN_DAYS_SECONDS * 1000;

function hasDismissCookieOrStorage(): boolean {
  if (typeof document === "undefined") return true;

  // 1. 쿠키 확인
  const cookies = document.cookie.split(";").map((c) => c.trim());
  if (cookies.some((c) => c.startsWith(`${COOKIE_NAME}=1`))) {
    return true;
  }

  // 2. localStorage 타임스탬프 보조 확인
  try {
    const untilRaw = window.localStorage.getItem(STORAGE_KEY);
    if (untilRaw) {
      const until = Number(untilRaw);
      if (!Number.isNaN(until) && until > Date.now()) {
        return true;
      }
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // 시크릿 모드 등 스토리지 제한 환경 무시
  }

  return false;
}

function setSevenDayDismiss(): void {
  if (typeof document === "undefined") return;

  // 7일 유지 쿠키 저장
  document.cookie = `${COOKIE_NAME}=1; max-age=${SEVEN_DAYS_SECONDS}; path=/; SameSite=Lax`;

  // localStorage에도 만료 시각 기록
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now() + SEVEN_DAYS_MS));
  } catch {
    // ignore
  }
}

function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIPhoneIPad = /iPhone|iPad|iPod/i.test(ua);
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return isIPhoneIPad || isIPadOS;
}

export default function AppInstallBanner() {
  const pathname = usePathname() || "";
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [storeUrl, setStoreUrl] = useState(PLAY_STORE_URL);

  // 관리자 페이지 및 비대면 계약 서명 전용 페이지에서는 배너 미노출
  const isExcludedRoute = pathname.startsWith("/admin") || pathname.startsWith("/sign");

  useEffect(() => {
    if (isExcludedRoute) {
      setVisible(false);
      return;
    }

    // 1. 네이티브 앱(안드로이드/iOS WebView) 또는 PWA 단독 실행 시 절대 노출하지 않음
    if (isAppEnvironment()) {
      setVisible(false);
      return;
    }
    if (typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)")?.matches) {
      setVisible(false);
      return;
    }

    // 2. iOS 기기 체크 (아이폰 앱 출시 전까지는 미노출, 출시 후 IOS_STORE_URL로 자동 분기)
    if (isIOSDevice()) {
      if (!IOS_STORE_URL) {
        setVisible(false);
        return;
      }
      setStoreUrl(IOS_STORE_URL);
    } else {
      setStoreUrl(PLAY_STORE_URL);
    }

    // 3. 7일간 보지 않기 쿠키/스토리지 확인
    if (hasDismissCookieOrStorage()) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [isExcludedRoute]);

  const handleDismissFor7Days = () => {
    vibrateDevice(15);
    setSevenDayDismiss();
    setClosing(true);
    window.setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 240);
  };

  const handleDownloadClick = () => {
    vibrateDevice(25);
    // 다운로드 클릭 시에도 7일간 중복 알림이 뜨지 않도록 쿠키 처리
    setSevenDayDismiss();
  };

  if (!visible || isExcludedRoute) return null;

  return (
    <aside
      className={`app-install-banner ${closing ? "is-closing" : ""}`}
      role="region"
      aria-label="마음데이타 앱 다운로드 안내"
    >
      <div className="app-install-banner-main">
        {/* 좌측: 마음데이타 앱 심볼 아이콘 */}
        <div className="app-install-icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="appBannerGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#3182f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <path
              d="M20 72 L20 42 C20 35 28 31 34 36 L48 48 C49.5 49.5 52 49.5 53.5 48 L68 34 C74 29 82 33 82 40 L82 72"
              stroke="url(#appBannerGrad)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M62 22 L82 22 L82 42"
              stroke="#38bdf8"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="50" cy="48" r="6.5" fill="#38bdf8" />
          </svg>
        </div>

        {/* 중앙: 메인 카피 & 서브 문구 */}
        <div className="app-install-copy">
          <div className="app-install-title">
            마음데이타 앱 다운받고 <span className="app-install-highlight">기업정보 무료보기</span>
          </div>
          <div className="app-install-sub">
            실시간 휴폐업 · 재무분석 · 명함스캔을 앱에서 더 빠르게
          </div>
        </div>

        {/* 우측: 다운로드 버튼 */}
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDownloadClick}
          className="app-install-cta"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3.61 1.814L13.793 12 3.61 22.186a1.96 1.96 0 0 1-.61-1.42V3.234c0-.545.225-1.055.61-1.42zm11.255 11.256l2.79 2.79-11.09 6.398 8.3-9.188zm3.82-2.203l2.297 1.326c.824.476.824 1.662 0 2.138l-2.297 1.326-3.035-3.035 3.035-2.755zM6.565 1.746l11.09 6.398-2.79 2.79-8.3-9.188z" />
          </svg>
          <span>다운로드</span>
        </a>
      </div>

      {/* 하단 슬림 컨트롤 바: 인터페이스 해치지 않는 깔끔한 7일간 알림 끄기 */}
      <div className="app-install-footer">
        <span className="app-install-badge-txt">Google Play 공식 무료 앱</span>
        <button
          type="button"
          onClick={handleDismissFor7Days}
          className="app-install-dismiss-btn"
          aria-label="7일간 앱 다운로드 알림 끄기"
        >
          <span>7일간 알림 끄기</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
