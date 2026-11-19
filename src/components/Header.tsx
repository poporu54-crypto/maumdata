"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MaumDataLogo from "./MaumDataLogo";
import { vibrateDevice, useAppModalBack } from "@/lib/appBridge";

const MOBILE_MENU_SECTIONS = [
  {
    group: "기업 · 상권 · 통계 분석",
    items: [
      { href: "/", icon: "🏢", label: "기업 조회 홈", desc: "상호·대표자·사업자번호 통합 조회" },
      { href: "/directory", icon: "🏆", label: "기업 랭킹 · 디렉토리", desc: "지역·업종·연봉·매출 알짜 기업 순위" },
      { href: "/compare", icon: "⚖️", label: "기업 1:1 스펙 비교", desc: "두 회사 연봉·임직원·매출 맞대결" },
      { href: "/bulk-check", icon: "⚡", label: "거래처 휴·폐업 일괄조회", desc: "최대 100건 실시간 상태·엑셀 저장" },
      { href: "/stats/market-area", icon: "📍", label: "전국 상권 분석", desc: "행정동별 밀집도 및 지도 분석" },
      { href: "/insights", icon: "📊", label: "데이터 인사이트", desc: "국민연금 고용·매출 랭킹 리포트" },
      { href: "/stats/new-biz", icon: "📈", label: "업종별 기업 분포", desc: "실등록 업종 순위 및 대표 기업" },
      { href: "/stats/active-rate", icon: "🛡️", label: "계속사업자 유지율", desc: "생존율 및 사업 안정성 지표" },
      { href: "/stats/distribution", icon: "🗺️", label: "시도별 사업체 분포", desc: "전국 17개 시도 기업 현황" },
    ],
  },
  {
    group: "비즈니스 문서 · 전자계약 · B2B",
    items: [
      { href: "/form", icon: "🎁", label: "무료 서식 센터", desc: "300여 종 계약서·견적서·공문서" },
      { href: "/form/resume", icon: "📝", label: "표준 이력서 작성", desc: "즉시 PDF 저장 및 인쇄 지원" },
      { href: "/form/resignation", icon: "📄", label: "표준 사직서 작성", desc: "모바일 서명 날인 즉시 완성" },
      { href: "/contracts", icon: "📁", label: "내 영구 계약 보관함", desc: "체결 계약서 클라우드 영구 열람" },
      { href: "/partners", icon: "💼", label: "기업 공식 인증 · B2B 제휴", desc: "공식 프로필 등록 · 거래처 폐업 알림 신청" },
    ],
  },
];

interface NavItem {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
  className?: string;
}

const FORM_NAV_ITEMS: NavItem[] = [
  { href: "/form", label: "서식홈", isActive: (p) => p === "/form" },
  { href: "/form/resume", label: "이력서 작성", isActive: (p) => p === "/form/resume" },
  { href: "/form/resignation", label: "사직서 작성", isActive: (p) => p === "/form/resignation" },
  { href: "/contracts", label: "📁 내 계약 보관함", isActive: (p) => p.startsWith("/contracts") },
  { href: "/", label: "기업 BIZ 분석 →", isActive: () => false, className: "btn-portal-switch" },
];

const BIZ_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "기업 조회", isActive: (p) => p === "/" || p.startsWith("/biz") },
  { href: "/directory", label: "기업 랭킹", isActive: (p) => p.startsWith("/directory") },
  { href: "/compare", label: "1:1 비교", isActive: (p) => p.startsWith("/compare") },
  { href: "/bulk-check", label: "일괄조회", isActive: (p) => p.startsWith("/bulk-check") },
  { href: "/stats/market-area", label: "상권 분석", isActive: (p) => p.startsWith("/stats/market-area") },
  {
    href: "/insights",
    label: "데이터 인사이트",
    isActive: (p) => p.startsWith("/insights") || (p.startsWith("/stats") && !p.startsWith("/stats/market-area")),
  },
  {
    href: "/form",
    label: "무료 서식 센터 🎁",
    isActive: (p) => p.startsWith("/form"),
    className: "nav-link-highlight",
  },
  { href: "/contracts", label: "📁 내 계약 보관함", isActive: (p) => p.startsWith("/contracts") },
];

