import React from "react";
import Link from "next/link";

const STATS_LINKS = [
  { href: "/stats/new-biz", label: "📈 신규 채용 · 신설 법인 동향" },
  { href: "/stats/active-rate", label: "🛡️ 국세청 계속사업자 · 고용 안정성" },
  { href: "/stats/distribution", label: "📊 업종별 기업 분포 · 통계청 공식 집계" },
  { href: "/insights", label: "💡 매출 · 고용 리더보드 인사이트" },
  { href: "/stats/market-area", label: "🗺️ 전국 핵심 행정동 상권 분석" },
  { href: "/form", label: "📑 무료 전자문서 · 표준서식 센터" },
];

export default function StatsRelatedNav({ currentPath }: { currentPath?: string }) {
  return (
    <nav
      aria-label="실데이터 기업 통계 및 상권 분석 연관 리포트"
      className="card no-print"
      style={{
        marginTop: "28px",
        padding: "24px",
        border: "1px solid var(--color-border)",
        backgroundColor: "var(--bg-color-card)",
      }}
    >
      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
        🔗 함께 살펴볼 실데이터 기업 통계 · 상권 리포트
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {STATS_LINKS.filter((item) => item.href !== currentPath).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--color-text-sub)",
              backgroundColor: "var(--bg-color-main)",
              border: "1px solid var(--color-border)",
              borderRadius: "20px",
              padding: "7px 14px",
              textDecoration: "none",
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
