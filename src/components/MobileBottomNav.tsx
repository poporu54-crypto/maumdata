"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname() || "";

  // 현재 활성 탭 판별
  const isHome = pathname === "/" || pathname.startsWith("/biz") || pathname.startsWith("/search");
  const isMarket = pathname.startsWith("/stats");
  const isForm = pathname.startsWith("/form");
  const isInsights = pathname.startsWith("/insights");

  const navItems = [
    {
      label: "기업조회",
      href: "/",
      active: isHome,
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.4" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
          {active && <circle cx="6" cy="6" r="1.5" fill="currentColor" />}
        </svg>
      ),
    },
    {
      label: "상권분석",
      href: "/stats/market-area",
      active: isMarket,
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.4" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.6 12a.6.6 0 0 0 .8 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8z" />
          <circle cx="12" cy="10" r="3" fill={active ? "currentColor" : "none"} />
        </svg>
      ),
    },
    {
      label: "무료서식",
      href: "/form",
      active: isForm,
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.4" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      ),
    },
    {
      label: "인사이트",
      href: "/insights",
      active: isInsights,
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.4" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="모바일 하단 내비게이션">
      <div className="mobile-bottom-nav-inner">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-tab ${item.active ? "active" : ""}`}
          >
            <div className="tab-icon-wrapper">
              {item.icon(item.active)}
              {item.active && <span className="tab-active-dot" />}
            </div>
            <span className="tab-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
