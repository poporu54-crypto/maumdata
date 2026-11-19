import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import BulkCheckClient from "./BulkCheckClient";
import AdBanner from "@/components/AdBanner";
import StatsRelatedNav from "@/components/StatsRelatedNav";
import JsonLd from "@/components/JsonLd";
import { ORG_ID, SITE_URL, WEBSITE_ID, buildBreadcrumbNode } from "@/lib/structuredData";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "사업자등록번호 대량 일괄 상태조회 (휴·폐업·과세유형 엑셀 검증기)",
  description:
    "세금계산서 발행·수취 전 거래처 사업자등록번호 최대 100개를 한 번에 붙여넣고 계속사업자·휴업·폐업·간이과세 전환 여부를 1초 만에 무료 검증 후 엑셀(CSV)로 저장하세요.",
  keywords: [
    "사업자등록번호 일괄조회",
    "사업자번호 대량조회",
    "휴폐업 일괄조회",
    "거래처 폐업 확인",
    "과세유형 일괄조회",
    "세금계산서 발행전 휴폐업 조회",
    "국세청 사업자상태 대량조회",
    "마음데이타",
  ],
  alternates: {
    canonical: "/bulk-check",
  },
  openGraph: {
    title: "거래처 사업자번호 휴·폐업 대량 일괄 검증기 | 마음데이타",
    description:
      "회원가입·설치 없이 최대 100개 사업자등록번호의 실시간 계속/휴업/폐업/간이과세 여부를 1초 만에 표로 검증하고 엑셀로 다운로드하세요.",
    url: "https://www.maumdata.com/bulk-check",
    type: "website",
  },
};

function buildBulkCheckJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/bulk-check#webapp`,
        name: "마음데이타 사업자등록번호 휴·폐업 대량 일괄 상태조회기",
        url: `${SITE_URL}/bulk-check`,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        isAccessibleForFree: true,
        inLanguage: "ko-KR",
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
        description:
          "최대 100개의 거래처 사업자등록번호를 한 번에 입력하여 국세청 실시간 계속·휴업·폐업 상태 및 일반·간이·면세 과세유형을 검증하고 CSV(엑셀)로 내보내는 무료 세무·경리 실무 도구입니다.",
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/bulk-check#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "한 번에 몇 개의 사업자등록번호를 조회할 수 있나요?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "회원가입 없이 1회 최대 100개의 거래처 사업자등록번호를 동시에 검증할 수 있으며, 엑셀에서 상호명과 번호 열을 함께 복사해 붙여넣어도 10자리 사업자번호만 자동 추출합니다.",
            },
          },
          {
            "@type": "Question",
            name: "세금계산서 수취 전 왜 과세유형과 폐업 여부를 확인해야 하나요?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "폐업한 사업자나 세금계산서 발급불가 간이과세자·면세사업자로부터 세금계산서를 수취할 경우 부가가치세 매입세액 불공제 및 가산세 불이익이 발생할 수 있으므로 월말 정산·대금 지급 전 사전 검증이 필수입니다.",
            },
          },
        ],
      },
      buildBreadcrumbNode(
        [
          { name: "홈", path: "/" },
          { name: "거래처 휴·폐업 일괄 검증기", path: "/bulk-check" },
        ],
        "/bulk-check"
      ),
    ],
  };
}

