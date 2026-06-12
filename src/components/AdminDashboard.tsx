"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface TimelineEvent {
  date: string;
  title: string;
  desc: string;
}

interface EditRequest {
  id: number;
  b_no: string;
  b_nm: string;
  currentBrandName: string;
  currentHomepage: string;
  currentDescription: string;
  requesterType: "visitor" | "relation";
  requesterEmail: string;
  proposedBrandName: string;
  proposedHomepage: string;
  proposedDescription: string;
  proposedTimeline: TimelineEvent[];
  status: string;
  createdAt: string;
  proposedBusinessName?: string;
}

interface AdminStats {
  totalBusinesses: number;
  noNameBusinesses: number;
  pendingRequests: number;
  totalViews: number;
}

interface NoNameBusiness {
  b_no: string;
  b_nm: string;
  p_nm: string;
  b_adr: string;
  b_sector: string;
  viewCount: number;
}

interface AdminDashboardProps {
  initialRequests: EditRequest[];
  stats: AdminStats;
  noNameBusinesses: NoNameBusiness[];
}

export default function AdminDashboard({ initialRequests, stats, noNameBusinesses }: AdminDashboardProps) {
  const router = useRouter();
  
  // 클라이언트 측 동적 동기화를 위한 State 격상
  const [requests, setRequests] = useState<EditRequest[]>(initialRequests);
  const [statsState, setStatsState] = useState<AdminStats>(stats);
  const [noNameState, setNoNameState] = useState<NoNameBusiness[]>(noNameBusinesses);

  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // 탭 상태: 'proposals' (정보 수정 제안 검토) | 'no-name' (상호 정보 없음 기업 목록)
  const [activeTab, setActiveTab] = useState<"proposals" | "no-name">("proposals");
  
  // 호버 제어를 위한 임시 상태 목록
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setProcessingId(id);
    setAlertMsg(null);

    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAlertMsg({
          type: "success",
          text: action === "approve" ? "제안을 승인하여 DB에 정상 반영했습니다." : "제안을 반려 처리했습니다."
        });
        // 목록에서 제거
        setRequests(requests.filter((r) => r.id !== id));
        
        // 통계 및 수치도 즉시 실시간 갱신 (승인 시 등록 수 및 대기 건수 변경 반영)
        // 화면 리프레시 유도 및 데이터 다시 불러오기를 위해 백엔드 API를 찔러 최신 통계를 가져올 수도 있습니다.
        const statsRes = await fetch("/api/admin/bulk-sync", { method: "POST", body: JSON.stringify({ onlyStats: true }) }).catch(() => null);
        if (statsRes && statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.stats) setStatsState(statsData.stats);
        }
      } else {
        setAlertMsg({ type: "error", text: data.error || "처리 중 오류가 발생했습니다." });
      }
    } catch (err) {
      setAlertMsg({ type: "error", text: "요청 중 네트워크 오류가 발생했습니다." });
    } finally {
      setProcessingId(null);
      // 알림 메시지 3초 후 삭제
      setTimeout(() => setAlertMsg(null), 3000);
    }
  };

  // ⚡️ 누락 상호 일괄 동기화 (Bulk Sync API) 호출
  const handleBulkSync = async () => {
    setIsSyncing(true);
    setAlertMsg(null);

    try {
      const res = await fetch("/api/admin/bulk-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // 백엔드로부터 전달받은 최신 통계와 최신 누락 리스트를 클라이언트에 실시간 주입
        setStatsState(data.stats);
        setNoNameState(data.noNameBusinesses);

        const { totalScanned, successCount, deletedCount, unchangedCount } = data.report;
        setAlertMsg({
          type: "success",
          text: `⚡️ 동기화 스캔 완료: 총 ${totalScanned}개 중 상호 복구 ${successCount}개 | 미등록 격리 ${deletedCount}개 | 정보 대기 ${unchangedCount}개`
        });
      } else {
        setAlertMsg({
          type: "error",
          text: data.error || "일괄 동기화 중 오류가 발생했습니다."
        });
      }
    } catch (err) {
      setAlertMsg({
        type: "error",
        text: "일괄 동기화 요청 중 네트워크 오류가 발생했습니다."
      });
    } finally {
      setIsSyncing(false);
      // 보고용 알림이므로 6초간 출력
      setTimeout(() => setAlertMsg(null), 6000);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (res.ok) {
        router.push("/admin/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    if (dateStr.length === 8) {
      return `${dateStr.slice(0, 4)}년 ${dateStr.slice(4, 6)}월`;
    }
    return dateStr;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ko-KR").format(num);
  };

  return (
    <div style={{
      padding: "40px 24px 80px 24px",
      fontFamily: "var(--font-family-sans)",
      color: "var(--color-text-main)",
      maxWidth: "1240px",
      margin: "0 auto",
      backgroundColor: "#080b11",
      minHeight: "100vh"
    }}>
      {/* 로딩 스피너 및 키프레임 애니메이션 삽입 */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner-active {
          animation: spin 0.8s linear infinite;
        }
      `}} />

      {/* 어드민 네비게이션 헤더 */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "24px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        marginBottom: "40px",
        gap: "16px",
        flexWrap: "wrap"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              System Admin
            </span>
          </div>
          <h1 style={{
            fontSize: "2.2rem",
            fontWeight: 900,
            background: "linear-gradient(135deg, #ffffff 40%, #a5b4fc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "8px 0 0 0",
            letterSpacing: "-0.02em"
          }}>
            🛡️ 어드민 컨트롤 타워
          </h1>
          <p style={{ color: "rgba(156, 163, 175, 0.7)", fontSize: "0.95rem", margin: "6px 0 0 0" }}>
            마음데이터 실시간 통계 관제 및 유저 정보 제안 심사 시스템
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a
            href="/"
            style={{
              padding: "11px 20px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              fontSize: "0.88rem",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.8)",
              textDecoration: "none",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)";
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
            }}
          >
            홈페이지 바로가기
          </a>
          <button
            onClick={handleLogout}
            style={{
              padding: "11px 20px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "rgba(248, 113, 113, 0.12)",
              color: "#fca5a5",
              fontSize: "0.88rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(248, 113, 113, 0.25)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(248, 113, 113, 0.12)";
              e.currentTarget.style.color = "#fca5a5";
            }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* KPI 통계 카드 대시보드 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "20px",
        marginBottom: "40px"
      }}>
        {/* 카드 1: 총 등록 업체 수 */}
        <div
          onMouseEnter={() => setHoveredCard(1)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background: "linear-gradient(135deg, rgba(31, 41, 55, 0.6) 0%, rgba(17, 24, 39, 0.8) 100%)",
            backdropFilter: "blur(16px)",
            border: hoveredCard === 1 ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: hoveredCard === 1 ? "0 10px 25px rgba(59, 130, 246, 0.15)" : "none",
            transform: hoveredCard === 1 ? "translateY(-5px)" : "translateY(0)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "80px",
            height: "80px",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
            borderRadius: "50%"
          }} />
          <span style={{ color: "rgba(156, 163, 175, 0.6)", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>
            🏢 총 등록 업체 수
          </span>
          <div style={{
            fontSize: "2.4rem",
            fontWeight: 900,
            color: "#ffffff",
            margin: "12px 0 4px 0",
            display: "flex",
            alignItems: "baseline",
            gap: "4px"
          }}>
            {formatNumber(statsState.totalBusinesses)}
            <span style={{ fontSize: "1rem", fontWeight: 500, color: "rgba(156, 163, 175, 0.7)" }}>개</span>
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#3b82f6", fontWeight: 600 }}>
            누적 적재 기업 데이터베이스
          </p>
        </div>

        {/* 카드 2: 상호 정보 없음 업체 수 */}
        <div
          onMouseEnter={() => setHoveredCard(2)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background: "linear-gradient(135deg, rgba(31, 41, 55, 0.6) 0%, rgba(17, 24, 39, 0.8) 100%)",
            backdropFilter: "blur(16px)",
            border: hoveredCard === 2 ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: hoveredCard === 2 ? "0 10px 25px rgba(245, 158, 11, 0.15)" : "none",
            transform: hoveredCard === 2 ? "translateY(-5px)" : "translateY(0)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "80px",
            height: "80px",
            background: "radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)",
            borderRadius: "50%"
          }} />
          <span style={{ color: "rgba(156, 163, 175, 0.6)", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>
            🔍 상호 정보 없음 기업
          </span>
          <div style={{
            fontSize: "2.4rem",
            fontWeight: 900,
            color: "#fbbf24",
            margin: "12px 0 4px 0",
            display: "flex",
            alignItems: "baseline",
            gap: "4px"
          }}>
            {formatNumber(statsState.noNameBusinesses)}
            <span style={{ fontSize: "1rem", fontWeight: 500, color: "rgba(156, 163, 175, 0.7)" }}>개</span>
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#f59e0b", fontWeight: 600 }}>
            수동 보완 및 크롤링 대기 대상
          </p>
        </div>

        {/* 카드 3: 검토 대기중인 제안 수 */}
        <div
          onMouseEnter={() => setHoveredCard(3)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background: "linear-gradient(135deg, rgba(31, 41, 55, 0.6) 0%, rgba(17, 24, 39, 0.8) 100%)",
            backdropFilter: "blur(16px)",
            border: hoveredCard === 3 ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: hoveredCard === 3 ? "0 10px 25px rgba(168, 85, 247, 0.15)" : "none",
            transform: hoveredCard === 3 ? "translateY(-5px)" : "translateY(0)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "80px",
            height: "80px",
            background: "radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)",
            borderRadius: "50%"
          }} />
          <span style={{ color: "rgba(156, 163, 175, 0.6)", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>
            📥 검토 대기 수정 제안
          </span>
          <div style={{
            fontSize: "2.4rem",
            fontWeight: 900,
            color: "#c084fc",
            margin: "12px 0 4px 0",
            display: "flex",
            alignItems: "baseline",
            gap: "4px"
          }}>
            {formatNumber(requests.length)}
            <span style={{ fontSize: "1rem", fontWeight: 500, color: "rgba(156, 163, 175, 0.7)" }}>건</span>
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#a855f7", fontWeight: 600 }}>
            신속한 수동 심사 필요
          </p>
        </div>

        {/* 카드 4: 누적 조회수 */}
        <div
          onMouseEnter={() => setHoveredCard(4)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background: "linear-gradient(135deg, rgba(31, 41, 55, 0.6) 0%, rgba(17, 24, 39, 0.8) 100%)",
            backdropFilter: "blur(16px)",
            border: hoveredCard === 4 ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: hoveredCard === 4 ? "0 10px 25px rgba(16, 185, 129, 0.15)" : "none",
            transform: hoveredCard === 4 ? "translateY(-5px)" : "translateY(0)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "80px",
            height: "80px",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
            borderRadius: "50%"
          }} />
          <span style={{ color: "rgba(156, 163, 175, 0.6)", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>
            📈 누적 기업 조회수
          </span>
          <div style={{
            fontSize: "2.4rem",
            fontWeight: 900,
            color: "#34d399",
            margin: "12px 0 4px 0",
            display: "flex",
            alignItems: "baseline",
            gap: "4px"
          }}>
            {formatNumber(statsState.totalViews)}
            <span style={{ fontSize: "1rem", fontWeight: 500, color: "rgba(156, 163, 175, 0.7)" }}>회</span>
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>
            데이터 트래픽 활성 지표
          </p>
        </div>
      </div>

      {/* 실시간 피드백 토스트 알림 */}
      {alertMsg && (
        <div style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          zIndex: 1100,
          backgroundColor: alertMsg.type === "success" ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.95)",
          color: "#ffffff",
          padding: "16px 24px",
          borderRadius: "14px",
          fontWeight: 700,
          fontSize: "0.95rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          backdropFilter: "blur(8px)",
          animation: "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          {alertMsg.type === "success" ? "✅" : "⚠️"} {alertMsg.text}
        </div>
      )}

      {/* 탭 컨트롤 영역 */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        marginBottom: "32px",
        gap: "8px"
      }}>
        <button
          onClick={() => setActiveTab("proposals")}
          onMouseEnter={() => setHoveredTab("proposals")}
          onMouseLeave={() => setHoveredTab(null)}
          style={{
            padding: "16px 24px",
            backgroundColor: "transparent",
            border: "none",
            borderBottom: activeTab === "proposals" ? "3px solid #3b82f6" : "3px solid transparent",
            color: activeTab === "proposals" ? "#ffffff" : "rgba(156, 163, 175, 0.6)",
            fontSize: "1.05rem",
            fontWeight: 800,
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          📥 정보 수정 제안 검토
          <span style={{
            backgroundColor: activeTab === "proposals" ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.05)",
            color: activeTab === "proposals" ? "#60a5fa" : "rgba(156, 163, 175, 0.6)",
            padding: "2px 8px",
            borderRadius: "20px",
            fontSize: "0.78rem",
            fontWeight: 700
          }}>
            {requests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("no-name")}
          onMouseEnter={() => setHoveredTab("no-name")}
          onMouseLeave={() => setHoveredTab(null)}
          style={{
            padding: "16px 24px",
            backgroundColor: "transparent",
            border: "none",
            borderBottom: activeTab === "no-name" ? "3px solid #f59e0b" : "3px solid transparent",
            color: activeTab === "no-name" ? "#ffffff" : "rgba(156, 163, 175, 0.6)",
            fontSize: "1.05rem",
            fontWeight: 800,
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          🔍 상호 정보 없음 기업
          <span style={{
            backgroundColor: activeTab === "no-name" ? "rgba(245, 158, 11, 0.2)" : "rgba(255, 255, 255, 0.05)",
            color: activeTab === "no-name" ? "#fbbf24" : "rgba(156, 163, 175, 0.6)",
            padding: "2px 8px",
            borderRadius: "20px",
            fontSize: "0.78rem",
            fontWeight: 700
          }}>
            {noNameState.length}
          </span>
        </button>
      </div>

      {/* 탭 1: 수정 제안 검토 목록 */}
      {activeTab === "proposals" && (
        <div>
          {requests.length === 0 ? (
            <div style={{
              backgroundColor: "rgba(17, 24, 39, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "20px",
              padding: "80px 24px",
              textAlign: "center",
              color: "rgba(156, 163, 175, 0.6)"
            }}>
              <span style={{ fontSize: "3rem", display: "block", marginBottom: "16px" }}>🎉</span>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", marginBottom: "8px" }}>
                새로운 수정 제안이 없습니다.
              </h3>
              <p style={{ fontSize: "0.9rem", margin: 0 }}>
                모든 제출 정보 검토가 완료되었습니다.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              {requests.map((req) => {
                // 비교 결과 변경 여부 체크
                const isBusinessNameDiff = (req.proposedBusinessName || "").trim() !== "" && (req.proposedBusinessName !== req.b_nm);
                const isBrandDiff = (req.proposedBrandName || "").trim() !== "" && (req.proposedBrandName !== req.currentBrandName);
                const isHomepageDiff = (req.proposedHomepage || "").trim() !== "" && (req.proposedHomepage !== req.currentHomepage);
                const isDescDiff = (req.proposedDescription || "").trim() !== "" && (req.proposedDescription !== req.currentDescription);

                return (
                  <div
                    key={req.id}
                    style={{
                      backgroundColor: "rgba(17, 24, 39, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "20px",
                      padding: "32px",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                      transition: "all 0.3s ease",
                      opacity: processingId === req.id ? 0.6 : 1
                    }}
                  >
                    {/* 상단 카드 헤더 */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "12px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                      paddingBottom: "16px"
                    }}>
                      <div>
                        <span style={{ fontSize: "0.8rem", color: "rgba(156, 163, 175, 0.5)", fontWeight: 700 }}>
                          제안 ID: #{req.id} | 사업자번호: {req.b_no}
                        </span>
                        <h2 style={{ fontSize: "1.4rem", fontWeight: 850, color: "#ffffff", margin: "4px 0 0 0" }}>
                          {req.b_nm}
                        </h2>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "flex-end" }}>
                          <span style={{
                            backgroundColor: req.requesterType === "relation" ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.04)",
                            color: req.requesterType === "relation" ? "#34d399" : "rgba(156, 163, 175, 0.7)",
                            padding: "4px 10px",
                            borderRadius: "30px",
                            fontSize: "0.78rem",
                            fontWeight: 700
                          }}>
                            {req.requesterType === "relation" ? "🏢 회사 관계자 제안" : "👤 방문자 제안"}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "rgba(156, 163, 175, 0.6)", display: "block", marginTop: "6px" }}>
                          제출 이메일: <strong style={{ color: "#ffffff" }}>{req.requesterEmail}</strong>
                        </span>
                      </div>
                    </div>

                    {/* 1:1 병렬 대조 영역 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                      {/* 공식 상호명 대조 */}
                      {isBusinessNameDiff && (
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                          gap: "16px",
                          backgroundColor: "rgba(59, 130, 246, 0.03)",
                          padding: "16px",
                          borderRadius: "12px",
                          border: "1px dashed rgba(59, 130, 246, 0.2)"
                        }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <span style={{ fontSize: "0.8rem", color: "rgba(156, 163, 175, 0.6)", fontWeight: 700 }}>
                              [기존] 공식 상호명
                            </span>
                            <div style={{
                              padding: "12px 16px",
                              borderRadius: "10px",
                              backgroundColor: "rgba(239, 68, 68, 0.08)",
                              color: "#fca5a5",
                              fontSize: "0.9rem",
                              border: "1px solid rgba(239, 68, 68, 0.15)",
                              textDecoration: "line-through"
                            }}>
                              {req.b_nm || "(기존 등록 없음)"}
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#60a5fa", fontWeight: 700 }}>
                              [제안] 공식 상호명 ✦ 변경됨
                            </span>
                            <div style={{
                              padding: "12px 16px",
                              borderRadius: "10px",
                              backgroundColor: "rgba(16, 185, 129, 0.12)",
                              color: "#34d399",
                              fontSize: "0.9rem",
                              border: "1px solid rgba(16, 185, 129, 0.2)",
                              fontWeight: 700
                            }}>
                              {req.proposedBusinessName}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 브랜드 별칭 대조 */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "16px",
                        backgroundColor: isBrandDiff ? "rgba(59, 130, 246, 0.02)" : "transparent",
                        padding: isBrandDiff ? "16px" : "0",
                        borderRadius: "12px",
                        border: isBrandDiff ? "1px dashed rgba(59, 130, 246, 0.15)" : "none"
                      }}>
                        {/* 이전 데이터 */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "0.8rem", color: "rgba(156, 163, 175, 0.6)", fontWeight: 700 }}>
                            [기존] 브랜드 별칭
                          </span>
                          <div style={{
                            padding: "12px 16px",
                            borderRadius: "10px",
                            backgroundColor: isBrandDiff ? "rgba(239, 68, 68, 0.08)" : "rgba(255, 255, 255, 0.02)",
                            color: isBrandDiff ? "#fca5a5" : "rgba(156, 163, 175, 0.7)",
                            fontSize: "0.9rem",
                            border: isBrandDiff ? "1px solid rgba(239, 68, 68, 0.15)" : "1px solid transparent",
                            textDecoration: isBrandDiff ? "line-through" : "none"
                          }}>
                            {req.currentBrandName || "(기존 등록 없음)"}
                          </div>
                        </div>
                        {/* 제안 데이터 */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "0.8rem", color: isBrandDiff ? "#60a5fa" : "rgba(156, 163, 175, 0.6)", fontWeight: 700 }}>
                            [제안] 브랜드 별칭 {isBrandDiff && "✦ 변경됨"}
                          </span>
                          <div style={{
                            padding: "12px 16px",
                            borderRadius: "10px",
                            backgroundColor: isBrandDiff ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.02)",
                            color: isBrandDiff ? "#34d399" : "#ffffff",
                            fontSize: "0.9rem",
                            border: isBrandDiff ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid transparent",
                            fontWeight: isBrandDiff ? 700 : 500
                          }}>
                            {req.proposedBrandName || "(변경 없음)"}
                          </div>
                        </div>
                      </div>

                      {/* 홈페이지 대조 */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "16px",
                        backgroundColor: isHomepageDiff ? "rgba(59, 130, 246, 0.02)" : "transparent",
                        padding: isHomepageDiff ? "16px" : "0",
                        borderRadius: "12px",
                        border: isHomepageDiff ? "1px dashed rgba(59, 130, 246, 0.15)" : "none"
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "0.8rem", color: "rgba(156, 163, 175, 0.6)", fontWeight: 700 }}>
                            [기존] 홈페이지 주소
                          </span>
                          <div style={{
                            padding: "12px 16px",
                            borderRadius: "10px",
                            backgroundColor: isHomepageDiff ? "rgba(239, 68, 68, 0.08)" : "rgba(255, 255, 255, 0.02)",
                            color: isHomepageDiff ? "#fca5a5" : "rgba(156, 163, 175, 0.7)",
                            fontSize: "0.9rem",
                            border: isHomepageDiff ? "1px solid rgba(239, 68, 68, 0.15)" : "1px solid transparent",
                            textDecoration: isHomepageDiff ? "line-through" : "none",
                            wordBreak: "break-all"
                          }}>
                            {req.currentHomepage || "(기존 등록 없음)"}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "0.8rem", color: isHomepageDiff ? "#60a5fa" : "rgba(156, 163, 175, 0.6)", fontWeight: 700 }}>
                            [제안] 홈페이지 주소 {isHomepageDiff && "✦ 변경됨"}
                          </span>
                          <div style={{
                            padding: "12px 16px",
                            borderRadius: "10px",
                            backgroundColor: isHomepageDiff ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.02)",
                            color: isHomepageDiff ? "#34d399" : "#ffffff",
                            fontSize: "0.9rem",
                            border: isHomepageDiff ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid transparent",
                            fontWeight: isHomepageDiff ? 700 : 500,
                            wordBreak: "break-all"
                          }}>
                            {req.proposedHomepage || "(변경 없음)"}
                          </div>
                        </div>
                      </div>

                      {/* 기업 소개 및 설명 대조 */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "16px",
                        backgroundColor: isDescDiff ? "rgba(59, 130, 246, 0.02)" : "transparent",
                        padding: isDescDiff ? "16px" : "0",
                        borderRadius: "12px",
                        border: isDescDiff ? "1px dashed rgba(59, 130, 246, 0.15)" : "none"
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "0.8rem", color: "rgba(156, 163, 175, 0.6)", fontWeight: 700 }}>
                            [기존] 기업 소개 및 설명
                          </span>
                          <div style={{
                            padding: "12px 16px",
                            borderRadius: "10px",
                            backgroundColor: isDescDiff ? "rgba(239, 68, 68, 0.08)" : "rgba(255, 255, 255, 0.02)",
                            color: isDescDiff ? "#fca5a5" : "rgba(156, 163, 175, 0.7)",
                            fontSize: "0.9rem",
                            border: isDescDiff ? "1px solid rgba(239, 68, 68, 0.15)" : "1px solid transparent",
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap"
                          }}>
                            {req.currentDescription || "(기존 등록 없음)"}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "0.8rem", color: isDescDiff ? "#60a5fa" : "rgba(156, 163, 175, 0.6)", fontWeight: 700 }}>
                            [제안] 기업 소개 및 설명 {isDescDiff && "✦ 변경됨"}
                          </span>
                          <div style={{
                            padding: "12px 16px",
                            borderRadius: "10px",
                            backgroundColor: isDescDiff ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.02)",
                            color: isDescDiff ? "#34d399" : "#ffffff",
                            fontSize: "0.9rem",
                            border: isDescDiff ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid transparent",
                            fontWeight: isDescDiff ? 700 : 500,
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap"
                          }}>
                            {req.proposedDescription || "(변경 없음)"}
                          </div>
                        </div>
                      </div>

                      {/* 추가 제안된 연혁 리스트 */}
                      {req.proposedTimeline && req.proposedTimeline.length > 0 && (
                        <div style={{
                          backgroundColor: "rgba(59, 130, 246, 0.04)",
                          border: "1px solid rgba(59, 130, 246, 0.15)",
                          borderRadius: "12px",
                          padding: "16px"
                        }}>
                          <span style={{
                            fontSize: "0.82rem",
                            color: "#60a5fa",
                            fontWeight: 800,
                            display: "block",
                            marginBottom: "12px"
                          }}>
                            📅 신규 추가 제안 연혁 ({req.proposedTimeline.length}건)
                          </span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {req.proposedTimeline.map((item, idx) => (
                              <div key={idx} style={{
                                display: "flex",
                                gap: "12px",
                                backgroundColor: "rgba(255, 255, 255, 0.02)",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                fontSize: "0.85rem"
                              }}>
                                <div style={{ color: "#60a5fa", fontWeight: 700, minWidth: "90px" }}>
                                  {formatDateLabel(item.date)}
                                </div>
                                <div>
                                  <strong style={{ color: "#ffffff", display: "block", marginBottom: "2px" }}>
                                    {item.title}
                                  </strong>
                                  <span style={{ color: "rgba(156, 163, 175, 0.8)" }}>{item.desc}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                    {/* 거절 / 승인 제어 버튼 */}
                    <div style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "12px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      paddingTop: "20px",
                      marginTop: "8px"
                    }}>
                      <button
                        onClick={() => handleAction(req.id, "reject")}
                        disabled={processingId !== null}
                        style={{
                          padding: "12px 24px",
                          borderRadius: "10px",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          backgroundColor: "transparent",
                          color: "#fca5a5",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          cursor: processingId !== null ? "not-allowed" : "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          if (processingId === null) {
                            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (processingId === null) {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }
                        }}
                      >
                        거절 (반려)
                      </button>
                      <button
                        onClick={() => handleAction(req.id, "approve")}
                        disabled={processingId !== null}
                        style={{
                          padding: "12px 28px",
                          borderRadius: "10px",
                          border: "none",
                          backgroundColor: "#3b82f6",
                          color: "#ffffff",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          cursor: processingId !== null ? "not-allowed" : "pointer",
                          transition: "all 0.2s",
                          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)"
                        }}
                        onMouseEnter={(e) => {
                          if (processingId === null) {
                            e.currentTarget.style.backgroundColor = "#2563eb";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (processingId === null) {
                            e.currentTarget.style.backgroundColor = "#3b82f6";
                            e.currentTarget.style.transform = "translateY(0)";
                          }
                        }}
                      >
                        승인 (실시간 반영)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 탭 2: 상호 정보 없음 기업 목록 */}
      {activeTab === "no-name" && (
        <div style={{
          backgroundColor: "rgba(17, 24, 39, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "20px",
          padding: "32px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
          animation: "fadeIn 0.25s ease"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                ⚠️ 상호 정보 누락 기업 데이터 현황
              </h3>
              <p style={{ fontSize: "0.85rem", color: "rgba(156, 163, 175, 0.6)", margin: "4px 0 0 0" }}>
                국세청 등록 상태 검증은 완료되었으나, 상호 정보가 비어 있는 사업자 리스트입니다.
              </p>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              {/* ⚡️ 누락 상호 일괄 동기화 버튼 */}
              <button
                onClick={handleBulkSync}
                disabled={isSyncing}
                style={{
                  padding: "11px 20px",
                  borderRadius: "12px",
                  border: "none",
                  background: isSyncing 
                    ? "rgba(245, 158, 11, 0.2)"
                    : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: isSyncing ? "#fef3c7" : "#ffffff",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: isSyncing ? "not-allowed" : "pointer",
                  boxShadow: isSyncing ? "none" : "0 4px 14px rgba(245, 158, 11, 0.25)",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseEnter={(e) => {
                  if (!isSyncing) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 18px rgba(245, 158, 11, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSyncing) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(245, 158, 11, 0.25)";
                  }
                }}
              >
                {isSyncing ? (
                  <>
                    <span className="spinner-active" style={{
                      width: "12px",
                      height: "12px",
                      border: "2px solid #ffffff",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      display: "inline-block"
                    }} />
                    <span>일괄 스캔 중...</span>
                  </>
                ) : (
                  <>⚡️ 누락 상호 일괄 동기화 (API 재스캔)</>
                )}
              </button>

              <span style={{
                backgroundColor: "rgba(245, 158, 11, 0.12)",
                color: "#fbbf24",
                padding: "8px 16px",
                borderRadius: "30px",
                fontSize: "0.82rem",
                fontWeight: 700
              }}>
                총 {noNameState.length}개 발견됨
              </span>
            </div>
          </div>

          {noNameState.length === 0 ? (
            <div style={{
              padding: "60px 0",
              textAlign: "center",
              color: "rgba(156, 163, 175, 0.5)"
            }}>
              <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "12px" }}>✅</span>
              <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#ffffff", margin: 0 }}>
                상호가 비어 있는 기업이 없습니다!
              </p>
              <p style={{ fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                모든 사업자가 정상 상호명을 갖고 있습니다.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "0 8px",
                textAlign: "left",
                fontSize: "0.88rem"
              }}>
                <thead>
                  <tr style={{ color: "rgba(156, 163, 175, 0.6)" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>사업자번호</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>임시상호명</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>대표자명</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>업종 / 분야</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>소재지 주소</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "center" }}>누적 조회수</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {noNameState.map((biz) => {
                    const isHovered = hoveredRow === biz.b_no;
                    return (
                      <tr
                        key={biz.b_no}
                        onMouseEnter={() => setHoveredRow(biz.b_no)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          backgroundColor: isHovered ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.01)",
                          borderRadius: "10px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {/* 사업자번호 */}
                        <td style={{
                          padding: "16px",
                          fontWeight: 700,
                          color: "#60a5fa",
                          borderTopLeftRadius: "10px",
                          borderBottomLeftRadius: "10px"
                        }}>
                          {biz.b_no.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3")}
                        </td>
                        
                        {/* 임시 상호명 */}
                        <td style={{ padding: "16px", color: "rgba(245, 158, 11, 0.8)", fontWeight: 600 }}>
                          {biz.b_nm}
                        </td>
                        
                        {/* 대표자명 */}
                        <td style={{ padding: "16px", color: "#ffffff" }}>
                          {biz.p_nm || "(정보 없음)"}
                        </td>
                        
                        {/* 업종 */}
                        <td style={{ padding: "16px", color: "rgba(156, 163, 175, 0.8)", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {biz.b_sector || "(정보 없음)"}
                        </td>
                        
                        {/* 주소 */}
                        <td style={{ padding: "16px", color: "rgba(156, 163, 175, 0.7)", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {biz.b_adr || "(정보 없음)"}
                        </td>

                        {/* 누적 조회수 */}
                        <td style={{ padding: "16px", color: "#34d399", fontWeight: 700, textAlign: "center" }}>
                          {biz.viewCount}회
                        </td>
                        
                        {/* 작업 제어 버튼 */}
                        <td style={{
                          padding: "16px",
                          textAlign: "right",
                          borderTopRightRadius: "10px",
                          borderBottomRightRadius: "10px"
                        }}>
                          <a
                            href={`/biz/${biz.b_no}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-block",
                              padding: "8px 14px",
                              borderRadius: "8px",
                              backgroundColor: "rgba(59, 130, 246, 0.15)",
                              color: "#60a5fa",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              textDecoration: "none",
                              transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#3b82f6";
                              e.currentTarget.style.color = "#ffffff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
                              e.currentTarget.style.color = "#60a5fa";
                            }}
                          >
                            상세 정보 등록하러 가기 ↗
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
