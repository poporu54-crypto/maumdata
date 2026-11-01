"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminDashboard, {
  type EditRequest,
  type AdminStats,
  type NoNameBusiness,
} from "@/components/AdminDashboard";

interface FeedbackItem {
  id: number;
  message: string;
  url: string;
  userAgent?: string;
  userId?: string;
  category?: string;
  status: string;
  createdAt: string;
}

function getSafeFeedbackHref(rawUrl: string | undefined | null): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export default function AdminPage() {
  const [inputKey, setInputKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [adminMode, setAdminMode] = useState<"feedback" | "company">("feedback");

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [companyStats, setCompanyStats] = useState<AdminStats>({
    totalBusinesses: 0,
    noNameBusinesses: 0,
    pendingRequests: 0,
    totalViews: 0,
  });
  const [noNameBusinesses, setNoNameBusinesses] = useState<NoNameBusiness[]>([]);

  const loadAllAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [fbRes, reqRes, statsRes] = await Promise.all([
        fetch("/api/feedback", { cache: "no-store" }),
        fetch("/api/admin/requests", { cache: "no-store" }),
        fetch("/api/admin/bulk-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ onlyStats: true }),
        }),
      ]);

      if (fbRes.status === 401 || fbRes.status === 403) {
        setIsAuthenticated(false);
        return;
      }

      if (fbRes.ok) {
        const fbData = await fbRes.json();
        setFeedbacks(fbData.feedbacks || []);
      }

      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setEditRequests(reqData.requests || []);
      }

      if (statsRes.ok) {
        const stData = await statsRes.json();
        if (stData.stats) setCompanyStats(stData.stats);
        if (Array.isArray(stData.noNameBusinesses)) {
          setNoNameBusinesses(stData.noNameBusinesses);
        }
      }
    } catch (err) {
      console.error("관리자 데이터 로드 오류:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 마운트 시 레거시 평문 스토리지 정리 및 서명 세션 쿠키 확인
  useEffect(() => {
    try {
      sessionStorage.removeItem("maumdata_admin_key");
      localStorage.removeItem("maumdata_admin_key");
    } catch {
      // ignore storage errors
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/login", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && data.authenticated) {
          setIsAuthenticated(true);
          await loadAllAdminData();
        }
      } catch {
        // ignore network errors on initial check
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadAllAdminData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    setLoading(true);
    setError("");
    try {
      const loginRes = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: inputKey.trim() }),
      });

      const data = await loginRes.json().catch(() => ({}));
      if (!loginRes.ok || !data.success) {
        throw new Error(data.error || "관리자 비밀번호가 올바르지 않습니다.");
      }

      setInputKey("");
      setIsAuthenticated(true);
      await loadAllAdminData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "로그인에 실패했습니다.";
      setError(message);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("관리자 세션을 로그아웃 하시겠습니까?")) return;
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore logout network errors
    }
    setIsAuthenticated(false);
    setInputKey("");
    setFeedbacks([]);
    setEditRequests([]);
    setNoNameBusinesses([]);
  };

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === "RESOLVED" ? "PENDING" : "RESOLVED";
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: nextStatus } : f))
        );
      } else {
        alert("상태 변경에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("해당 피드백을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      } else {
        alert("삭제 실패");
      }
    } catch {
      alert("네트워크 오류");
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesStatus = statusFilter === "ALL" ? true : f.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === ""
        ? true
        : f.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          Boolean(f.userId && f.userId.toLowerCase().includes(searchQuery.toLowerCase())) ||
          Boolean(f.url && f.url.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const pendingCount = feedbacks.filter((f) => f.status === "PENDING").length;
  const resolvedCount = feedbacks.filter((f) => f.status === "RESOLVED").length;

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case "bug":
        return { label: "🐛 버그 신고", bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" };
      case "data_error":
        return { label: "🏢 기업 정보 수정", bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" };
      case "inquiry":
        return { label: "❓ 일반 문의", bg: "rgba(168, 85, 247, 0.15)", color: "#a855f7" };
      default:
        return { label: "💡 기능 제안", bg: "rgba(49, 130, 246, 0.15)", color: "#3182f6" };
    }
  };

  if (checkingSession) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--color-text-desc)", fontSize: "0.95rem", fontWeight: 600 }}>
          관리자 세션을 확인하고 있습니다...
        </div>
      </div>
    );
  }

  // 1. 로그인 전 화면
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div
          className="card"
          style={{
            maxWidth: "400px",
            width: "100%",
            padding: "40px 32px",
            textAlign: "center",
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔐</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
            마음데이타 관리자 센터
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--color-text-desc)", marginBottom: "24px" }}>
            관리자 인증 비밀번호를 입력해주세요.
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input
              type="password"
              placeholder="관리자 인증키 입력"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              required
              autoFocus
              autoComplete="current-password"
              style={{
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--bg-color-main)",
                color: "var(--color-text-main)",
                fontSize: "1rem",
                outline: "none",
                textAlign: "center",
              }}
            />

            {error && (
              <div style={{ color: "var(--color-danger)", fontSize: "0.85rem", fontWeight: 600 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                padding: "14px",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "인증 중..." : "로그인"}
            </button>
          </form>

          <div style={{ marginTop: "24px" }}>
            <Link href="/" prefetch={false} style={{ color: "var(--color-text-desc)", fontSize: "0.85rem", textDecoration: "underline" }}>
              ← 홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. 관리자 통합 대시보드 화면
  return (
    <div className="animate-fade-in" style={{ padding: "32px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "1180px" }}>
        {/* 상단 헤더 바 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "24px",
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: "20px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span style={{ fontSize: "1.5rem" }}>🛡️</span>
              <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
                마음데이타 관리자 대시보드
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--color-text-desc)" }}>
              고객 피드백·버그 제보와 기업 정보 수정 제안·누락 상호 데이터를 한곳에서 통합 관리합니다.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={loadAllAdminData}
              disabled={loading}
              style={{
                backgroundColor: "var(--bg-color-card)",
                color: "var(--color-text-main)",
                border: "1px solid var(--color-border)",
                padding: "10px 16px",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "0.88rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              🔄 새로고침
            </button>
            <Link
              href="/"
              prefetch={false}
              style={{
                backgroundColor: "var(--bg-color-card)",
                color: "var(--color-text-main)",
                border: "1px solid var(--color-border)",
                padding: "10px 16px",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "0.88rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              🏠 사이트 홈
            </Link>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "var(--color-danger)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                padding: "10px 16px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
              }}
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 최상위 관리 모드 탭 */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setAdminMode("feedback")}
            style={{
              padding: "12px 20px",
              borderRadius: "12px",
              border:
                adminMode === "feedback"
                  ? "1px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
              backgroundColor:
                adminMode === "feedback" ? "var(--color-primary)" : "var(--bg-color-card)",
              color: adminMode === "feedback" ? "#ffffff" : "var(--color-text-main)",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            💬 고객 피드백 관리 ({pendingCount}건 대기)
          </button>
          <button
            type="button"
            onClick={() => setAdminMode("company")}
            style={{
              padding: "12px 20px",
              borderRadius: "12px",
              border:
                adminMode === "company"
                  ? "1px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
              backgroundColor:
                adminMode === "company" ? "var(--color-primary)" : "var(--bg-color-card)",
              color: adminMode === "company" ? "#ffffff" : "var(--color-text-main)",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            🏢 기업 수정 제안 · 누락 상호 관리 ({editRequests.length}건 대기)
          </button>
        </div>

        {adminMode === "company" ? (
          <AdminDashboard
            embedded
            initialRequests={editRequests}
            stats={companyStats}
            noNameBusinesses={noNameBusinesses}
          />
        ) : (
          <>
            {/* 핵심 통계 지표 카드 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              <div className="card" style={{ padding: "20px 24px" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", fontWeight: 600 }}>
                  총 접수된 피드백
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-text-main)", marginTop: "8px" }}>
                  {feedbacks.length}건
                </div>
              </div>
              <div className="card" style={{ padding: "20px 24px", borderColor: "rgba(245, 158, 11, 0.3)" }}>
                <div style={{ fontSize: "0.85rem", color: "#f59e0b", fontWeight: 600 }}>
                  검토 대기 중 (PENDING)
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f59e0b", marginTop: "8px" }}>
                  {pendingCount}건
                </div>
              </div>
              <div className="card" style={{ padding: "20px 24px", borderColor: "rgba(16, 185, 129, 0.3)" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--color-success)", fontWeight: 600 }}>
                  처리 완료 (RESOLVED)
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-success)", marginTop: "8px" }}>
                  {resolvedCount}건
                </div>
              </div>
            </div>

            {/* 필터 및 검색 바 */}
            <div
              className="card"
              style={{
                padding: "16px 20px",
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { id: "ALL", label: `전체 (${feedbacks.length})` },
                  { id: "PENDING", label: `대기 중 (${pendingCount})` },
                  { id: "RESOLVED", label: `완료됨 (${resolvedCount})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor:
                        statusFilter === tab.id ? "var(--color-primary)" : "var(--bg-color-main)",
                      color: statusFilter === tab.id ? "#ffffff" : "var(--color-text-sub)",
                      fontWeight: statusFilter === tab.id ? 700 : 500,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ minWidth: "250px" }}>
                <input
                  type="text"
                  placeholder="내용, 연락처, URL 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--bg-color-main)",
                    color: "var(--color-text-main)",
                    fontSize: "0.85rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* 피드백 리스트 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {filteredFeedbacks.length === 0 ? (
                <div
                  className="card"
                  style={{
                    padding: "60px 20px",
                    textAlign: "center",
                    color: "var(--color-text-desc)",
                  }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📭</div>
                  <p style={{ margin: 0, fontSize: "1rem" }}>해당 조건의 피드백이 존재하지 않습니다.</p>
                </div>
              ) : (
                filteredFeedbacks.map((f) => {
                  const badge = getCategoryBadge(f.category);
                  const isResolved = f.status === "RESOLVED";
                  const safeHref = getSafeFeedbackHref(f.url);

                  return (
                    <div
                      key={f.id}
                      className="card"
                      style={{
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                        borderLeft: `5px solid ${isResolved ? "var(--color-success)" : "#f59e0b"}`,
                        transition: "all 0.2s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.color,
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                            }}
                          >
                            {badge.label}
                          </span>
                          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-desc)" }}>
                            #{f.id}
                          </span>
                          <span style={{ fontSize: "0.82rem", color: "var(--color-text-desc)" }}>
                            {new Date(f.createdAt).toLocaleString("ko-KR")}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button
                            onClick={() => handleUpdateStatus(f.id, f.status)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              border: `1px solid ${
                                isResolved ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"
                              }`,
                              backgroundColor: isResolved
                                ? "rgba(16, 185, 129, 0.1)"
                                : "rgba(245, 158, 11, 0.1)",
                              color: isResolved ? "var(--color-success)" : "#f59e0b",
                            }}
                          >
                            {isResolved ? "✓ 완료됨" : "⚡ 대기 중"} (클릭 전환)
                          </button>
                          <button
                            onClick={() => handleDelete(f.id)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "8px",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              border: "1px solid var(--color-border)",
                              backgroundColor: "transparent",
                              color: "var(--color-text-desc)",
                            }}
                            title="피드백 삭제"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: "0.95rem",
                          lineHeight: 1.6,
                          color: "var(--color-text-main)",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                          backgroundColor: "var(--bg-color-main)",
                          padding: "16px",
                          borderRadius: "10px",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {f.message}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "16px",
                          fontSize: "0.82rem",
                          color: "var(--color-text-desc)",
                          borderTop: "1px solid var(--color-border)",
                          paddingTop: "12px",
                        }}
                      >
                        {f.userId && f.userId !== "anonymous" && (
                          <div>
                            <strong>작성자/연락처:</strong>{" "}
                            <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>{f.userId}</span>
                          </div>
                        )}
                        {f.url && (
                          <div>
                            <strong>접수 위치:</strong>{" "}
                            {safeHref ? (
                              <a
                                href={safeHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "var(--color-primary)",
                                  textDecoration: "underline",
                                  wordBreak: "break-all",
                                }}
                              >
                                {safeHref}
                              </a>
                            ) : (
                              <span style={{ wordBreak: "break-all" }}>{f.url}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
