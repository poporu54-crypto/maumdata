"use client";

import React, { useState } from "react";
import Link from "next/link";

interface DemoCompany {
  id: string;
  name: string;
  bNo: string;
  category: string;
  badge: string;
  badgeColor: string;
  taxStatus: string;
  stats: {
    employees: string;
    joinRate: string;
    quitRate: string;
    healthGrade: string;
    healthGradeColor: string;
    b2gGrade: string;
    b2gVolume: string;
    revenue: string;
    profit: string;
    patentsCount: string;
  };
  highlightComment: string;
}

const DEMO_COMPANIES: DemoCompany[] = [
  {
    id: "samsung",
    name: "삼성전자(주)",
    bNo: "1248100998",
    category: "반도체 · IT 대기업",
    badge: "KOSPI 1위",
    badgeColor: "#3182f6",
    taxStatus: "부가가치세 일반과세자 (정상 가동)",
    stats: {
      employees: "125,480명",
      joinRate: "+1.2%",
      quitRate: "-0.7%",
      healthGrade: "S (매우 안정)",
      healthGradeColor: "#10b981",
      b2gGrade: "S등급",
      b2gVolume: "1조 4,200억+",
      revenue: "302조 2,314억",
      profit: "6조 5,670억",
      patentsCount: "135,000건+",
    },
    highlightComment: "국내 최대 고용 안정세와 독보적 글로벌 특허 포트폴리오 보유",
  },
  {
    id: "toss",
    name: "(주)비바리퍼블리카 (토스)",
    bNo: "1208801280",
    category: "핀테크 · 유니콘",
    badge: "혁신 유니콘",
    badgeColor: "#8b5cf6",
    taxStatus: "부가가치세 일반과세자 (정상 가동)",
    stats: {
      employees: "1,150명",
      joinRate: "+4.8%",
      quitRate: "-1.9%",
      healthGrade: "A+ (고속 성장)",
      healthGradeColor: "#3b82f6",
      b2gGrade: "A등급",
      b2gVolume: "145억+",
      revenue: "1조 3,700억",
      profit: "흑자 전환 달성",
      patentsCount: "320건+",
    },
    highlightComment: "월간 입사율 +4.8%의 강력한 조직 팽창 및 금융 플랫폼 흑자 성장세",
  },
  {
    id: "starbucks",
    name: "주식회사 에스씨케이컴퍼니 (스타벅스)",
    bNo: "2018121515",
    category: "외식 · 커피 유통",
    badge: "소비 트렌드 1위",
    badgeColor: "#10b981",
    taxStatus: "부가가치세 일반과세자 (정상 가동)",
    stats: {
      employees: "21,800명",
      joinRate: "+2.4%",
      quitRate: "-2.1%",
      healthGrade: "A (우수 가동)",
      healthGradeColor: "#10b981",
      b2gGrade: "B등급",
      b2gVolume: "42억+",
      revenue: "3조 1,000억",
      profit: "1,980억",
      patentsCount: "48건+",
    },
    highlightComment: "전국 1,900여 개 매장 기반의 견고한 일일 현금 흐름 및 상권 영향력",
  },
];

