import React from "react";
import { Metadata } from "next";
import AdBanner from "@/components/AdBanner";
import StatsRelatedNav from "@/components/StatsRelatedNav";
import InsightsTabsClient from "@/components/InsightsTabsClient";
import { getRealPortalStats } from "@/lib/statApi";
import JsonLd from "@/components/JsonLd";
import { buildStatsDatasetJsonLd } from "@/lib/structuredData";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "대한민국 기업 실데이터 인사이트 | 마음데이타",
  description:
    "국세청 계속사업자 납세상태, 국민연금 가입 임직원 및 월별 채용 추이, 금융감독원 DART 결산 재무·전자공시 실데이터를 집계한 기업 빅데이터 인사이트 리포트입니다.",
  alternates: {
    canonical: "/insights",
  },
  openGraph: {
    title: "대한민국 기업 실데이터 인사이트 | 마음데이타",
    description:
      "국세청 계속사업자 납세상태, 국민연금 가입 임직원 및 월별 채용 추이, 금융감독원 DART 결산 재무·전자공시 실데이터를 집계한 기업 빅데이터 인사이트 리포트입니다.",
    url: "https://www.maumdata.com/insights",
    type: "website",
  },
};

export default async function InsightsPage() {
  const stats = await getRealPortalStats();
  const { summary } = stats;

  const datasetJsonLd = buildStatsDatasetJsonLd({
    path: "/insights",
    name: "대한민국 기업 실데이터 종합 인사이트 (납세상태 · 국민연금 고용 · DART 공시)",
    description:
      "마음데이타 DB에 실제 동기화된 국세청 계속사업자 납세상태, 국민연금 가입 임직원 및 월별 채용 추이, 금융감독원 DART 결산 재무·전자공시 실데이터를 집계한 기업 빅데이터 리포트입니다.",
    keywords: ["기업 통계", "계속사업자 현황", "국민연금 임직원 통계", "DART 재무 랭킹", "마음데이타 인사이트"],
    dateModified: summary.latestSyncDate,
    basedOnSources: [
      { name: "국세청 사업자등록 상태조회 공공데이터", url: "https://www.data.go.kr" },
      { name: "국민연금공단 가입 사업장 내역 공공데이터", url: "https://www.data.go.kr" },
      { name: "금융감독원 전자공시시스템 (DART)", url: "https://dart.fss.or.kr" },
    ],
    variables: [
      { name: "검증 계속사업자 수", value: summary.activeBizCount, unitText: "개사" },
      { name: "국민연금 추적 가입 임직원 수", value: summary.totalTrackedEmployees, unitText: "명" },
      { name: "수집 DART 전자공시 건수", value: summary.totalDisclosuresCount, unitText: "건" },
      { name: "결산 재무 검증 기업 수", value: summary.financialCompanyCount, unitText: "개사" },
    ],
    breadcrumbs: [
      { name: "홈", path: "/" },
      { name: "데이터 인사이트", path: "/insights" },
    ],
  });

  return (
    <div className="animate-fade-in" style={{ padding: "40px 0 80px 0" }}>
      <JsonLd data={datasetJsonLd} />
      <div className="container" style={{ maxWidth: "880px" }}>
        {/* 타이틀 및 헤더 */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.8rem",
              color: "var(--color-primary)",
              backgroundColor: "var(--color-primary-light)",
              padding: "5px 12px",
              borderRadius: "20px",
              fontWeight: 800,
              marginBottom: "12px",
            }}
          >
            <span>MAUMDATA REAL-DATA INSIGHTS</span>
            {summary.latestSyncDate && <span>· 동기화 {summary.latestSyncDate}</span>}
          </div>
          <h1
            style={{
              fontSize: "2.25rem",
              fontWeight: 850,
              color: "var(--color-text-main)",
              letterSpacing: "-0.03em",
              marginBottom: "10px",
            }}
          >
            대한민국 기업 실데이터 인사이트
          </h1>
          <p
            style={{
              color: "var(--color-text-sub)",
              fontSize: "1.02rem",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            추정치나 가공 폴백 없이 마음데이타 DB에 실제 연동된 국세청 납세상태({summary.activeBizCount.toLocaleString("ko-KR")}개 계속사업자), 국민연금 가입 임직원({summary.totalTrackedEmployees.toLocaleString("ko-KR")}명), DART 재무·전자공시({summary.totalDisclosuresCount.toLocaleString("ko-KR")}건)를 실시간 SQL로 집계한 리포트입니다.
          </p>
        </div>

        {/* 상단 실데이터 핵심 요약 스트립 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          <div
            className="card"
            style={{ padding: "18px 20px", border: "1px solid var(--color-border)" }}
          >
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
              검증 계속사업자
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 850, color: "var(--color-text-main)", marginTop: "4px" }}>
              {summary.activeBizCount.toLocaleString("ko-KR")}개사
            </div>
          </div>

          <div
            className="card"
            style={{ padding: "18px 20px", border: "1px solid var(--color-border)" }}
          >
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
              국민연금 추적 인원
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 850, color: "var(--color-primary)", marginTop: "4px" }}>
              {summary.totalTrackedEmployees.toLocaleString("ko-KR")}명
            </div>
          </div>

          <div
            className="card"
            style={{ padding: "18px 20px", border: "1px solid var(--color-border)" }}
          >
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
              재무제표 검증 기업
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 850, color: "var(--color-success)", marginTop: "4px" }}>
              {summary.financialCompanyCount.toLocaleString("ko-KR")}개사
            </div>
          </div>

          <div
            className="card"
            style={{ padding: "18px 20px", border: "1px solid var(--color-border)" }}
          >
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
              DART 전자공시 적재
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 850, color: "var(--color-text-main)", marginTop: "4px" }}>
              {summary.totalDisclosuresCount.toLocaleString("ko-KR")}건
            </div>
          </div>
        </div>

        <AdBanner />

        <div style={{ marginTop: "24px" }}>
          <InsightsTabsClient stats={stats} />
        </div>

        <StatsRelatedNav currentPath="/insights" />
      </div>
    </div>
  );
}
