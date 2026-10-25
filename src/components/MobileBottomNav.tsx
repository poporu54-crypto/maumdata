"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { vibrateDevice } from "@/lib/appBridge";

const BusinessCardScannerModal = dynamic(() => import("./BusinessCardScannerModal"), {
  ssr: false,
});

export default function MobileBottomNav() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // 현재 활성 탭 판별
  const isHome = pathname === "/" || pathname.startsWith("/biz") || pathname.startsWith("/search");
  const isMarket = pathname.startsWith("/stats");
  const isForm = pathname.startsWith("/form");
  const isContracts = pathname.startsWith("/contracts");

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="모바일 하단 내비게이션">
        <div className="mobile-bottom-nav-inner" style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          {/* 1. 기업조회 */}
          <Link
            href="/"
            onClick={() => vibrateDevice(15)}
            className={`mobile-nav-tab ${isHome ? "active" : ""}`}
          >
            <div className="tab-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isHome ? "2.4" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
                {isHome && <circle cx="6" cy="6" r="1.5" fill="currentColor" />}
              </svg>
              {isHome && <span className="tab-active-dot" />}
            </div>
            <span className="tab-label">기업조회</span>
          </Link>

          {/* 2. 상권분석 */}
          <Link
            href="/stats/market-area"
            onClick={() => vibrateDevice(15)}
            className={`mobile-nav-tab ${isMarket ? "active" : ""}`}
          >
            <div className="tab-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isMarket ? "2.4" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.6 12a.6.6 0 0 0 .8 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8z" />
                <circle cx="12" cy="10" r="3" fill={isMarket ? "currentColor" : "none"} />
              </svg>
              {isMarket && <span className="tab-active-dot" />}
            </div>
            <span className="tab-label">상권분석</span>
          </Link>

          {/* 3. 중앙 퀵 액션: 명함/등록증 스캔 버튼 */}
          <button
            type="button"
            onClick={() => {
              vibrateDevice(35);
              setIsScannerOpen(true);
            }}
            className="mobile-nav-tab"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0"
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
                marginTop: "-14px",
                border: "2.5px solid var(--color-card)"
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <span className="tab-label" style={{ fontWeight: 800, color: "#2563eb", marginTop: "2px" }}>
              스캔
            </span>
          </button>

          {/* 4. 무료서식 */}
          <Link
            href="/form"
            onClick={() => vibrateDevice(15)}
            className={`mobile-nav-tab ${isForm ? "active" : ""}`}
          >
            <div className="tab-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isForm ? "2.4" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              {isForm && <span className="tab-active-dot" />}
            </div>
            <span className="tab-label">무료서식</span>
          </Link>

          {/* 5. 계약보관 */}
          <Link
            href="/contracts"
            onClick={() => vibrateDevice(15)}
            className={`mobile-nav-tab ${isContracts ? "active" : ""}`}
          >
            <div className="tab-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isContracts ? "2.4" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <path d="M9 13l2 2 4-4" />
              </svg>
              {isContracts && <span className="tab-active-dot" />}
            </div>
            <span className="tab-label">계약보관</span>
          </Link>
        </div>
      </nav>

      {/* 카메라 스캐너 모달 */}
      {isScannerOpen && (
        <BusinessCardScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onDetectedBusinessNo={(bNo) => {
            router.push(`/biz/${bNo}`);
          }}
        />
      )}
    </>
  );
}
