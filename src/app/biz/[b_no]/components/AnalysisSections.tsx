import React from "react";
import { getIndustryAnalysis } from "@/lib/db";
import { formatMoney } from "../utils/helpers";
import { BusinessData } from "../utils/dataLoader";

// 1. 예상 연봉/HR 지표 분석 컴포넌트
export function SalarySection({ business }: { business: BusinessData }) {
  if (!business.npsLinked || !business.npsSbscrbNmps || !business.npsChrgAmt) {
    return (
      <div className="card" style={{ padding: "28px", textAlign: "center" }}>
        <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "8px" }}>💳</span>
        <div style={{ fontWeight: 700, color: "var(--color-text-sub)", fontSize: "0.95rem", marginBottom: "6px" }}>
          국민연금 연봉 정보 제공 불가
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", lineHeight: 1.5, margin: 0 }}>
          본 기업은 실시간 국민연금 고지 정보 연동이 지연되었거나 1인 이하 소기업으로, 추정 연봉 통계가 제공되지 않습니다.
        </p>
      </div>
    );
  }

  const emps = business.npsSbscrbNmps;
  const chrgAmt = business.npsChrgAmt; // 당월 고지 보험료 총액
  const avgPremium = chrgAmt / emps;
  
  // 국민연금 보험료율 9% (근로자 4.5% + 회사 4.5% = 총 9% 고지)
  let avgMonthlySalary = avgPremium / 0.09;
  let isMaxed = false;
  let isMinified = false;

  // 국민연금 기준 상/하한액 보정
  if (avgPremium >= 555300) {
    isMaxed = true;
    avgMonthlySalary = 6170000;
  } else if (avgPremium <= 33300) {
    isMinified = true;
    avgMonthlySalary = 370000;
  }

  const avgYearlySalary = Math.round((avgMonthlySalary * 12) / 10000); // 만원 단위
  const formattedSalary = isMaxed 
    ? "7,400만원 이상 (국민연금 상한액 도달)" 
    : isMinified 
      ? "2,400만원 미만 (최저임금 수준)" 
      : `${avgYearlySalary.toLocaleString()}만원`;

  const hires = business.newAcqsNmps || 0;
  const exits = business.lossSbscrbNmps || 0;
  const exitRate = ((exits / emps) * 100).toFixed(1);

  return (
    <div className="card" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "1.2rem" }}>💳</span>
        <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
          예상 평균 연봉 및 고용 HR 지표
        </h4>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "20px"
      }}>
        <div style={{
          backgroundColor: "var(--bg-color-main)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}>
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
            예상 평균 연봉 (국민연금 납부액 기준)
          </span>
          <div style={{ marginTop: "4px" }}>
            <span style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--color-primary)" }}>
              {formattedSalary}
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", lineHeight: 1.4 }}>
            * 당월 국민연금 고지총액({(chrgAmt/10000).toLocaleString()}만원)과 상시 가입자수({emps}명)의 9% 요율 역산 추정치입니다.
          </span>
        </div>

        <div style={{
          backgroundColor: "var(--bg-color-main)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          justifyContent: "center"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-sub)" }}>
            <span>상시 근로자수</span>
            <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>{emps}명</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-sub)" }}>
            <span>월평균 고지 보험료</span>
            <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>{(avgPremium/1000).toLocaleString()}천원</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-sub)" }}>
            <span>HR 안정성 등급</span>
            <span style={{
              fontWeight: 700,
              color: parseFloat(exitRate) > 10 ? "var(--color-danger)" : "var(--color-success)"
            }}>
              {parseFloat(exitRate) > 10 ? "인력 유출 주의" : "고용 안정 기업"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. 동종 업종 분석 및 업계 순위 컴포넌트
export async function IndustrySection({ bSector, bNo }: { bSector: string; bNo: string }) {
  const analysis = await getIndustryAnalysis(bSector, bNo);
  
  if (analysis.totalCompanies === 0) {
    return (
      <div className="card" style={{ padding: "28px", textAlign: "center" }}>
        <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "8px" }}>🏢</span>
        <div style={{ fontWeight: 700, color: "var(--color-text-sub)", fontSize: "0.95rem", marginBottom: "6px" }}>
          동종 업종 비교 통계 미제공
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", lineHeight: 1.5, margin: 0 }}>
          등록된 동일 업종 분류 기업 정보가 부족하여 산업 내 순위 및 위치 비교가 어렵습니다.
        </p>
      </div>
    );
  }

  const getPositionText = (pct: number) => {
    if (pct >= 85) return "최상위";
    if (pct >= 55) return "상위";
    if (pct >= 30) return "중위";
    return "하위";
  };

  const getBarColor = (pct: number) => {
    if (pct >= 85) return "var(--color-primary)";
    if (pct >= 55) return "#3182f6";
    if (pct >= 30) return "#10b981";
    return "#718096";
  };

  const metrics = [
    { name: "활동성 (매출 규모)", val: analysis.rankings.revenuePercentile },
    { name: "수익성 (영업이익률)", val: analysis.rankings.operatingMarginPercentile },
    { name: "안정성 (자본 대비 부채)", val: analysis.rankings.debtRatioPercentile },
    { name: "규모 (고용인원)", val: analysis.rankings.employeePercentile }
  ];

  return (
    <div className="card" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.2rem" }}>🏢</span>
          <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
            동종 업종 분석 및 업계 순위
          </h4>
        </div>
        <span style={{
          backgroundColor: "rgba(49, 130, 246, 0.08)",
          color: "var(--color-primary)",
          fontSize: "0.8rem",
          fontWeight: 700,
          padding: "4px 12px",
          borderRadius: "30px",
          border: "1px solid rgba(49, 130, 246, 0.2)"
        }}>
          기준 연도: 2024년 결산
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "32px"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h5 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-text-sub)", margin: 0 }}>
            📊 동종 업종 내 상대적 위치 (백분위)
          </h5>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {metrics.map((m) => (
              <div key={m.name} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700 }}>
                  <span style={{ color: "var(--color-text-sub)" }}>{m.name}</span>
                  <span style={{ color: getBarColor(m.val) }}>
                    {getPositionText(m.val)} (상위 {100 - m.val}%)
                  </span>
                </div>
                <div style={{
                  width: "100%",
                  height: "10px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  borderRadius: "5px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${m.val}%`,
                    height: "100%",
                    backgroundColor: getBarColor(m.val),
                    borderRadius: "5px",
                    boxShadow: `0 0 8px ${getBarColor(m.val)}55`
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {analysis.leaders.length > 0 && (
            <div>
              <h5 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-text-sub)", margin: "0 0 14px 0" }}>
                🏆 {bSector.substring(0, 15)}... 매출액 순위
              </h5>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {analysis.leaders.map((l, index) => (
                  <div key={l.b_no} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    backgroundColor: l.b_no === bNo ? "rgba(49, 130, 246, 0.08)" : "var(--bg-color-main)",
                    border: l.b_no === bNo ? "1px solid rgba(49, 130, 246, 0.3)" : "1px solid var(--color-border)",
                    borderRadius: "12px",
                    fontSize: "0.85rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{
                        fontWeight: 900,
                        color: index === 0 ? "#ffd700" : index === 1 ? "#c0c0c0" : "#cd7f32"
                      }}>
                        {index + 1}위
                      </span>
                      <strong style={{ color: "var(--color-text-main)", fontWeight: 700 }}>{l.b_nm}</strong>
                    </div>
                    <span style={{ color: "var(--color-text-desc)" }}>
                      {l.revenue >= 10000 
                        ? `${(l.revenue / 10000).toFixed(1)}조` 
                        : `${l.revenue}억 원`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h5 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-text-sub)", margin: "0 0 12px 0" }}>
              ⚠️ 산업별 거시 위험 통계
            </h5>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "12px"
            }}>
              <div style={{
                backgroundColor: "var(--bg-color-main)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                padding: "14px",
                textAlign: "center"
              }}>
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                  업종 평균 폐업률
                </span>
                <span style={{ fontSize: "1.3rem", fontWeight: 900, color: analysis.closeRate > 5 ? "var(--color-danger)" : "var(--color-success)" }}>
                  {analysis.closeRate}%
                </span>
              </div>
              <div style={{
                backgroundColor: "var(--bg-color-main)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                padding: "14px",
                textAlign: "center"
              }}>
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                  업종 등록 기업수
                </span>
                <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--color-text-main)" }}>
                  {analysis.totalCompanies}개사
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. 차트 1 (매출액/영업이익 추이) 렌더링 헬퍼 컴포넌트
function DualChart({ history }: { history: BusinessData["history"] }) {
  if (!history || history.length === 0) return null;
  const width = 320;
  const height = 130;
  const padding = 25;
  
  const maxVal = Math.max(...history.map(d => d.revenue)) * 1.15;
  const minVal = Math.min(...history.map(d => Math.min(d.revenue, d.operatingIncome))) * 0.85;
  const valRange = maxVal === minVal ? 10 : (maxVal - minVal);

  const revenuePoints = history.map((d, index) => {
    const x = padding + (index * (width - 2 * padding)) / (history.length - 1);
    const y = height - padding - ((d.revenue - minVal) / valRange) * (height - 2 * padding);
    return { x, y, val: d.revenue, year: d.year };
  });

  const incomePoints = history.map((d, index) => {
    const x = padding + (index * (width - 2 * padding)) / (history.length - 1);
    const y = height - padding - ((d.operatingIncome - minVal) / valRange) * (height - 2 * padding);
    return { x, y, val: d.operatingIncome };
  });

  const revenueLine = revenuePoints.map(p => `${p.x},${p.y}`).join(" ");
  const incomeLine = incomePoints.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="2 2" />
      <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="2 2" />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--color-border)" strokeWidth="1" />

      {/* 매출액 선 (Blue) */}
      <polyline fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={revenueLine} />
      {/* 영업이익 선 (Purple) */}
      <polyline fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" strokeLinejoin="round" points={incomeLine} />

      {/* 매출액 포인트 */}
      {revenuePoints.map((p, i) => (
        <g key={`rev-${i}`}>
          <circle cx={p.x} cy={p.y} r="4.5" fill="var(--color-primary)" stroke="var(--bg-color-card)" strokeWidth="1.5" />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--color-text-main)">
            {formatMoney(p.val)}
          </text>
          <text x={p.x} y={height - 6} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-text-desc)">
            {p.year}년
          </text>
        </g>
      ))}

      {/* 영업이익 포인트 */}
      {incomePoints.map((p, i) => (
        <g key={`inc-${i}`}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#a855f7" stroke="var(--bg-color-card)" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}

// 4. 재무/고용 요약 분석 인사이트 대시보드 컴포넌트
export function InsightSection({ business }: { business: BusinessData }) {
  const latestFinance = business.history && business.history.length > 0
    ? business.history[business.history.length - 1]
    : null;
    
  const debtRatio = latestFinance && latestFinance.totalEquity > 0
    ? Math.round((latestFinance.totalLiabilities / latestFinance.totalEquity) * 100)
    : 0;
    
  const operatingMargin = latestFinance && latestFinance.revenue > 0
    ? ((latestFinance.operatingIncome / latestFinance.revenue) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="card" style={{ padding: "32px" }}>
      <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
        {business.history && business.history.length > 0 ? "📊 마음데이터 분석 인사이트" : "📊 마음데이터 고용 분석 인사이트"}
      </h3>
      <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginBottom: "28px" }}>
        {business.history && business.history.length > 0 
          ? "수집된 재무 및 고용 데이터를 바탕으로 분석된 핵심 트렌드입니다." 
          : "실시간 고용 데이터를 바탕으로 분석된 기업의 고용 트렌드입니다."}
      </p>

      {business.history && business.history.length > 0 ? (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "32px",
            marginBottom: "32px",
            alignItems: "stretch"
          }}>
            {/* 차트 1: 매출액 & 영업이익 꺾은선 차트 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700, color: "var(--color-text-sub)", fontSize: "0.95rem" }}>
                  연간 매출액 & 영업이익 추이
                </span>
                <span style={{ color: "var(--color-primary)", fontWeight: 800, fontSize: "0.95rem" }}>
                  재무 종합 분석
                </span>
              </div>
              <div style={{
                flex: 1,
                minHeight: "160px",
                backgroundColor: "var(--bg-color-main)",
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--color-border)",
                boxSizing: "border-box"
              }}>
                <DualChart history={business.history} />
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", fontSize: "0.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ display: "inline-block", width: "10px", height: "3px", backgroundColor: "var(--color-primary)" }}></span>
                  <span style={{ color: "var(--color-text-sub)", fontWeight: 600 }}>매출액</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ display: "inline-block", width: "10px", height: "3px", borderTop: "2px dashed #a855f7" }}></span>
                  <span style={{ color: "var(--color-text-sub)", fontWeight: 600 }}>영업이익</span>
                </div>
              </div>
            </div>

            {/* 차트 2: HR 고용 건전성 및 퇴사율 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontWeight: 700, color: "var(--color-text-sub)", fontSize: "0.95rem", whiteSpace: "nowrap" }}>
                  초정밀 HR 고용 건전성 분석
                </span>
              </div>
              <div style={{
                flex: 1,
                minHeight: "160px",
                backgroundColor: "var(--bg-color-main)",
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                border: "1px solid var(--color-border)",
                boxSizing: "border-box",
                justifyContent: "center"
              }}>
                {(() => {
                  if (!business.npsLinked || !business.npsSbscrbNmps) {
                    return (
                      <div style={{ textAlign: "center", color: "var(--color-text-desc)", fontSize: "0.9rem", padding: "24px 0" }}>
                        실시간 국민연금 고용 정보 미연동
                      </div>
                    );
                  }

                  const emps = business.npsSbscrbNmps;
                  const hires = business.newAcqsNmps || 0;
                  const exits = business.lossSbscrbNmps || 0;

                  const hireRate = parseFloat(((hires / emps) * 100).toFixed(1));
                  const exitRate = parseFloat(((exits / emps) * 100).toFixed(1));

                  let alertBadge = "✅ 고용 안정 상태";
                  let alertColor = "#10b981";
                  let alertBg = "rgba(16, 185, 129, 0.1)";

                  if (exitRate > 15 && exits > hires) {
                    alertBadge = "⚠️ 인력 급격 유출 경보";
                    alertColor = "#ef4444";
                    alertBg = "rgba(239, 68, 68, 0.1)";
                  } else if (exitRate > 8 && exits > hires) {
                    alertBadge = "🚨 인력 유출 주의";
                    alertColor = "#f59e0b";
                    alertBg = "rgba(245, 158, 11, 0.1)";
                  } else if (hireRate > 15 && hires > exits) {
                    alertBadge = "🚀 인력 급성장 중";
                    alertColor = "#3182f6";
                    alertBg = "rgba(49, 130, 246, 0.1)";
                  }

                  let stabilityScore = 85;
                  stabilityScore -= Math.round(exitRate * 2);
                  stabilityScore += Math.round(hireRate * 0.5);
                  if (hires < emps * 0.05 && exits < emps * 0.05) {
                    stabilityScore += 5;
                  }
                  stabilityScore = Math.max(10, Math.min(100, stabilityScore));

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{
                          backgroundColor: alertBg,
                          color: alertColor,
                          border: `1px solid ${alertColor}33`,
                          padding: "4px 12px",
                          borderRadius: "30px",
                          fontSize: "0.78rem",
                          fontWeight: 800
                        }}>
                          {alertBadge}
                        </span>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "0.78rem", color: "#a0aec0", fontWeight: 700, marginRight: "6px" }}>성장 안정도</span>
                          <span style={{ fontSize: "1.2rem", fontWeight: 800, color: alertColor }}>
                            {stabilityScore}점
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#a0aec0", fontWeight: 700 }}>
                          <span>당월 입사율: {hireRate}% (+{hires}명)</span>
                          <span>당월 퇴사율: {exitRate}% (-{exits}명)</span>
                        </div>
                        
                        <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", backgroundColor: "rgba(255, 255, 255, 0.08)" }}>
                          <div style={{ width: `${Math.min(100, hireRate * 2)}%`, backgroundColor: "#3182f6", boxShadow: "0 0 8px #3182f6aa" }} />
                          <div style={{ flex: 1, backgroundColor: "transparent" }} />
                          <div style={{ width: `${Math.min(100, exitRate * 2)}%`, backgroundColor: "#ef4444", boxShadow: "0 0 8px #ef4444aa" }} />
                        </div>
                      </div>

                      <div style={{ fontSize: "0.78rem", color: "#718096", lineHeight: 1.4, textAlign: "center" }}>
                        전체 가입 상시 근로자 <strong>{emps.toLocaleString()}명</strong> 기준 당월 유출입 추이 분석
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 평가지표 카드 */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "16px",
            marginBottom: "32px"
          }}>
            <div style={{
              backgroundColor: "var(--bg-color-main)",
              padding: "16px 20px",
              borderRadius: "14px",
              border: "1px solid var(--color-border)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 700, marginBottom: "4px" }}>
                안정성 신용 등급
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-primary)" }}>
                {business.credit_rating}
              </div>
            </div>

            <div style={{
              backgroundColor: "var(--bg-color-main)",
              padding: "16px 20px",
              borderRadius: "14px",
              border: "1px solid var(--color-border)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 700, marginBottom: "4px" }}>
                동종 업종 내 위치
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                {business.industry_rank}
              </div>
            </div>

            <div style={{
              backgroundColor: "var(--bg-color-main)",
              padding: "16px 20px",
              borderRadius: "14px",
              border: "1px solid var(--color-border)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 700, marginBottom: "4px" }}>
                부채비율 (건전성)
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: debtRatio > 150 ? "var(--color-danger)" : "var(--color-success)" }}>
                {debtRatio}%
              </div>
            </div>

            <div style={{
              backgroundColor: "var(--bg-color-main)",
              padding: "16px 20px",
              borderRadius: "14px",
              border: "1px solid var(--color-border)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 700, marginBottom: "4px" }}>
                최근 영업이익률
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-primary)" }}>
                {operatingMargin}%
              </div>
            </div>
          </div>
        </>
      ) : (
        // 2. 비외감 기업 (공시 비대상)용 간략 HR UI
        <div style={{ marginBottom: "24px" }}>
          {business.npsLinked && business.npsSbscrbNmps ? (
            (() => {
              const emps = business.npsSbscrbNmps;
              const hires = business.newAcqsNmps || 0;
              const exits = business.lossSbscrbNmps || 0;

              const hireRate = parseFloat(((hires / emps) * 100).toFixed(1));
              const exitRate = parseFloat(((exits / emps) * 100).toFixed(1));

              let alertBadge = "✅ 고용 안정 상태";
              let alertColor = "#10b981";
              let alertBg = "rgba(16, 185, 129, 0.1)";

              if (exitRate > 15 && exits > hires) {
                alertBadge = "⚠️ 인력 급격 유출";
                alertColor = "#ef4444";
                alertBg = "rgba(239, 68, 68, 0.1)";
              } else if (exitRate > 8 && exits > hires) {
                alertBadge = "🚨 인력 유출 주의";
                alertColor = "#f59e0b";
                alertBg = "rgba(245, 158, 11, 0.1)";
              } else if (hireRate > 15 && hires > exits) {
                alertBadge = "🚀 인력 급성장 중";
                alertColor = "#3182f6";
                alertBg = "rgba(49, 130, 246, 0.1)";
              }

              let stabilityScore = 85;
              stabilityScore -= Math.round(exitRate * 2);
              stabilityScore += Math.round(hireRate * 0.5);
              stabilityScore = Math.max(10, Math.min(100, stabilityScore));

              return (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "24px",
                  background: "linear-gradient(135deg, rgba(26, 32, 44, 0.6) 0%, rgba(17, 20, 28, 0.8) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.25)"
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", color: "#a0aec0", fontWeight: 700 }}>실시간 국민연금 고용 지표</span>
                      <span style={{
                        backgroundColor: alertBg,
                        color: alertColor,
                        border: `1px solid ${alertColor}33`,
                        padding: "2px 8px",
                        borderRadius: "30px",
                        fontSize: "0.72rem",
                        fontWeight: 800
                      }}>
                        {alertBadge}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "20px", marginTop: "8px", alignItems: "baseline" }}>
                      <div>
                        <span style={{ fontSize: "2.1rem", fontWeight: 900, color: "#f7fafc" }}>
                          {emps.toLocaleString()}
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "#718096", fontWeight: 700, marginLeft: "4px" }}>명</span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#a0aec0", fontWeight: 600 }}>
                        당월 입사 <span style={{ color: "#3182f6", fontWeight: 700 }}>+{hires}명</span> | 퇴사 <span style={{ color: "#ef4444", fontWeight: 700 }}>-{exits}명</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: "0.85rem", color: "#a0aec0", fontWeight: 700 }}>고용 성장 안정도</span>
                      <span style={{ fontSize: "1.4rem", fontWeight: 900, color: alertColor }}>{stabilityScore} 점</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#718096" }}>
                        <span>입사율: {hireRate}%</span>
                        <span>퇴사율: {exitRate}%</span>
                      </div>
                      <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)" }}>
                        <div style={{ width: `${Math.min(100, hireRate * 2)}%`, backgroundColor: "#3182f6" }} />
                        <div style={{ flex: 1, backgroundColor: "transparent" }} />
                        <div style={{ width: `${Math.min(100, exitRate * 2)}%`, backgroundColor: "#ef4444" }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div style={{
              width: "100%",
              padding: "24px",
              borderRadius: "14px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              textAlign: "center",
              color: "var(--color-text-desc)",
              fontSize: "0.9rem"
            }}>
              실시간 국민연금 고용 이력 정보가 연동되지 않은 소기업입니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 5. 3개년 주요 재무제표 요약 테이블 컴포넌트
export function FinancialTableSection({ business }: { business: BusinessData }) {
  return (
    <div style={{ marginTop: "24px" }}>
      {business.history && business.history.length > 0 ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
              📋 3개년 주요 재무 상태표 & 손익계산서 요약
            </h4>
            {business.is_audited && business.dart_code && (
              <a
                href="#dart-disclosures-section"
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-primary)",
                  fontWeight: 700,
                  backgroundColor: "var(--color-primary-light)",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                🏛️ 금융감독원 DART 공시 원본 보기 ➔
              </a>
            )}
          </div>
          <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "14px" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "right",
              fontSize: "0.9rem",
              backgroundColor: "var(--bg-color-card)"
            }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-color-main)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--color-text-sub)", fontWeight: 700 }}>계정과목 (단위: 억 원)</th>
                  {business.history.map((h, i) => (
                    <th key={i} style={{ padding: "14px 16px", color: "var(--color-text-sub)", fontWeight: 700 }}>{h.year}년</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>자산 총계</td>
                  {business.history.map((h, i) => (
                    <td key={i} style={{ padding: "12px 16px", color: "var(--color-text-main)", fontWeight: 600 }}>{formatMoney(h.totalAssets)}</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-sub)" }}>부채 총계</td>
                  {business.history.map((h, i) => (
                    <td key={i} style={{ padding: "12px 16px", color: "var(--color-text-sub)" }}>{formatMoney(h.totalLiabilities)}</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-sub)" }}>자본 총계</td>
                  {business.history.map((h, i) => (
                    <td key={i} style={{ padding: "12px 16px", color: "var(--color-text-sub)" }}>{formatMoney(h.totalEquity)}</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "rgba(49, 130, 246, 0.02)" }}>
                  <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--color-primary)" }}>매출액 (영업수익)</td>
                  {business.history.map((h, i) => (
                    <td key={i} style={{ padding: "12px 16px", fontWeight: 700, color: "var(--color-primary)" }}>
                      {formatMoney(h.revenue)}
                    </td>
                  ))}
                </tr>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>영업이익</td>
                  {business.history.map((h, i) => (
                    <td key={i} style={{ padding: "12px 16px", color: h.operatingIncome >= 0 ? "var(--color-success)" : "var(--color-danger)", fontWeight: 600 }}>
                      {formatMoney(h.operatingIncome)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-sub)" }}>당기순이익</td>
                  {business.history.map((h, i) => (
                    <td key={i} style={{ padding: "12px 16px", color: h.netIncome >= 0 ? "var(--color-text-main)" : "var(--color-danger)" }}>
                      {formatMoney(h.netIncome)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{
          padding: "24px",
          borderRadius: "14px",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--bg-color-main)",
          textAlign: "center"
        }}>
          <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "8px" }}>🏛️</span>
          <div style={{ fontWeight: 700, color: "var(--color-text-sub)", fontSize: "0.95rem", marginBottom: "6px" }}>
            공식 재무 공시 비대상 기업
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", lineHeight: 1.5, margin: 0 }}>
            본 기업은 외부감사(외감) 법령 기준 미달 소기업 또는 소상공인으로, 금융감독원 DART 공시 및 금융위원회 재무제표 공시 법적 의무가 없는 비대상 기업입니다. 이에 따라 인위적인 매출/신용도 추정을 배제하고 검증된 계속사업 상태 정보 및 실시간 고용 현황만 제공합니다.
          </p>
        </div>
      )}
    </div>
  );
}
