import React, { Suspense } from "react";
import type { Metadata } from "next";
import PartnersFormClient from "./PartnersFormClient";
import StatsRelatedNav from "@/components/StatsRelatedNav";
import JsonLd from "@/components/JsonLd";
import { ORG_ID, SITE_URL, WEBSITE_ID, buildBreadcrumbNode } from "@/lib/structuredData";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "기업 공식 프로필 인증 · 거래처 변동 알림 · B2B 비즈니스 제휴",
  description:
    "마음데이타 기업 공식 담당자 프로필 인증 등록, 주요 거래처 휴·폐업/과세전환 자동 알림 사전신청, 전자계약 팀 보관함 Pro 및 B2B 데이터 제휴 안내 페이지입니다.",
  alternates: {
    canonical: "/partners",
  },
  openGraph: {
    title: "마음데이타 B2B 비즈니스 · 공식 기업 인증 & 거래처 알림",
    description:
      "우리 회사 공식 프로필 인증부터 거래처 폐업 경보 알림, 전자계약 Pro 도입까지 한 곳에서 신청하세요.",
    url: `${SITE_URL}/partners`,
    type: "website",
  },
};

export default function PartnersPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/partners#webpage`,
        url: `${SITE_URL}/partners`,
        name: "마음데이타 B2B 파트너 · 공식 기업 인증 & 거래처 알림",
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
        inLanguage: "ko-KR",
      },
      buildBreadcrumbNode(
        [
          { name: "홈", path: "/" },
          { name: "B2B 비즈니스 · 공식 인증", path: "/partners" },
        ],
        "/partners"
      ),
    ],
  };

  return (
    <div className="animate-fade-in" style={{ padding: "36px 0 84px 0" }}>
      <JsonLd data={jsonLd} />
      <div className="container" style={{ maxWidth: "900px" }}>
        <div style={{ marginBottom: "28px" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "0.78rem",
              fontWeight: 800,
              color: "var(--color-primary)",
              backgroundColor: "var(--color-primary-light)",
              padding: "5px 13px",
              borderRadius: "999px",
              marginBottom: "12px",
            }}
          >
            💼 MAUMDATA FOR BUSINESS
          </span>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 850,
              color: "var(--color-text-main)",
              letterSpacing: "-0.03em",
              margin: "0 0 10px 0",
              wordBreak: "keep-all",
            }}
          >
            기업 공식 프로필 인증 · 거래처 변동 알림 · B2B 제휴
          </h1>
          <p style={{ fontSize: "0.96rem", color: "var(--color-text-sub)", lineHeight: 1.6, margin: 0, wordBreak: "keep-all" }}>
            매월 수많은 구직자·거래처 담당자가 열람하는 마음데이타 기업 리포트에 공식 정보를 등록하거나, 거래처 리스크 관리·전자계약 팀 플랜 우선 도입을 신청하실 수 있습니다.
          </p>
        </div>

        {/* 3대 B2B 솔루션 요약 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))",
            gap: "14px",
            marginBottom: "26px",
          }}
        >
          <div className="card" style={{ padding: "22px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "1.6rem", marginBottom: "8px" }}>🛡️</div>
            <h2 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 6px 0" }}>
              공식 기업 프로필 인증
            </h2>
            <p style={{ fontSize: "0.83rem", color: "var(--color-text-desc)", lineHeight: 1.55, margin: 0 }}>
              기업 상세페이지에 공식 브랜드명, 최신 홈페이지, 회사 핵심 소개 및 공식 채용 페이지 링크를 검증 후 반영합니다.
            </p>
          </div>

          <div className="card" style={{ padding: "22px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "1.6rem", marginBottom: "8px" }}>🔔</div>
            <h2 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 6px 0" }}>
              거래처 휴·폐업 자동 알림
            </h2>
            <p style={{ fontSize: "0.83rem", color: "var(--color-text-desc)", lineHeight: 1.55, margin: 0 }}>
              주요 매입·매출 거래처 중 폐업, 휴업, 간이과세 전환이 감지되면 담당자 이메일로 즉시 알려주는 리스크 경보 서비스입니다.
            </p>
          </div>

          <div className="card" style={{ padding: "22px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "1.6rem", marginBottom: "8px" }}>📁</div>
            <h2 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 6px 0" }}>
              전자계약 팀 보관함 Pro
            </h2>
            <p style={{ fontSize: "0.83rem", color: "var(--color-text-desc)", lineHeight: 1.55, margin: 0 }}>
              부서별 전자계약 공동 관리, 대량 서명 요청 및 장기 원본 보관·감사 추적 기능이 필요한 기업을 위한 전용 플랜입니다.
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="card" style={{ height: "360px" }} />}>
          <PartnersFormClient />
        </Suspense>

        <StatsRelatedNav currentPath="/partners" />
      </div>
    </div>
  );
}
