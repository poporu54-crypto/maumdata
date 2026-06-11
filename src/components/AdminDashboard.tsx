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
}

interface AdminDashboardProps {
  initialRequests: EditRequest[];
}

export default function AdminDashboard({ initialRequests }: AdminDashboardProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<EditRequest[]>(initialRequests);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  return (
    <div style={{
      padding: "40px 24px 80px 24px",
      fontFamily: "var(--font-family-sans)",
      color: "var(--color-text-main)",
      maxWidth: "1200px",
      margin: "0 auto"
    }}>
      {/* 어드민 네비게이션 헤더 */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "24px",
        borderBottom: "1px solid var(--color-border)",
        marginBottom: "40px",
        gap: "16px",
        flexWrap: "wrap"
      }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
            🛡️ 어드민 컨트롤 타워
          </h1>
          <p style={{ color: "var(--color-text-desc)", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
            나무위키형 기업 정보 수정 제안 승인/반려 대시보드
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a
            href="/"
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--color-text-sub)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ffffff";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.color = "var(--color-text-sub)";
            }}
          >
            메인 홈페이지
          </a>
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "rgba(240, 68, 56, 0.15)",
              color: "#f87171",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(240, 68, 56, 0.25)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(240, 68, 56, 0.15)"}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 실시간 알림 */}
      {alertMsg && (
        <div style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          zIndex: 1100,
          backgroundColor: alertMsg.type === "success" ? "rgba(45, 202, 115, 0.95)" : "rgba(240, 68, 56, 0.95)",
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

      {/* 요청 개수 요약 */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{
          backgroundColor: "rgba(49, 130, 246, 0.15)",
          color: "var(--color-primary)",
          padding: "6px 12px",
          borderRadius: "20px",
          fontWeight: 800,
          fontSize: "0.88rem"
        }}>
          검토 대기중 {requests.length}건
        </span>
      </div>

      {requests.length === 0 ? (
        <div style={{
          backgroundColor: "var(--bg-color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "20px",
          padding: "80px 24px",
          textAlign: "center",
          color: "var(--color-text-desc)"
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
            const isBrandDiff = (req.proposedBrandName || "").trim() !== "" && (req.proposedBrandName !== req.currentBrandName);
            const isHomepageDiff = (req.proposedHomepage || "").trim() !== "" && (req.proposedHomepage !== req.currentHomepage);
            const isDescDiff = (req.proposedDescription || "").trim() !== "" && (req.proposedDescription !== req.currentDescription);

            return (
              <div
                key={req.id}
                style={{
                  backgroundColor: "var(--bg-color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "20px",
                  padding: "32px",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
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
                  borderBottom: "1px solid var(--color-border)",
                  paddingBottom: "16px"
                }}>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
                      제안 ID: #{req.id} | 사업자번호: {req.b_no}
                    </span>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#ffffff", margin: "4px 0 0 0" }}>
                      {req.b_nm}
                    </h2>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "flex-end" }}>
                      <span style={{
                        backgroundColor: req.requesterType === "relation" ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.05)",
                        color: req.requesterType === "relation" ? "#34d399" : "var(--color-text-sub)",
                        padding: "4px 10px",
                        borderRadius: "30px",
                        fontSize: "0.78rem",
                        fontWeight: 700
                      }}>
                        {req.requesterType === "relation" ? "🏢 회사 관계자 제안" : "👤 방문자 제안"}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", display: "block", marginTop: "6px" }}>
                      제출 이메일: <strong>{req.requesterEmail}</strong>
                    </span>
                  </div>
                </div>

                {/* 1:1 병렬 대조 영역 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  
                  {/* 브랜드 별칭 대조 */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "16px",
                    backgroundColor: isBrandDiff ? "rgba(49, 130, 246, 0.03)" : "transparent",
                    padding: isBrandDiff ? "16px" : "0",
                    borderRadius: "12px",
                    border: isBrandDiff ? "1px dashed rgba(49, 130, 246, 0.2)" : "none"
                  }}>
                    {/* 이전 데이터 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
                        [기존] 브랜드 별칭
                      </span>
                      <div style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        backgroundColor: isBrandDiff ? "rgba(240, 68, 56, 0.08)" : "rgba(255, 255, 255, 0.02)",
                        color: isBrandDiff ? "#f87171" : "var(--color-text-sub)",
                        fontSize: "0.9rem",
                        border: isBrandDiff ? "1px solid rgba(240, 68, 56, 0.2)" : "1px solid transparent",
                        textDecoration: isBrandDiff ? "line-through" : "none"
                      }}>
                        {req.currentBrandName || "(기존 등록 없음)"}
                      </div>
                    </div>
                    {/* 제안 데이터 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", color: isBrandDiff ? "var(--color-primary)" : "var(--color-text-desc)", fontWeight: 700 }}>
                        [제안] 브랜드 별칭 {isBrandDiff && "✦ 변경됨"}
                      </span>
                      <div style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        backgroundColor: isBrandDiff ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.02)",
                        color: isBrandDiff ? "#34d399" : "var(--color-text-main)",
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
                    backgroundColor: isHomepageDiff ? "rgba(49, 130, 246, 0.03)" : "transparent",
                    padding: isHomepageDiff ? "16px" : "0",
                    borderRadius: "12px",
                    border: isHomepageDiff ? "1px dashed rgba(49, 130, 246, 0.2)" : "none"
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
                        [기존] 홈페이지 주소
                      </span>
                      <div style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        backgroundColor: isHomepageDiff ? "rgba(240, 68, 56, 0.08)" : "rgba(255, 255, 255, 0.02)",
                        color: isHomepageDiff ? "#f87171" : "var(--color-text-sub)",
                        fontSize: "0.9rem",
                        border: isHomepageDiff ? "1px solid rgba(240, 68, 56, 0.2)" : "1px solid transparent",
                        textDecoration: isHomepageDiff ? "line-through" : "none",
                        wordBreak: "break-all"
                      }}>
                        {req.currentHomepage || "(기존 등록 없음)"}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", color: isHomepageDiff ? "var(--color-primary)" : "var(--color-text-desc)", fontWeight: 700 }}>
                        [제안] 홈페이지 주소 {isHomepageDiff && "✦ 변경됨"}
                      </span>
                      <div style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        backgroundColor: isHomepageDiff ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.02)",
                        color: isHomepageDiff ? "#34d399" : "var(--color-text-main)",
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
                    backgroundColor: isDescDiff ? "rgba(49, 130, 246, 0.03)" : "transparent",
                    padding: isDescDiff ? "16px" : "0",
                    borderRadius: "12px",
                    border: isDescDiff ? "1px dashed rgba(49, 130, 246, 0.2)" : "none"
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
                        [기존] 기업 소개 및 설명
                      </span>
                      <div style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        backgroundColor: isDescDiff ? "rgba(240, 68, 56, 0.08)" : "rgba(255, 255, 255, 0.02)",
                        color: isDescDiff ? "#f87171" : "var(--color-text-sub)",
                        fontSize: "0.9rem",
                        border: isDescDiff ? "1px solid rgba(240, 68, 56, 0.2)" : "1px solid transparent",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap"
                      }}>
                        {req.currentDescription || "(기존 등록 없음)"}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", color: isDescDiff ? "var(--color-primary)" : "var(--color-text-desc)", fontWeight: 700 }}>
                        [제안] 기업 소개 및 설명 {isDescDiff && "✦ 변경됨"}
                      </span>
                      <div style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        backgroundColor: isDescDiff ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.02)",
                        color: isDescDiff ? "#34d399" : "var(--color-text-main)",
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
                      backgroundColor: "rgba(49, 130, 246, 0.05)",
                      border: "1px solid rgba(49, 130, 246, 0.2)",
                      borderRadius: "12px",
                      padding: "16px"
                    }}>
                      <span style={{
                        fontSize: "0.82rem",
                        color: "var(--color-primary)",
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
                            <div style={{ color: "var(--color-primary)", fontWeight: 700, minWidth: "90px" }}>
                              {formatDateLabel(item.date)}
                            </div>
                            <div>
                              <strong style={{ color: "#ffffff", display: "block", marginBottom: "2px" }}>
                                {item.title}
                              </strong>
                              <span style={{ color: "var(--color-text-sub)" }}>{item.desc}</span>
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
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "20px",
                  marginTop: "8px"
                }}>
                  <button
                    onClick={() => handleAction(req.id, "reject")}
                    disabled={processingId !== null}
                    style={{
                      padding: "12px 24px",
                      borderRadius: "10px",
                      border: "1px solid rgba(240, 68, 56, 0.3)",
                      backgroundColor: "transparent",
                      color: "#f87171",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      cursor: processingId !== null ? "not-allowed" : "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      if (processingId === null) {
                        e.currentTarget.style.backgroundColor = "rgba(240, 68, 56, 0.1)";
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
                      backgroundColor: "var(--color-primary)",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      cursor: processingId !== null ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      boxShadow: "0 4px 12px rgba(49, 130, 246, 0.15)"
                    }}
                    onMouseEnter={(e) => {
                      if (processingId === null) {
                        e.currentTarget.style.backgroundColor = "var(--color-primary-hover)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (processingId === null) {
                        e.currentTarget.style.backgroundColor = "var(--color-primary)";
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
  );
}
