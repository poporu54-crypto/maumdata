import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getDirectoryOverview, type DirectoryHubCardPreview } from "@/lib/directoryApi";
import AdBanner from "@/components/AdBanner";
import StatsRelatedNav from "@/components/StatsRelatedNav";
import JsonLd from "@/components/JsonLd";
import { buildDirectoryOverviewJsonLd } from "@/lib/structuredData";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "알짜 기업 랭킹 · 업무지구 · 산업별 디렉토리",
  description:
    "서울 강남·판교·여의도·성수 등 전국 핵심 업무지구별 주요 기업과 국민연금 추정 평균연봉·신규채용·결산 매출액·코스피/코스닥 상장사 실데이터 랭킹 허브입니다.",
  keywords: [
    "기업 연봉 순위",
    "강남 IT 기업 리스트",
    "판교 기업 순위",
    "국민연금 평균연봉 상위 기업",
    "신규채용 많은 기업",
    "코스닥 상장기업 목록",
    "업종별 매출 순위",
    "마음데이타 기업 디렉토리",
  ],
  alternates: {
    canonical: "/directory",
  },
  openGraph: {
    title: "대한민국 알짜 기업 랭킹 · 지역 · 업종 디렉토리 | 마음데이타",
    description:
      "국세청 계속사업자 검증, 국민연금 임직원·연봉, DART 결산 실데이터로 분류한 전국 주요 업무지구·산업별 기업 리더보드",
    url: "https://www.maumdata.com/directory",
    type: "website",
  },
};

