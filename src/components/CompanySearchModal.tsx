"use client";

import React, { useState } from "react";
import { vibrateDevice, useAppModalBack } from "@/lib/appBridge";

export interface SelectedCompany {
  b_no: string;
  b_nm: string;
  p_nm: string;
  b_adr: string;
  b_sector: string;
}

interface CompanySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCompany: (company: SelectedCompany) => void;
  title?: string;
  description?: string;
}

export default function CompanySearchModal({
  isOpen,
  onClose,
  onSelectCompany,
  title = "🔍 기업 DB에서 정보 불러오기",
  description = "마음데이타의 실시간 기업 DB에서 거래처 정보를 검색하여 서식에 자동 입력합니다."
}: CompanySearchModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SelectedCompany[]>([]);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setErrorMsg("검색어는 2글자 이상 입력해 주세요.");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    setSearched(true);
    vibrateDevice(20);

    try {
      const res = await fetch(`/api/extension/search?query=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        throw new Error("검색 결과를 불러올 수 없습니다.");
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "검색 중 오류가 발생했습니다.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (company: SelectedCompany) => {
    vibrateDevice(40);
    onSelectCompany(company);
    onClose();
  };

  useAppModalBack(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        backdropFilter: "blur(6px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--color-card)",
          width: "100%",
          maxWidth: "520px",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxHeight: "85vh"
        }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)" }}>
              {title}
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "var(--color-text-sub)" }}>
              {description}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: "none",
              border: "none",
              fontSize: "1.4rem",
              cursor: "pointer",
              color: "var(--color-text-desc)",
              padding: "4px"
            }}
          >
            ✕
          </button>
        </div>

        {/* 검색 폼 */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="상호명 또는 사업자번호 입력 (예: 삼성전자, 토스)"
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              color: "var(--color-text-main)",
              fontSize: "0.95rem"
            }}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.92rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "검색 중..." : "검색"}
          </button>
        </form>

        {errorMsg && (
          <div style={{ fontSize: "0.82rem", color: "#dc2626", fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}

        {/* 결과 리스트 */}
        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "10px", minHeight: "150px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-sub)", fontSize: "0.9rem" }}>
              기업 DB를 실시간 조회 중입니다...
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-sub)", fontSize: "0.9rem" }}>
              검색된 기업 정보가 없습니다.<br />정확한 상호명이나 사업자번호를 입력해 보세요.
            </div>
          )}

          {!loading && !searched && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-desc)", fontSize: "0.85rem" }}>
              💡 거래처 상호명을 검색하면<br /><strong>사업자번호, 대표자명, 본점 주소</strong>가 1초 만에 자동 기입됩니다.
            </div>
          )}

          {!loading && results.map((item, idx) => {
            const cleanBno = item.b_no ? item.b_no.replace(/[^0-9]/g, "") : "";
            const formattedBno = cleanBno.length === 10
              ? cleanBno.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3")
              : item.b_no;

            return (
              <div
                key={idx}
                onClick={() => handleSelect(item)}
                style={{
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-main)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#2563eb";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--color-text-main)" }}>
                      {item.b_nm}
                    </span>
                    {formattedBno && (
                      <span style={{ fontSize: "0.78rem", color: "#2563eb", fontWeight: 700, backgroundColor: "rgba(37, 99, 235, 0.08)", padding: "2px 6px", borderRadius: "4px" }}>
                        {formattedBno}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-sub)", display: "flex", gap: "10px" }}>
                    <span>대표: <strong>{item.p_nm || "-"}</strong></span>
                    <span>업종: {item.b_sector || "-"}</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", marginTop: "2px" }}>
                    {item.b_adr || "-"}
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                >
                  선택
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
