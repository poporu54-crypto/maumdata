import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import CompareSelectorClient from "./CompareSelectorClient";
import { FEATURED_RIVALRIES } from "@/lib/compareConfig";
import AdBanner from "@/components/AdBanner";
import StatsRelatedNav from "@/components/StatsRelatedNav";
import JsonLd from "@/components/JsonLd";
import { ORG_ID, SITE_URL, WEBSITE_ID, buildBreadcrumbNode } from "@/lib/structuredData";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "기업 1:1 스펙 비교기 (연봉 · 임직원 · 입퇴사율 · 매출 맞대결)",
  description:
    "취업·이직·투자를 앞둔 두 기업의 국민연금 추정 평균연봉, 상시 임직원 수, 입사/퇴사율, 최근 3개년 결산 매출액·영업이익률·부채비율을 한 화면에서 1:1로 비교하고 링크를 공유하세요.",
  keywords: [
    "기업 연봉 비교",
    "회사 스펙 비교",
    "이직 기업 비교",
    "국민연금 연봉 비교",
    "기업 매출 비교",
    "퇴사율 비교",
    "마음데이타 기업비교",
  ],
  alternates: {
    canonical: "/compare",
  },
  openGraph: {
    title: "A사 vs B사 기업 1:1 스펙 비교기 | 마음데이타",
    description:
      "두 기업의 국민연금 추정 평균연봉 · 상시 임직원 · 입퇴사율 · 3개년 매출/영업이익을 나란히 비교해 보세요.",
    url: "https://www.maumdata.com/compare",
    type: "website",
  },
};

function buildCompareHubJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/compare#webapp`,
        name: "마음데이타 기업 1:1 스펙 비교기",
        url: `${SITE_URL}/compare`,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        isAccessibleForFree: true,
        inLanguage: "ko-KR",
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
        description:
          "대한민국 기업의 국민연금 추정 평균연봉, 임직원 규모, 당월 입퇴사율, 3개년 결산 재무제표 및 DART 공시 건수를 1:1로 정밀 비교하는 무료 분석 도구입니다.",
      },
      {
        "@type": "ItemList",
        name: "대한민국 대표 라이벌 기업 1:1 빅매치 목록",
        numberOfItems: FEATURED_RIVALRIES.length,
        itemListElement: FEATURED_RIVALRIES.map((r, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${r.nameA} vs ${r.nameB} 연봉·실적 비교`,
          url: `${SITE_URL}/compare/${r.pairSlug}`,
        })),
      },
      buildBreadcrumbNode(
        [
          { name: "홈", path: "/" },
          { name: "기업 1:1 스펙 비교기", path: "/compare" },
        ],
        "/compare"
      ),
    ],
  };
}

export default function CompareHubPage() {
  return (
    <div className="animate-fade-in" style={{ padding: "36px 0 84px 0" }}>
      <JsonLd data={buildCompareHubJsonLd()} />
      <div className="container" style={{ maxWidth: "960px" }}>
        {/* 히어로 헤더 */}
        <div style={{ marginBottom: "24px" }}>
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
            <span>⚖️ 취준생 · 이직자 · B2B 실무자 필수 비교툴</span>
          </div>

          <h1
            style={{
              fontSize: "2.1rem",
              fontWeight: 850,
              color: "var(--color-text-main)",
              letterSpacing: "-0.03em",
              margin: "0 0 10px 0",
              wordBreak: "keep-all",
            }}
          >
            A사 vs B사 기업 1:1 스펙 정밀 비교기
          </h1>

          <p
            style={{
              fontSize: "0.98rem",
              color: "var(--color-text-sub)",
              lineHeight: 1.6,
              margin: 0,
              wordBreak: "keep-all",
            }}
          >
            어느 회사가 더 알짜일까요? 두 기업을 선택하면 <strong>국민연금 추정 평균연봉 · 상시 임직원 · 입퇴사율 · 3개년 결산 매출/영업이익 · 부채비율</strong>을 나란히 비교하고 공유 링크를 만들어 드립니다.
          </p>
        </div>

        {/* 기업 선택기 */}
        <Suspense fallback={<div className="card" style={{ height: "160px" }} />}>
          <CompareSelectorClient />
        </Suspense>

        <div style={{ marginTop: "24px" }}>
          <AdBanner />
        </div>

        {/* 인기 라이벌 빅매치 10선 (시맨틱 <a href> 프리셋) */}
        <section style={{ marginTop: "40px" }}>
          <div style={{ marginBottom: "16px" }}>
            <h2
              style={{
                fontSize: "1.35rem",
                fontWeight: 850,
                color: "var(--color-text-main)",
                margin: "0 0 6px 0",
              }}
            >
              🔥 많이 비교하는 업계 라이벌 빅매치 Top 10
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--color-text-desc)", margin: 0 }}>
              클릭 즉시 두 기업의 연봉·인력·재무 실데이터 1:1 비교 리포트를 열람할 수 있습니다.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(285px, 1fr))",
              gap: "14px",
            }}
          >
            {FEATURED_RIVALRIES.map((rv) => (
              <Link
                key={rv.pairSlug}
                href={`/compare/${rv.pairSlug}`}
                prefetch={false}
                className="card related-card"
                style={{
                  padding: "20px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-card)",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.73rem",
                      fontWeight: 800,
                      padding: "3px 9px",
                      borderRadius: "999px",
                      backgroundColor: "var(--color-primary-light)",
                      color: "var(--color-primary)",
                      marginBottom: "10px",
                    }}
                  >
                    {rv.categoryBadge}
                  </span>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                      fontSize: "1.02rem",
                      fontWeight: 850,
                      color: "var(--color-text-main)",
                    }}
                  >
                    <span>{rv.nameA}</span>
                    <span
                      style={{
                        fontSize: "0.74rem",
                        fontWeight: 900,
                        padding: "2px 6px",
                        borderRadius: "6px",
                        backgroundColor: "var(--bg-color-main)",
                        color: "var(--color-text-desc)",
                      }}
                    >
                      VS
                    </span>
                    <span>{rv.nameB}</span>
                  </div>

                  <p
                    style={{
                      fontSize: "0.81rem",
                      color: "var(--color-text-desc)",
                      lineHeight: 1.48,
                      margin: "8px 0 0 0",
                    }}
                  >
                    {rv.tagline}
                  </p>
                </div>

                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-primary)" }}>
                  1:1 비교 리포트 보기 ➔
                </div>
              </Link>
            ))}
          </div>
        </section>

        <StatsRelatedNav currentPath="/compare" />
      </div>
    </div>
  );
}
