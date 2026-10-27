"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MaumDataLogo from "./MaumDataLogo";
import { vibrateDevice, useAppModalBack } from "@/lib/appBridge";

const MOBILE_MENU_SECTIONS = [
  {
    group: "기업 · 상권 · 통계 분석",
    items: [
      { href: "/", icon: "🏢", label: "기업 조회 홈", desc: "상호·대표자·사업자번호 통합 조회" },
      { href: "/stats/market-area", icon: "📍", label: "전국 상권 분석", desc: "행정동별 밀집도 및 지도 분석" },
      { href: "/insights", icon: "📊", label: "데이터 인사이트", desc: "국민연금 고용·매출 랭킹 리포트" },
      { href: "/stats/new-biz", icon: "📈", label: "업종별 기업 분포", desc: "실등록 업종 순위 및 대표 기업" },
      { href: "/stats/active-rate", icon: "🛡️", label: "계속사업자 유지율", desc: "생존율 및 사업 안정성 지표" },
      { href: "/stats/distribution", icon: "🗺️", label: "시도별 사업체 분포", desc: "전국 17개 시도 기업 현황" },
    ],
  },
  {
    group: "비즈니스 문서 · 전자계약",
    items: [
      { href: "/form", icon: "🎁", label: "무료 서식 센터", desc: "300여 종 계약서·견적서·공문서" },
      { href: "/form/resume", icon: "📝", label: "표준 이력서 작성", desc: "즉시 PDF 저장 및 인쇄 지원" },
      { href: "/form/resignation", icon: "📄", label: "표준 사직서 작성", desc: "모바일 서명 날인 즉시 완성" },
      { href: "/contracts", icon: "📁", label: "내 영구 계약 보관함", desc: "체결 계약서 클라우드 영구 열람" },
    ],
  },
];

