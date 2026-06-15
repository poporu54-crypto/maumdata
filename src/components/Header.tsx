"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname() || "";
  const isFormCenter = pathname.startsWith("/form");

  return (
    <header className="header">
      <div className="container header-inner">
        {isFormCenter ? (
          <Link href="/form" className="logo">
            마음데이터<span className="logo-accent" style={{ color: "var(--color-primary)" }}>FORM</span>
          </Link>
        ) : (
          <Link href="/" className="logo">
            마음데이터<span className="logo-accent">BIZ</span>
          </Link>
        )}

        <nav className="nav-links" style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {isFormCenter ? (
            <>
              <Link 
                href="/form" 
                className={`nav-link ${pathname === "/form" ? "active" : ""}`}
                style={{ fontWeight: pathname === "/form" ? 700 : 500 }}
              >
                서식홈
              </Link>
              <Link 
                href="/form/resume" 
                className={`nav-link ${pathname === "/form/resume" ? "active" : ""}`}
                style={{ fontWeight: pathname === "/form/resume" ? 700 : 500 }}
              >
                이력서작성
              </Link>
              <Link 
                href="/form/resignation" 
                className={`nav-link ${pathname === "/form/resignation" ? "active" : ""}`}
                style={{ fontWeight: pathname === "/form/resignation" ? 700 : 500 }}
              >
                사직서작성
              </Link>
              <Link 
                href="/" 
                className="nav-link"
                style={{ 
                  color: "var(--color-text-desc)",
                  fontSize: "0.85rem",
                  marginLeft: "12px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid var(--color-border)"
                }}
              >
                마음데이터 BIZ 가기 →
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/" 
                className={`nav-link ${pathname === "/" ? "active" : ""}`}
              >
                홈
              </Link>
              <Link 
                href="/stats/market-area" 
                className={`nav-link ${pathname.startsWith("/stats") ? "active" : ""}`}
              >
                상권 분석
              </Link>
              <Link 
                href="/insights" 
                className={`nav-link ${pathname.startsWith("/insights") ? "active" : ""}`}
              >
                데이터 인사이트
              </Link>
              <Link 
                href="/form" 
                className={`nav-link ${pathname.startsWith("/form") ? "active" : ""}`}
                style={{ 
                  color: "var(--color-primary)",
                  fontWeight: 700
                }}
              >
                무료 서식 🎁
              </Link>
            </>
          )}
          {/* 테마 토글러가 들어가는 영역 */}
          <div id="theme-toggle-container"></div>
        </nav>
      </div>
    </header>
  );
}