export default function BulkCheckPage() {
  return (
    <div className="animate-fade-in" style={{ padding: "36px 0 84px 0" }}>
      <JsonLd data={buildBulkCheckJsonLd()} />
      <div className="container" style={{ maxWidth: "960px" }}>
        {/* 헤더 */}
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
            <span>⚡ 경리 · 세무 · 구매팀 필수 무료 실무도구</span>
          </div>

          <h1
            style={{
              fontSize: "2.05rem",
              fontWeight: 850,
              color: "var(--color-text-main)",
              letterSpacing: "-0.03em",
              margin: "0 0 10px 0",
              wordBreak: "keep-all",
            }}
          >
            거래처 사업자번호 휴·폐업 &amp; 과세유형 대량 일괄 검증기
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
            세금계산서 발행·수취 및 거래대금 송금 전, 거래처 목록(최대 100건)을 그대로 붙여넣어 국세청 실시간 <strong>계속·휴업·폐업 여부</strong>와 <strong>간이·면세 과세전환 여부</strong>를 1초 만에 확인하고 엑셀(CSV)로 보관하세요.
          </p>
        </div>

        <BulkCheckClient />

        <div style={{ marginTop: "24px" }}>
          <AdBanner />
        </div>

        {/* 세무 실무 체크리스트 & 연관 서식 브릿지 */}
        <section
          aria-label="세금계산서 발행 전 필수 확인 가이드"
          className="card"
          style={{
            marginTop: "28px",
            padding: "26px",
            border: "1px solid var(--color-border)",
          }}
        >
          <h2 style={{ fontSize: "1.12rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 14px 0" }}>
            🛡️ 월말 정산 · 대금 지급 전 실무자 체크포인트
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "14px",
              fontSize: "0.85rem",
              color: "var(--color-text-sub)",
              lineHeight: 1.6,
            }}
          >
            <div style={{ padding: "14px 16px", borderRadius: "12px", backgroundColor: "var(--bg-color-main)" }}>
              <strong style={{ color: "var(--color-text-main)", display: "block", marginBottom: "4px" }}>
                1. 폐업일 이후 수취 세금계산서 불공제 주의
              </strong>
              거래처가 공급시기 이전에 이미 폐업한 경우 세금계산서를 교부받더라도 매입세액 공제가 부인될 수 있으므로 송금 직전 반드시 계속사업자 상태를 확인하세요.
            </div>
            <div style={{ padding: "14px 16px", borderRadius: "12px", backgroundColor: "var(--bg-color-main)" }}>
              <strong style={{ color: "var(--color-text-main)", display: "block", marginBottom: "4px" }}>
                2. 일반과세 → 간이과세 전환일자 점검
              </strong>
              기존 일반과세 거래처가 7월·1월 기준 간이과세자(세금계산서 발급불가)로 전환되었는지 과세유형 전환일자를 함께 확인해야 가산세를 예방할 수 있습니다.
            </div>
            <div style={{ padding: "14px 16px", borderRadius: "12px", backgroundColor: "var(--bg-color-main)" }}>
              <strong style={{ color: "var(--color-text-main)", display: "block", marginBottom: "4px" }}>
                3. 검증 완료 거래처 서식 즉시 작성
              </strong>
              정상 영업이 확인된 거래처라면{" "}
              <Link href="/form/estimate" prefetch={false} style={{ color: "var(--color-primary)", fontWeight: 700 }}>
                표준 견적서
              </Link>
              ,{" "}
              <Link href="/form/order" prefetch={false} style={{ color: "var(--color-primary)", fontWeight: 700 }}>
                발주서
              </Link>
              ,{" "}
              <Link href="/form/payment" prefetch={false} style={{ color: "var(--color-primary)", fontWeight: 700 }}>
                지출결의서
              </Link>
              를 회원가입 없이 바로 작성·인쇄하고,{" "}
              <a
                href="https://www.maumcalc.com/calculators/vat"
                target="_blank"
                rel="noopener"
                style={{ color: "var(--color-primary)", fontWeight: 700 }}
              >
                부가가치세(VAT) 계산기(마음계산기) ↗
              </a>
              로 공급가액·세액을 즉시 검산하세요.
            </div>
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              fontSize: "0.84rem",
            }}
          >
            <span style={{ color: "var(--color-text-sub)" }}>
              매월 수십~수백 곳 거래처 상태를 일일이 재조회하기 번거로우신가요?
            </span>
            <Link
              href="/partners?type=closure_alert"
              prefetch={false}
              style={{
                color: "var(--color-primary)",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              🔔 주요 거래처 폐업·휴업 시 이메일 자동 알림 신청 ➔
            </Link>
          </div>
        </section>

        <StatsRelatedNav currentPath="/bulk-check" />
      </div>
    </div>
  );
}
