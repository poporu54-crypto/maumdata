import React from "react";
import { BusinessData } from "../utils/dataLoader";
import { formatSyncTime } from "../utils/helpers";

interface EmploymentHealthSectionProps {
  business: BusinessData;
}

export default function EmploymentHealthSection({ business }: EmploymentHealthSectionProps) {
  if (!business.npsLinked || !business.npsSbscrbNmps) {
    return (
      <div className="card" style={{ padding: "28px", textAlign: "center", color: "var(--color-text-desc)" }}>
        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🏢</div>
        <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
          국민연금 고용 지표 미연동
        </h4>
        <p style={{ fontSize: "0.88rem", margin: 0 }}>
          이 기업은 국민연금 사업장 정보가 연동되어 있지 않거나, 임시 가상 프로필 상태입니다.
        </p>
      </div>
    );
  }

  const total = business.npsSbscrbNmps;
  const newAcqs = business.newAcqsNmps || 0;
  const losses = business.lossSbscrbNmps || 0;
  const netChange = newAcqs - losses;

  const quitRate = total > 0 ? parseFloat(((losses / total) * 100).toFixed(1)) : 0;
  const joinRate = total > 0 ? parseFloat(((newAcqs / total) * 100).toFixed(1)) : 0;
  const netGrowthRate = total > 0 ? parseFloat(((netChange / total) * 100).toFixed(1)) : 0;

  // 조직 성장세 및 건강도 등급 판별
  let healthGrade = {
    title: "고용 안정세 (유지 중)",
    description: "최근 인력 흐름이 안정적으로 제자리를 지키고 있습니다.",
    color: "#64748b",
    bg: "rgba(100, 116, 139, 0.1)",
    icon: "✓"
  };

  if (quitRate >= 10.0 && losses >= 3) {
    healthGrade = {
      title: "인력 이탈 과다 (경고)",
      description: "당월 직원 이탈율이 10% 이상으로 급격한 퇴사 흐름이 감지되었습니다.",
      color: "#f04438",
      bg: "rgba(240, 68, 56, 0.1)",
      icon: "⚠️"
    };
  } else if (netGrowthRate > 2.0 && netChange >= 3) {
    healthGrade = {
      title: "초고속 성장 (대폭 확장)",
      description: "인재 유입이 이탈 대비 압도적이며 고용 규모가 급성장하고 있습니다.",
      color: "#3182f6",
      bg: "rgba(49, 130, 246, 0.1)",
      icon: "⚡"
    };
  } else if (netGrowthRate > 0.5 && netChange >= 1) {
    healthGrade = {
      title: "안정적 성장 (확장 중)",
      description: "지속적인 채용을 통해 조직 규모를 안정적으로 확대해 나가는 중입니다.",
      color: "#2dca73",
      bg: "rgba(45, 202, 115, 0.1)",
      icon: "📈"
    };
  } else if (netGrowthRate < -1.0 && netChange <= -3) {
    healthGrade = {
      title: "인력 유출 우려 (인원 감축)",
      description: "채용 대비 퇴사 인원이 늘어나 조직 규모가 축소되고 있습니다.",
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)",
      icon: "📉"
    };
  }

  // 월별 이력 가공
  const history = business.employmentHistory || [];
  const hasHistory = history.length > 1;

  return (
    <div className="card animate-fade-in" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* 헤더 타이틀 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "1.2rem" }}>📊</span>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
              국민연금 기반 실시간 조직 건강도 대시보드
            </h3>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", margin: 0 }}>
            검증 기준일자: {business.basDt ? `${business.basDt.substring(0,4)}년 ${business.basDt.substring(4,6)}월` : "최신"} | 동기화: {formatSyncTime(business.npsLastSyncAt)}
          </p>
        </div>

        {/* 건강도 뱃지 */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: healthGrade.bg,
          color: healthGrade.color,
          padding: "8px 14px",
          borderRadius: "30px",
          fontWeight: 700,
          fontSize: "0.88rem",
          border: `1px solid ${healthGrade.color}22`
        }}>
          <span>{healthGrade.icon}</span>
          <span>{healthGrade.title}</span>
        </div>
      </div>

      {/* 등급 설명 및 인사이트 */}
      <div style={{
        backgroundColor: "var(--bg-color-main)",
        padding: "16px 20px",
        borderRadius: "12px",
        fontSize: "0.9rem",
        color: "var(--color-text-sub)",
        lineHeight: 1.5,
        borderLeft: `4px solid ${healthGrade.color}`,
        fontWeight: 500
      }}>
        {healthGrade.description}
      </div>

      {/* 3대 핵심 지표 카드 그리드 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px"
      }}>
        <div style={{
          padding: "20px",
          borderRadius: "14px",
          backgroundColor: "var(--bg-color-main)",
          border: "1px solid var(--color-border)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 600, marginBottom: "8px" }}>
            당월 신규 입사율
          </div>
          <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--color-primary)" }}>
            {joinRate}%
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", marginTop: "4px" }}>
            +{newAcqs}명 신규 취득
          </div>
        </div>

        <div style={{
          padding: "20px",
          borderRadius: "14px",
          backgroundColor: "var(--bg-color-main)",
          border: "1px solid var(--color-border)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 600, marginBottom: "8px" }}>
            당월 실질 퇴사율
          </div>
          <div style={{
            fontSize: "1.7rem",
            fontWeight: 800,
            color: quitRate >= 5.0 ? "var(--color-danger)" : "var(--color-text-main)"
          }}>
            {quitRate}%
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", marginTop: "4px" }}>
            -{losses}명 상실
          </div>
        </div>

        <div style={{
          padding: "20px",
          borderRadius: "14px",
          backgroundColor: "var(--bg-color-main)",
          border: "1px solid var(--color-border)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 600, marginBottom: "8px" }}>
            순증가율 (조직 팽창률)
          </div>
          <div style={{
            fontSize: "1.7rem",
            fontWeight: 800,
            color: netChange > 0 ? "var(--color-success)" : netChange < 0 ? "var(--color-danger)" : "var(--color-text-desc)"
          }}>
            {netChange > 0 ? `+${netGrowthRate}%` : `${netGrowthRate}%`}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", marginTop: "4px" }}>
            {netChange > 0 ? `순증 +${netChange}명` : netChange < 0 ? `순감 ${netChange}명` : "변동 없음"}
          </div>
        </div>
      </div>

      {/* 입퇴사 비율 시각화 바 차트 */}
      <div>
        <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
          👥 인력 입사 vs 퇴사 대조 비율
        </h4>
        {newAcqs === 0 && losses === 0 ? (
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", padding: "8px 0" }}>
            당월 입퇴사 변동 내역이 없습니다. (총 {total}명 가입 유지 중)
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{
              height: "18px",
              borderRadius: "9px",
              overflow: "hidden",
              display: "flex",
              backgroundColor: "var(--color-border)",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)"
            }}>
              <div style={{
                width: `${(newAcqs / (newAcqs + losses)) * 100}%`,
                background: "linear-gradient(90deg, #3182f6, #60a5fa)",
                transition: "width 0.5s ease"
              }} title={`입사: ${newAcqs}명`} />
              <div style={{
                width: `${(losses / (newAcqs + losses)) * 100}%`,
                background: "linear-gradient(90deg, #f04438, #fc8181)",
                transition: "width 0.5s ease"
              }} title={`퇴사: ${losses}명`} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700 }}>
              <div style={{ color: "#3182f6", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3182f6", display: "inline-block" }}></span>
                <span>신규 입사 {newAcqs}명 ({Math.round((newAcqs / (newAcqs + losses)) * 100)}%)</span>
              </div>
              <div style={{ color: "#f04438", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f04438", display: "inline-block" }}></span>
                <span>퇴사 상실 {losses}명 ({Math.round((losses / (newAcqs + losses)) * 100)}%)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 월별 고용 추이 리스트/차트 */}
      <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "20px" }}>
        <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
          📈 월별 고용 인원 추이 및 퇴사율 차트
        </h4>

        {hasHistory ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", minWidth: "500px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-border)", color: "var(--color-text-desc)" }}>
                    <th style={{ padding: "8px", textAlign: "left" }}>연월</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>총 가입 인원</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>신규 입사</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>상실/퇴사</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>실질 퇴사율</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>순증가</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, idx) => {
                    const hTotal = h.employees;
                    const hNew = h.newAcquisitions;
                    const hLoss = h.losses;
                    const hNet = hNew - hLoss;
                    const hQuitRate = hTotal > 0 ? ((hLoss / hTotal) * 100).toFixed(1) : "0.0";

                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--color-border)", height: "40px" }}>
                        <td style={{ padding: "8px", fontWeight: 700, color: "var(--color-text-main)" }}>
                          {h.recordMonth}
                        </td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: 600 }}>
                          {hTotal.toLocaleString()}명
                        </td>
                        <td style={{ padding: "8px", textAlign: "right", color: "#3182f6", fontWeight: 600 }}>
                          +{hNew}명
                        </td>
                        <td style={{ padding: "8px", textAlign: "right", color: hLoss > 0 ? "var(--color-danger)" : "var(--color-text-desc)" }}>
                          -{hLoss}명
                        </td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>
                          {hQuitRate}%
                        </td>
                        <td style={{
                          padding: "8px",
                          textAlign: "right",
                          fontWeight: 700,
                          color: hNet > 0 ? "var(--color-success)" : hNet < 0 ? "var(--color-danger)" : "var(--color-text-desc)"
                        }}>
                          {hNet > 0 ? `+${hNet}명` : hNet < 0 ? `${hNet}명` : "0명"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", margin: 0 }}>
              * 국민연금 가입이 유지되는 동안 월별 데이터가 지속적으로 적재 및 업데이트됩니다.
            </p>
          </div>
        ) : (
          <div style={{
            padding: "20px",
            borderRadius: "12px",
            border: "1px dashed var(--color-border)",
            textAlign: "center",
            backgroundColor: "var(--bg-color-main)"
          }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "8px" }}>⚙️</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px" }}>
              월별 고용 히스토리 빌드 대기 중
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", margin: "0 auto", maxWidth: "450px", lineHeight: 1.4 }}>
              마음데이터 첫 실시간 검증이 개시되었습니다. 매월 사용자의 재검증 혹은 스크립트 배치가 기동될 때마다 월별 데이터가 누적되어 <strong>추이 차트가 자동으로 빌드</strong>됩니다.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