export default function Header() {
  const pathname = usePathname() || "";
  const isFormCenter = pathname.startsWith("/form");
  const navItems = isFormCenter ? FORM_NAV_ITEMS : BIZ_NAV_ITEMS;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const navRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
    suppressClickUntil: 0,
  });

  // 가로 스크롤 가능 여부(좌/우 페이드 마스크 표시용) 계산
  const updateScrollIndicators = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScroll - el.scrollLeft > 4);
  }, []);

  useEffect(() => {
    updateScrollIndicators();
    const el = navRef.current;
    if (!el) return;

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateScrollIndicators) : null;
    ro?.observe(el);
    window.addEventListener("resize", updateScrollIndicators);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateScrollIndicators);
    };
  }, [updateScrollIndicators, pathname]);

  // 현재 활성 탭이 화면 밖에 있으면 가로 레일 안에서만 부드럽게 중앙 정렬 (세로 스크롤 간섭 없음)
  useEffect(() => {
    setIsMobileMenuOpen(false);
    const el = navRef.current;
    if (!el) return;
    const activeLink = el.querySelector<HTMLElement>(".nav-link.active");
    if (!activeLink) return;
    if (el.scrollWidth <= el.clientWidth) return;

    const targetLeft = activeLink.offsetLeft - (el.clientWidth - activeLink.offsetWidth) / 2;
    el.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: "smooth",
    });
  }, [pathname]);

  // 데스크톱 마우스 드래그 스크롤 (터치 기기는 브라우저 네이티브 관성 스와이프 그대로 사용)
  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    const el = navRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;

    dragStateRef.current.active = true;
    dragStateRef.current.startX = e.clientX;
    dragStateRef.current.startScrollLeft = el.scrollLeft;
    dragStateRef.current.moved = false;

    const handleMouseMove = (moveEvt: MouseEvent) => {
      const state = dragStateRef.current;
      if (!state.active || !navRef.current) return;
      const dx = moveEvt.clientX - state.startX;
      if (!state.moved && Math.abs(dx) > 5) {
        state.moved = true;
        setIsDragging(true);
      }
      if (state.moved) {
        moveEvt.preventDefault();
        navRef.current.scrollLeft = state.startScrollLeft - dx;
      }
    };

    const handleMouseUp = () => {
      const state = dragStateRef.current;
      if (state.moved) {
        state.suppressClickUntil = Date.now() + 180;
      }
      state.active = false;
      state.moved = false;
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLElement>) => {
    if (Date.now() < dragStateRef.current.suppressClickUntil) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // 안드로이드 물리 뒤로가기 연동 및 당겨서 새로고침 잠금
  useAppModalBack(isMobileMenuOpen, () => setIsMobileMenuOpen(false));

  const isScrollable = canScrollLeft || canScrollRight;

  return (
    <>
      <header className="header no-print">
        <div className="container header-inner">
          {/* 1. 좌측 고정 SVG 로고 */}
          <Link href={isFormCenter ? "/form" : "/"} prefetch={false} className="header-logo-link">
            <MaumDataLogo size="md" variant={isFormCenter ? "form" : "biz"} />
          </Link>

          {/* 2. 가로 손가락 스와이프 · 마우스 드래그 지원 단일 네비게이션 레일 */}
          <div
            className={`header-nav-rail ${canScrollLeft ? "fade-left" : ""} ${canScrollRight ? "fade-right" : ""}`}
          >
            <nav
              ref={navRef}
              aria-label="주요 서비스 메뉴"
              className={`header-nav-scroll ${isScrollable ? "is-scrollable" : ""} ${isDragging ? "is-dragging" : ""}`}
              onScroll={updateScrollIndicators}
              onMouseDown={handleMouseDown}
              onClickCapture={handleClickCapture}
            >
              {navItems.map((item) => {
                const active = item.isActive(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    draggable={false}
                    onClick={() => vibrateDevice(12)}
                    className={`nav-link ${item.className || ""} ${active ? "active" : ""}`.trim()}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 3. 우측 고정 액션 영역 (테마 토글 + 모바일 전체메뉴 버튼) */}
          <div className="header-right-actions">
            <div id="theme-toggle-container" className="theme-toggle-wrapper"></div>
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
          aria-label="마음데이타 전체 메뉴"
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

            {/* 하단 서비스 피드백 버튼 */}
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
