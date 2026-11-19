import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FEATURED_RIVALRIES, parseComparePairSlug } from "@/lib/compareConfig";
import { getCompareMatchup } from "@/lib/compareApi";
import CompareSelectorClient from "../CompareSelectorClient";
import AdBanner from "@/components/AdBanner";
import StatsRelatedNav from "@/components/StatsRelatedNav";
import JsonLd from "@/components/JsonLd";
import { ORG_ID, SITE_URL, WEBSITE_ID, buildBreadcrumbNode } from "@/lib/structuredData";
import { formatBizNo, formatEokToKorean } from "@/lib/statFormatters";

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

interface ComparePairPageProps {
  params: Promise<{ pair: string }>;
}

export async function generateMetadata({ params }: ComparePairPageProps): Promise<Metadata> {
  const { pair } = await params;
  const parsed = parseComparePairSlug(pair);
  if (!parsed) {
    return { title: "비교 대상을 찾을 수 없습니다", robots: { index: false, follow: false } };
  }

  const matchup = await getCompareMatchup(parsed.bNoA, parsed.bNoB);
  if (!matchup) {
    return { title: "기업 비교 정보를 찾을 수 없습니다", robots: { index: false, follow: false } };
  }

  const { companyA: a, companyB: b } = matchup;
  const canonicalPath = `/compare/${a.bNo}-vs-${b.bNo}`;
  const title = `${a.name} vs ${b.name} 연봉·임직원·매출·입퇴사율 1:1 비교`;
  const description = `${a.name}와(과) ${b.name}의 국민연금 추정 평균연봉, 상시 임직원 규모, 당월 입퇴사율, 최근 결산 매출액·영업이익률·부채비율 실데이터 정밀 비교 리포트입니다.`;

  return {
    title,
    description,
    keywords: [
      `${a.name} ${b.name} 비교`,
      `${a.name} 연봉`,
      `${b.name} 연봉`,
      `${a.name} vs ${b.name}`,
      "기업 1:1 스펙 비교",
      "마음데이타",
    ],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${title} | 마음데이타`,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      type: "website",
    },
  };
}

function DualBarRow({
  label,
  valAText,
  valBText,
  numA,
  numB,
  higherIsBetter = true,
}: {
  label: string;
  valAText: string;
  valBText: string;
  numA: number | null;
  numB: number | null;
  higherIsBetter?: boolean;
}) {
  const validBoth = numA !== null && numB !== null && (numA > 0 || numB > 0);
  let winner: "A" | "B" | "NONE" = "NONE";
  if (numA !== null && numB !== null && numA !== numB) {
    if (higherIsBetter) winner = numA > numB ? "A" : "B";
    else winner = numA < numB ? "A" : "B";
  }

  const absA = Math.max(0, numA || 0);
  const absB = Math.max(0, numB || 0);
  const total = absA + absB;
  const pctA = validBoth && total > 0 ? Math.min(92, Math.max(8, Math.round((absA / total) * 100))) : 50;
  const pctB = 100 - pctA;

  return (
    <div
      style={{
        padding: "16px 0",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: "12px",
          marginBottom: validBoth ? "10px" : 0,
        }}
      >
        <div
          style={{
            fontSize: "1rem",
            fontWeight: winner === "A" ? 900 : 700,
            color: winner === "A" ? "#2563eb" : "var(--color-text-main)",
          }}
        >
          {valAText} {winner === "A" && <span style={{ fontSize: "0.78rem" }}>👑</span>}
        </div>

        <div
          style={{
            fontSize: "0.8rem",
            fontWeight: 800,
            color: "var(--color-text-desc)",
            textAlign: "center",
            padding: "3px 10px",
            borderRadius: "999px",
            backgroundColor: "var(--bg-color-main)",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: "1rem",
            fontWeight: winner === "B" ? 900 : 700,
            color: winner === "B" ? "#0d9488" : "var(--color-text-main)",
            textAlign: "right",
          }}
        >
          {winner === "B" && <span style={{ fontSize: "0.78rem" }}>👑 </span>}
          {valBText}
        </div>
      </div>

      {validBoth && (
        <div
          style={{
            display: "flex",
            height: "8px",
            borderRadius: "999px",
            overflow: "hidden",
            backgroundColor: "var(--bg-color-main)",
            gap: "3px",
          }}
        >
          <div
            style={{
              width: `${pctA}%`,
              backgroundColor: winner === "A" ? "#2563eb" : "rgba(37, 99, 235, 0.38)",
              borderRadius: "999px",
            }}
          />
          <div
            style={{
              width: `${pctB}%`,
              backgroundColor: winner === "B" ? "#0d9488" : "rgba(13, 148, 136, 0.38)",
              borderRadius: "999px",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default async function ComparePairPage({ params }: ComparePairPageProps) {
  const { pair } = await params;
  const parsed = parseComparePairSlug(pair);
  if (!parsed) {
    notFound();
  }

  const matchup = await getCompareMatchup(parsed.bNoA, parsed.bNoB);
  if (!matchup) {
    notFound();
  }

  const { companyA: a, companyB: b, highlights } = matchup;
  const canonicalPath = `/compare/${a.bNo}-vs-${b.bNo}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}${canonicalPath}#webpage`,
        url: `${SITE_URL}${canonicalPath}`,
        name: `${a.name} vs ${b.name} 연봉·임직원·매출 1:1 비교 리포트`,
        description: `${a.name}와 ${b.name}의 공공데이터 기반 연봉·고용·재무 비교 분석`,
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
        inLanguage: "ko-KR",
        about: [
          { "@type": "Organization", name: a.name, url: `${SITE_URL}/biz/${a.bNo}` },
          { "@type": "Organization", name: b.name, url: `${SITE_URL}/biz/${b.bNo}` },
        ],
      },
      buildBreadcrumbNode(
        [
          { name: "홈", path: "/" },
          { name: "기업 1:1 스펙 비교기", path: "/compare" },
          { name: `${a.name} vs ${b.name}`, path: canonicalPath },
        ],
        canonicalPath
      ),
    ],
  };

  return (
    <div className="animate-fade-in" style={{ padding: "32px 0 84px 0" }}>
      <JsonLd data={jsonLd} />
      <div className="container" style={{ maxWidth: "960px" }}>
        {/* 브레드크럼 */}
        <nav
          aria-label="이동 경로"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.82rem",
            color: "var(--color-text-desc)",
            marginBottom: "16px",
          }}
        >
          <Link href="/" prefetch={false} style={{ color: "var(--color-text-sub)", textDecoration: "none" }}>
            홈
          </Link>
          <span>›</span>
          <Link
            href="/compare"
            prefetch={false}
            style={{ color: "var(--color-primary)", fontWeight: 700, textDecoration: "none" }}
          >
            기업 1:1 스펙 비교기
          </Link>
          <span>›</span>
          <strong style={{ color: "var(--color-text-main)" }}>
            {a.name} vs {b.name}
          </strong>
        </nav>

        {/* 상단 타이틀 */}
        <div style={{ marginBottom: "20px" }}>
          <h1
            style={{
              fontSize: "1.9rem",
              fontWeight: 850,
              color: "var(--color-text-main)",
              letterSpacing: "-0.025em",
              margin: "0 0 8px 0",
              wordBreak: "keep-all",
            }}
          >
            ⚖️ {a.name} <span style={{ color: "var(--color-text-desc)", fontWeight: 700 }}>vs</span> {b.name}
          </h1>
          <p style={{ fontSize: "0.92rem", color: "var(--color-text-sub)", margin: 0 }}>
            국세청 · 국민연금 · 금융감독원 DART 공식 실데이터로 분석한 두 기업의 연봉·고용·재무 1:1 맞대결 리포트입니다.
          </p>
        </div>

        {/* 기업 변경 & 공유 링크 바 */}
        <CompareSelectorClient
          initialA={{ bNo: a.bNo, name: a.name, sector: a.sector }}
          initialB={{ bNo: b.bNo, name: b.name, sector: b.sector }}
        />

        {/* 부문별 우위 하이라이트 */}
        {highlights.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
              marginTop: "18px",
            }}
          >
            {highlights.map((hl) => (
              <div
                key={hl.metric}
                className="card"
                style={{
                  padding: "16px 18px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-desc)" }}>
                  {hl.metric}
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 850,
                    marginTop: "5px",
                    color:
                      hl.winner === "A"
                        ? "#2563eb"
                        : hl.winner === "B"
                          ? "#0d9488"
                          : "var(--color-text-main)",
                    wordBreak: "keep-all",
                  }}
                >
                  {hl.summaryText}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: "22px" }}>
          <AdBanner />
        </div>

        {/* 양사 헤더 배너 + 상세 이동 버튼 */}
        <div
          className="card"
          style={{
            marginTop: "22px",
            padding: "24px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: "12px",
              paddingBottom: "18px",
              borderBottom: "2px solid var(--color-border)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#2563eb" }}>🅰️ 기업 A</div>
              <Link
                href={`/biz/${a.bNo}`}
                prefetch={false}
                style={{
                  fontSize: "1.18rem",
                  fontWeight: 900,
                  color: "var(--color-text-main)",
                  textDecoration: "none",
                }}
              >
                {a.name} ↗
              </Link>
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", marginTop: "3px" }}>
                {a.marketBoard || a.listingStatus} · {a.shortRegion}
              </div>
            </div>

            <div
              style={{
                fontWeight: 900,
                fontSize: "0.85rem",
                color: "var(--color-text-desc)",
                padding: "6px 10px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-color-main)",
              }}
            >
              VS
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#0d9488" }}>🅱️ 기업 B</div>
              <Link
                href={`/biz/${b.bNo}`}
                prefetch={false}
                style={{
                  fontSize: "1.18rem",
                  fontWeight: 900,
                  color: "var(--color-text-main)",
                  textDecoration: "none",
                }}
              >
                {b.name} ↗
              </Link>
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", marginTop: "3px" }}>
                {b.marketBoard || b.listingStatus} · {b.shortRegion}
              </div>
            </div>
          </div>

          {/* 1. 보상 및 고용 비교 */}
          <h2
            style={{
              fontSize: "1.05rem",
              fontWeight: 850,
              color: "var(--color-text-main)",
              margin: "22px 0 6px 0",
            }}
          >
            💳 1. 추정 평균연봉 &amp; 국민연금 고용 흐름 비교
          </h2>

          <DualBarRow
            label="추정 평균연봉"
            valAText={a.estimatedSalaryLabel || "미제공"}
            valBText={b.estimatedSalaryLabel || "미제공"}
            numA={a.estimatedSalaryManwon}
            numB={b.estimatedSalaryManwon}
            higherIsBetter={true}
          />
          <DualBarRow
            label="상시 임직원 수"
            valAText={a.employees > 0 ? `${a.employees.toLocaleString("ko-KR")}명` : "미연동"}
            valBText={b.employees > 0 ? `${b.employees.toLocaleString("ko-KR")}명` : "미연동"}
            numA={a.employees > 0 ? a.employees : null}
            numB={b.employees > 0 ? b.employees : null}
            higherIsBetter={true}
          />
          <DualBarRow
            label="당월 신규 입사자"
            valAText={
              a.employees > 0
                ? `+${a.newHires.toLocaleString("ko-KR")}명 (${a.joinRatePct ?? 0}%)`
                : "-"
            }
            valBText={
              b.employees > 0
                ? `+${b.newHires.toLocaleString("ko-KR")}명 (${b.joinRatePct ?? 0}%)`
                : "-"
            }
            numA={a.employees > 0 ? a.newHires : null}
            numB={b.employees > 0 ? b.newHires : null}
            higherIsBetter={true}
          />
          <DualBarRow
            label="당월 퇴사율 (낮을수록 안정)"
            valAText={
              a.employees > 0 && a.exitRatePct !== null
                ? `${a.exitRatePct}% (-${a.losses.toLocaleString("ko-KR")}명)`
                : "-"
            }
            valBText={
              b.employees > 0 && b.exitRatePct !== null
                ? `${b.exitRatePct}% (-${b.losses.toLocaleString("ko-KR")}명)`
                : "-"
            }
            numA={a.employees > 0 ? a.exitRatePct : null}
            numB={b.employees > 0 ? b.exitRatePct : null}
            higherIsBetter={false}
          />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              marginTop: "14px",
              padding: "12px 16px",
              borderRadius: "12px",
              backgroundColor: "var(--bg-color-main)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-sub)" }}>
              💡 두 회사 연봉 기준 세후 월급과 퇴직금 차이가 궁금하다면?
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <a
                href="https://www.maumcalc.com/calculators/net-salary"
                target="_blank"
                rel="noopener"
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  backgroundColor: "var(--color-primary-light)",
                  color: "var(--color-primary)",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                🧮 연봉 실수령액 계산기 (마음계산기) ↗
              </a>
              <a
                href="https://www.maumcalc.com/calculators/severance-pay"
                target="_blank"
                rel="noopener"
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-card)",
                  color: "var(--color-text-sub)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                💰 퇴직금 계산기 ↗
              </a>
            </div>
          </div>

          {/* 2. 결산 재무 비교 */}
          <h2
            style={{
              fontSize: "1.05rem",
              fontWeight: 850,
              color: "var(--color-text-main)",
              margin: "28px 0 6px 0",
            }}
          >
            📈 2. 결산 실적 &amp; 재무 건전성 비교
          </h2>

          <DualBarRow
            label="최근 결산 매출액"
            valAText={
              a.latestFinance
                ? `${formatEokToKorean(a.latestFinance.revenueEok)} (${a.latestFinance.year})`
                : "미공시"
            }
            valBText={
              b.latestFinance
                ? `${formatEokToKorean(b.latestFinance.revenueEok)} (${b.latestFinance.year})`
                : "미공시"
            }
            numA={a.latestFinance ? a.latestFinance.revenueEok : null}
            numB={b.latestFinance ? b.latestFinance.revenueEok : null}
            higherIsBetter={true}
          />
          <DualBarRow
            label="최근 영업이익"
            valAText={
              a.latestFinance ? formatEokToKorean(a.latestFinance.operatingIncomeEok) : "미공시"
            }
            valBText={
              b.latestFinance ? formatEokToKorean(b.latestFinance.operatingIncomeEok) : "미공시"
            }
            numA={a.latestFinance ? a.latestFinance.operatingIncomeEok : null}
            numB={b.latestFinance ? b.latestFinance.operatingIncomeEok : null}
            higherIsBetter={true}
          />
          <DualBarRow
            label="영업이익률"
            valAText={
              a.latestFinance?.operatingMarginPct !== null &&
              a.latestFinance?.operatingMarginPct !== undefined
                ? `${a.latestFinance.operatingMarginPct}%`
                : "-"
            }
            valBText={
              b.latestFinance?.operatingMarginPct !== null &&
              b.latestFinance?.operatingMarginPct !== undefined
                ? `${b.latestFinance.operatingMarginPct}%`
                : "-"
            }
            numA={a.latestFinance?.operatingMarginPct ?? null}
            numB={b.latestFinance?.operatingMarginPct ?? null}
            higherIsBetter={true}
          />
          <DualBarRow
            label="부채비율 (낮을수록 건전)"
            valAText={
              a.latestFinance?.debtRatioPct !== null &&
              a.latestFinance?.debtRatioPct !== undefined
                ? `${a.latestFinance.debtRatioPct}%`
                : "-"
            }
            valBText={
              b.latestFinance?.debtRatioPct !== null &&
              b.latestFinance?.debtRatioPct !== undefined
                ? `${b.latestFinance.debtRatioPct}%`
                : "-"
            }
            numA={a.latestFinance?.debtRatioPct ?? null}
            numB={b.latestFinance?.debtRatioPct ?? null}
            higherIsBetter={false}
          />

          {/* 3. 기업 기본정보 및 공시 건수 */}
          <h2
            style={{
              fontSize: "1.05rem",
              fontWeight: 850,
              color: "var(--color-text-main)",
              margin: "28px 0 6px 0",
            }}
          >
            🏛️ 3. 기업 기본 정보 &amp; 공시 활동 비교
          </h2>

          <DualBarRow
            label="DART 전자공시 누적"
            valAText={a.disclosureCount > 0 ? `${a.disclosureCount.toLocaleString("ko-KR")}건` : "-"}
            valBText={b.disclosureCount > 0 ? `${b.disclosureCount.toLocaleString("ko-KR")}건` : "-"}
            numA={a.disclosureCount > 0 ? a.disclosureCount : null}
            numB={b.disclosureCount > 0 ? b.disclosureCount : null}
            higherIsBetter={true}
          />

          <div style={{ overflowX: "auto", marginTop: "14px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <tbody>
                {[
                  { k: "사업자등록번호", va: formatBizNo(a.bNo), vb: formatBizNo(b.bNo) },
                  { k: "납세상태", va: a.bStt, vb: b.bStt },
                  { k: "대표자", va: a.representative, vb: b.representative },
                  {
                    k: "설립연도",
                    va: a.foundedYear ? `${a.foundedYear}년` : "-",
                    vb: b.foundedYear ? `${b.foundedYear}년` : "-",
                  },
                  { k: "주력 업종", va: a.sector, vb: b.sector },
                  { k: "본사 소재지", va: a.shortRegion, vb: b.shortRegion },
                ].map((row) => (
                  <tr key={row.k} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "11px 8px", width: "38%", fontWeight: 600, color: "var(--color-text-main)" }}>
                      {row.va}
                    </td>
                    <td
                      style={{
                        padding: "11px 8px",
                        width: "24%",
                        textAlign: "center",
                        fontWeight: 800,
                        color: "var(--color-text-desc)",
                        fontSize: "0.78rem",
                      }}
                    >
                      {row.k}
                    </td>
                    <td
                      style={{
                        padding: "11px 8px",
                        width: "38%",
                        textAlign: "right",
                        fontWeight: 600,
                        color: "var(--color-text-main)",
                      }}
                    >
                      {row.vb}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 각 기업 상세 리포트 직행 버튼 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
              marginTop: "22px",
            }}
          >
            <Link
              href={`/biz/${a.bNo}`}
              prefetch={false}
              className="btn-secondary"
              style={{
                padding: "13px 16px",
                borderRadius: "12px",
                textAlign: "center",
                fontWeight: 800,
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              🏢 {a.name} 전체 리포트 열기 ➔
            </Link>
            <Link
              href={`/biz/${b.bNo}`}
              prefetch={false}
              className="btn-secondary"
              style={{
                padding: "13px 16px",
                borderRadius: "12px",
                textAlign: "center",
                fontWeight: 800,
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              🏢 {b.name} 전체 리포트 열기 ➔
            </Link>
          </div>
        </div>

        {/* 다른 라이벌 매치 추천 */}
        <section
          aria-label="다른 인기 기업 빅매치"
          className="card"
          style={{
            marginTop: "28px",
            padding: "24px",
            border: "1px solid var(--color-border)",
          }}
        >
          <h2 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 12px 0" }}>
            🔥 함께 많이 본 업계 라이벌 비교 매치
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {FEATURED_RIVALRIES.filter((r) => r.pairSlug !== `${a.bNo}-vs-${b.bNo}`).map((rv) => (
              <Link
                key={rv.pairSlug}
                href={`/compare/${rv.pairSlug}`}
                prefetch={false}
                style={{
                  padding: "7px 13px",
                  borderRadius: "999px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-main)",
                  color: "var(--color-text-sub)",
                  fontSize: "0.81rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {rv.nameA} vs {rv.nameB}
              </Link>
            ))}
          </div>
        </section>

        <StatsRelatedNav currentPath="/compare" />
      </div>
    </div>
  );
}
