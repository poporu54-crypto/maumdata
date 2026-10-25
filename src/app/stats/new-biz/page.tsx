import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import StatsRelatedNav from "@/components/StatsRelatedNav";
import { getRealPortalStats, formatBizNo } from "@/lib/statApi";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "국민연금 신규 채용 & 신설 법인 실데이터 동향",
  description:
    "국민연금 가입 사업장의 최근 월 실제 신규 입사(취득) 인원 추이, 채용 상위 기업 랭킹, 신설 검증 법인 및 전국 17개 시·도별 고용 분포 리포트입니다.",
  alternates: {
    canonical: "/stats/new-biz",
  },
  openGraph: {
    title: "국민연금 신규 채용 & 신설 법인 실데이터 동향 | 마음데이타",
    description:
      "추정치 없이 실제 국민연금 가입·신규 취득 데이터와 국세청 검증 법인 DB를 직접 집계한 채용 및 신설 법인 동향입니다.",
    url: "https://www.maumdata.com/stats/new-biz",
    type: "website",
  },
};

export default async function NewBizStatsPage() {
  const stats = await getRealPortalStats();
  const {
    summary,
    monthlyEmployment,
    topHiringCompanies,
    recentFoundedCompanies,
    regionDistribution,
  } = stats;

  // 월별 실제 신규 입사자 시계열 SVG 그래프 좌표 계산
  const generateMonthlyChart = () => {
    if (monthlyEmployment.length === 0) return null;
    const width = 560;
    const height = 175;
    const paddingX = 44;
    const paddingTop = 36;
    const paddingBottom = 32;
    const activeWidth = width - paddingX * 2;
    const activeHeight = height - paddingTop - paddingBottom;

    const values = monthlyEmployment.map((m) => m.newHires);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const valRange = maxVal === minVal ? 1 : maxVal - minVal;

    const points = monthlyEmployment.map((m, idx) => {
      const x =
        monthlyEmployment.length === 1
          ? width / 2
          : paddingX + (idx / (monthlyEmployment.length - 1)) * activeWidth;
      const y =
        paddingTop +
        activeHeight -
        ((m.newHires - minVal) / valRange) * activeHeight;
      return { x, y, ...m };
    });

    const linePath = points
      .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${
      height - paddingBottom
    } L ${points[0].x.toFixed(1)} ${height - paddingBottom} Z`;

    return { width, height, paddingBottom, linePath, areaPath, points };
  };

  const chart = generateMonthlyChart();

  return (
    <div className="animate-fade-in" style={{ padding: "24px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "820px" }}>
        {/* 타이틀 헤더 */}
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
            <span>100% 실데이터 DB 집계</span>
            {summary.latestSyncDate && <span>· 최종 동기화 {summary.latestSyncDate}</span>}
          </div>
          <h1
            style={{
              fontSize: "1.85rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--color-text-main)",
              marginBottom: "8px",
            }}
          >
            📈 국민연금 신규 채용 &amp; 신설 법인 동향
          </h1>
          <p
            style={{
              fontSize: "0.92rem",
              color: "var(--color-text-desc)",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            임의 추정 공식 없이 마음데이타 DB에 실제 연동된 국민연금 가입 사업장의 신규 취득(입사) 인원과 국세청 계속사업자 검증 법인을 실시간 SQL로 직접 집계한 데이터입니다.
          </p>
        </div>

        {/* 핵심 실데이터 요약 카드 3종 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div
            className="card"
            style={{
              padding: "24px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
            }}
          >
            <div style={{ fontSize: "0.82rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
              최근 월 신규 입사(취득) 합계
            </div>
            <div
              style={{
                fontSize: "2.1rem",
                fontWeight: 850,
                color: "var(--color-success)",
                marginTop: "6px",
              }}
            >
              +{summary.monthlyNewHires.toLocaleString("ko-KR")}명
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", marginTop: "6px" }}>
              동월 상실(퇴사) {summary.monthlyLosses.toLocaleString("ko-KR")}명
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: "24px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
            }}
          >
            <div style={{ fontSize: "0.82rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
              국민연금 실연동 사업장 · 재직자
            </div>
            <div
              style={{
                fontSize: "2.1rem",
                fontWeight: 850,
                color: "var(--color-text-main)",
                marginTop: "6px",
              }}
            >
              {summary.totalTrackedEmployees.toLocaleString("ko-KR")}명
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", marginTop: "6px" }}>
              실가입 확인 {summary.npsCompanyCount.toLocaleString("ko-KR")}개 계속사업장 합계
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: "24px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
            }}
          >
            <div style={{ fontSize: "0.82rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
              국세청 검증 등록 기업 수
            </div>
            <div
              style={{
                fontSize: "2.1rem",
                fontWeight: 850,
                color: "var(--color-primary)",
                marginTop: "6px",
              }}
            >
              {summary.activeBizCount.toLocaleString("ko-KR")}개사
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", marginTop: "6px" }}>
              계속사업자 정상 가동 확인 법인
            </div>
          </div>
        </div>

        {/* 월별 국민연금 신규 입사 시계열 차트 */}
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
            📊 월별 국민연금 신규 취득(입사) 인원 실측 추이
          </h2>
          <p style={{ fontSize: "0.84rem", color: "var(--color-text-desc)", marginBottom: "20px" }}>
            당사 DB 내 월별 고용 이력 표본이 100개사 이상 확보된 기준월의 실제 신규 취득자 합계입니다.
          </p>

          {chart ? (
            <>
              <div style={{ width: "100%", overflowX: "auto" }}>
                <div style={{ minWidth: "500px" }}>
                  <svg
                    width="100%"
                    height={chart.height}
                    viewBox={`0 0 ${chart.width} ${chart.height}`}
                    style={{ overflow: "visible" }}
                  >
                    <defs>
                      <linearGradient id="realHireAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <line
                      x1="36"
                      y1="36"
                      x2={chart.width - 36}
                      y2="36"
                      stroke="var(--color-border)"
                      strokeWidth="0.7"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="36"
                      y1="90"
                      x2={chart.width - 36}
                      y2="90"
                      stroke="var(--color-border)"
                      strokeWidth="0.7"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="36"
                      y1={chart.height - chart.paddingBottom}
                      x2={chart.width - 36}
                      y2={chart.height - chart.paddingBottom}
                      stroke="var(--color-border)"
                      strokeWidth="1"
                    />

                    <path d={chart.areaPath} fill="url(#realHireAreaGrad)" />
                    <path
                      d={chart.linePath}
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {chart.points.map((p, idx) => (
                      <g key={p.month}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={idx === chart.points.length - 1 ? "5.5" : "4.5"}
                          fill="var(--color-primary)"
                          stroke="var(--bg-color-card)"
                          strokeWidth="2"
                        />
                        <text
                          x={p.x}
                          y={p.y - 11}
                          textAnchor="middle"
                          fontSize="10.5"
                          fontWeight="800"
                          fill="var(--color-text-main)"
                        >
                          +{p.newHires.toLocaleString("ko-KR")}명
                        </text>
                        <text
                          x={p.x}
                          y={chart.height - 10}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="600"
                          fill="var(--color-text-desc)"
                        >
                          {p.month} ({p.companyCount.toLocaleString("ko-KR")}사)
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
              <div
                style={{
                  fontSize: "0.76rem",
                  color: "var(--color-text-desc)",
                  marginTop: "12px",
                }}
              >
                * 괄호 안의 기업 수는 해당 기준월에 국민연금 사업장 가입 내역이 수집된 실제 표본 법인 수입니다.
              </div>
            </>
          ) : (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--color-text-desc)" }}>
              집계된 월별 고용 시계열 데이터가 없습니다.
            </div>
          )}
        </div>

        {/* 신규 채용 상위 TOP 15 기업 랭킹 */}
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
            🏆 최근 월 국민연금 신규 채용 상위 TOP 15 기업
          </h2>
          <p style={{ fontSize: "0.84rem", color: "var(--color-text-desc)", marginBottom: "20px" }}>
            국세청 계속사업자 중 최근 국민연금 신규 취득(입사) 인원이 가장 많은 실제 기업 순위입니다. 기업명을 클릭하면 상세 분석 리포트로 연결됩니다.
          </p>

          {topHiringCompanies.length > 0 ? (
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
                      가입 재직자
                    </th>
                    <th style={{ padding: "12px 14px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>
                      신규 입사
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topHiringCompanies.map((comp, idx) => (
                    <tr
                      key={comp.bNo}
                      style={{
                        borderBottom:
                          idx === topHiringCompanies.length - 1
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
                            display: "inline-block",
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
                      <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, color: "var(--color-success)" }}>
                        +{comp.newHires.toLocaleString("ko-KR")}명
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--color-text-desc)" }}>
              조회된 신규 채용 기업 데이터가 없습니다.
            </div>
          )}
        </div>

        {/* 최근 설립 검증 법인 현황 */}
        {recentFoundedCompanies.length > 0 && (
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
              🆕 최근 설립일이 검증된 신설 계속사업자 법인
            </h2>
            <p style={{ fontSize: "0.84rem", color: "var(--color-text-desc)", marginBottom: "20px" }}>
              2023년 이후 설립되어 국세청 계속사업자 가동 상태가 확인된 실제 등록 법인 목록입니다.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "12px",
              }}
            >
              {recentFoundedCompanies.map((comp) => (
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 800, color: "var(--color-text-main)", fontSize: "0.92rem" }}>
                      {comp.name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "var(--color-primary)",
                        backgroundColor: "var(--bg-color-card)",
                        padding: "2px 7px",
                        borderRadius: "6px",
                        border: "1px solid var(--color-border)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      설립 {comp.startDt}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)" }}>
                    {comp.sector} · {comp.region}
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "var(--color-text-sub)", fontWeight: 600 }}>
                    사업자번호 {formatBizNo(comp.bNo)}
                    {comp.employees > 0 ? ` · 국민연금 ${comp.employees.toLocaleString("ko-KR")}명` : ""}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 전국 17개 시·도별 실제 검증 법인 및 채용 분포 */}
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
            🗺️ 전국 17개 광역시·도별 검증 기업 &amp; 신규 입사 실집계
          </h2>
          <p style={{ fontSize: "0.84rem", color: "var(--color-text-desc)", marginBottom: "20px" }}>
            사업장 소재지 주소를 기준으로 정규화 집계한 시·도별 실제 계속사업자 수, 국민연금 재직 인원 및 최근 월 신규 입사자 수입니다.
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
                minWidth: "560px",
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
                  <th style={{ padding: "12px 16px", color: "var(--color-text-sub)", fontWeight: 700 }}>
                    광역시·도
                  </th>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>
                    검증 기업 수 (비중)
                  </th>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>
                    국민연금 재직자
                  </th>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>
                    신규 입사자
                  </th>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-sub)", fontWeight: 700 }}>
                    권역 대표 기업
                  </th>
                </tr>
              </thead>
              <tbody>
                {regionDistribution.map((reg, idx) => (
                  <tr
                    key={reg.region}
                    style={{
                      borderBottom:
                        idx === regionDistribution.length - 1
                          ? "none"
                          : "1px solid var(--color-border)",
                    }}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-main)" }}>
                      {reg.region}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-text-sub)", fontWeight: 600 }}>
                      {reg.bizCount.toLocaleString("ko-KR")}개사 ({reg.ratio}%)
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-text-sub)" }}>
                      {reg.totalEmployees.toLocaleString("ko-KR")}명
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "var(--color-success)" }}>
                      +{reg.newHires.toLocaleString("ko-KR")}명
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {reg.topBNo && reg.topBNm ? (
                        <Link
                          href={`/biz/${reg.topBNo}`}
                          style={{
                            color: "var(--color-primary)",
                            fontWeight: 700,
                            textDecoration: "none",
                            fontSize: "0.82rem",
                          }}
                        >
                          {reg.topBNm} ➔
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <StatsRelatedNav currentPath="/stats/new-biz" />
      </div>
    </div>
  );
}
