import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import DateSelector from "@/components/DateSelector";
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
    title: `계속사업자 비율 상세 분석 ${targetDate ? `(${targetDate})` : ""} | 마음데이터`,
    description: `${targetDate ? `${targetDate} 기준 ` : ""}대한민국 업종별 활성(계속)사업자 비율 및 유지 안정성 통계 데이터입니다.`,
  };
}

export default async function ActiveRateStatsPage({ searchParams }: PageProps) {
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
  let activeEntry = history.find(h => h.date === queryDate);
  if (!activeEntry && history.length > 0) {
    activeEntry = history[history.length - 1];
  }

  if (!activeEntry) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center" }}>
        <h3>통계 데이터를 불러오지 못했습니다.</h3>
        <Link href="/">홈으로 이동</Link>
      </div>
    );
  }

  // 꺾은선 차트 그리기 데이터 (최근 7일치 비율 변화)
  const chartHeight = 150;
  const chartWidth = 500;
  const padding = 30;
  const graphHistory = history.slice(-7);
  const minRate = Math.min(...graphHistory.map(h => h.activeBizRate)) - 0.2;
  const maxRate = Math.max(...graphHistory.map(h => h.activeBizRate)) + 0.2;
  const rateRange = maxRate - minRate || 1;

  const points = graphHistory.map((h, i) => {
    const x = padding + (i * (chartWidth - 2 * padding)) / (graphHistory.length - 1);
    const y = chartHeight - padding - ((h.activeBizRate - minRate) / rateRange) * (chartHeight - 2 * padding);
    return { x, y, rate: h.activeBizRate, date: h.date.slice(5) }; // MM-DD만 표시
  });

  const linePoints = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div className="animate-fade-in" style={{ padding: "24px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "720px" }}>
        
        {/* 헤더 */}
        <div style={{ marginBottom: "32px" }}>
          <Link href="/" className="back-link">➔ 메인 화면으로 돌아가기</Link>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
            📈 계속사업자 비율 통계 분석
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-desc)", lineHeight: 1.5 }}>
            국세청 100대 생활업종 통계를 바탕으로 휴폐업되지 않고 성실하게 납세를 계속하고 있는 국내 활성 사업체의 상대적 비율 추이를 분석한 리포트입니다.
          </p>
        </div>

        {/* 날짜 선택바 */}
        <DateSelector dates={dates} currentDate={activeEntry.date} baseUrl="/stats/active-rate" />

        {/* 요약 현황판 */}
        <div className="card" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "20px", marginBottom: "32px" }}>
          <div>
            <span style={{ fontSize: "0.9rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
              {activeEntry.date} 기준 전국 종합
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "4px" }}>
              <span style={{ fontSize: "2.8rem", fontWeight: 850, color: "var(--color-text-main)", lineHeight: 1 }}>
                {activeEntry.activeBizRate}%
              </span>
              <span style={{
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                color: "var(--color-success)",
                fontSize: "0.85rem",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "30px"
              }}>
                업종 기저 안정성 매우 높음
              </span>
            </div>
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-sub)", lineHeight: 1.6, margin: 0 }}>
            계속사업자 비율은 신규 개업 대비 폐업 가중치를 뺀 실제 경제 활동 기업군의 생존율을 보여주는 종합 지표입니다. 90% 이상으로 유지되는 상권은 전반적으로 충격에 대한 복원력과 업종 수명이 안정적인 상태를 뜻합니다.
          </p>
        </div>

        {/* 차트 시각화 영역 */}
        <div className="card" style={{ padding: "32px", marginBottom: "32px" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
            📊 최근 7일간의 계속사업자 비율 변동 흐름
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--color-text-desc)", marginBottom: "24px" }}>
            미세한 유입/유출 추세를 민감하게 반영한 7일 이동 평균 흐름입니다.
          </p>
          
          <div style={{ width: "100%", overflowX: "auto" }}>
            <div style={{ minWidth: "500px", position: "relative" }}>
              <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: "visible" }}>
                {/* 배경 그리드선 */}
                <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1={padding} y1={chartHeight/2} x2={chartWidth - padding} y2={chartHeight/2} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="var(--color-border)" strokeWidth="1" />

                {/* 꺾은선 */}
                <polyline fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={linePoints} />

                {/* 포인트 마커 및 텍스트 */}
                {points.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4" fill="var(--color-primary)" stroke="var(--bg-color-card)" strokeWidth="1.5" />
                    <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--color-text-main)">
                      {p.rate}%
                    </text>
                    <text x={p.x} y={chartHeight - 8} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-text-desc)">
                      {p.date}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
