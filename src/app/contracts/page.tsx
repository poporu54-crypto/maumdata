"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getLocalContractIds, removeContractFromLocal } from "@/lib/contractStorage";
import { vibrateDevice, showAppToast } from "@/lib/appBridge";
import MaumDataLogo from "@/components/MaumDataLogo";

interface ContractSummary {
  id: string;
  templateId: string;
  title: string;
  status: "WAITING_PARTY_B" | "COMPLETED" | "CANCELED";
  partyAName: string;
  partyACompany: string;
  partyASignedAt: string | null;
  partyBName: string;
  partyBCompany: string;
  partyBSignedAt: string | null;
  signToken: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContractsDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [recentContracts, setRecentContracts] = useState<ContractSummary[]>([]);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 기기에 저장된 최근 계약서 자동 로드
  useEffect(() => {
    async function loadRecent() {
      const localIds = getLocalContractIds();
      if (localIds.length === 0) return;

      try {
        const res = await fetch("/api/contracts/my", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contractIds: localIds })
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.contracts)) {
          setRecentContracts(data.contracts);
        }
      } catch (e) {
        console.warn("Failed to load recent contracts", e);
      }
    }
    loadRecent();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setErrorMsg("이메일 주소 또는 휴대폰 번호를 2글자 이상 입력해 주세요.");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    setSearched(true);
    vibrateDevice(20);

    try {
      const res = await fetch(`/api/contracts/my?query=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "계약서 목록을 불러올 수 없습니다.");
      }
      setContracts(data.contracts || []);
    } catch (err: any) {
      setErrorMsg(err.message || "조회 중 오류가 발생했습니다.");
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySignLink = (token: string, e: React.MouseEvent) => {
    e.stopPropagation();
    vibrateDevice(20);
    const url = `${window.location.origin}/sign/${token}`;
    navigator.clipboard.writeText(url);
    showAppToast("서명 요청 링크가 복사되었습니다!");
    alert(`서명 링크가 복사되었습니다:\n${url}\n\n상대방에게 전달해 주세요.`);
  };

  const displayList = searched ? contracts : recentContracts;

  return (
    <div style={{ backgroundColor: "var(--bg-color-main)", minHeight: "100vh", padding: "24px 16px 100px 16px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* 상단 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <MaumDataLogo size="sm" />
              <span style={{ fontSize: "0.78rem", fontWeight: 700, backgroundColor: "#2563eb", color: "#fff", padding: "2px 8px", borderRadius: "6px" }}>
                100% 무료 전자계약
              </span>
            </div>
            <h1 style={{ margin: "4px 0 0 0", fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-main)" }}>
              📁 내 계약서 관리 보관함
            </h1>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--color-text-sub)" }}>
              회원가입 없이 <strong>이메일이나 휴대폰 번호</strong>만으로 체결 현황을 실시간 확인하고 PDF를 영구 보관합니다.
            </p>
          </div>

          <Link
            href="/form"
            className="btn-primary"
            style={{
              padding: "10px 16px",
              fontSize: "0.88rem",
              fontWeight: 700,
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
              whiteSpace: "nowrap"
            }}
          >
            + 새 계약서 작성
          </Link>
        </div>

        {/* 1. 스마트 검색 카드 */}
        <div
          style={{
            backgroundColor: "var(--color-card)",
            borderRadius: "18px",
            border: "1px solid var(--color-border)",
            padding: "20px",
            marginBottom: "24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
          }}
        >
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🔍 내 계약서 1초 찾기</span>
          </div>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="계약 시 입력했던 이메일 또는 휴대폰 번호 입력"
              style={{
                flex: 1,
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--bg-color-main)",
                color: "var(--color-text-main)",
                fontSize: "0.95rem"
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 20px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.92rem",
                cursor: loading ? "not-allowed" : "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {loading ? "조회 중..." : "조회"}
            </button>
          </form>

          {errorMsg && (
            <div style={{ fontSize: "0.82rem", color: "#dc2626", fontWeight: 600, marginTop: "8px" }}>
              {errorMsg}
            </div>
          )}

          <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", marginTop: "10px", lineHeight: 1.4 }}>
            💡 갑(작성자) 또는 을(수신자)로 참여했던 모든 계약서가 실시간으로 검색됩니다.
          </div>
        </div>

        {/* 2. 섹션 타이틀 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
            {searched ? "🔎 검색된 계약서" : "🕒 이 기기에서 최근 작성/서명한 계약서"}
            <span style={{ fontSize: "0.85rem", color: "#2563eb", fontWeight: 700 }}>
              ({displayList.length}건)
            </span>
          </h2>
          {searched && (
            <button
              type="button"
              onClick={() => {
                setSearched(false);
                setSearchQuery("");
              }}
              style={{
                background: "none",
                border: "none",
                fontSize: "0.82rem",
                color: "#64748b",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              최근 목록으로 돌아가기
            </button>
          )}
        </div>

        {/* 3. 계약서 목록 리스트 */}
        {displayList.length === 0 ? (
          <div
            style={{
              backgroundColor: "var(--color-card)",
              borderRadius: "16px",
              border: "1px dashed var(--color-border)",
              padding: "48px 20px",
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: "2.6rem", marginBottom: "10px" }}>📄</div>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)" }}>
              {searched ? "검색된 계약서가 없습니다." : "최근 작성하거나 서명한 계약서가 없습니다."}
            </h3>
            <p style={{ margin: "0 0 18px 0", fontSize: "0.85rem", color: "var(--color-text-sub)" }}>
              마음데이터의 80여 개 실무 서식으로 1초 만에 무료 계약서를 만들어 보세요.
            </p>
            <Link href="/form" className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.9rem" }}>
              무료 계약서 작성하러 가기
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {displayList.map((item) => {
              const isCompleted = item.status === "COMPLETED";

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "var(--color-card)",
                    borderRadius: "16px",
                    border: "1px solid var(--color-border)",
                    padding: "20px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    transition: "all 0.15s ease"
                  }}
                >
                  {/* 상단 뱃지 및 상태 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            backgroundColor: isCompleted ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                            color: isCompleted ? "#059669" : "#d97706"
                          }}
                        >
                          {isCompleted ? "✅ 체결 완료" : "⏳ 서명 대기 중"}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-desc)" }}>
                          {item.id}
                        </span>
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
                      padding: "12px 14px",
                      borderRadius: "10px",
                      fontSize: "0.82rem"
                    }}
                  >
                    <div>
                      <span style={{ color: "#2563eb", fontWeight: 700 }}>[갑] 의뢰/공급:</span>{" "}
                      <strong>{item.partyACompany || item.partyAName}</strong>
                      <span style={{ fontSize: "0.72rem", color: "#10b981", marginLeft: "4px" }}>(서명완료)</span>
                    </div>
                    <div>
                      <span style={{ color: "#059669", fontWeight: 700 }}>[을] 수신/수임:</span>{" "}
                      <strong>{item.partyBCompany || item.partyBName || "상대방"}</strong>
                      <span style={{ fontSize: "0.72rem", color: isCompleted ? "#10b981" : "#f59e0b", marginLeft: "4px" }}>
                        {isCompleted ? "(서명완료)" : "(대기중)"}
                      </span>
                    </div>
                  </div>

                  {/* 액션 버튼 바 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "12px", marginTop: "4px", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-sub)" }}>
                      {isCompleted
                        ? `체결시각: ${new Date(item.partyBSignedAt || item.updatedAt).toLocaleString("ko-KR")}`
                        : "상대방이 서명하면 상태가 실시간 체결 완료로 전환됩니다."}
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      {!isCompleted && item.signToken && (
                        <button
                          type="button"
                          onClick={(e) => handleCopySignLink(item.signToken, e)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: "1px solid #3b82f6",
                            backgroundColor: "rgba(59, 130, 246, 0.08)",
                            color: "#2563eb",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: "pointer"
                          }}
                        >
                          🔗 서명 링크 복사
                        </button>
                      )}

                      <Link
                        href={`/sign/${item.signToken}`}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "8px",
                          backgroundColor: isCompleted ? "#059669" : "#2563eb",
                          color: "#ffffff",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                        }}
                      >
                        <span>{isCompleted ? "🖨️ 최종 계약서 및 증명서 보기" : "✍️ 계약서 열기 및 서명"}</span>
                        <span>➔</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
