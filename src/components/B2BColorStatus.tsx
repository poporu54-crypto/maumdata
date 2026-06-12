"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface B2BColorStatusProps {
  bNo: string;
  initialTaxType: string;
  initialTaxTypeCd: string;
  initialBStt: string;
  initialBSttCd: string;
  ntsLastSyncAt: any;
}

export default function B2BColorStatus({
  bNo,
  initialTaxType,
  initialTaxTypeCd,
  initialBStt,
  initialBSttCd,
  ntsLastSyncAt
}: B2BColorStatusProps) {
  const router = useRouter();
  const [bStt, setBStt] = useState(initialBStt || "계속사업자");
  const [bSttCd, setBSttCd] = useState(initialBSttCd || "01");
  const [taxType, setTaxType] = useState(initialTaxType || "부가가치세 일반과세자");
  const [taxTypeCd, setTaxTypeCd] = useState(initialTaxTypeCd || "01");
  const [syncTime, setSyncTime] = useState<any>(ntsLastSyncAt);
  const [loading, setLoading] = useState(false);
  const [animateSignal, setAnimateSignal] = useState(false);

  // 🟢🟡🔴 신호등 판정 함수
  // 🟢 초록: 계속사업자 (01) & 정상 과세
  // 🟡 노랑: 휴업자 (02) 또는 특이 과세 유형
  // 🔴 빨강: 폐업자 (03) 또는 형식 오류 / 조회 불가
  const getRiskLevel = (sttCd: string, typeCd: string) => {
    if (sttCd === "03" || sttCd === "형식 오류" || sttCd === "조회 불가") {
      return "RED";
    }
    if (sttCd === "02" || typeCd === "04" || typeCd === "06" || !sttCd) {
      // 02: 휴업자, 혹은 특정 유예 사업자 등은 노란불
      return "YELLOW";
    }
    return "GREEN";
  };

  const riskLevel = getRiskLevel(bSttCd, taxTypeCd);

  const formatSyncTime = (time: any) => {
    if (!time) return "방금 전 (실시간)";
    try {
      const d = new Date(time);
      if (isNaN(d.getTime())) return "방금 전 (실시간)";
      
      // UTC+9(한국 표준시) 강제 적용을 위한 오프셋 연산
      const kstTime = d.getTime() + (9 * 60 * 60 * 1000);
      const kstDate = new Date(kstTime);
      
      if (kstDate.getUTCFullYear() <= 1970) return "미동기화 (대기 중)";
      
      const year = kstDate.getUTCFullYear();
      const month = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
      const date = String(kstDate.getUTCDate()).padStart(2, "0");
      const hours = String(kstDate.getUTCHours()).padStart(2, "0");
      const minutes = String(kstDate.getUTCMinutes()).padStart(2, "0");
      return `${year}.${month}.${date} ${hours}:${minutes}`;
    } catch (e) {
      return "방금 전 (실시간)";
    }
  };

  const handleRefresh = async () => {
    if (loading) return;
    setLoading(true);
    setAnimateSignal(true);

    try {
      const response = await fetch(`/api/biz/${bNo}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("실시간 검증 요청 실패");
      }

      const json = await response.json();
      if (json.success && json.data) {
        setBStt(json.data.b_stt);
        setBSttCd(json.data.b_stt_cd);
        setTaxType(json.data.tax_type);
        setTaxTypeCd(json.data.tax_type_cd);
        setSyncTime(json.data.ntsLastSyncAt);
        
        // 페이지 전체 데이터 동기화를 위해 Next.js router 리프레시 실행
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to refresh business status:", err);
      alert("실시간 검증 도중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setTimeout(() => {
        setLoading(false);
        setAnimateSignal(false);
      }, 800); // 부드러운 애니메이션 효과를 위한 딜레이
    }
  };

  return (
    <div style={{
      width: "100%",
      padding: "24px",
      borderRadius: "16px",
      background: "linear-gradient(135deg, rgba(23, 25, 35, 0.75) 0%, rgba(13, 15, 23, 0.9) 100%)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(20px)",
      boxSizing: "border-box",
      color: "#f7fafc",
      display: "flex",
      flexDirection: "column",
      gap: "18px",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* 백그라운드 무드 라이트 효과 */}
      <div style={{
        position: "absolute",
        top: "-50px",
        right: "-50px",
        width: "180px",
        height: "180px",
        borderRadius: "50%",
        background: riskLevel === "GREEN" 
          ? "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0) 70%)"
          : riskLevel === "YELLOW"
            ? "radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0) 70%)"
            : "radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0) 70%)",
        pointerEvents: "none"
      }} />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blink-green {
          0%, 100% { box-shadow: 0 0 8px rgba(16, 185, 129, 0.4), 0 0 20px rgba(16, 185, 129, 0.2); opacity: 0.9; }
          50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.95), 0 0 45px rgba(16, 185, 129, 0.5); opacity: 1; }
        }
        @keyframes blink-yellow {
          0%, 100% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.4), 0 0 20px rgba(245, 158, 11, 0.2); opacity: 0.9; }
          50% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.95), 0 0 45px rgba(245, 158, 11, 0.5); opacity: 1; }
        }
        @keyframes blink-red {
          0%, 100% { box-shadow: 0 0 8px rgba(239, 68, 68, 0.4), 0 0 20px rgba(239, 68, 68, 0.2); opacity: 0.9; }
          50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.95), 0 0 45px rgba(239, 68, 68, 0.5); opacity: 1; }
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes signal-cycle {
          0%, 100% { background-color: rgba(255, 255, 255, 0.05); box-shadow: none; }
          33% { background-color: rgba(16, 185, 129, 0.8); box-shadow: 0 0 15px rgba(16, 185, 129, 0.8); }
          66% { background-color: rgba(245, 158, 11, 0.8); box-shadow: 0 0 15px rgba(245, 158, 11, 0.8); }
          90% { background-color: rgba(239, 68, 68, 0.8); box-shadow: 0 0 15px rgba(239, 68, 68, 0.8); }
        }
        .signal-loading {
          animation: signal-cycle 1.2s infinite linear;
        }
      `}} />

      {/* 헤더 및 거래처 위험도 정보 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.2rem" }}>🛡️</span>
          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#a0aec0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            B2B 거래선 전용 리스크 신호등
          </span>
        </div>
        <div style={{ fontSize: "0.8rem", color: "#718096" }}>
          최근 검증: {formatSyncTime(syncTime)}
        </div>
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        padding: "16px 20px",
        borderRadius: "14px",
        border: "1px solid rgba(255, 255, 255, 0.04)"
      }}>
        {/* 신호등 그래픽 */}
        <div style={{
          display: "flex",
          gap: "12px",
          backgroundColor: "#111",
          padding: "8px 16px",
          borderRadius: "30px",
          border: "2px solid #222",
          boxShadow: "inset 0 2px 5px rgba(0,0,0,0.5)"
        }}>
          {/* 초록불 */}
          <div className={animateSignal ? "signal-loading" : ""} style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: !animateSignal && riskLevel === "GREEN" ? "#10b981" : "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            animation: !animateSignal && riskLevel === "GREEN" ? "blink-green 2s infinite ease-in-out" : "none",
            transition: "all 0.3s ease",
            animationDelay: "0s"
          }} />

          {/* 노란불 */}
          <div className={animateSignal ? "signal-loading" : ""} style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: !animateSignal && riskLevel === "YELLOW" ? "#f59e0b" : "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            animation: !animateSignal && riskLevel === "YELLOW" ? "blink-yellow 2s infinite ease-in-out" : "none",
            transition: "all 0.3s ease",
            animationDelay: "0.4s"
          }} />

          {/* 빨간불 */}
          <div className={animateSignal ? "signal-loading" : ""} style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: !animateSignal && riskLevel === "RED" ? "#ef4444" : "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            animation: !animateSignal && riskLevel === "RED" ? "blink-red 2s infinite ease-in-out" : "none",
            transition: "all 0.3s ease",
            animationDelay: "0.8s"
          }} />
        </div>

        {/* 텍스트 정보 */}
        <div style={{ flex: 1, marginLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              fontSize: "1.1rem",
              fontWeight: 800,
              color: riskLevel === "GREEN" 
                ? "#10b981" 
                : riskLevel === "YELLOW"
                  ? "#f59e0b"
                  : "#ef4444"
            }}>
              {riskLevel === "GREEN" ? "안전 (🟢 정상 거래처)" : riskLevel === "YELLOW" ? "주의 (🟡 모니터링 필요)" : "위험 (🔴 거래 제한)"}
            </span>
          </div>
          <div style={{ fontSize: "0.85rem", color: "#cbd5e0", fontWeight: 500 }}>
            {bStt} | {taxType}
          </div>
        </div>

        {/* 온디맨드 실시간 갱신 버튼 - 개발 환경(development)에서만 렌더링 */}
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#f7fafc",
              padding: "10px 16px",
              borderRadius: "10px",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              outline: "none"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.borderColor = "var(--color-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
              }
            }}
          >
            <span style={{
              display: "inline-block",
              animation: loading ? "spin-slow 1s infinite linear" : "none",
              fontSize: "1rem"
            }}>
              🔄
            </span>
            <span>{loading ? "검증 중..." : "실시간 재검증"}</span>
          </button>
        )}
      </div>

      <div style={{
        fontSize: "0.8rem",
        color: "#a0aec0",
        lineHeight: 1.5,
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        paddingTop: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "4px"
      }}>
        <div>• <strong>🟢 정상</strong>: 계속사업 상태로 부도/폐업 우려가 낮아 정상 여신 한도 내 거래가 권장됩니다.</div>
        <div>• <strong>🟡 주의</strong>: 휴업 중이거나 세법상 특이 관리 과세 유형이 확인되어 추가 재무 실사가 요망됩니다.</div>
        <div>• <strong>🔴 위험</strong>: 폐업했거나 비정상 사업자 번호로 확인되어 대금 회수 불능 리스크가 극도로 높습니다.</div>
      </div>
    </div>
  );
}
