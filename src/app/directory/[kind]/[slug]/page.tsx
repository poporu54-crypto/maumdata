import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDirectoryHubDetail } from "@/lib/directoryApi";
import { RANKING_HUBS, REGION_HUBS, INDUSTRY_HUBS } from "@/lib/directoryConfig";
import DirectoryTableClient from "../../DirectoryTableClient";
import AdBanner from "@/components/AdBanner";
import StatsRelatedNav from "@/components/StatsRelatedNav";
import JsonLd from "@/components/JsonLd";
import { buildDirectoryHubJsonLd } from "@/lib/structuredData";
import { formatEokToKorean } from "@/lib/statFormatters";

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

interface HubPageProps {
  params: Promise<{ kind: string; slug: string }>;
}

function getKindLabel(kind: string): string {
  if (kind === "ranking") return "테마별 랭킹";
  if (kind === "region") return "업무지구 · 지역";
  return "핵심 산업 · 업종";
}

function getDefaultSortHint(kind: string, slug: string): string {
  if (kind === "ranking") {
    if (slug === "top-salary") return "추정연봉순";
    if (slug === "hiring-surge") return "당월채용순";
    if (slug === "top-revenue") return "매출액순";
    if (slug === "top-profit") return "영업이익순";
    return "임직원순";
  }
  return "임직원 · 매출 규모순";
}

