"use client";

import React, { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { validateBizrNo } from "@/lib/bizValidation";
import { vibrateDevice } from "@/lib/appBridge";

const BusinessCardScannerModal = dynamic(() => import("./BusinessCardScannerModal"), {
  ssr: false,
});

export default function SearchForm() {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // 사업자번호 포맷팅 (XXX-XX-XXXXX)
  const formatBusinessNumber = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (cleanValue.length <= 3) {
      return cleanValue;
    } else if (cleanValue.length <= 5) {
      return `${cleanValue.slice(0, 3)}-${cleanValue.slice(3)}`;
    } else {
      return `${cleanValue.slice(0, 3)}-${cleanValue.slice(3, 5)}-${cleanValue.slice(5, 10)}`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const isNumericOrHyphen = /^[0-9-]*$/.test(rawValue);
    
    if (isNumericOrHyphen) {
      const formatted = formatBusinessNumber(rawValue);
      if (formatted.replace(/[^0-9]/g, "").length <= 10) {
        setQuery(formatted);
      }
    } else {
      setQuery(rawValue);
    }
    setError("");
  };

  const executeSearch = (targetQuery: string) => {
    const trimmed = targetQuery.trim();
    if (trimmed.length < 2) {
      setError("두 글자 이상 입력해 주세요.");
      return;
    }

    // 스마트 행정동 검색 매핑
    const dongMapping: Record<string, string> = {
      "역삼동": "1168064000",
      "역삼1동": "1168064000",
      "역삼2동": "1168065000",
      "우동": "2635051000",
      "우1동": "2635051000",
      "해운대우동": "2635051000",
      "해운대 우동": "2635051000",
      "사당동": "1159062000",
      "사당1동": "1159062000",
      "범어동": "2726051000",
      "범어1동": "2726051000",
      "삼평동": "4113565500",
      "분당 삼평동": "4113565500",
      "구월동": "2820051000",
      "구월1동": "2820051000",
      "치평동": "1224074500",
      "둔산동": "3017064000",
      "둔산2동": "3017064000",
      "삼산동": "3114057000",
      "보람동": "3611056000",
      "퇴계동": "5111066000",
      "성안동": "4311154500",
      "불당동": "4413356600",
      "불당1동": "4413356600",
      "효자동": "5211173000",
      "효자5동": "5211173000",
      "여천동": "1213080000",
      "제철동": "4711157000",
      "상남동": "4812353000",
      "노형동": "5011066000",
    };

    const navigateTo = (targetHref: string) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("maumdata:nav-start"));
      }
      startTransition(() => {
        router.push(targetHref);
      });
    };

    const targetDongCd = dongMapping[trimmed];
    if (targetDongCd) {
      navigateTo(`/stats/market-area/${targetDongCd}`);
      return;
    }

    const cleanNumber = trimmed.replace(/[^0-9]/g, "");
    const isOnlyNumberInput = /^[0-9-]*$/.test(trimmed);
    if (isOnlyNumberInput && cleanNumber.length === 10) {
      if (!validateBizrNo(cleanNumber)) {
        setError("유효하지 않은 사업자등록번호 형식입니다 (체크섬 수학적 검증 실패).");
        return;
      }
      navigateTo(`/biz/${cleanNumber}`);
    } else {
      navigateTo(`/search?query=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  // 모바일/PC 추천 빠른 검색 키워드 칩
  const quickSuggestions = [
    { label: "명함/등록증 스캔", value: "__SCAN__", icon: "📷", isScan: true },
    { label: "삼성전자", value: "삼성전자", icon: "🏢" },
    { label: "토스", value: "토스", icon: "🦄" },
    { label: "스타벅스", value: "스타벅스", icon: "☕" },
    { label: "카카오", value: "카카오", icon: "🚀" },
    { label: "역삼동 상권", value: "역삼동", icon: "📍" },
    { label: "137-86-51839", value: "137-86-51839", icon: "🔢" },
  ];

  return (
    <div style={{ marginBottom: "28px" }}>
      <form onSubmit={handleSearch}>
        <div
          className="search-input-box"
          style={{
            padding: "6px 8px 6px 20px",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 10px 30px rgba(49, 130, 246, 0.08)",
            border: error ? "2px solid var(--color-danger)" : "1.5px solid var(--color-border)",
            backgroundColor: "var(--bg-color-card)",
            transition: "all 0.25s ease",
          }}
        >
          <div style={{ fontSize: "1.3rem", marginRight: "12px", color: "var(--color-primary)", display: "flex", alignItems: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <input
            type="text"
            placeholder="사업자번호(10자리), 상호명, 대표자 검색"
            value={query}
            onChange={handleInputChange}
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              background: "transparent",
              fontSize: "1.05rem", // iOS 사파리 자동 줌 방지(16px 이상)
              fontWeight: 600,
              color: "var(--color-text-main)",
              padding: "14px 8px 14px 0",
              outline: "none",
            }}
          />

          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setError(""); }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-text-desc)",
                cursor: "pointer",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                marginRight: "4px",
              }}
              aria-label="입력 지우기"
            >
              ✕
            </button>
          )}

                    {/* 명함/사업자등록증 카메라 스캔 버튼 */}
          <button
            type="button"
            onClick={() => {
              vibrateDevice(30);
              setIsScannerOpen(true);
            }}
            style={{
              background: "rgba(37, 99, 235, 0.08)",
              border: "1px solid rgba(37, 99, 235, 0.2)",
              color: "#2563eb",
              cursor: "pointer",
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              borderRadius: "10px",
              marginRight: "6px",
              fontSize: "0.82rem",
              fontWeight: 700,
              flexShrink: 0
            }}
            title="명함 또는 사업자등록증 촬영 스캔"
          >
            <span style={{ fontSize: "1.1rem" }}>📷</span>
            <span style={{ display: "inline-block" }}>스캔</span>
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary"
            style={{
              borderRadius: "14px",
              padding: "12px 22px",
              fontSize: "0.95rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 14px rgba(49, 130, 246, 0.35)",
              border: "none",
              opacity: isPending ? 0.8 : 1,
            }}
          >
            {isPending ? "조회 중..." : "조회"}
          </button>
        </div>

        {error && (
          <p
            style={{
              color: "var(--color-danger)",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginTop: "8px",
              paddingLeft: "16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        )}
      </form>

      {/* 모바일 친화적 빠른 추천 칩 영역 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          padding: "10px 4px 4px 4px",
          scrollbarWidth: "none",
        }}
      >
        <span style={{ fontSize: "0.8rem", color: "var(--color-text-desc)", fontWeight: 700, whiteSpace: "nowrap" }}>
          추천:
        </span>
        {quickSuggestions.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              if ((item as any).isScan) {
                vibrateDevice(30);
                setIsScannerOpen(true);
                return;
              }
              setQuery(item.value);
              executeSearch(item.value);
            }}
            style={{
              background: "var(--bg-color-main)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              padding: "5px 12px",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--color-text-sub)",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "var(--transition-smooth)",
            }}
            className="suggestion-chip"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* 명함 · 사업자등록증 카메라 스캔 모달 (온디맨드 조건부 마운트) */}
      {isScannerOpen && (
        <BusinessCardScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onDetectedBusinessNo={(bNo) => {
            setQuery(bNo);
            executeSearch(bNo);
          }}
        />
      )}
    </div>
  );
}
