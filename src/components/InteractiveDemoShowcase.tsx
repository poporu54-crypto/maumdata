"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { DemoCompanyRealData } from "@/lib/statApi";
import { formatBizNo, formatEokToKorean } from "@/lib/statFormatters";

interface InteractiveDemoShowcaseProps {
  companies: DemoCompanyRealData[];
}

export default function InteractiveDemoShowcase({
  companies,
}: InteractiveDemoShowcaseProps) {
  const [selectedBNo, setSelectedBNo] = useState<string>(
    companies[0]?.bNo || ""
  );

  if (!companies || companies.length === 0) {
    return null;
  }

  const activeBNo = companies.some((c) => c.bNo === selectedBNo)
    ? selectedBNo
    : companies[0].bNo;

  return (
    <section
      className="interactive-showcase-card"
      style={{
        marginTop: "48px",
        marginBottom: "56px",
        backgroundColor: "var(--bg-color-card)",
        border: "1.5px solid var(--color-border)",
        borderRadius: "24px",
        padding: "28px 24px",
        boxShadow: "0 12px 36px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* 쇼케이스 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.78rem",
              fontWeight: 800,
              color: "var(--color-primary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "6px",
            }}
          >
            <span>⚡ 1초 실데이터 미리보기</span>
          </div>
          <h3
            style={{
              fontSize: "1.3rem",
              fontWeight: 850,
              color: "var(--color-text-main)",
              letterSpacing: "-0.03em",
            }}
          >
            마음데이타가 검증한 실제 기업 공공데이터 리포트
          </h3>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--color-text-desc)",
              marginTop: "4px",
            }}
          >
            검색하기 전, 당사 DB에 실시간 적재된 국세청·국민연금·DART 실측 지표를 확인해 보세요.
          </p>
        </div>

        {/* 탭 셀렉터 */}
        <div
          style={{
            display: "flex",
            backgroundColor: "var(--bg-color-main)",
            padding: "4px",
            borderRadius: "14px",
            gap: "4px",
            border: "1px solid var(--color-border)",
            maxWidth: "100%",
            overflowX: "auto",
          }}
        >
          {companies.map((company) => {
            const isSelected = activeBNo === company.bNo;
            return (
              <button
                key={company.bNo}
                type="button"
                onClick={() => setSelectedBNo(company.bNo)}
                style={{
                  border: "none",
                  background: isSelected ? "var(--bg-color-card)" : "transparent",
                  color: isSelected
                    ? "var(--color-text-main)"
                    : "var(--color-text-desc)",
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: "0.82rem",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: isSelected
                    ? "0 2px 8px rgba(0, 0, 0, 0.08)"
                    : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {company.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* 기업별 메트릭 카드 대시보드 (검색엔진 봇이 모든 기업 상세 링크를 발견할 수 있도록 전체 렌더링 후 display 전환) */}
      {companies.map((company) => (
        <div
          key={company.bNo}
          style={{
            display: activeBNo === company.bNo ? "block" : "none",
            background: "var(--bg-color-main)",
            borderRadius: "18px",
            padding: "20px",
            border: "1px solid var(--color-border)",
          }}
        >
          {/* 기업 헤더 정보 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h4
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 800,
                    color: "var(--color-text-main)",
                    margin: 0,
                  }}
                >
                  {company.name}
                </h4>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "var(--color-primary)",
                    backgroundColor: "var(--bg-color-card)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {company.listingStatus}
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-text-desc)",
                  marginTop: "4px",
                }}
              >
                사업자등록번호: {formatBizNo(company.bNo)} · {company.taxStatus}
              </div>
            </div>

            <div
              style={{
                fontSize: "0.78rem",
                color: "var(--color-success)",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-success)",
                  display: "inline-block",
                }}
              ></span>
              DB 실데이터 동기화 완료
            </div>
          </div>

          {/* 4대 실제 검증 지표 그리드 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            {/* 지표 1: 국민연금 실가입 인원 */}
            <div
              style={{
                backgroundColor: "var(--bg-color-card)",
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--color-text-desc)",
                  fontWeight: 700,
                  marginBottom: "4px",
                }}
              >
                👥 국민연금 사업장 인원
              </div>
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 850,
                  color: company.employees > 0 ? "var(--color-text-main)" : "var(--color-text-desc)",
                }}
              >
                {company.employees > 0
                  ? `${company.employees.toLocaleString("ko-KR")}명`
                  : "사업장 분리신고"}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--color-text-desc)",
                  marginTop: "4px",
                }}
              >
                {company.employees > 0
                  ? `입사 +${company.newHires.toLocaleString("ko-KR")}명 / 상실 -${company.losses.toLocaleString("ko-KR")}명`
                  : "단일 사업자번호 외 분리"}
              </div>
            </div>

            {/* 지표 2: 최근 결산 매출액 */}
            <div
              style={{
                backgroundColor: "var(--bg-color-card)",
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--color-text-desc)",
                  fontWeight: 700,
                  marginBottom: "4px",
                }}
              >
                💰 결산 매출액 {company.finYear ? `(${company.finYear})` : ""}
              </div>
              <div
                style={{
                  fontSize: "1.02rem",
                  fontWeight: 850,
                  color: "var(--color-text-main)",
                }}
              >
                {formatEokToKorean(company.revenueEok)}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--color-text-desc)",
                  marginTop: "4px",
                }}
              >
                영업익: {formatEokToKorean(company.operatingIncomeEok)}
              </div>
            </div>

            {/* 지표 3: DART 전자공시 건수 */}
            <div
              style={{
                backgroundColor: "var(--bg-color-card)",
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--color-text-desc)",
                  fontWeight: 700,
                  marginBottom: "4px",
                }}
              >
                📑 DART 전자공시 적재
              </div>
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 850,
                  color: "var(--color-primary)",
                }}
              >
                {company.disclosureCount > 0
                  ? `${company.disclosureCount.toLocaleString("ko-KR")}건`
                  : "미공시 대상"}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--color-text-desc)",
                  marginTop: "4px",
                }}
              >
                금감원 공시 원문 연동
              </div>
            </div>

            {/* 지표 4: 표준 업종 및 설립일 */}
            <div
              style={{
                backgroundColor: "var(--bg-color-card)",
                padding: "14px",
                borderRadius: "14px",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--color-text-desc)",
                  fontWeight: 700,
                  marginBottom: "4px",
                }}
              >
                🏢 주업종 · 설립일
              </div>
              <div
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 800,
                  color: "var(--color-text-main)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={company.sector}
              >
                {company.sector}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--color-text-desc)",
                  marginTop: "4px",
                }}
              >
                설립: {company.startDt}
              </div>
            </div>
          </div>

          {/* 상세 리포트 이동 링크 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              paddingTop: "12px",
              borderTop: "1px dashed var(--color-border)",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-sub)",
                fontWeight: 600,
              }}
            >
              📌 위 수치는 추정이 아닌 마음데이타 DB에 실제 저장된 공공데이터 조회 결과입니다.
            </div>

            <Link
              href={`/biz/${company.bNo}`}
              className="btn-primary"
              style={{
                padding: "8px 16px",
                fontSize: "0.82rem",
                borderRadius: "10px",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>{company.shortLabel} 전체 리포트 보기</span>
              <span>➔</span>
            </Link>
          </div>
        </div>
      ))}
    </section>
  );
}
