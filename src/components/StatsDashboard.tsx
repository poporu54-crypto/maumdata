"use client";

import React from "react";
import Link from "next/link";
import { PortalStats } from "@/lib/statApi";

interface StatsDashboardProps {
  stats: PortalStats;
}

export default function StatsDashboard({ stats }: StatsDashboardProps) {
  // 실제 데이터 비중 계산
  const { retail, ict, manufacturing, others } = stats.industryRatios;

  // 동적 SVG 도넛 차트 세그먼트 계산
  const retailOffset = 25;
  const ictOffset = (25 - retail + 100) % 100;
  const manufacturingOffset = (ictOffset - ict + 100) % 100;
  const othersOffset = (manufacturingOffset - manufacturing + 100) % 100;

  return (
    <>
      {/* 컴포넌트 자체 호버 마이크로 인터랙션용 CSS 주입 */}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2 style={{
              fontSize: "1.45rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--color-text-main)",
              marginBottom: "4px"
            }}>
              오늘의 데이터 포털 지표
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)" }}>
              각 지표 카드를 클릭하면 상세한 실시간 전국 빅데이터 분석과 날짜별 과거 이력 조회가 가능합니다.
            </p>
          </div>
        </div>

        {/* 대시보드 그리드 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px"
        }}>
          
          {/* 카드 1: 실시간 개업 현황 */}
          <Link href="/stats/new-biz" className="stats-dashboard-link">
            <div className="card stats-dashboard-card" style={{ padding: "24px", border: "1px solid var(--color-border)", height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--color-text-sub)", fontWeight: 700 }}>실시간 개업 현황</span>
                <span style={{ fontSize: "1.2rem" }}>📈</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                  {stats.newBizToday.toLocaleString()}
                </span>
                <span style={{ color: "var(--color-success)", fontWeight: 700, fontSize: "0.95rem" }}>
                  +{stats.newBizTodayDelta} 오늘
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", lineHeight: 1.45, marginBottom: "8px" }}>
                국세청 100대 생활업종 데이터를 분석하여 가동 중인 오늘자 전국 신규 사업자 개설 예측 수치입니다.
              </p>
              <span style={{ fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "2px" }}>
                자세히 보기 ➔
              </span>
            </div>
          </Link>

          {/* 카드 2: 계속사업자 비율 */}
          <Link href="/stats/active-rate" className="stats-dashboard-link">
            <div className="card stats-dashboard-card" style={{ padding: "24px", border: "1px solid var(--color-border)", height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--color-text-sub)", fontWeight: 700 }}>계속사업자 비율</span>
                <span style={{ fontSize: "1.2rem" }}>🛡️</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                  {stats.activeBizRate}%
                </span>
                <span style={{ color: "var(--color-primary)", fontWeight: 700, fontSize: "0.95rem" }}>안정권</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", lineHeight: 1.45, marginBottom: "8px" }}>
                공식 통계에 등록된 전체 가동 사업자 중 폐업 상태가 아닌 계속 영업을 유지하고 있는 비율입니다.
              </p>
              <span style={{ fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "2px" }}>
                자세히 보기 ➔
              </span>
            </div>
          </Link>
        </div>

        {/* 카드 3: 업종별 가동 사업자 비율 */}
        <Link href="/stats/distribution" className="stats-dashboard-link">
          <div className="card stats-dashboard-card" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "20px", border: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "4px" }}>
                  국내 산업군별 사업자 분포도
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)" }}>
                  통계청 전국사업체조사 공식 API 집계를 실시간 연동하여 파싱한 국내 업종별 총사업체 비중입니다.
                </p>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: 700 }}>
                전체 19개 분류 보기 ➔
              </span>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              flexWrap: "wrap",
              gap: "32px",
              marginTop: "8px"
            }}>
              {/* SVG 원형 차트 */}
              <div style={{ position: "relative", width: "150px", height: "150px" }}>
                <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
                  <circle className="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="transparent"></circle>
                  <circle className="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="var(--color-border)" strokeWidth="4"></circle>

                  {/* 세그먼트 1: 도소매 */}
                  <circle className="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                          stroke="var(--color-primary)" strokeWidth="4.2" 
                          strokeDasharray={`${retail} ${100 - retail}`} strokeDashoffset={retailOffset}
                          style={{ transition: "stroke-dashoffset 0.8s ease" }}></circle>
                  
                  {/* 세그먼트 2: 정보통신 */}
                  <circle className="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                          stroke="#a855f7" strokeWidth="4.2" 
                          strokeDasharray={`${ict} ${100 - ict}`} strokeDashoffset={ictOffset}
                          style={{ transition: "stroke-dashoffset 0.8s ease" }}></circle>
                  
                  {/* 세그먼트 3: 제조업 */}
                  <circle className="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                          stroke="#fbbf24" strokeWidth="4.2" 
                          strokeDasharray={`${manufacturing} ${100 - manufacturing}`} strokeDashoffset={manufacturingOffset}
                          style={{ transition: "stroke-dashoffset 0.8s ease" }}></circle>
                  
                  {/* 세그먼트 4: 기타 */}
                  <circle className="donut-segment" cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                          stroke="#94a3b8" strokeWidth="4.2" 
                          strokeDasharray={`${others} ${100 - others}`} strokeDashoffset={othersOffset}
                          style={{ transition: "stroke-dashoffset 0.8s ease" }}></circle>
                </svg>
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 850, color: "var(--color-text-main)", lineHeight: 1 }}>100%</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--color-text-desc)", fontWeight: 700, marginTop: "4px" }}>전체 비율</div>
                </div>
              </div>

              {/* 범례 */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px 20px",
                minWidth: "220px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "var(--color-primary)" }}></div>
                  <span style={{ color: "var(--color-text-sub)" }}>도소매업 ({retail}%)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#a855f7" }}></div>
                  <span style={{ color: "var(--color-text-sub)" }}>정보통신업 ({ict}%)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#fbbf24" }}></div>
                  <span style={{ color: "var(--color-text-sub)" }}>제조업 ({manufacturing}%)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#94a3b8" }}></div>
                  <span style={{ color: "var(--color-text-sub)" }}>음식/기타 ({others}%)</span>
                </div>
              </div>

            </div>
          </div>
        </Link>

      </div>
    </>
  );
}
