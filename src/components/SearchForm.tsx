"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { validateBizrNo } from "@/lib/bizValidation";

export default function SearchForm() {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
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
    
    // 오직 숫자와 하이픈으로만 이루어진 입력인 경우에만 자동 사업자번호 포맷팅 적용
    const isNumericOrHyphen = /^[0-9-]*$/.test(rawValue);
    
    if (isNumericOrHyphen) {
      const formatted = formatBusinessNumber(rawValue);
      // 최대 10자리 숫자 기준 제한
      if (formatted.replace(/[^0-9]/g, "").length <= 10) {
        setQuery(formatted);
      }
    } else {
      // 그 외 텍스트(상호명/대표자명 등)는 원본 타이핑 그대로 입력 허용
      setQuery(rawValue);
    }
    setError("");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setError("두 글자 이상 입력해 주세요.");
      return;
    }

    // 스마트 행정동 검색 매핑
    const dongMapping: Record<string, string> = {
      "역삼동": "1168064000",
      "역삼1동": "1168064000",
      "역삼2동": "1168065000",
      "우동": "2635010500",
      "해운대우동": "2635010500",
      "해운대 우동": "2635010500",
      "사당동": "1159062000",
      "사당1동": "1159062000",
      "범어동": "2726051000",
      "범어1동": "2726051000",
      
      // 전국 광역시도 대표 행정동 검색 대응
      "삼평동": "4113510900",
      "분당 삼평동": "4113510900",
      "구월동": "2820054000",
      "구월1동": "2820054000",
      "치평동": "2914074000",
      "둔산동": "3017056000",
      "둔산2동": "3017056000",
      "삼산동": "3114059000",
      "보람동": "3611055000",
      "퇴계동": "5111059000",
      "성안동": "4311151000",
      "불당동": "4413310700",
      "효자동": "4511160500",
      "효자5동": "4511160500",
      "여천동": "4613063000",
      "제철동": "4711163000",
      "상남동": "4812355000",
      "노형동": "5011066000",
      "제주 노형동": "5011066000"
    };

    const targetDongCd = dongMapping[trimmedQuery];
    if (targetDongCd) {
      router.push(`/stats/market-area/${targetDongCd}`);
      return;
    }

    const cleanNumber = trimmedQuery.replace(/[^0-9]/g, "");
    // 숫자와 하이픈으로만 이루어지고, 숫자 10자리인 경우 사업체 상세로 바로 이동
    const isOnlyNumberInput = /^[0-9-]*$/.test(trimmedQuery);
    if (isOnlyNumberInput && cleanNumber.length === 10) {
      if (!validateBizrNo(cleanNumber)) {
        setError("유효하지 않은 사업자등록번호 형식입니다 (체크섬 수학적 검증 실패).");
        return;
      }
      router.push(`/biz/${cleanNumber}`);
    } else {
      // 텍스트 검색 또는 완성되지 않은 숫자는 검색 결과 페이지로 이동
      router.push(`/search?query=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} style={{ marginBottom: "24px" }}>
      <div className="card" style={{
        padding: "8px 8px 8px 24px",
        borderRadius: "24px",
        display: "flex",
        alignItems: "center",
        boxShadow: "var(--shadow-md)",
        border: error ? "2px solid var(--color-danger)" : "1px solid var(--color-border)",
        backgroundColor: "var(--bg-color-card)",
        transition: "var(--transition-smooth)"
      }}>
        <div style={{ fontSize: "1.5rem", marginRight: "16px" }}>🔍</div>
        <input
          type="text"
          placeholder="사업자번호, 상호명, 대표자명 또는 지역명(예: 역삼동) 입력"
          value={query}
          onChange={handleInputChange}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontSize: "1.15rem",
            fontWeight: 600,
            color: "var(--color-text-main)",
            padding: "12px 0"
          }}
        />
        <button type="submit" className="btn-primary" style={{
          borderRadius: "16px",
          padding: "14px 28px",
          fontSize: "1rem",
          whiteSpace: "nowrap"
        }}>
          조회하기
        </button>
      </div>
      {error && (
        <p style={{
          color: "var(--color-danger)",
          fontSize: "0.9rem",
          fontWeight: 600,
          marginTop: "8px",
          paddingLeft: "16px"
        }}>
          ⚠️ {error}
        </p>
      )}
    </form>
  );
}
