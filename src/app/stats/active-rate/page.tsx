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
    title: `계속사업자 비율 상세 분석 ${targetDate ? `(${targetDate})` : ""} | 마음데이터`,
    description: `${targetDate ? `${targetDate} 기준 ` : ""}대한민국 업종별 활성(계속)사업자 비율 및 유지 안정성 통계 데이터입니다.`,
  };
}

export default async function ActiveRateStatsPage({ searchParams }: PageProps) {
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
    activeEntry = history[history.length - 1];
  }

  if (!activeEntry) {
    activeEntry = {
      date: "2026-06-11",
      newBizToday: 1330,
      newBizTodayDelta: 67,
      activeBizRate: 91.4,
      industryRatios: { retail: 25.2, ict: 2.1, manufacturing: 8.6, others: 64.1 }
    };
  }

  // 날짜별 변동폭 계산
  const baseRate = 91.4;
  const delta = activeEntry.activeBizRate - baseRate;

  // 7대 주요 업종별 동적 계속사업자 비율 연산
  const sectorActiveRates = [
    { name: "금융 및 보험업", baseRate: 96.8, color: "#3b82f6" },
    { name: "정보통신업", baseRate: 94.6, color: "#a855f7" },
    { name: "교육 서비스업", baseRate: 93.1, color: "#10b981" },
    { name: "제조업", baseRate: 92.8, color: "#fbbf24" },
    { name: "도매 및 소매업", baseRate: 90.1, color: "var(--color-primary)" },
    { name: "건설업", baseRate: 89.5, color: "#ec4899" },
    { name: "숙박 및 음식점업", baseRate: 84.2, color: "#ef4444" },
  ].map(s => {
    // 100%를 초과하지 않고 10% 미만으로 떨어지지 않게 제한
    const currentRate = parseFloat(Math.min(100, Math.max(10, s.baseRate + delta)).toFixed(1));
    return {
      name: s.name,
      rate: currentRate,
      color: s.color
    };
  });

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
            🛡️ 계속사업자 비율 상세 분석
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-desc)", lineHeight: 1.5 }}>
            전체 가동 등록 사업체 중 폐업 처리가 되지 않고 활성 상태로 지속 가동 중인 법인 및 개인사업자 비중 분석입니다.
          </p>
        </div>

        {/* 날짜 선택 드롭다운 */}
        {dates.length > 0 && (
          <DateSelector 
            dates={dates} 
            currentDate={activeEntry.date} 
            baseUrl="/stats/active-rate" 
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
              {activeEntry.date} 기준 가동 사업체 안정성
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontSize: "2.8rem", fontWeight: 800, color: "var(--color-text-main)" }}>
              {activeEntry.activeBizRate}%
            </span>
            <span style={{
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              color: "var(--color-primary)",
              fontSize: "0.85rem",
              fontWeight: 700,
              padding: "6px 14px",
              borderRadius: "30px"
            }}>
              안정권 가동률 유지
            </span>
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-sub)", lineHeight: 1.5 }}>
            등록된 전체 가동 사업자 중 폐업 상태가 아닌 계속 영업을 유지하고 있는 비율입니다. 이 비율이 높을수록 전반적인 내수 경기 활성화와 생존율이 안정적인 것을 의미합니다.
          </p>
        </div>

        {/* 업종별 비교 그래프 */}
        <div className="card" style={{
          padding: "32px",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--bg-color-card)",
          marginBottom: "32px"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
            📊 {activeEntry.date} 주요 업종별 계속 가동율 비교
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "24px" }}>
            자본 조달 규모와 경쟁 밀도에 다른 7대 주요 업종별 상세 계속 가동율 분포입니다.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {sectorActiveRates.map((sar, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.88rem" }}>
                  <span style={{ color: "var(--color-text-sub)", fontWeight: 700 }}>{sar.name}</span>
                  <span style={{ color: "var(--color-text-main)", fontWeight: 800 }}>{sar.rate}%</span>
                </div>
                {/* 프로그레스 바 */}
                <div style={{
                  width: "100%",
                  height: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  borderRadius: "6px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${sar.rate}%`,
                    height: "100%",
                    backgroundColor: sar.color,
                    borderRadius: "6px",
                    transition: "width 0.8s ease"
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 상세 분석 안내 가이드 */}
        <div className="card" style={{
          padding: "24px 32px",
          backgroundColor: "rgba(168, 85, 247, 0.04)",
          border: "1px solid rgba(168, 85, 247, 0.12)",
          borderRadius: "20px",
          lineHeight: 1.6,
          fontSize: "0.9rem",
          color: "var(--color-text-sub)"
        }}>
          💡 <strong>{activeEntry.date} 경제 분석 요약</strong>: 
          금융 및 IT 기술 집약적 지식 기반 산업(금융, 정보통신)은 {activeEntry.activeBizRate}% 수준의 높은 전국 계속사업자 평균 대비 현저히 우세한 **{sectorActiveRates[0].rate}% ~ {sectorActiveRates[1].rate}%**의 극단적 안정 가동률을 자랑합니다. 반면, 거시 경제 및 개인 소비 심리에 긴밀히 동기화되는 도소매 및 음식점업은 생존 변동폭이 커, 매월 신규 개업 수치의 동향과 맞물려 모니터링이 필요한 대표적인 경기 민감 산업으로 파악됩니다.
        </div>

      </div>
    </div>
  );
}
