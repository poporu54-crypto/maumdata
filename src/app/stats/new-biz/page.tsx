import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import DateSelector from "@/components/DateSelector";
import { HistoryEntry } from "@/lib/statScheduler";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { date } = await searchParams;
  const targetDate = date ? decodeURIComponent(date) : "";
  return {
    title: `실시간 개업 현황 상세 분석 ${targetDate ? `(${targetDate})` : ""} | 마음데이터`,
    description: `${targetDate ? `${targetDate} 기준 ` : ""}대한민국 국세청 100대 생활업종 신규 개업 추세 분석 데이터입니다.`,
  };
}

export default async function NewBizStatsPage({ searchParams }: PageProps) {
  const { date } = await searchParams;
  const queryDate = date ? decodeURIComponent(date).trim() : "";

  // 1. 히스토리 파일 읽기
  let history: HistoryEntry[] = [];
  try {
    const filePath = path.join(process.cwd(), "src/data/stats_history.json");
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf-8");
      history = JSON.parse(fileData);
    }
  } catch (err) {
    console.error("Failed to load history data:", err);
  }

  // 날짜 오름차순 정렬
  history.sort((a, b) => a.date.localeCompare(b.date));
  const dates = history.map(h => h.date);

  // 대상 날짜의 엔트리 조회
  let activeEntry = history.find(h => h.date === queryDate);
  if (!activeEntry && history.length > 0) {
    // 지정 날짜가 없으면 가장 최신 데이터 지정
    activeEntry = history[history.length - 1];
  }

  // 데이터가 아예 없을 시의 폴백
  if (!activeEntry) {
    activeEntry = {
      date: "2026-06-11",
      newBizToday: 1330,
      newBizTodayDelta: 67,
      activeBizRate: 91.4,
      industryRatios: { retail: 25.2, ict: 2.1, manufacturing: 8.6, others: 64.1 }
    };
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
    if (history.length === 0) return null;
    const width = 450;
    const height = 140;
    const padding = 25;
    const activeWidth = width - padding * 2;
    const activeHeight = height - padding * 2;

    const values = history.map(h => h.newBizToday);
    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.05;
    const valRange = maxVal - minVal;

    const points = history.map((h, idx) => {
      const x = padding + (idx / (history.length - 1)) * activeWidth;
      const y = padding + activeHeight - ((h.newBizToday - minVal) / valRange) * activeHeight;
      return { x, y };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

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

          {trendData && history.length > 0 ? (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <div style={{ minWidth: "450px", position: "relative" }}>
                <svg width="100%" height="140" viewBox="0 0 450 140" style={{ overflow: "visible" }}>
                  <defs>
                    <linearGradient id="newBizAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* 격자 백그라운드 선 */}
                  <line x1="25" y1="25" x2="425" y2="25" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="25" y1="70" x2="425" y2="70" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="25" y1="115" x2="425" y2="115" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" strokeDasharray="3 3" />

                  {/* 그라디언트 에어리어 */}
                  <path d={trendData.areaPath} fill="url(#newBizAreaGrad)" />
                  {/* 메인 꺾은선 */}
                  <path d={trendData.linePath} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                  {/* 도트 마커 및 말풍선 값 */}
                  {trendData.points.map((p, idx) => {
                    const isSelected = history[idx].date === activeEntry.date;
                    return (
                      <g key={idx}>
                        <circle 
                          cx={p.x} cy={p.y} 
                          r={isSelected ? "7" : "5"} 
                          fill={isSelected ? "#a855f7" : "var(--color-primary)"} 
                        />
                        <circle cx={p.x} cy={p.y} r="2.5" fill="white" />
                        <text 
                          x={p.x} y={p.y - 12} 
                          textAnchor="middle" 
                          fontSize={isSelected ? "11" : "9"} 
                          fontWeight={isSelected ? "800" : "700"} 
                          fill={isSelected ? "#a855f7" : "var(--color-text-main)"}
                        >
                          {history[idx].newBizToday}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                {/* X축 레이블 */}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0 12px", marginTop: "10px" }}>
                  {history.map((h, idx) => (
                    <span 
                      key={idx} 
                      style={{ 
                        fontSize: "0.75rem", 
                        color: h.date === activeEntry.date ? "var(--color-text-main)" : "var(--color-text-desc)", 
                        fontWeight: h.date === activeEntry.date ? 800 : 600 
                      }}
                    >
                      {h.date.substring(5)}
                    </span>
                  ))}
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
                  <th style={{ padding: "12px 20px", color: "var(--color-text-sub)", fontWeight: 700, textAlign: "right" }}>가중 비중</th>
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

      </div>
    </div>
  );
}
