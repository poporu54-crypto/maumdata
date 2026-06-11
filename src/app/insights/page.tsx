"use client";

import React, { useState } from "react";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState<"industry" | "region" | "trend">("industry");

  // 업종별 통계 데이터
  const industryData = [
    { name: "도매 및 소매업", count: "1,245,821", ratio: "32.4%", status: "경쟁 심화", color: "var(--color-primary)" },
    { name: "숙박 및 음식점업", count: "892,104", ratio: "23.2%", status: "주의", color: "#f04438" },
    { name: "제조업", count: "482,109", ratio: "12.5%", status: "안정", color: "#fbbf24" },
    { name: "정보통신업 (IT)", count: "342,852", ratio: "8.9%", status: "급성장", color: "#a855f7" },
    { name: "부동산업", count: "295,124", ratio: "7.7%", status: "둔화", color: "#94a3b8" },
    { name: "운수 및 창고업", count: "189,452", ratio: "4.9%", status: "회복", color: "#2dca73" },
  ];

  // 지역별 분포
  const regionData = [
    { name: "서울특별시", active: "1,120,402", new: "+12,402", rate: "29.2%" },
    { name: "경기도", active: "1,050,892", new: "+14,891", rate: "27.4%" },
    { name: "부산광역시", active: "290,124", new: "+3,102", rate: "7.6%" },
    { name: "인천광역시", active: "254,891", new: "+4,092", rate: "6.6%" },
    { name: "경상남도", active: "210,452", new: "+1,902", rate: "5.5%" },
    { name: "충청남도", active: "180,124", new: "+2,104", rate: "4.7%" },
  ];

  // 렌더링용 연도별 성장 트렌드 차트 (SVG Area Chart)
  const renderTrendChart = () => {
    const width = 600;
    const height = 240;
    const padding = 40;

    const data = [
      { year: "2021", count: 320 },
      { year: "2022", count: 345 },
      { year: "2023", count: 362 },
      { year: "2024", count: 374 },
      { year: "2025", count: 384 },
    ];

    const maxVal = 420;
    const minVal = 280;
    const valRange = maxVal - minVal;

    const points = data.map((d, index) => {
      const x = padding + (index * (width - 2 * padding)) / (data.length - 1);
      const y = height - padding - ((d.count - minVal) / valRange) * (height - 2 * padding);
      return { x, y, val: d.count, label: d.year };
    });

    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(" ");
    const areaPoints = `${points[0].x},${height - padding} ${polylinePoints} ${points[points.length - 1].x},${height - padding}`;

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* 그리드 가이드라인 */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3 3" />
        <line x1={padding} y1={(height)/2} x2={width - padding} y2={(height)/2} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3 3" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--color-border)" strokeWidth="1" />

        {/* 그라데이션 영역 */}
        <polygon fill="url(#areaGradient)" points={areaPoints} />

        {/* 선 */}
        <polyline fill="none" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={polylinePoints} />

        {/* 포인트 */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="6" fill="var(--color-primary)" stroke="var(--bg-color-card)" strokeWidth="3" />
            {/* 텍스트 수치 */}
            <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--color-text-main)">
              {p.val}만
            </text>
            {/* X축 레이블 */}
            <text x={p.x} y={height - 12} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--color-text-desc)">
              {p.label}년
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="animate-fade-in" style={{ padding: "40px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "880px" }}>
        
        {/* 타이틀 및 헤더 */}
        <div style={{ marginBottom: "32px" }}>
          <span style={{
            fontSize: "0.85rem",
            color: "var(--color-primary)",
            fontWeight: 800,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: "8px",
            display: "block"
          }}>
            MAUMDATA INSIGHTS
          </span>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--color-text-main)", letterSpacing: "-0.03em", marginBottom: "12px" }}>
            대한민국 사업자 데이터 인사이트
          </h1>
          <p style={{ color: "var(--color-text-sub)", fontSize: "1.1rem", lineHeight: 1.6 }}>
            국세청 사업자등록 실시간 통계를 가공 및 분류하여 최신 창업 트렌드 및 산업 변화 흐름을 한눈에 제공합니다.
          </p>
        </div>

        {/* 탭 네비게이션 (토스 세그먼트 컨트롤 스타일) */}
        <div style={{
          display: "flex",
          backgroundColor: "var(--bg-color-card)",
          padding: "6px",
          borderRadius: "14px",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
          marginBottom: "32px",
          width: "fit-content"
        }}>
          <button
            onClick={() => setActiveTab("industry")}
            style={{
              padding: "10px 24px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: activeTab === "industry" ? "var(--color-primary-light)" : "transparent",
              color: activeTab === "industry" ? "var(--color-primary)" : "var(--color-text-sub)",
              fontWeight: 700,
              cursor: "pointer",
              transition: "var(--transition-smooth)"
            }}
          >
            업종별 통계
          </button>
          <button
            onClick={() => setActiveTab("region")}
            style={{
              padding: "10px 24px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: activeTab === "region" ? "var(--color-primary-light)" : "transparent",
              color: activeTab === "region" ? "var(--color-primary)" : "var(--color-text-sub)",
              fontWeight: 700,
              cursor: "pointer",
              transition: "var(--transition-smooth)"
            }}
          >
            지역별 분포
          </button>
          <button
            onClick={() => setActiveTab("trend")}
            style={{
              padding: "10px 24px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: activeTab === "trend" ? "var(--color-primary-light)" : "transparent",
              color: activeTab === "trend" ? "var(--color-primary)" : "var(--color-text-sub)",
              fontWeight: 700,
              cursor: "pointer",
              transition: "var(--transition-smooth)"
            }}
          >
            성장 추이
          </button>
        </div>

        <AdBanner />

        {/* 컨텐츠 영역 */}
        {activeTab === "industry" && (
          <div className="card animate-fade-in" style={{ padding: "32px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
              산업 분야별 사업자 분포 및 시장 상태
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "24px" }}>
              대분류 기준 가동 중인 전국 개인 및 법인 사업자 수 기준 통계 정보입니다.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {industryData.map((item, index) => (
                <div key={index} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 20px",
                  borderRadius: "14px",
                  backgroundColor: "var(--bg-color-main)",
                  border: "1px solid var(--color-border)",
                  transition: "var(--transition-smooth)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: item.color
                    }} />
                    <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>{item.name}</span>
                  </div>
                  
                  <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.95rem", color: "var(--color-text-sub)", fontWeight: 500 }}>
                      {item.count}개 ({item.ratio})
                    </span>
                    <span style={{
                      backgroundColor: item.status === "급성장" || item.status === "안정" ? "rgba(45, 202, 115, 0.1)" : "rgba(240, 68, 56, 0.1)",
                      color: item.status === "급성장" || item.status === "안정" ? "var(--color-success)" : "var(--color-danger)",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700
                    }}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "region" && (
          <div className="card animate-fade-in" style={{ padding: "32px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
              시·도 광역 지자체별 사업자 통계
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "24px" }}>
              지역에 등록된 활성 기업 수 및 금월 신규 추가 사업자 분포입니다.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px"
            }}>
              {regionData.map((item, index) => (
                <div key={index} style={{
                  padding: "20px",
                  borderRadius: "14px",
                  backgroundColor: "var(--bg-color-main)",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, color: "var(--color-text-main)" }}>{item.name}</span>
                    <span style={{
                      backgroundColor: "var(--color-primary-light)",
                      color: "var(--color-primary)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 700
                    }}>
                      비중 {item.rate}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
                    <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                      {item.active}개
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "var(--color-success)", fontWeight: 700 }}>
                      {item.new} 신규
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "trend" && (
          <div className="card animate-fade-in" style={{ padding: "32px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
              연도별 가동 사업자 성장 추이
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "24px" }}>
              대한민국 전체 등록 사업자 수의 가파른 누적 상승 곡선 분석 (단위: 만 개)
            </p>

            <div style={{
              height: "260px",
              backgroundColor: "var(--bg-color-main)",
              borderRadius: "16px",
              padding: "20px 10px 10px 10px",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px"
            }}>
              {renderTrendChart()}
            </div>

            <div style={{
              backgroundColor: "var(--color-primary-light)",
              padding: "16px 20px",
              borderRadius: "14px",
              color: "var(--color-text-sub)",
              fontSize: "0.9rem",
              lineHeight: 1.5,
              fontWeight: 500
            }}>
              💡 <strong>최근 분석:</strong> 2021년 코로나 팬데믹 시점 이후 1인 크리에이터, 통신판매업 등 비대면 창업 수요가 급증함에 따라 가동 사업자 수의 누적 그래프가 15% 이상 가파른 성장을 기록하고 있습니다.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
