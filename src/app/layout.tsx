import type { Metadata } from "next";
import "./globals.css";
import ThemeRegistry from "@/components/ThemeRegistry";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.maumdata.com"),
  title: {
    template: "%s | 마음데이터",
    default: "마음데이터(MaumData)",
  },
  description: "국세청 실시간 사업자 상태 조회 및 트랜드, 기업분석, 업종분석, 통계, 무료제공 사업자 정보조회 사이트.",
  keywords: ["사업자등록번호 조회", "실시간 사업자 상태", "계속사업자", "휴업", "폐업", "기업 정보 검색", "민간 데이터 포털"],
  authors: [{ name: "MaumData Team" }],
  openGraph: {
    title: "마음데이터(MaumData)",
    description: "국세청 실시간 사업자 상태 조회 및 트랜드, 기업분석, 업종분석, 통계, 무료제공 사업자 정보조회 사이트.",
    url: "https://www.maumdata.com",
    siteName: "마음데이터",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "마음데이터 최첨단 기업분석 포털",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "마음데이터(MaumData)",
    description: "국세청 실시간 사업자 상태 조회 및 트랜드, 기업분석, 업종분석, 통계, 무료제공 사업자 정보조회 사이트.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3713361723411048"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <ThemeRegistry>
          <header className="header">
            <div className="container header-inner">
              <Link href="/" className="logo">
                마음데이터<span className="logo-accent">BIZ</span>
              </Link>
              <nav className="nav-links">
                <Link href="/" className="nav-link">
                  홈
                </Link>
                <Link href="/stats/market-area" className="nav-link">
                  상권 분석
                </Link>
                <Link href="/insights" className="nav-link">
                  데이터 인사이트
                </Link>
                {/* 테마 토글러가 들어가는 영역 */}
                <div id="theme-toggle-container"></div>
              </nav>
            </div>
          </header>
          
          <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {children}
          </main>
          
          <footer style={{
            backgroundColor: "var(--bg-color-card)",
            borderTop: "1px solid var(--color-border)",
            padding: "48px 0",
            color: "var(--color-text-desc)",
            fontSize: "0.85rem",
            marginTop: "auto",
            transition: "var(--transition-smooth)"
          }}>
            <div className="container" style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "24px" }}>
                <div>
                  <div style={{ fontWeight: 800, color: "var(--color-text-sub)", fontSize: "1rem", marginBottom: "12px" }}>
                    마음데이터 BIZ
                  </div>
                  <p style={{ maxWidth: "400px", lineHeight: 1.6 }}>
                    마음데이터 독자 기업 정밀 분석 엔진을 바탕으로 구축된 대한민국 대표 민간 기업 데이터 포털 사이트입니다.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "48px" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--color-text-sub)", marginBottom: "8px" }}>서비스</div>
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <li><Link href="/" className="footer-link">사업자 조회</Link></li>
                      <li><Link href="/insights" className="footer-link">데이터 인사이트</Link></li>
                      <li><Link href="/stats/market-area" className="footer-link">국가 통계 및 상권 분석</Link></li>
                    </ul>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--color-text-sub)", marginBottom: "8px" }}>법적 고지</div>
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <li><Link href="/terms" className="footer-link">이용약관</Link></li>
                      <li><Link href="/privacy" className="footer-link">개인정보처리방침</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
              <hr style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  © 2026 MaumData Inc. All rights reserved. 본 서비스에서 제공하는 기업 정보 및 통계 분석 데이터는 독자적인 데이터 필터링을 거쳐 제공되는 마음데이터의 자산입니다.
                </div>
              </div>
            </div>
          </footer>
        </ThemeRegistry>
      </body>
    </html>
  );
}
