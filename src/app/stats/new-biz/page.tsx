import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import DateSelector from "@/components/DateSelector";
import StatsRelatedNav from "@/components/StatsRelatedNav";
import { HistoryEntry } from "@/lib/statScheduler";
import { getStatsHistory } from "@/lib/db";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { date } = await searchParams;
  const targetDate = date ? decodeURIComponent(date) : "";
  return {
    title: `실시간 개업 현황 상세 분석${targetDate ? ` (${targetDate})` : ""}`,
    description: `${targetDate ? `${targetDate} 기준 ` : ""}대한민국 국세청 100대 생활업종 신규 개업 추세 분석 데이터입니다.`,
    alternates: {
      canonical: "/stats/new-biz",
    },
    openGraph: {
      title: `실시간 개업 현황 상세 분석 ${targetDate ? `(${targetDate})` : ""} | 마음데이타`,
      description: `${targetDate ? `${targetDate} 기준 ` : ""}대한민국 국세청 100대 생활업종 신규 개업 추세 분석 데이터입니다.`,
      url: "https://www.maumdata.com/stats/new-biz",
      type: "website",
    },
  };
}

export default async function NewBizStatsPage({ searchParams }: PageProps) {
  const { date } = await searchParams;
  const queryDate = date ? decodeURIComponent(date).trim() : "";

  // 1. Neon DB에서 히스토리 데이터 비동기 조회
  let history: HistoryEntry[] = [];
  try {
    history = await getStatsHistory();
  } catch (err) {
    console.error("Failed to load history data from Neon DB:", err);
  }

  // 날짜 오름차순 정렬
  history.sort((a, b) => a.date.localeCompare(b.date));
  const dates = history.map(h => h.date);

  // 대상 날짜의 엔트리 조회
  let activeIndex = history.findIndex(h => h.date === queryDate);
  if (activeIndex === -1 && history.length > 0) {
    activeIndex = history.length - 1;
  }
  let activeEntry = activeIndex >= 0 ? history[activeIndex] : null;

  if (!activeEntry) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center" }}>
        <h3>통계 데이터를 불러오지 못했습니다.</h3>
        <Link href="/">홈으로 이동</Link>
      </div>
    );
  }

  // 차트에 표시할 최근 7일간의 히스토리 슬라이스 (데이터가 뭉치지 않도록 최대 7개 구간으로 필터링)
  let displayHistory: HistoryEntry[] = [];
  if (history.length > 0) {
    const endIdx = activeIndex >= 0 ? activeIndex + 1 : history.length;
    const startIdx = Math.max(0, endIdx - 7);
    displayHistory = history.slice(startIdx, endIdx);

    // 선택 날짜가 앞부분이라 7개 미만인데 전체 데이터가 7개 이상이면 앞에서부터 7개 확보
    if (displayHistory.length < 7 && history.length >= 7) {
      displayHistory = history.slice(0, 7);
    }
  } else {
    displayHistory = [activeEntry];
  }

  // 7대 권역 비율 및 계산
  const regionWeights = [
    { name: "경기도", pct: 26 },
    { name: "서울특별시", pct: 22 },
    { name: "부산광역시", pct: 7 },
    { name: "인천광역시", pct: 6 },
    { name: "대구광역시", pct: 5 },
    { name: "대전광역시", pct: 4 },
    { name: "광주광역시", pct: 4 },
    { name: "기타 지역", pct: 26 },
  ];

  // 최근 7일 개업 트렌드 SVG 그래프 연산
  const generateTrendPath = () => {
    if (displayHistory.length === 0) return null;
    const width = 500;
    const height = 150;
    const paddingX = 40;
    const paddingTop = 35;
    const paddingBottom = 25;
    const activeWidth = width - paddingX * 2;
    const activeHeight = height - paddingTop - paddingBottom;

    const values = displayHistory.map(h => h.newBizToday);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const valRange = maxVal === minVal ? 1 : maxVal - minVal;

    const points = displayHistory.map((h, idx) => {
      const x = displayHistory.length === 1 
        ? width / 2 
        : paddingX + (idx / (displayHistory.length - 1)) * activeWidth;
      const y = paddingTop + activeHeight - ((h.newBizToday - minVal) / valRange) * activeHeight;
      return { x, y };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - paddingBottom} L ${points[0].x.toFixed(1)} ${height - paddingBottom} Z`;

    return { linePath, areaPath, points };
  };

  const trendData = generateTrendPath();

  return (
    <div className="animate-fade-in" style={{ padding: "24px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "720px" }}>

        {/* 타이틀 헤더 */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--color-text-main)",
            marginBottom: "8px"
          }}>
            📈 실시간 개업 현황 상세 분석
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-desc)", lineHeight: 1.5 }}>
            국세청 100대 생활업종 데이터를 시계열적으로 수집 및 파싱하여, 자정 24:00마다 누적된 전국 사업자 개설 통계 이력입니다.
          </p>
        </div>

        {/* 날짜 선택 드롭다운 */}
        {dates.length > 0 && (
          <DateSelector 
            dates={dates} 
            currentDate={activeEntry.date} 
            baseUrl="/stats/new-biz" 
          />
        )}

        {/* 핵심 요약 카드 */}
        <div className="card" style={{
          padding: "32px",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--bg-color-card)",
          marginBottom: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          <div>
            <span style={{ fontSize: "0.9rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
              {activeEntry.date} 기준 전국 개업자 통계
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontSize: "2.8rem", fontWeight: 800, color: "var(--color-text-main)" }}>
              {activeEntry.newBizToday.toLocaleString()}
            </span>
            <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-success)" }}>
              +{activeEntry.newBizTodayDelta} 개소 (전일 대비)
            </span>
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-sub)", lineHeight: 1.5 }}>
            해당 일자에 산출된 전국 신규 사업자 개설 예측치입니다. 소비 심리, 거시 경제 지표 및 100대 업종별 실시간 증감 트렌드를 분석 반영했습니다.
          </p>
        </div>

        {/* 트렌드 그래프 차트 */}
        <div className="card" style={{
          padding: "32px",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--bg-color-card)",
          marginBottom: "32px"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
            📊 시계열 개업 트렌드 추이
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "24px" }}>
            최근 7일간 기록된 일일 개업 수의 유기적인 변화 흐름 그래프입니다.
          </p>

          {trendData && displayHistory.length > 0 ? (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <div style={{ minWidth: "460px", position: "relative" }}>
                <svg width="100%" height="150" viewBox="0 0 500 150" style={{ overflow: "visible" }}>
                  <defs>
                    <linearGradient id="newBizAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* 격자 백그라운드 선 */}
                  <line x1="30" y1="35" x2="470" y2="35" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="30" y1="75" x2="470" y2="75" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="30" y1="125" x2="470" y2="125" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="3 3" />

                  {/* 그라디언트 에어리어 */}
                  <path d={trendData.areaPath} fill="url(#newBizAreaGrad)" />
                  {/* 메인 꺾은선 */}
                  <path d={trendData.linePath} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                  {/* 도트 마커 및 개업 수 레이블 */}
                  {trendData.points.map((p, idx) => {
                    const isSelected = displayHistory[idx].date === activeEntry.date;
                    return (
                      <g key={idx}>
                        {isSelected && (
                          <circle cx={p.x} cy={p.y} r="11" fill="var(--color-primary)" opacity="0.25" />
                        )}
                        <circle 
                          cx={p.x} cy={p.y} 
                          r={isSelected ? "6.5" : "4.5"} 
                          fill={isSelected ? "#a855f7" : "var(--color-primary)"} 
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <text 
                          x={p.x} y={p.y - 12} 
                          textAnchor="middle" 
                          fontSize={isSelected ? "11.5" : "10"} 
                          fontWeight={isSelected ? "800" : "600"} 
                          fill={isSelected ? "#a855f7" : "var(--color-text-main)"}
                        >
                          {displayHistory[idx].newBizToday.toLocaleString()}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                {/* X축 레이블 */}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0 20px", marginTop: "12px" }}>
                  {displayHistory.map((h, idx) => {
                    const isSelected = h.date === activeEntry.date;
                    return (
                      <Link 
                        key={idx} 
                        href={`/stats/new-biz?date=${h.date}`}
                        style={{ 
                          textDecoration: "none",
                          fontSize: "0.78rem", 
                          color: isSelected ? "var(--color-primary)" : "var(--color-text-desc)", 
                          fontWeight: isSelected ? 800 : 500,
                          backgroundColor: isSelected ? "var(--color-primary-light)" : "transparent",
                          padding: "2px 6px",
                          borderRadius: "6px",
                          transition: "all 0.2s"
                        }}
                      >
                        {h.date.substring(5)}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--color-text-desc)" }}>
              조회 가능한 이력 데이터가 없습니다.
            </div>
          )}
        </div>

        {/* 권역별 배분 리스트 표 */}
        <div className="card" style={{
          padding: "32px",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--bg-color-card)"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
            🗺️ {activeEntry.date} 권역별 예상 개업 수
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "20px" }}>
            당일 등록된 신규 개업 총 수치({activeEntry.newBizToday.toLocaleString()}개소)에 각 권역별 가중 비중을 연동한 분포 표입니다.
          </p>

          <div style={{
            border: "1px solid var(--color-border)",
            borderRadius: "16px",
            overflow: "hidden",
            backgroundColor: "rgba(255, 255, 255, 0.01)"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  borderBottom: "1px solid var(--color-border)",
                  textAlign: "left"
                }}>
                  <th style={{ padding: "12px 20px", color: "var(--color-text-sub)", fontWeight: 700 }}>권역명</th>
                  <th style={{ padding: "12px 20px", color: "var(--color-text-desc)", stroke: "none", fontWeight: 700, textAlign: "right" }}>가중 비중</th>
                  <th style={{ padding: "12px 20px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>예상 개업 수</th>
                </tr>
              </thead>
              <tbody>
                {regionWeights.map((rw, idx) => {
                  const estCount = Math.round(activeEntry.newBizToday * (rw.pct / 100));
                  return (
                    <tr 
                      key={idx} 
                      style={{ 
                        borderBottom: idx === regionWeights.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.04)",
                        backgroundColor: idx % 2 === 1 ? "rgba(255, 255, 255, 0.005)" : "transparent"
                      }}
                    >
                      <td style={{ padding: "12px 20px", color: "var(--color-text-main)", fontWeight: 600 }}>
                        {rw.name}
                      </td>
                      <td style={{ padding: "12px 20px", color: "var(--color-text-desc)", textAlign: "right", fontWeight: 500 }}>
                        {rw.pct}%
                      </td>
                      <td style={{ padding: "12px 20px", color: "var(--color-success)", textAlign: "right", fontWeight: 700 }}>
                        약 {estCount.toLocaleString()}개소
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <StatsRelatedNav currentPath="/stats/new-biz" />

      </div>
    </div>
  );
}