export default function InteractiveDemoShowcase() {
  const [selectedId, setSelectedId] = useState("samsung");
  const current = DEMO_COMPANIES.find((c) => c.id === selectedId) || DEMO_COMPANIES[0];

  return (
    <section className="interactive-showcase-card" style={{
      marginTop: "48px",
      marginBottom: "56px",
      backgroundColor: "var(--bg-color-card)",
      border: "1.5px solid var(--color-border)",
      borderRadius: "24px",
      padding: "28px 24px",
      boxShadow: "0 12px 36px rgba(0, 0, 0, 0.04)",
    }}>
      {/* 쇼케이스 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.78rem",
            fontWeight: 800,
            color: "var(--color-primary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "6px"
          }}>
            <span>⚡ 1초 실시간 미리보기</span>
          </div>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 850, color: "var(--color-text-main)", letterSpacing: "-0.03em" }}>
            마음데이타가 분석하는 실시간 기업 건강도
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginTop: "4px" }}>
            검색하기 전, 실제 기업들의 독자적인 분석 지표를 원클릭으로 체험해 보세요.
          </p>
        </div>

        {/* 탭 셀렉터 */}
        <div style={{
          display: "flex",
          backgroundColor: "var(--bg-color-main)",
          padding: "4px",
          borderRadius: "14px",
          gap: "4px",
          border: "1px solid var(--color-border)",
          maxWidth: "100%",
          overflowX: "auto"
        }}>
          {DEMO_COMPANIES.map((company) => (
            <button
              key={company.id}
              onClick={() => setSelectedId(company.id)}
              style={{
                border: "none",
                background: selectedId === company.id ? "var(--bg-color-card)" : "transparent",
                color: selectedId === company.id ? "var(--color-text-main)" : "var(--color-text-desc)",
                fontWeight: selectedId === company.id ? 800 : 600,
                fontSize: "0.82rem",
                padding: "8px 14px",
                borderRadius: "10px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: selectedId === company.id ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
                transition: "all 0.2s ease"
              }}
            >
              {company.name.split("(")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* 현재 선택된 기업의 메트릭 카드 대시보드 */}
      <div style={{
        background: "var(--bg-color-main)",
        borderRadius: "18px",
        padding: "20px",
        border: "1px solid var(--color-border)",
      }}>
        {/* 기업 헤더 정보 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
                {current.name}
              </h4>
              <span style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: current.badgeColor,
                backgroundColor: "var(--bg-color-card)",
                padding: "2px 8px",
                borderRadius: "6px",
                border: "1px solid var(--color-border)"
              }}>
                {current.badge}
              </span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-desc)", marginTop: "4px" }}>
              사업자등록번호: {current.bNo.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3")} · {current.taxStatus}
            </div>
          </div>

          <div style={{
            fontSize: "0.78rem",
            color: "var(--color-success)",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "5px"
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-success)", display: "inline-block" }}></span>
            실시간 검증 완료
          </div>
        </div>

        {/* 4대 핵심 지표 그리드 (모바일 2x2, 데스크톱 4열) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "12px",
          marginBottom: "16px"
        }}>
          {/* 지표 1: 고용 건강도 */}
          <div style={{ backgroundColor: "var(--bg-color-card)", padding: "14px", borderRadius: "14px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-desc)", fontWeight: 700, marginBottom: "4px" }}>👥 고용 건강도</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 850, color: current.stats.healthGradeColor }}>
              {current.stats.healthGrade}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-desc)", marginTop: "4px" }}>
              입사 {current.stats.joinRate} / 퇴사 {current.stats.quitRate}
            </div>
          </div>

          {/* 지표 2: B2G 입찰 역량 */}
          <div style={{ backgroundColor: "var(--bg-color-card)", padding: "14px", borderRadius: "14px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-desc)", fontWeight: 700, marginBottom: "4px" }}>🏛️ 정부 조달 수주</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 850, color: "var(--color-primary)" }}>
              {current.stats.b2gGrade}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-desc)", marginTop: "4px" }}>
              누적 {current.stats.b2gVolume}
            </div>
          </div>

          {/* 지표 3: 재무 실적 */}
          <div style={{ backgroundColor: "var(--bg-color-card)", padding: "14px", borderRadius: "14px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-desc)", fontWeight: 700, marginBottom: "4px" }}>💰 연간 매출 규모</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 850, color: "var(--color-text-main)" }}>
              {current.stats.revenue}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-desc)", marginTop: "4px" }}>
              영업익: {current.stats.profit}
            </div>
          </div>

          {/* 지표 4: 특허 및 기술력 */}
          <div style={{ backgroundColor: "var(--bg-color-card)", padding: "14px", borderRadius: "14px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-desc)", fontWeight: 700, marginBottom: "4px" }}>💡 특허 포트폴리오</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 850, color: "var(--color-text-main)" }}>
              {current.stats.patentsCount}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-desc)", marginTop: "4px" }}>
              총 임직원: {current.stats.employees}
            </div>
          </div>
        </div>

        {/* AI 분석 코멘트 & 상세 리포트 버튼 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          paddingTop: "12px",
          borderTop: "1px dashed var(--color-border)"
        }}>
          <div style={{ fontSize: "0.82rem", color: "var(--color-text-sub)", fontWeight: 600 }}>
            💡 <span style={{ color: "var(--color-text-main)", fontWeight: 700 }}>AI 핵심 코멘트:</span> {current.highlightComment}
          </div>

          <Link
            href={`/biz/${current.bNo}`}
            className="btn-primary"
            style={{
              padding: "8px 16px",
              fontSize: "0.82rem",
              borderRadius: "10px",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <span>{current.name.split("(")[0]} 심층 리포트 보기</span>
            <span>➔</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