export async function generateMetadata({ params }: HubPageProps): Promise<Metadata> {
  const { kind, slug } = await params;
  const detail = await getDirectoryHubDetail(kind, slug);

  if (!detail) {
    return {
      title: "기업 디렉토리를 찾을 수 없습니다",
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `/directory/${detail.kind}/${detail.slug}`;

  return {
    title: `${detail.meta.title} — 연봉·임직원·매출 실데이터 순위`,
    description: detail.meta.seoDescription,
    keywords: [
      detail.meta.shortTitle,
      `${detail.meta.shortTitle} 연봉`,
      `${detail.meta.shortTitle} 기업 순위`,
      `${detail.meta.shortTitle} 매출 순위`,
      "국민연금 추정 연봉",
      "계속사업자 기업분석",
      "마음데이타",
    ],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${detail.meta.title} | 마음데이타`,
      description: detail.meta.seoDescription,
      url: `https://www.maumdata.com${canonicalPath}`,
      type: "website",
    },
  };
}

export default async function DirectoryHubDetailPage({ params }: HubPageProps) {
  const { kind, slug } = await params;
  const detail = await getDirectoryHubDetail(kind, slug);

  if (!detail || detail.companies.length === 0) {
    notFound();
  }

  const canonicalPath = `/directory/${detail.kind}/${detail.slug}`;
  const kindLabel = getKindLabel(detail.kind);
  const sortHint = getDefaultSortHint(detail.kind, detail.slug);

  const jsonLd = buildDirectoryHubJsonLd({
    path: canonicalPath,
    kindLabel,
    title: detail.meta.title,
    description: detail.meta.seoDescription,
    dateModified: detail.stats.updatedAt,
    companies: detail.companies,
  });

  const siblingHubs =
    detail.kind === "ranking"
      ? RANKING_HUBS.filter((h) => h.slug !== detail.slug)
      : detail.kind === "region"
        ? REGION_HUBS.filter((h) => h.slug !== detail.slug)
        : INDUSTRY_HUBS.filter((h) => h.slug !== detail.slug);

  const overflowCrawlLinks = detail.companies.slice(50);

  return (
    <div className="animate-fade-in" style={{ padding: "32px 0 84px 0" }}>
      <JsonLd data={jsonLd} />
      <div className="container" style={{ maxWidth: "980px" }}>
        {/* 브레드크럼 네비게이션 */}
        <nav
          aria-label="이동 경로"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.82rem",
            color: "var(--color-text-desc)",
            marginBottom: "18px",
          }}
        >
          <Link href="/" prefetch={false} style={{ color: "var(--color-text-sub)", textDecoration: "none" }}>
            홈
          </Link>
          <span>›</span>
          <Link
            href="/directory"
            prefetch={false}
            style={{ color: "var(--color-primary)", fontWeight: 700, textDecoration: "none" }}
          >
            기업 랭킹 · 디렉토리
          </Link>
          <span>›</span>
          <span>{kindLabel}</span>
          <span>›</span>
          <strong style={{ color: "var(--color-text-main)" }}>{detail.meta.shortTitle}</strong>
        </nav>

        {/* 상단 히어로 요약 카드 */}
        <div
          className="card"
          style={{
            padding: "28px 26px",
            border: "1px solid var(--color-border)",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                color: "var(--color-primary)",
                backgroundColor: "var(--color-primary-light)",
                padding: "4px 10px",
                borderRadius: "999px",
              }}
            >
              {detail.meta.emoji} {kindLabel}
            </span>
            {detail.meta.kind === "region" && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--color-text-sub)",
                  backgroundColor: "var(--bg-color-main)",
                  border: "1px solid var(--color-border)",
                  padding: "4px 10px",
                  borderRadius: "999px",
                }}
              >
                📍 {detail.meta.areaLabel}
              </span>
            )}
            {(detail.stats.kospiCount > 0 || detail.stats.kosdaqCount > 0) && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#059669",
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  padding: "4px 10px",
                  borderRadius: "999px",
                }}
              >
                상장사 {(detail.stats.kospiCount + detail.stats.kosdaqCount).toLocaleString("ko-KR")}곳 포함
              </span>
            )}
          </div>

          <h1
            style={{
              fontSize: "1.85rem",
              fontWeight: 850,
              color: "var(--color-text-main)",
              letterSpacing: "-0.025em",
              margin: "0 0 10px 0",
              wordBreak: "keep-all",
            }}
          >
            {detail.meta.title}
          </h1>

          <p
            style={{
              fontSize: "0.95rem",
              color: "var(--color-text-sub)",
              lineHeight: 1.6,
              margin: 0,
              wordBreak: "keep-all",
            }}
          >
            {detail.meta.subtitle}
          </p>

          {/* 4대 집계 지표 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "12px",
              marginTop: "22px",
              paddingTop: "20px",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
                분류 내 검증 계속사업자
              </div>
              <div style={{ fontSize: "1.3rem", fontWeight: 850, color: "var(--color-text-main)", marginTop: "3px" }}>
                {detail.stats.totalMatchedCount.toLocaleString("ko-KR")}개사
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
                국민연금 상시 임직원 합계
              </div>
              <div style={{ fontSize: "1.3rem", fontWeight: 850, color: "var(--color-text-main)", marginTop: "3px" }}>
                {detail.stats.totalEmployees > 0
                  ? `${detail.stats.totalEmployees.toLocaleString("ko-KR")}명`
                  : "-"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
                분류 평균 추정연봉 (5인+)
              </div>
              <div style={{ fontSize: "1.3rem", fontWeight: 850, color: "var(--color-primary)", marginTop: "3px" }}>
                {detail.stats.avgSalaryManwon
                  ? `${detail.stats.avgSalaryManwon.toLocaleString("ko-KR")}만원`
                  : "-"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
                확인 결산매출 합계
              </div>
              <div style={{ fontSize: "1.3rem", fontWeight: 850, color: "var(--color-text-main)", marginTop: "3px" }}>
                {detail.stats.totalRevenueEok > 0
                  ? formatEokToKorean(detail.stats.totalRevenueEok)
                  : `${detail.stats.totalNewHires.toLocaleString("ko-KR")}명 신규입사`}
              </div>
            </div>
          </div>
        </div>

        <AdBanner />

        {/* 메인 인터랙티브 랭킹 표 */}
        <div style={{ marginTop: "20px" }}>
          <DirectoryTableClient companies={detail.companies} defaultSortHint={sortHint} />
        </div>

        {/* 51위 이후 기업 시맨틱 크롤링 연결망 보존 */}
        {overflowCrawlLinks.length > 0 && (
          <section
            aria-label="추가 수록 기업 바로가기"
            className="card"
            style={{
              marginTop: "24px",
              padding: "20px 22px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
            }}
          >
            <h2
              style={{
                fontSize: "0.92rem",
                fontWeight: 800,
                color: "var(--color-text-sub)",
                margin: "0 0 10px 0",
              }}
            >
              📑 {detail.meta.shortTitle} 주요 검증 기업 빠른 바로가기 (51위~{detail.companies.length}위)
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
              {overflowCrawlLinks.map((c) => (
                <Link
                  key={c.bNo}
                  href={`/biz/${c.bNo}`}
                  prefetch={false}
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-text-desc)",
                    textDecoration: "none",
                    lineHeight: 1.65,
                  }}
                >
                  {c.rank}. {c.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 산출 기준 안내 */}
        <div
          style={{
            marginTop: "20px",
            padding: "16px 20px",
            borderRadius: "12px",
            backgroundColor: "var(--bg-color-card)",
            border: "1px solid var(--color-border)",
            fontSize: "0.79rem",
            color: "var(--color-text-desc)",
            lineHeight: 1.6,
          }}
        >
          • <strong>데이터 기준 안내</strong>: 본 리더보드는 국세청 사업자등록 상태가 <strong>계속사업자</strong>로 확인된 기업만을 대상으로 집계하며, 추정 평균연봉은 국민연금 사업장 당월 고지총액과 가입자 수(보험료율 9%, 월 기준소득월액 상한 617만 원 반영)를 역산한 통계치로 실제 개별 직급·성과급과는 차이가 있을 수 있습니다.
        </div>

        {/* 인접 허브 탐색 네비게이션 */}
        <section
          aria-label={`다른 ${kindLabel} 디렉토리 둘러보기`}
          className="card"
          style={{
            marginTop: "28px",
            padding: "24px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "14px",
            }}
          >
            <h2 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
              🔍 다른 {kindLabel} 리더보드 둘러보기
            </h2>
            <Link
              href="/directory"
              prefetch={false}
              style={{
                fontSize: "0.83rem",
                fontWeight: 700,
                color: "var(--color-primary)",
                textDecoration: "none",
              }}
            >
              전체 디렉토리 홈 ➔
            </Link>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {siblingHubs.map((h) => (
              <Link
                key={h.slug}
                href={`/directory/${h.kind}/${h.slug}`}
                prefetch={false}
                style={{
                  padding: "7px 13px",
                  borderRadius: "999px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-main)",
                  color: "var(--color-text-sub)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {h.emoji} {h.shortTitle}
              </Link>
            ))}
          </div>
        </section>

        <StatsRelatedNav currentPath="/directory" />
      </div>
    </div>
  );
}