function HubGridSection({
  id,
  badge,
  title,
  desc,
  items,
}: {
  id: string;
  badge: string;
  title: string;
  desc: string;
  items: DirectoryHubCardPreview[];
}) {
  if (items.length === 0) return null;

  return (
    <section id={id} style={{ marginTop: "48px", scrollMarginTop: "100px" }}>
      <div style={{ marginBottom: "18px" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: "0.75rem",
            fontWeight: 800,
            color: "var(--color-primary)",
            backgroundColor: "var(--color-primary-light)",
            padding: "4px 10px",
            borderRadius: "999px",
            marginBottom: "8px",
          }}
        >
          {badge}
        </span>
        <h2
          style={{
            fontSize: "1.45rem",
            fontWeight: 850,
            color: "var(--color-text-main)",
            letterSpacing: "-0.02em",
            margin: "0 0 6px 0",
            wordBreak: "keep-all",
          }}
        >
          {title}
        </h2>
        <p style={{ fontSize: "0.92rem", color: "var(--color-text-desc)", margin: 0, lineHeight: 1.55 }}>
          {desc}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
          gap: "14px",
        }}
      >
        {items.map((hub) => (
          <Link
            key={`${hub.kind}-${hub.slug}`}
            href={`/directory/${hub.kind}/${hub.slug}`}
            prefetch={false}
            className="card related-card"
            style={{
              padding: "20px 22px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "14px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontSize: "1.55rem", lineHeight: 1 }}>{hub.emoji}</span>
                <span
                  style={{
                    fontSize: "0.73rem",
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: "999px",
                    backgroundColor: "var(--bg-color-main)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-sub)",
                  }}
                >
                  검증 {hub.companyCount.toLocaleString("ko-KR")}개사
                </span>
              </div>

              <h3
                style={{
                  fontSize: "1.06rem",
                  fontWeight: 800,
                  color: "var(--color-text-main)",
                  margin: "0 0 6px 0",
                  wordBreak: "keep-all",
                }}
              >
                {hub.shortTitle}
              </h3>

              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--color-text-desc)",
                  lineHeight: 1.48,
                  margin: 0,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {hub.subtitle}
              </p>
            </div>

            {hub.sampleCompanies.length > 0 && (
              <div
                style={{
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                }}
              >
                {hub.sampleCompanies.map((sc, idx) => (
                  <div
                    key={sc.bNo}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      fontSize: "0.79rem",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--color-text-sub)",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <strong style={{ color: "var(--color-primary)", marginRight: "5px" }}>{idx + 1}</strong>
                      {sc.name}
                    </span>
                    <span
                      style={{
                        color: "var(--color-text-desc)",
                        fontWeight: 700,
                        fontSize: "0.74rem",
                        flexShrink: 0,
                      }}
                    >
                      {sc.metricText}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function DirectoryOverviewPage() {
  const overview = await getDirectoryOverview();
  const { globalSummary, rankingHubs, regionHubs, industryHubs } = overview;

  const allHubLinks = [
    ...rankingHubs.map((h) => ({ title: h.title, path: `/directory/ranking/${h.slug}` })),
    ...regionHubs.map((h) => ({ title: h.title, path: `/directory/region/${h.slug}` })),
    ...industryHubs.map((h) => ({ title: h.title, path: `/directory/industry/${h.slug}` })),
  ];

  const jsonLd = buildDirectoryOverviewJsonLd({
    hubLinks: allHubLinks,
    dateModified: globalSummary.updatedAt,
  });

  return (
    <div className="animate-fade-in" style={{ padding: "36px 0 84px 0" }}>
      <JsonLd data={jsonLd} />
      <div className="container" style={{ maxWidth: "980px" }}>
        {/* 히어로 헤더 */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.8rem",
              fontWeight: 800,
              color: "var(--color-primary)",
              backgroundColor: "var(--color-primary-light)",
              padding: "5px 13px",
              borderRadius: "999px",
              marginBottom: "12px",
            }}
          >
            <span>🏆 실데이터 검증 기업 랭킹 · 디렉토리</span>
          </div>

          <h1
            style={{
              fontSize: "2.15rem",
              fontWeight: 850,
              color: "var(--color-text-main)",
              letterSpacing: "-0.03em",
              margin: "0 0 10px 0",
              wordBreak: "keep-all",
            }}
          >
            대한민국 알짜 기업 랭킹 &amp; 권역·업종 디렉토리
          </h1>

          <p
            style={{
              fontSize: "1rem",
              color: "var(--color-text-sub)",
              lineHeight: 1.6,
              margin: 0,
              maxWidth: "780px",
              wordBreak: "keep-all",
            }}
          >
            사업자등록번호를 몰라도 괜찮습니다. 국세청 계속사업자 검증, 국민연금 상시 임직원·추정 평균연봉, 금융감독원 DART 결산 재무제표가 확인된 우량 기업들을 업무지구·산업군·핵심 지표별로 한눈에 비교해 보세요.
          </p>
        </div>

        {/* 실데이터 KPI 요약 스트립 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))",
            gap: "12px",
            marginBottom: "22px",
          }}
        >
          <div className="card" style={{ padding: "18px 20px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
              검증 계속사업자
            </div>
            <div style={{ fontSize: "1.42rem", fontWeight: 850, color: "var(--color-text-main)", marginTop: "4px" }}>
              {globalSummary.activeVerifiedCount.toLocaleString("ko-KR")}개사
            </div>
          </div>

          <div className="card" style={{ padding: "18px 20px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
              상장법인 (KOSPI · KOSDAQ)
            </div>
            <div style={{ fontSize: "1.42rem", fontWeight: 850, color: "var(--color-primary)", marginTop: "4px" }}>
              {globalSummary.listedTotalCount.toLocaleString("ko-KR")}개사
            </div>
          </div>

          <div className="card" style={{ padding: "18px 20px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
              국민연금 추적 임직원
            </div>
            <div style={{ fontSize: "1.42rem", fontWeight: 850, color: "var(--color-text-main)", marginTop: "4px" }}>
              {globalSummary.totalTrackedEmployees.toLocaleString("ko-KR")}명
            </div>
          </div>

          <div className="card" style={{ padding: "18px 20px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
              결산 재무 검증 법인
            </div>
            <div style={{ fontSize: "1.42rem", fontWeight: 850, color: "var(--color-text-main)", marginTop: "4px" }}>
              {globalSummary.financialVerifiedCount.toLocaleString("ko-KR")}개사
            </div>
          </div>
        </div>

        {/* 섹션 점프 네비게이션 */}
        <nav
          aria-label="디렉토리 섹션 빠른 이동"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <a
            href="#section-rankings"
            style={{
              padding: "8px 15px",
              borderRadius: "999px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
              color: "var(--color-text-main)",
              fontSize: "0.84rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            🏆 테마별 실데이터 랭킹 ({rankingHubs.length})
          </a>
          <a
            href="#section-regions"
            style={{
              padding: "8px 15px",
              borderRadius: "999px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
              color: "var(--color-text-main)",
              fontSize: "0.84rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            📍 전국 업무지구별 기업 ({regionHubs.length})
          </a>
          <a
            href="#section-industries"
            style={{
              padding: "8px 15px",
              borderRadius: "999px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
              color: "var(--color-text-main)",
              fontSize: "0.84rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            🏭 핵심 산업·업종별 기업 ({industryHubs.length})
          </a>
        </nav>

        <AdBanner />

        <HubGridSection
          id="section-rankings"
          badge="REAL-DATA LEADERBOARDS"
          title="🏆 테마별 알짜 기업 실데이터 랭킹"
          desc="취업·이직 준비생과 B2B 영업·세무 실무자가 가장 많이 확인하는 연봉·채용·매출·영업이익·상장시장별 리더보드입니다."
          items={rankingHubs}
        />

        <HubGridSection
          id="section-regions"
          badge="OFFICE DISTRICTS & REGIONS"
          title="📍 전국 주요 업무지구 · 권역별 기업 디렉토리"
          desc="강남 테헤란로, 판교 테크노밸리, 여의도, 가산·구로 G밸리, 성수 등 주요 비즈니스 거점별 핵심 기업 목록입니다."
          items={regionHubs}
        />

        <HubGridSection
          id="section-industries"
          badge="KEY INDUSTRY SECTORS"
          title="🏭 12대 핵심 산업군 · 업종별 기업 디렉토리"
          desc="소프트웨어·IT부터 반도체, 제약·바이오, 로봇·기계, K-뷰티·유통까지 주력 산업군별 대표 기업을 비교해 보세요."
          items={industryHubs}
        />

        <StatsRelatedNav currentPath="/directory" />
      </div>
    </div>
  );
}
