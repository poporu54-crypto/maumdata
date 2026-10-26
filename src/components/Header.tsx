"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MaumDataLogo from "./MaumDataLogo";

export default function Header() {
  const pathname = usePathname() || "";
  const isFormCenter = pathname.startsWith("/form");

  return (
    <header className="header">
      <div className="container header-inner">
        {/* SVG 로고 영역 */}
        <Link href={isFormCenter ? "/form" : "/"} prefetch={false} className="header-logo-link">
          <MaumDataLogo 
            size="md" 
            variant={isFormCenter ? "form" : "biz"} 
          />
        </Link>

        {/* 데스크톱 전용 네비게이션 링크 (모바일에서는 하단 바텀 탭 네비게이션이 담당) */}
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
              <Link 
                href="/" 
                prefetch={false}
                className="nav-link btn-portal-switch"
              >
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

          {/* 테마 토글러 주입 영역 */}
          <div id="theme-toggle-container" className="theme-toggle-wrapper"></div>
        </nav>

        {/* 모바일 우측 헤더 액션 (테마 토글러 전용) */}
        <div className="mobile-header-actions">
          <div id="mobile-theme-toggle-slot"></div>
        </div>
      </div>
    </header>
  );
}