export default function Header() {
  const pathname = usePathname() || "";
  const isFormCenter = pathname.startsWith("/form");
  const isInsightsActive =
    pathname.startsWith("/insights") ||
    (pathname.startsWith("/stats") && !pathname.startsWith("/stats/market-area"));

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 페이지 이동 시 모바일 전체메뉴 자동 닫기
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // 안드로이드 물리 뒤로가기 연동 및 당겨서 새로고침 잠금
  useAppModalBack(isMobileMenuOpen, () => setIsMobileMenuOpen(false));

  return (
    <>
      <header className="header no-print">
        <div className="container header-inner">
          {/* SVG 로고 영역 */}
          <Link href={isFormCenter ? "/form" : "/"} prefetch={false} className="header-logo-link">
            <MaumDataLogo size="md" variant={isFormCenter ? "form" : "biz"} />
          </Link>

          {/* 데스크톱 전용 네비게이션 링크 */}
          <nav className="desktop-nav-links">
            {isFormCenter ? (
              <>
                <Link
                  href="/form"
                  prefetch={false}
                  className={`nav-link ${pathname === "/form" ? "active" : ""}`}
                  style={{ fontWeight: pathname === "/form" ? 700 : 500 }}
                >
                  서식홈
                </Link>
                <Link
                  href="/form/resume"
                  prefetch={false}
                  className={`nav-link ${pathname === "/form/resume" ? "active" : ""}`}
                  style={{ fontWeight: pathname === "/form/resume" ? 700 : 500 }}
                >
                  이력서 작성
                </Link>
                <Link
                  href="/form/resignation"
                  prefetch={false}
                  className={`nav-link ${pathname === "/form/resignation" ? "active" : ""}`}
                  style={{ fontWeight: pathname === "/form/resignation" ? 700 : 500 }}
                >
                  사직서 작성
                </Link>
                <Link
                  href="/contracts"
                  prefetch={false}
                  className={`nav-link ${pathname.startsWith("/contracts") ? "active" : ""}`}
                  style={{ fontWeight: pathname.startsWith("/contracts") ? 700 : 500 }}
                >
                  📁 내 계약 보관함
                </Link>
                <Link href="/" prefetch={false} className="nav-link btn-portal-switch">
                  기업 BIZ 분석 가기 →
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  prefetch={false}
                  className={`nav-link ${pathname === "/" ? "active" : ""}`}
                >
                  기업 조회
                </Link>
                <Link
                  href="/stats/market-area"
                  prefetch={false}
                  className={`nav-link ${pathname.startsWith("/stats") ? "active" : ""}`}
                >
                  상권 분석
                </Link>
                <Link
                  href="/insights"
                  prefetch={false}
                  className={`nav-link ${pathname.startsWith("/insights") ? "active" : ""}`}
                >
                  데이터 인사이트
                </Link>
                <Link
                  href="/form"
                  prefetch={false}
                  className={`nav-link nav-link-highlight ${pathname.startsWith("/form") ? "active" : ""}`}
                >
                  무료 서식 센터 🎁
                </Link>
                <Link
                  href="/contracts"
                  prefetch={false}
                  className={`nav-link ${pathname.startsWith("/contracts") ? "active" : ""}`}
                  style={{ fontWeight: pathname.startsWith("/contracts") ? 700 : 500 }}
                >
                  📁 내 계약 보관함
                </Link>
              </>
            )}

            {/* 데스크톱 테마 토글러 주입 영역 */}
            <div id="theme-toggle-container" className="theme-toggle-wrapper"></div>
          </nav>

          {/* 모바일 우측 헤더 액션 (인사이트 바로가기 + 다크모드 + 전체메뉴) */}
          <div className="mobile-header-actions">
            <Link
              href="/insights"
              prefetch={false}
              onClick={() => vibrateDevice(15)}
              className={`mobile-insights-chip ${isInsightsActive ? "active" : ""}`}
            >
              <span>📊</span>
              <span>인사이트</span>
            </Link>
            <div id="mobile-theme-toggle-slot"></div>
            <button
              type="button"
              className="mobile-menu-trigger-btn"
              aria-label="전체 메뉴 열기"
              onClick={() => {
                vibrateDevice(20);
                setIsMobileMenuOpen(true);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 전체 메뉴 시트 (열렸을 때만 조건부 마운트 — DOM 낭비 제로) */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="마음데이터 전체 메뉴"
          className="no-print"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            zIndex: 10050,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(340px, 88vw)",
              height: "100%",
              backgroundColor: "var(--bg-color-card)",
              borderLeft: "1px solid var(--color-border)",
              boxShadow: "-12px 0 36px rgba(0, 0, 0, 0.3)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              padding: "20px 18px calc(28px + env(safe-area-inset-bottom)) 18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "14px",
                borderBottom: "1px solid var(--color-border)",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                전체 서비스 메뉴
              </span>
              <button
                type="button"
                aria-label="전체 메뉴 닫기"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  background: "var(--bg-color-main)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  width: "34px",
                  height: "34px",
                  fontSize: "1.1rem",
                  color: "var(--color-text-sub)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px", flex: 1 }}>
              {MOBILE_MENU_SECTIONS.map((sec) => (
                <div key={sec.group}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: "var(--color-text-desc)",
                      marginBottom: "8px",
                      paddingLeft: "4px",
                    }}
                  >
                    {sec.group}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {sec.items.map((item) => {
                      const active =
                        item.href === "/"
                          ? pathname === "/"
                          : pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={false}
                          onClick={() => {
                            vibrateDevice(15);
                            setIsMobileMenuOpen(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 12px",
                            borderRadius: "12px",
                            backgroundColor: active ? "var(--color-primary-light)" : "var(--bg-color-main)",
                            border: active
                              ? "1px solid rgba(49, 130, 246, 0.35)"
                              : "1px solid transparent",
                            textDecoration: "none",
                          }}
                        >
                          <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{item.icon}</span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: "0.9rem",
                                fontWeight: 700,
                                color: active ? "var(--color-primary)" : "var(--color-text-main)",
                              }}
                            >
                              {item.label}
                            </div>
                            <div
                              style={{
                                fontSize: "0.74rem",
                                color: "var(--color-text-desc)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.desc}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 하단 서비스 피드백 버튼 (모바일 플로팅 버튼 겹침 해소 후 메뉴 내부로 깔끔히 수납) */}
            <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid var(--color-border)" }}>
              <button
                type="button"
                onClick={() => {
                  vibrateDevice(20);
                  setIsMobileMenuOpen(false);
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("maumdata-open-feedback"));
                  }
                }}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-main)",
                  color: "var(--color-text-sub)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span>💬</span>
                <span>서비스 개선 의견 보내기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
