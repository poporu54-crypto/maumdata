"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { RealPortalStats } from "@/lib/statApi";
import { formatBizNo, formatEokToKorean } from "@/lib/statFormatters";

interface InsightsTabsClientProps {
  stats: RealPortalStats;
}

export default function InsightsTabsClient({ stats }: InsightsTabsClientProps) {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "industry" | "region">(
    "leaderboard"
  );

  const {
    topRevenueCompanies,
    topEmployerCompanies,
    dbSectorDistribution,
    regionDistribution,
    foundingByYear,
  } = stats;

  // 설립연도별 실제 법인 등록 수 막대 차트 렌더링
  const renderFoundingChart = () => {
    if (!foundingByYear || foundingByYear.length === 0) return null;
    const maxCnt = Math.max(1, ...foundingByYear.map((f) => f.count));

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${foundingByYear.length}, minmax(44px, 1fr))`,
          gap: "10px",
          alignItems: "end",
          height: "190px",
          padding: "24px 12px 8px 12px",
          backgroundColor: "var(--bg-color-main)",
          borderRadius: "14px",
          border: "1px solid var(--color-border)",
          overflowX: "auto",
        }}
      >
        {foundingByYear.map((item) => {
          const barHeightPct = Math.max(8, Math.round((item.count / maxCnt) * 100));
          return (
            <div
              key={item.year}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                height: "100%",
                gap: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  color: "var(--color-text-main)",
                }}
              >
                {item.count.toLocaleString("ko-KR")}
              </span>
              <div
                style={{
                  width: "100%",
                  maxWidth: "34px",
                  height: `${barHeightPct}%`,
                  backgroundColor: "var(--color-primary)",
                  borderRadius: "8px 8px 4px 4px",
                  opacity: 0.88,
                }}
              />
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--color-text-desc)",
                }}
              >
                {item.year}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* 탭 네비게이션 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          backgroundColor: "var(--bg-color-card)",
          padding: "6px",
          borderRadius: "14px",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
          marginBottom: "28px",
          width: "fit-content",
          gap: "4px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("leaderboard")}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            backgroundColor:
              activeTab === "leaderboard" ? "var(--color-primary-light)" : "transparent",
            color:
              activeTab === "leaderboard" ? "var(--color-primary)" : "var(--color-text-sub)",
            fontWeight: 700,
            cursor: "pointer",
            transition: "var(--transition-smooth)",
          }}
        >
          매출 · 고용 리더보드
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("industry")}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            backgroundColor:
              activeTab === "industry" ? "var(--color-primary-light)" : "transparent",
            color:
              activeTab === "industry" ? "var(--color-primary)" : "var(--color-text-sub)",
            fontWeight: 700,
            cursor: "pointer",
            transition: "var(--transition-smooth)",
          }}
        >
          업종별 실등록 분포
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("region")}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            backgroundColor:
              activeTab === "region" ? "var(--color-primary-light)" : "transparent",
            color:
              activeTab === "region" ? "var(--color-primary)" : "var(--color-text-sub)",
            fontWeight: 700,
            cursor: "pointer",
            transition: "var(--transition-smooth)",
          }}
        >
          전국 17개 시·도 분포
        </button>
      </div>

      {/* 탭 1: 매출 · 고용 리더보드 (검색엔진 봇 크롤링을 위해 전체 DOM 유지) */}
      <div
        style={{
          display: activeTab === "leaderboard" ? "flex" : "none",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* DART 결산 매출 상위 TOP 12 */}
        <div className="card" style={{ padding: "28px", border: "1px solid var(--color-border)" }}>
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 800,
              color: "var(--color-text-main)",
              marginBottom: "6px",
            }}
          >
            💰 DART 재무제표 검증 매출액 상위 TOP 12 기업
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "20px" }}>
            당사 DB에 적재된 최신 연간 재무제표 기준 실제 매출액 상위 계속사업자입니다. 기업명을 클릭하면 상세 재무·공시 리포트로 이동합니다.
          </p>

          <div
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "14px",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.87rem",
                minWidth: "620px",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "var(--bg-color-main)",
                    borderBottom: "1px solid var(--color-border)",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "12px 14px", color: "var(--color-text-sub)", fontWeight: 700, width: "50px" }}>
                    순위
                  </th>
                  <th style={{ padding: "12px 14px", color: "var(--color-text-sub)", fontWeight: 700 }}>
                    기업명 (사업자번호)
                  </th>
                  <th style={{ padding: "12px 14px", color: "var(--color-text-sub)", fontWeight: 700 }}>
                    주업종 · 결산기준
                  </th>
                  <th style={{ padding: "12px 14px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>
                    결산 매출액
                  </th>
                  <th style={{ padding: "12px 14px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>
                    영업이익
                  </th>
                </tr>
              </thead>
              <tbody>
                {topRevenueCompanies.map((comp, idx) => (
                  <tr
                    key={comp.bNo}
                    style={{
                      borderBottom:
                        idx === topRevenueCompanies.length - 1
                          ? "none"
                          : "1px solid var(--color-border)",
                    }}
                  >
                    <td style={{ padding: "12px 14px", fontWeight: 800, color: idx < 3 ? "var(--color-primary)" : "var(--color-text-desc)" }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <Link
                        href={`/biz/${comp.bNo}`}
                        style={{
                          color: "var(--color-text-main)",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        {comp.name}
                      </Link>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", marginTop: "2px" }}>
                        {formatBizNo(comp.bNo)}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--color-text-sub)" }}>
                      <div style={{ fontWeight: 600 }}>{comp.sector}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", marginTop: "2px" }}>
                        {comp.finYear ? `${comp.finYear}년 결산` : "-"} · {comp.region}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, color: "var(--color-text-main)" }}>
                      {formatEokToKorean(comp.revenueEok)}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        textAlign: "right",
                        fontWeight: 700,
                        color:
                          (comp.operatingIncomeEok ?? 0) >= 0
                            ? "var(--color-success)"
                            : "var(--color-danger)",
                      }}
                    >
                      {formatEokToKorean(comp.operatingIncomeEok)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 국민연금 고용 상위 TOP 12 */}
        <div className="card" style={{ padding: "28px", border: "1px solid var(--color-border)" }}>
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 800,
              color: "var(--color-text-main)",
              marginBottom: "6px",
            }}
          >
            👥 국민연금 가입 임직원 상위 TOP 12 기업
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "20px" }}>
            국민연금 사업장 가입 데이터로 확인된 실제 고용 규모 최상위 계속사업자 목록입니다.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "12px",
            }}
          >
            {topEmployerCompanies.map((comp, idx) => (
              <Link
                key={comp.bNo}
                href={`/biz/${comp.bNo}`}
                style={{
                  textDecoration: "none",
                  padding: "18px",
                  borderRadius: "14px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-main)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.76rem", fontWeight: 800, color: "var(--color-primary)" }}>
                    #{idx + 1} · {comp.region}
                  </span>
                  <span style={{ fontSize: "0.92rem", fontWeight: 850, color: "var(--color-text-main)" }}>
                    {comp.employees.toLocaleString("ko-KR")}명
                  </span>
                </div>
                <div style={{ fontWeight: 800, color: "var(--color-text-main)", fontSize: "0.98rem" }}>
                  {comp.name}
                </div>
                <div style={{ fontSize: "0.76rem", color: "var(--color-text-desc)" }}>
                  {comp.sector} · 신규입사 +{comp.newHires.toLocaleString("ko-KR")}명
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 탭 2: 업종별 실등록 분포 */}
      <div
        className="card"
        style={{
          padding: "28px",
          border: "1px solid var(--color-border)",
          display: activeTab === "industry" ? "block" : "none",
        }}
      >
        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: 800,
            color: "var(--color-text-main)",
            marginBottom: "6px",
          }}
        >
          🏢 세부 산업 분야별 검증 기업 분포 &amp; 대표 기업
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "20px" }}>
          마음데이타 DB 내 국세청 계속사업자로 확인된 실제 법인들의 상위 15대 표준 업종 분포입니다.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {dbSectorDistribution.map((item, idx) => (
            <div
              key={item.sector}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                padding: "16px 18px",
                borderRadius: "14px",
                backgroundColor: "var(--bg-color-main)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    color: "var(--color-primary)",
                    minWidth: "24px",
                  }}
                >
                  #{idx + 1}
                </span>
                <div>
                  <div style={{ fontWeight: 800, color: "var(--color-text-main)", fontSize: "0.95rem" }}>
                    {item.sector}
                  </div>
                  {item.topBNo && item.topBNm && (
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", marginTop: "3px" }}>
                      대표 검증 기업:{" "}
                      <Link
                        href={`/biz/${item.topBNo}`}
                        style={{
                          color: "var(--color-primary)",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        {item.topBNm} ➔
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                  {item.bizCount.toLocaleString("ko-KR")}개사
                </span>
                <span
                  style={{
                    backgroundColor: "var(--color-primary-light)",
                    color: "var(--color-primary)",
                    padding: "4px 9px",
                    borderRadius: "6px",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                  }}
                >
                  {item.ratio}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 탭 3: 전국 17개 시·도 분포 + 연도별 설립 현황 */}
      <div
        style={{
          display: activeTab === "region" ? "flex" : "none",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <div className="card" style={{ padding: "28px", border: "1px solid var(--color-border)" }}>
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 800,
              color: "var(--color-text-main)",
              marginBottom: "6px",
            }}
          >
            🗺️ 전국 17개 광역시·도별 검증 법인 &amp; 고용 분포
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "20px" }}>
            당사 DB 내 계속사업자 소재지를 17개 광역 지자체로 정규화하여 실제 등록 법인 수, 재직 인원 및 권역 대표 기업을 집계했습니다.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "14px",
            }}
          >
            {regionDistribution.map((item) => (
              <div
                key={item.region}
                style={{
                  padding: "18px",
                  borderRadius: "14px",
                  backgroundColor: "var(--bg-color-main)",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 800, color: "var(--color-text-main)" }}>
                    {item.region}
                  </span>
                  <span
                    style={{
                      backgroundColor: "var(--color-primary-light)",
                      color: "var(--color-primary)",
                      padding: "2px 7px",
                      borderRadius: "5px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    비중 {item.ratio}%
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "1.3rem", fontWeight: 850, color: "var(--color-text-main)" }}>
                    {item.bizCount.toLocaleString("ko-KR")}개사
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "var(--color-success)", fontWeight: 700 }}>
                    신규입사 +{item.newHires.toLocaleString("ko-KR")}명
                  </span>
                </div>

                <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)" }}>
                  국민연금 재직자: {item.totalEmployees.toLocaleString("ko-KR")}명
                </div>

                {item.topBNo && item.topBNm && (
                  <div
                    style={{
                      paddingTop: "6px",
                      borderTop: "1px dashed var(--color-border)",
                      fontSize: "0.78rem",
                    }}
                  >
                    <Link
                      href={`/biz/${item.topBNo}`}
                      style={{
                        color: "var(--color-primary)",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      대표 기업: {item.topBNm} ➔
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {foundingByYear.length > 0 && (
          <div className="card" style={{ padding: "28px", border: "1px solid var(--color-border)" }}>
            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                color: "var(--color-text-main)",
                marginBottom: "6px",
              }}
            >
              📅 설립연도별 검증 계속사업자 등록 분포 (2016~2025)
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "18px" }}>
              당사 DB에 설립일자(8자리)가 확인된 계속사업자들의 실제 설립연도별 법인 수 집계입니다.
            </p>
            {renderFoundingChart()}
          </div>
        )}
      </div>
    </>
  );
}
