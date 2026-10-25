import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import StatsRelatedNav from "@/components/StatsRelatedNav";
import { getRealPortalStats, formatBizNo } from "@/lib/statApi";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "국세청 계속사업자 검증 현황 & 고용 안정성 실데이터 분석",
  description:
    "국세청 사업자등록 상태 실조회 기반 계속사업자·과세유형 분포와 국민연금 월별 고용 유지율, 순고용 증가 우수 기업 리더보드를 제공합니다.",
  alternates: {
    canonical: "/stats/active-rate",
  },
  openGraph: {
    title: "국세청 계속사업자 검증 현황 & 고용 안정성 분석 | 마음데이타",
    description:
      "마음데이타 DB에 실제 동기화된 국세청 납세상태 및 국민연금 고용 유지 안정성 리포트입니다.",
    url: "https://www.maumdata.com/stats/active-rate",
    type: "website",
  },
};

export default async function ActiveRateStatsPage() {
  const stats = await getRealPortalStats();
  const {
    summary,
    monthlyEmployment,
    topNetGrowthCompanies,
    topEmployerCompanies,
  } = stats;

  const activePct =
    summary.verifiedTotalCount > 0
      ? ((summary.activeBizCount / summary.verifiedTotalCount) * 100).toFixed(2)
      : "0.00";

  // 월별 고용 유지율 차트 좌표 계산
  const chartHeight = 165;
  const chartWidth = 560;
  const paddingX = 44;
  const paddingY = 34;

  const rates = monthlyEmployment.map((m) => m.retentionRate);
  const minRate = rates.length > 0 ? Math.max(0, Math.min(...rates) - 0.5) : 95;
  const maxRate = rates.length > 0 ? Math.min(100, Math.max(...rates) + 0.5) : 100;
  const rateRange = maxRate - minRate || 1;

  const points = monthlyEmployment.map((m, idx) => {
    const x =
      monthlyEmployment.length === 1
        ? chartWidth / 2
        : paddingX +
          (idx * (chartWidth - 2 * paddingX)) /
            Math.max(1, monthlyEmployment.length - 1);
    const y =
      chartHeight -
      paddingY -
      ((m.retentionRate - minRate) / rateRange) * (chartHeight - 2 * paddingY);
    return { x, y, ...m };
  });

  const linePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="animate-fade-in" style={{ padding: "24px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "820px" }}>
        {/* 헤더 */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--color-primary)",
              backgroundColor: "var(--color-primary-light)",
              padding: "5px 12px",
              borderRadius: "20px",
              marginBottom: "12px",
            }}
          >
            <span>국세청 · 국민연금 실데이터 집계</span>
            {summary.latestSyncDate && <span>· 최종 동기화 {summary.latestSyncDate}</span>}
          </div>
          <h1
            style={{
              fontSize: "1.85rem",
              fontWeight: 800,
              color: "var(--color-text-main)",
              marginBottom: "8px",
            }}
          >
            🛡️ 국세청 계속사업자 검증 현황 &amp; 고용 안정성
          </h1>
          <p
            style={{
              fontSize: "0.92rem",
              color: "var(--color-text-desc)",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            마음데이타 데이터베이스에 등록된 법인 및 사업장의 국세청 실제 납세상태·과세유형 검증 현황과 국민연금 가입자 기반 인력 유지 안정성을 분석한 리포트입니다.
          </p>
        </div>

        {/* 국세청 납세상태 및 과세유형 실집계 요약 */}
        <div
          className="card"
          style={{
            padding: "28px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--bg-color-card)",
            marginBottom: "28px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.86rem",
                  color: "var(--color-text-desc)",
                  fontWeight: 700,
                }}
              >
                당사 검증 DB 등록 기업 ({summary.verifiedTotalCount.toLocaleString("ko-KR")}개사) 중 계속사업자 비율
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "12px",
                  marginTop: "6px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "2.6rem",
                    fontWeight: 850,
                    color: "var(--color-text-main)",
                    lineHeight: 1,
                  }}
                >
                  {summary.activeBizCount.toLocaleString("ko-KR")}개사
                </span>
                <span
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    color: "var(--color-success)",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: "30px",
                  }}
                >
                  검증 표본 내 {activePct}% 정상 가동
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "12px",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                backgroundColor: "var(--bg-color-main)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div style={{ fontSize: "0.76rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
                부가가치세 일반과세자
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", marginTop: "4px" }}>
                {summary.generalTaxCount.toLocaleString("ko-KR")}개사
              </div>
            </div>

            <div
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                backgroundColor: "var(--bg-color-main)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div style={{ fontSize: "0.76rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
                부가가치세 면세사업자
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", marginTop: "4px" }}>
                {summary.taxFreeCount.toLocaleString("ko-KR")}개사
              </div>
            </div>

            <div
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                backgroundColor: "var(--bg-color-main)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div style={{ fontSize: "0.76rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
                폐업 상태 확인 기업
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-danger)", marginTop: "4px" }}>
                {summary.closedBizCount.toLocaleString("ko-KR")}개사
              </div>
            </div>

            <div
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                backgroundColor: "var(--bg-color-main)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div style={{ fontSize: "0.76rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
                재무제표 실매출 검증
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-primary)", marginTop: "4px" }}>
                {summary.financialCompanyCount.toLocaleString("ko-KR")}개사
              </div>
            </div>
          </div>

          <p style={{ fontSize: "0.82rem", color: "var(--color-text-desc)", lineHeight: 1.5, margin: 0 }}>
            * 안내: 본 수치는 전국 개인사업자 추정치가 아니며, 마음데이타 DB에 수록·동기화된 법인 및 주요 사업장 표본({summary.verifiedTotalCount.toLocaleString("ko-KR")}개사)에 대해 국세청 사업자등록 상태조회 API로 실제 확인한 결과입니다.
          </p>
        </div>

        {/* 월별 국민연금 고용 유지율 시계열 차트 */}
        <div
          className="card"
          style={{
            padding: "28px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--bg-color-card)",
            marginBottom: "28px",
          }}
        >
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "var(--color-text-main)",
              marginBottom: "6px",
            }}
          >
            📊 월별 국민연금 가입 사업장 인력 유지율 추이
          </h2>
          <p style={{ fontSize: "0.84rem", color: "var(--color-text-desc)", marginBottom: "20px" }}>
            월별 전체 가입 임직원 대비 당월 상실(퇴사)자를 제외한 실제 월간 인력 유지 비율 흐름입니다.
          </p>

          {points.length > 0 ? (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <div style={{ minWidth: "500px" }}>
                <svg
                  width="100%"
                  height={chartHeight}
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  style={{ overflow: "visible" }}
                >
                  <line
                    x1={paddingX}
                    y1={paddingY}
                    x2={chartWidth - paddingX}
                    y2={paddingY}
                    stroke="var(--color-border)"
                    strokeWidth="0.6"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1={paddingX}
                    y1={chartHeight / 2}
                    x2={chartWidth - paddingX}
                    y2={chartHeight / 2}
                    stroke="var(--color-border)"
                    strokeWidth="0.6"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1={paddingX}
                    y1={chartHeight - paddingY}
                    x2={chartWidth - paddingX}
                    y2={chartHeight - paddingY}
                    stroke="var(--color-border)"
                    strokeWidth="1"
                  />

                  <polyline
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={linePoints}
                  />

                  {points.map((p) => (
                    <g key={p.month}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="4.5"
                        fill="var(--color-primary)"
                        stroke="var(--bg-color-card)"
                        strokeWidth="2"
                      />
                      <text
                        x={p.x}
                        y={p.y - 10}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="800"
                        fill="var(--color-text-main)"
                      >
                        {p.retentionRate}%
                      </text>
                      <text
                        x={p.x}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="600"
                        fill="var(--color-text-desc)"
                      >
                        {p.month}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          ) : (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--color-text-desc)" }}>
              집계된 월별 고용 유지율 데이터가 없습니다.
            </div>
          )}
        </div>

        {/* 순고용 증가 우수 계속사업자 TOP 12 */}
        <div
          className="card"
          style={{
            padding: "28px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--bg-color-card)",
            marginBottom: "28px",
          }}
        >
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "var(--color-text-main)",
              marginBottom: "6px",
            }}
          >
            🚀 순고용 증가(입사 &gt; 퇴사) 우수 계속사업자 TOP 12
          </h2>
          <p style={{ fontSize: "0.84rem", color: "var(--color-text-desc)", marginBottom: "20px" }}>
            상시 가입 인원 100인 이상 계속사업자 중 최근 월 신규 취득자가 상실자보다 많아 실질 인력이 순증가한 성장 기업입니다.
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
                minWidth: "600px",
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
                  <th style={{ padding: "12px 14px", color: "var(--color-text-sub)", fontWeight: 700, width: "52px" }}>
                    순위
                  </th>
                  <th style={{ padding: "12px 14px", color: "var(--color-text-sub)", fontWeight: 700 }}>
                    기업명 (사업자번호)
                  </th>
                  <th style={{ padding: "12px 14px", color: "var(--color-text-sub)", fontWeight: 700 }}>
                    주업종 · 소재지
                  </th>
                  <th style={{ padding: "12px 14px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>
                    총 재직자
                  </th>
                  <th style={{ padding: "12px 14px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>
                    순증가 (입사/상실)
                  </th>
                </tr>
              </thead>
              <tbody>
                {topNetGrowthCompanies.map((comp, idx) => (
                  <tr
                    key={comp.bNo}
                    style={{
                      borderBottom:
                        idx === topNetGrowthCompanies.length - 1
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
                        {comp.region}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, color: "var(--color-text-main)" }}>
                      {comp.employees.toLocaleString("ko-KR")}명
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <span style={{ fontWeight: 800, color: "var(--color-success)" }}>
                        +{comp.netChange.toLocaleString("ko-KR")}명
                      </span>
                      <div style={{ fontSize: "0.74rem", color: "var(--color-text-desc)", marginTop: "2px" }}>
                        (+{comp.newHires.toLocaleString("ko-KR")} / -{comp.losses.toLocaleString("ko-KR")})
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 대규모 고용 안정 기업 TOP 12 */}
        <div
          className="card"
          style={{
            padding: "28px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--bg-color-card)",
          }}
        >
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "var(--color-text-main)",
              marginBottom: "6px",
            }}
          >
            🏛️ 국민연금 대규모 고용 유지 계속사업장 TOP 12
          </h2>
          <p style={{ fontSize: "0.84rem", color: "var(--color-text-desc)", marginBottom: "20px" }}>
            단일 사업자등록번호 기준 국민연금 가입 임직원 규모가 가장 큰 핵심 계속사업장 리더보드입니다.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
            }}
          >
            {topEmployerCompanies.map((comp, idx) => (
              <Link
                key={comp.bNo}
                href={`/biz/${comp.bNo}`}
                style={{
                  textDecoration: "none",
                  padding: "16px",
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
                  <span style={{ fontSize: "0.85rem", fontWeight: 850, color: "var(--color-text-main)" }}>
                    {comp.employees.toLocaleString("ko-KR")}명
                  </span>
                </div>
                <div style={{ fontWeight: 800, color: "var(--color-text-main)", fontSize: "0.94rem" }}>
                  {comp.name}
                </div>
                <div style={{ fontSize: "0.76rem", color: "var(--color-text-desc)" }}>
                  {comp.sector} · {formatBizNo(comp.bNo)}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <StatsRelatedNav currentPath="/stats/active-rate" />
      </div>
    </div>
  );
}
