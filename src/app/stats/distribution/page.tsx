import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import StatsRelatedNav from "@/components/StatsRelatedNav";
import { getRealPortalStats, getOfficialKosisSurvey } from "@/lib/statApi";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "산업군별 검증 기업 분포 & 통계청 전국사업체조사 공식 통계",
  description:
    "마음데이타 DB 등록 계속사업자의 실제 업종별 분포·대표 기업 링크와 국가데이터처(통계청) 전국사업체조사 19대 산업 대분류 공식 확정 통계를 제공합니다.",
  alternates: {
    canonical: "/stats/distribution",
  },
  openGraph: {
    title: "산업군별 검증 기업 분포 & 통계청 공식 업종 통계 | 마음데이타",
    description:
      "실시간 DB 검증 법인 업종 분포 및 국가데이터처(통계청) 전국사업체조사 공식 확정 통계를 기준일과 함께 투명하게 확인하세요.",
    url: "https://www.maumdata.com/stats/distribution",
    type: "website",
  },
};

export default async function DistributionStatsPage() {
  const [stats, kosisSurvey] = await Promise.all([
    getRealPortalStats(),
    getOfficialKosisSurvey(),
  ]);

  const { summary, macroRatios, dbSectorDistribution } = stats;
  const {
    classifiedTotal,
    financeServices,
    constructionRealEstate,
    manufacturing,
    ictCommerce,
  } = macroRatios;

  const seg1Offset = 25;
  const seg2Offset = (25 - financeServices + 100) % 100;
  const seg3Offset = (seg2Offset - constructionRealEstate + 100) % 100;
  const seg4Offset = (seg3Offset - manufacturing + 100) % 100;

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
            <span>실데이터 업종 집계 + 공식 통계 기준일 투명 표기</span>
            {summary.latestSyncDate && <span>· DB 동기화 {summary.latestSyncDate}</span>}
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
            🏢 대한민국 산업군별 기업 분포 &amp; 공식 업종 통계
          </h1>
          <p
            style={{
              fontSize: "0.92rem",
              color: "var(--color-text-desc)",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            마음데이타 DB에 실제 수록된 검증 계속사업자의 세부 업종 분포 및 대표 기업과, 국가데이터처(통계청) 전국사업체조사의 19대 산업 대분류 공식 확정 수치를 일체의 임의 역산 없이 원문 그대로 제공합니다.
          </p>
        </div>

        {/* 섹션 1: 마음데이타 DB 4대 산업군 도넛 요약 */}
        <div
          className="card"
          style={{
            padding: "28px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--bg-color-card)",
            marginBottom: "28px",
            display: "flex",
            flexDirection: "column",
            gap: "22px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "var(--color-text-main)",
                marginBottom: "4px",
              }}
            >
              📊 마음데이타 검증 법인 산업군 구성비 (실제 DB 집계)
            </h2>
            <p style={{ fontSize: "0.84rem", color: "var(--color-text-desc)", margin: 0 }}>
              표준 업종 분류가 확인된 계속사업자 총 <strong>{classifiedTotal.toLocaleString("ko-KR")}개사</strong>의 실제 산업군 비중입니다.
            </p>
          </div>

          {classifiedTotal > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                flexWrap: "wrap",
                gap: "32px",
              }}
            >
              <div style={{ position: "relative", width: "160px", height: "160px" }}>
                <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
                  <circle className="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="transparent" />
                  <circle
                    className="donut-ring"
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="var(--color-border)"
                    strokeWidth="4"
                  />
                  <circle
                    className="donut-segment"
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="var(--color-primary)"
                    strokeWidth="4.5"
                    strokeDasharray={`${financeServices} ${100 - financeServices}`}
                    strokeDashoffset={seg1Offset}
                  />
                  <circle
                    className="donut-segment"
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="4.5"
                    strokeDasharray={`${constructionRealEstate} ${100 - constructionRealEstate}`}
                    strokeDashoffset={seg2Offset}
                  />
                  <circle
                    className="donut-segment"
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#fbbf24"
                    strokeWidth="4.5"
                    strokeDasharray={`${manufacturing} ${100 - manufacturing}`}
                    strokeDashoffset={seg3Offset}
                  />
                  <circle
                    className="donut-segment"
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#a855f7"
                    strokeWidth="4.5"
                    strokeDasharray={`${ictCommerce} ${100 - ictCommerce}`}
                    strokeDashoffset={seg4Offset}
                  />
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
                  <div style={{ fontSize: "1.15rem", fontWeight: 850, color: "var(--color-text-main)", lineHeight: 1.1 }}>
                    {classifiedTotal.toLocaleString("ko-KR")}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--color-text-desc)", fontWeight: 700, marginTop: "3px" }}>
                    검증 법인
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px 20px",
                  minWidth: "240px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "var(--color-primary)" }} />
                  <span style={{ color: "var(--color-text-sub)" }}>금융·전문서비스 ({financeServices}%)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#10b981" }} />
                  <span style={{ color: "var(--color-text-sub)" }}>건설·부동산 ({constructionRealEstate}%)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#fbbf24" }} />
                  <span style={{ color: "var(--color-text-sub)" }}>제조·엔지니어링 ({manufacturing}%)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#a855f7" }} />
                  <span style={{ color: "var(--color-text-sub)" }}>IT·유통·물류 ({ictCommerce}%)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 섹션 2: 마음데이타 DB 상위 15대 세부 업종 & 대표 기업 링크 */}
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
            🏢 당사 DB 등록 상위 15대 세부 업종 &amp; 대표 기업
          </h2>
          <p style={{ fontSize: "0.84rem", color: "var(--color-text-desc)", marginBottom: "20px" }}>
            실제 등록된 계속사업자 수가 많은 상위 표준 업종과 각 업종 내 매출·고용 대표 기업 바로가기입니다.
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
                    세부 업종명
                  </th>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>
                    등록 법인 수
                  </th>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>
                    분류 내 비중
                  </th>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-sub)", fontWeight: 700 }}>
                    업종 대표 검증 기업
                  </th>
                </tr>
              </thead>
              <tbody>
                {dbSectorDistribution.map((item, idx) => (
                  <tr
                    key={item.sector}
                    style={{
                      borderBottom:
                        idx === dbSectorDistribution.length - 1
                          ? "none"
                          : "1px solid var(--color-border)",
                    }}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-text-main)" }}>
                      {item.sector}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-text-sub)", fontWeight: 600 }}>
                      {item.bizCount.toLocaleString("ko-KR")}개사
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-primary)", fontWeight: 700 }}>
                      {item.ratio}%
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {item.topBNo && item.topBNm ? (
                        <Link
                          href={`/biz/${item.topBNo}`}
                          prefetch={false}
                          style={{
                            color: "var(--color-primary)",
                            fontWeight: 700,
                            textDecoration: "none",
                            fontSize: "0.84rem",
                          }}
                        >
                          {item.topBNm} ➔
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

        {/* 섹션 3: 통계청 전국사업체조사 19대 산업 대분류 공식 확정 통계 (API 정상 응답 시에만 노출, 기준일 정직 표기) */}
        {kosisSurvey && kosisSurvey.industries.length > 0 && (
          <div
            className="card"
            style={{
              padding: "28px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: "18px",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 800,
                    color: "var(--color-text-main)",
                    marginBottom: "6px",
                  }}
                >
                  📋 전국사업체조사 19대 산업 대분류 공식 통계
                </h2>
                <p style={{ fontSize: "0.84rem", color: "var(--color-text-desc)", margin: 0 }}>
                  전국 총 사업체 <strong>{kosisSurvey.totalBusinesses.toLocaleString("ko-KR")}개소</strong> · 총 종사자{" "}
                  <strong>{kosisSurvey.totalEmployees.toLocaleString("ko-KR")}명</strong> 공식 확정 집계입니다.
                </p>
              </div>
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  color: "var(--color-primary)",
                  backgroundColor: "var(--color-primary-light)",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  whiteSpace: "nowrap",
                }}
              >
                공식 발표 기준: {kosisSurvey.referenceDateLabel}
              </span>
            </div>

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
                  fontSize: "0.86rem",
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
                      한국표준산업분류 대분류명
                    </th>
                    <th style={{ padding: "12px 16px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>
                      총 사업체 수
                    </th>
                    <th style={{ padding: "12px 16px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>
                      총 종사자 수
                    </th>
                    <th style={{ padding: "12px 16px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>
                      사업체 비중
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {kosisSurvey.industries.map((ind, idx) => (
                    <tr
                      key={ind.code}
                      style={{
                        borderBottom:
                          idx === kosisSurvey.industries.length - 1
                            ? "none"
                            : "1px solid var(--color-border)",
                      }}
                    >
                      <td style={{ padding: "12px 16px", color: "var(--color-text-main)", fontWeight: 600 }}>
                        {ind.name}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--color-text-sub)", textAlign: "right", fontWeight: 500 }}>
                        {ind.businessCount.toLocaleString("ko-KR")}개소
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--color-text-sub)", textAlign: "right", fontWeight: 500 }}>
                        {ind.employeeCount.toLocaleString("ko-KR")}명
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--color-primary)", textAlign: "right", fontWeight: 700 }}>
                        {ind.ratio}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                textAlign: "right",
                fontSize: "0.75rem",
                color: "var(--color-text-desc)",
                marginTop: "14px",
              }}
            >
              * 공공데이터 출처: {kosisSurvey.sourceName} ({kosisSurvey.referenceDateLabel}, 공공데이터포털 API 원문 연동)
            </div>
          </div>
        )}

        <StatsRelatedNav currentPath="/stats/distribution" />
      </div>
    </div>
  );
}
