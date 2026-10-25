"use client";

import React from "react";
import Link from "next/link";
import type { RealPortalStats } from "@/lib/statApi";

interface StatsDashboardProps {
  stats: RealPortalStats;
}

export default function StatsDashboard({ stats }: StatsDashboardProps) {
  const { summary, macroRatios } = stats;
  const {
    financeServices,
    constructionRealEstate,
    manufacturing,
    ictCommerce,
    classifiedTotal,
  } = macroRatios;

  // 동적 SVG 도넛 차트 세그먼트 계산 (100% 실제 DB 업종 집계 비율)
  const seg1Offset = 25;
  const seg2Offset = (25 - financeServices + 100) % 100;
  const seg3Offset = (seg2Offset - constructionRealEstate + 100) % 100;
  const seg4Offset = (seg3Offset - manufacturing + 100) % 100;

  return (
    <>
      <style>{`
        .stats-dashboard-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .stats-dashboard-card {
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .stats-dashboard-card:hover {
          transform: translateY(-6px);
          border-color: var(--color-primary) !important;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* 설명 영역 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.45rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--color-text-main)",
                marginBottom: "4px",
              }}
            >
              마음데이타 실데이터 검증 지표
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", margin: 0 }}>
              국세청·국민연금·DART 공공데이터와 실제 동기화된 DB 실시간 집계입니다. 카드를 클릭하면 기업별 상세 랭킹으로 이동합니다.
            </p>
          </div>
          {summary.latestSyncDate && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-desc)",
                backgroundColor: "var(--bg-color-card)",
                border: "1px solid var(--color-border)",
                padding: "4px 10px",
                borderRadius: "20px",
                fontWeight: 600,
              }}
            >
              최종 DB 동기화: {summary.latestSyncDate}
            </span>
          )}
        </div>

        {/* 대시보드 그리드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {/* 카드 1: 국민연금 신규 채용 및 신설 법인 동향 */}
          <Link href="/stats/new-biz" className="stats-dashboard-link">
            <div
              className="card stats-dashboard-card"
              style={{
                padding: "24px",
                border: "1px solid var(--color-border)",
                height: "100%",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--color-text-sub)", fontWeight: 700 }}>
                  국민연금 신규 채용 현황
                </span>
                <span style={{ fontSize: "1.2rem" }}>📈</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                  marginBottom: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: "2.05rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                  +{summary.monthlyNewHires.toLocaleString("ko-KR")}명
                </span>
                <span style={{ color: "var(--color-success)", fontWeight: 700, fontSize: "0.88rem" }}>
                  총 재직 {summary.totalTrackedEmployees.toLocaleString("ko-KR")}명
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-text-desc)",
                  lineHeight: 1.45,
                  marginBottom: "10px",
                }}
              >
                국민연금 가입이 연동된 {summary.npsCompanyCount.toLocaleString("ko-KR")}개 계속사업장의 최근 월 실제 신규 취득(입사) 인원 합계입니다.
              </p>
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "var(--color-primary)",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                신규 채용 상위 기업 랭킹 보기 ➔
              </span>
            </div>
          </Link>

          {/* 카드 2: 국세청 검증 계속사업자 현황 */}
          <Link href="/stats/active-rate" className="stats-dashboard-link">
            <div
              className="card stats-dashboard-card"
              style={{
                padding: "24px",
                border: "1px solid var(--color-border)",
                height: "100%",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--color-text-sub)", fontWeight: 700 }}>
                  국세청 검증 계속사업자
                </span>
                <span style={{ fontSize: "1.2rem" }}>🛡️</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                  marginBottom: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: "2.05rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                  {summary.activeBizCount.toLocaleString("ko-KR")}개사
                </span>
                <span style={{ color: "var(--color-primary)", fontWeight: 700, fontSize: "0.88rem" }}>
                  공시 {summary.totalDisclosuresCount.toLocaleString("ko-KR")}건
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-text-desc)",
                  lineHeight: 1.45,
                  marginBottom: "10px",
                }}
              >
                당사 DB에 등록·검증된 {summary.verifiedTotalCount.toLocaleString("ko-KR")}개 법인 및 사업장 중 국세청 계속사업자로 확인된 실제 기업 수입니다.
              </p>
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "var(--color-primary)",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                납세상태 · 고용 안정 기업 보기 ➔
              </span>
            </div>
          </Link>
        </div>

        {/* 카드 3: 업종별 검증 기업 실데이터 분포도 */}
        <Link href="/stats/distribution" className="stats-dashboard-link">
          <div
            className="card stats-dashboard-card"
            style={{
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "var(--color-text-main)",
                    marginBottom: "4px",
                  }}
                >
                  검증 등록 기업 산업군별 실데이터 분포
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", margin: 0 }}>
                  마음데이타 DB 내 표준 업종이 확인된 {classifiedTotal.toLocaleString("ko-KR")}개 계속사업자의 실제 산업군 비중과 국가데이터처(통계청) 19대 대분류 확정 통계를 함께 제공합니다.
                </p>
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--color-primary)", fontWeight: 700 }}>
                업종별 대표 기업 · 공식 통계 보기 ➔
              </span>
            </div>

            {classifiedTotal > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-around",
                  flexWrap: "wrap",
                  gap: "32px",
                  marginTop: "8px",
                }}
              >
                {/* SVG 원형 차트 */}
                <div style={{ position: "relative", width: "150px", height: "150px" }}>
                  <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
                    <circle
                      className="donut-hole"
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                    ></circle>
                    <circle
                      className="donut-ring"
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="var(--color-border)"
                      strokeWidth="4"
                    ></circle>

                    <circle
                      className="donut-segment"
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="var(--color-primary)"
                      strokeWidth="4.2"
                      strokeDasharray={`${financeServices} ${100 - financeServices}`}
                      strokeDashoffset={seg1Offset}
                    ></circle>

                    <circle
                      className="donut-segment"
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="4.2"
                      strokeDasharray={`${constructionRealEstate} ${100 - constructionRealEstate}`}
                      strokeDashoffset={seg2Offset}
                    ></circle>

                    <circle
                      className="donut-segment"
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#fbbf24"
                      strokeWidth="4.2"
                      strokeDasharray={`${manufacturing} ${100 - manufacturing}`}
                      strokeDashoffset={seg3Offset}
                    ></circle>

                    <circle
                      className="donut-segment"
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#a855f7"
                      strokeWidth="4.2"
                      strokeDasharray={`${ictCommerce} ${100 - ictCommerce}`}
                      strokeDashoffset={seg4Offset}
                    ></circle>
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.08rem",
                        fontWeight: 850,
                        color: "var(--color-text-main)",
                        lineHeight: 1.1,
                      }}
                    >
                      {classifiedTotal.toLocaleString("ko-KR")}
                    </div>
                    <div
                      style={{
                        fontSize: "0.66rem",
                        color: "var(--color-text-desc)",
                        fontWeight: 700,
                        marginTop: "3px",
                      }}
                    >
                      표준분류 법인
                    </div>
                  </div>
                </div>

                {/* 범례 */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px 20px",
                    minWidth: "240px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", fontWeight: 600 }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "var(--color-primary)" }}></div>
                    <span style={{ color: "var(--color-text-sub)" }}>금융·전문서비스 ({financeServices}%)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", fontWeight: 600 }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#10b981" }}></div>
                    <span style={{ color: "var(--color-text-sub)" }}>건설·부동산 ({constructionRealEstate}%)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", fontWeight: 600 }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#fbbf24" }}></div>
                    <span style={{ color: "var(--color-text-sub)" }}>제조·엔지니어링 ({manufacturing}%)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", fontWeight: 600 }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#a855f7" }}></div>
                    <span style={{ color: "var(--color-text-sub)" }}>IT·유통·물류 ({ictCommerce}%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Link>
      </div>
    </>
  );
}
