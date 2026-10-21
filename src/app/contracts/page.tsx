"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getLocalContractIds,
  removeContractFromLocal,
  getLoggedInUser,
  setLoggedInUser,
  ContractUser,
} from "@/lib/contractStorage";
import { vibrateDevice, showAppToast } from "@/lib/appBridge";
import MaumDataLogo from "@/components/MaumDataLogo";
import ContractAuthModal from "@/components/ContractAuthModal";

interface ContractSummary {
  id: string;
  templateId: string;
  title: string;
  status: "WAITING_PARTY_B" | "COMPLETED" | "CANCELED";
  partyAName: string;
  partyACompany: string;
  partyASignedAt: string | null;
  partyAUserId?: string;
  partyBName: string;
  partyBCompany: string;
  partyBSignedAt: string | null;
  partyBUserId?: string;
  signToken: string;
  accessPin?: string;
  r2Key?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContractsDashboardPage() {
  const [currentUser, setCurrentUser] = useState<ContractUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [filterTab, setFilterTab] = useState<"ALL" | "COMPLETED" | "WAITING">("ALL");

  const fetchMyVault = useCallback(async (user: ContractUser | null) => {
    setLoading(true);
    try {
      const localIds = getLocalContractIds();
      if (!user && localIds.length === 0) {
        setContracts([]);
        return;
      }

      const res = await fetch("/api/contracts/my", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "",
          userEmail: user?.email || "",
          contractIds: localIds,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.contracts)) {
        setContracts(data.contracts);
      }
    } catch (e) {
      console.warn("Failed to load vault contracts:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 세션 및 소셜 로그인 콜백 파라미터 처리
  useEffect(() => {
    let activeUser = getLoggedInUser();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const oauthSession = params.get("oauth_session");
      const authError = params.get("auth_error");

      if (oauthSession) {
        try {
          const decoded = oauthSession.trim().startsWith("{")
            ? oauthSession
            : decodeURIComponent(escape(window.atob(oauthSession)));
          const parsed = JSON.parse(decoded) as ContractUser;
          if (parsed && parsed.id) {
            setLoggedInUser(parsed);
            activeUser = parsed;
            showAppToast(`${parsed.name}님 환영합니다! 영구 계약 보관함이 연결되었습니다.`);
          }
        } catch (err) {
          console.error("Failed to parse oauth session", err);
        }
        window.history.replaceState({}, "", "/contracts");
      } else if (authError) {
        if (authError === "kakao_not_configured" || authError === "google_not_configured") {
          alert(
            "소셜 로그인 키가 아직 설정되지 않았습니다.\n아래 '이메일 1초 간편 시작'으로 바로 이용하실 수 있습니다."
          );
          setIsAuthModalOpen(true);
        }
        window.history.replaceState({}, "", "/contracts");
      }
    }

    setCurrentUser(activeUser);
    fetchMyVault(activeUser);
  }, [fetchMyVault]);

  const handleLogout = () => {
    vibrateDevice(20);
    setLoggedInUser(null);
    setCurrentUser(null);
    fetchMyVault(null);
    showAppToast("로그아웃되었습니다.");
  };

  const handleDeleteContract = async (contractId: string, title: string) => {
    vibrateDevice(25);
    const ok = window.confirm(
      `'${title}' 계약서를 내 보관함에서 삭제하시겠습니까?\n(삭제하면 내 보관함 목록에서 영구히 제외됩니다)`
    );
    if (!ok) return;

    try {
      removeContractFromLocal(contractId);
      await fetch("/api/contracts/my", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          contractId,
          userId: currentUser?.id || "",
        }),
      });
      setContracts((prev) => prev.filter((c) => c.id !== contractId));
      showAppToast("계약서가 보관함에서 삭제되었습니다.");
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleCopyInviteLink = (item: ContractSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    vibrateDevice(20);
    const url = `${window.location.origin}/sign/${item.signToken}`;
    const pinLine = item.accessPin ? `\n🔑 열람용 임시 비밀번호: ${item.accessPin}` : "";
    const text = `[마음데이터 전자계약 서명 요청]\n'${item.title}' 계약서 전용 주소입니다.\n\n👉 계약서 주소:\n${url}${pinLine}`;
    navigator.clipboard.writeText(text);
    showAppToast("계약서 주소와 임시 비밀번호가 복사되었습니다!");
    alert(`계약서 주소와 임시 비밀번호가 복사되었습니다:\n\n${url}${pinLine}`);
  };

  const filteredList = contracts.filter((item) => {
    if (filterTab === "COMPLETED") return item.status === "COMPLETED";
    if (filterTab === "WAITING") return item.status !== "COMPLETED";
    return true;
  });

  return (
    <div style={{ backgroundColor: "var(--bg-color-main)", minHeight: "100vh", padding: "32px 0 100px 0" }}>
      <div className="container">
        {/* 상단 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                📁 내 계약서 영구 보관함
              </h1>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, backgroundColor: "#2563eb", color: "#fff", padding: "3px 10px", borderRadius: "6px" }}>
                Cloudflare R2 영구 보관소
              </span>
            </div>
            <p style={{ margin: "6px 0 0 0", fontSize: "0.85rem", color: "var(--color-text-sub)" }}>
              계약서 파일을 일일이 다운받지 않아도, 내가 직접 지우기 전까지 보낸 계약과 받은 계약이 안전하게 영구 보관됩니다.
            </p>
          </div>

          <Link
            href="/form"
            className="btn-primary"
            style={{
              padding: "10px 18px",
              fontSize: "0.9rem",
              fontWeight: 800,
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
              whiteSpace: "nowrap",
            }}
          >
            + 새 계약서 작성
          </Link>
        </div>

        {/* 1. 계정 연동 & 보안 상태 배너 (무단 번호 조회 원천 차단) */}
        <div
          style={{
            backgroundColor: "var(--color-card)",
            borderRadius: "18px",
            border: currentUser ? "1.5px solid rgba(37, 99, 235, 0.3)" : "1px solid var(--color-border)",
            padding: "22px 24px",
            marginBottom: "24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          {currentUser ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "14px",
                    backgroundColor: "rgba(37, 99, 235, 0.1)",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    fontWeight: 900,
                  }}
                >
                  ☁️
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                      {currentUser.name}님의 전용 클라우드 보관함
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "#059669",
                        backgroundColor: "rgba(16, 185, 129, 0.12)",
                        padding: "2px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      🔒 본인 인증 보호 중
                    </span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--color-text-sub)", marginTop: "3px" }}>
                    연동 계정: <strong>{currentUser.email}</strong> · 다른 사람은 내 계약서를 절대 검색하거나 열람할 수 없습니다.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-main)",
                  color: "var(--color-text-sub)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "14px",
                    backgroundColor: "rgba(37, 99, 235, 0.1)",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                  }}
                >
                  🔐
                </div>
                <div>
                  <div style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                    기기가 바뀌어도 평생 보관하려면 보관함에 로그인하세요
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--color-text-sub)", marginTop: "3px" }}>
                    타인의 무단 조회를 막기 위해 <strong>로그인한 본인에게만</strong> 계약서 리스트가 표시됩니다.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  vibrateDevice(20);
                  setIsAuthModalOpen(true);
                }}
                style={{
                  padding: "11px 20px",
                  borderRadius: "12px",
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                  whiteSpace: "nowrap",
                }}
              >
                🚀 소셜 / 1초 간편 로그인
              </button>
            </>
          )}
        </div>

        {/* 2. 필터 탭 & 카운트 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { key: "ALL", label: `전체 보관함 (${contracts.length})` },
              {
                key: "COMPLETED",
                label: `체결 완료 (${contracts.filter((c) => c.status === "COMPLETED").length})`,
              },
              {
                key: "WAITING",
                label: `서명 진행 중 (${contracts.filter((c) => c.status !== "COMPLETED").length})`,
              },
            ].map((tab) => {
              const active = filterTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterTab(tab.key as any)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    border: active ? "none" : "1px solid var(--color-border)",
                    backgroundColor: active ? "#2563eb" : "var(--color-card)",
                    color: active ? "#ffffff" : "var(--color-text-sub)",
                    fontWeight: 700,
                    fontSize: "0.84rem",
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)" }}>
            * 본인이 직접 [삭제] 버튼을 누르기 전까지 영구 보존됩니다.
          </div>
        </div>

        {/* 3. 계약서 목록 리스트 */}
        {loading ? (
          <div
            style={{
              backgroundColor: "var(--color-card)",
              borderRadius: "16px",
              border: "1px solid var(--color-border)",
              padding: "48px 20px",
              textAlign: "center",
              color: "var(--color-text-sub)",
            }}
          >
            보관함에서 계약서 목록을 불러오는 중입니다...
          </div>
        ) : filteredList.length === 0 ? (
          <div
            style={{
              backgroundColor: "var(--color-card)",
              borderRadius: "16px",
              border: "1px dashed var(--color-border)",
              padding: "56px 20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2.6rem", marginBottom: "10px" }}>📄</div>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)" }}>
              보관된 계약서가 없습니다
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "0.85rem", color: "var(--color-text-sub)" }}>
              새 계약서를 작성해 상대방에게 전용 주소를 보내거나, 기존 계정으로 로그인해 보세요.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
              <Link href="/form" className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.9rem" }}>
                + 무료 계약서 작성하러 가기
              </Link>
              {!currentUser && (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--bg-color-main)",
                    color: "var(--color-text-main)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  기존 보관함 로그인
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredList.map((item) => {
              const isCompleted = item.status === "COMPLETED";

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "var(--color-card)",
                    borderRadius: "16px",
                    border: "1px solid var(--color-border)",
                    padding: "20px 24px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {/* 상단 뱃지 및 상태 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            backgroundColor: isCompleted ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                            color: isCompleted ? "#059669" : "#d97706",
                          }}
                        >
                          {isCompleted ? "✅ 체결 완료" : "⏳ 상대방 서명 대기 중"}
                        </span>
                        <span
                          style={{
                            fontSize: "0.73rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            backgroundColor: "rgba(37, 99, 235, 0.08)",
                            color: "#2563eb",
                          }}
                        >
                          ☁️ R2 영구보관
                        </span>
                        {!isCompleted && item.accessPin && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              padding: "3px 8px",
                              borderRadius: "6px",
                              backgroundColor: "#f1f5f9",
                              color: "#1e293b",
                            }}
                          >
                            🔑 임시 비밀번호: {item.accessPin}
                          </span>
                        )}
                      </div>
                      <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                        {item.title}
                      </h3>
                    </div>

                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", textAlign: "right" }}>
                      작성일: {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                    </div>
                  </div>

                  {/* 당사자 정보 카드 */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      backgroundColor: "var(--bg-color-main)",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      fontSize: "0.84rem",
                    }}
                  >
                    <div>
                      <span style={{ color: "#2563eb", fontWeight: 700 }}>[갑] 작성자:</span>{" "}
                      <strong>{item.partyACompany || item.partyAName}</strong>
                      <span style={{ fontSize: "0.74rem", color: "#10b981", marginLeft: "6px", fontWeight: 700 }}>
                        (서명완료)
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "#059669", fontWeight: 700 }}>[을] 상대방:</span>{" "}
                      <strong>{item.partyBCompany || item.partyBName || "상대방"}</strong>
                      <span
                        style={{
                          fontSize: "0.74rem",
                          color: isCompleted ? "#10b981" : "#f59e0b",
                          marginLeft: "6px",
                          fontWeight: 700,
                        }}
                      >
                        {isCompleted ? "(서명완료)" : "(서명대기)"}
                      </span>
                    </div>
                  </div>

                  {/* 액션 버튼 바 */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid var(--color-border)",
                      paddingTop: "12px",
                      marginTop: "2px",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-sub)" }}>
                      {isCompleted
                        ? `최종 체결 일시: ${new Date(item.partyBSignedAt || item.updatedAt).toLocaleString("ko-KR")}`
                        : "전용 주소와 임시 비밀번호를 상대방에게 전달하면 그 주소에서 즉시 서명이 완료됩니다."}
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      {!isCompleted && item.signToken && (
                        <button
                          type="button"
                          onClick={(e) => handleCopyInviteLink(item, e)}
                          style={{
                            padding: "7px 12px",
                            borderRadius: "8px",
                            border: "1px solid #3b82f6",
                            backgroundColor: "rgba(59, 130, 246, 0.08)",
                            color: "#2563eb",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                          }}
                        >
                          📋 주소+임시비번 복사
                        </button>
                      )}

                      <Link
                        href={`/sign/${item.signToken}`}
                        style={{
                          padding: "7px 14px",
                          borderRadius: "8px",
                          backgroundColor: isCompleted ? "#059669" : "#2563eb",
                          color: "#ffffff",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>{isCompleted ? "🖨️ 체결본 열람 / PDF 인쇄" : "✍️ 계약서 주소 열기"}</span>
                        <span>➔</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteContract(item.id, item.title)}
                        style={{
                          padding: "7px 10px",
                          borderRadius: "8px",
                          border: "1px solid var(--color-border)",
                          backgroundColor: "transparent",
                          color: "#ef4444",
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          cursor: "pointer",
                        }}
                        title="내 보관함에서 영구 삭제"
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 로그인 모달 */}
      <ContractAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          fetchMyVault(user);
        }}
      />
    </div>
  );
}
