"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { DirectoryCompanyItem } from "@/lib/directoryApi";
import { formatBizNo, formatEokToKorean } from "@/lib/statFormatters";

type SortKey = "default" | "employees" | "salary" | "revenue" | "hires";

const INITIAL_VISIBLE = 50;

export default function DirectoryTableClient({
  companies,
  defaultSortHint,
}: {
  companies: DirectoryCompanyItem[];
  defaultSortHint: string;
}) {
  const [sortBy, setSortBy] = useState<SortKey>("default");
  const [keyword, setKeyword] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredAndSorted = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const filtered = q
      ? companies.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.sector.toLowerCase().includes(q) ||
            c.shortRegion.toLowerCase().includes(q) ||
            c.representative.toLowerCase().includes(q) ||
            c.bNo.includes(q.replace(/[^0-9]/g, ""))
        )
      : companies;

    if (sortBy === "default") return filtered;

    return [...filtered].sort((a, b) => {
      if (sortBy === "employees") return b.employees - a.employees;
      if (sortBy === "salary") return (b.estimatedSalaryManwon || 0) - (a.estimatedSalaryManwon || 0);
      if (sortBy === "revenue") return (b.revenueEok || 0) - (a.revenueEok || 0);
      if (sortBy === "hires") return b.newHires - a.newHires;
      return a.rank - b.rank;
    });
  }, [companies, keyword, sortBy]);

  const visibleItems =
    showAll || keyword.trim().length > 0
      ? filteredAndSorted
      : filteredAndSorted.slice(0, INITIAL_VISIBLE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 검색 & 정렬 컨트롤 바 */}
      <div
        className="card"
        style={{
          padding: "16px 18px",
          border: "1px solid var(--color-border)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: "380px" }}>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="목록 내 기업명 · 업종 · 대표자 빠른 필터"
            aria-label="목록 내 기업 검색"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              color: "var(--color-text-main)",
              fontSize: "0.88rem",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {(
            [
              { key: "default", label: `기본 (${defaultSortHint})` },
              { key: "employees", label: "임직원순" },
              { key: "salary", label: "추정연봉순" },
              { key: "revenue", label: "매출액순" },
              { key: "hires", label: "신규채용순" },
            ] as const
          ).map((opt) => {
            const active = sortBy === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSortBy(opt.key)}
                style={{
                  padding: "7px 12px",
                  borderRadius: "999px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: active ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                  backgroundColor: active ? "var(--color-primary)" : "var(--bg-color-main)",
                  color: active ? "#ffffff" : "var(--color-text-sub)",
                  transition: "all 0.15s ease",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 기업 랭킹 리스트 (단일 반응형 DOM — 중복 마운트 제로 & content-visibility 가속) */}
      {visibleItems.length === 0 ? (
        <div
          className="card"
          style={{
            padding: "48px 24px",
            textAlign: "center",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-desc)",
          }}
        >
          입력하신 필터 조건과 일치하는 기업이 없습니다.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {visibleItems.map((company, idx) => {
            const displayRank = sortBy === "default" && !keyword.trim() ? company.rank : idx + 1;
            const isTop3 = displayRank <= 3;

            return (
              <Link
                key={company.bNo}
                href={`/biz/${company.bNo}`}
                prefetch={false}
                className="card related-card"
                style={{
                  padding: "18px 20px",
                  border: isTop3
                    ? "1.5px solid rgba(49, 130, 246, 0.38)"
                    : "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-card)",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "14px",
                  contentVisibility: "auto",
                  containIntrinsicSize: "0 92px",
                }}
              >
                {/* 좌측: 순위 배지 + 기업명 + 업종/지역/상장 태그 */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flex: "1 1 300px", minWidth: 0 }}>
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "10px",
                      backgroundColor: isTop3 ? "var(--color-primary)" : "var(--bg-color-main)",
                      border: isTop3 ? "none" : "1px solid var(--color-border)",
                      color: isTop3 ? "#ffffff" : "var(--color-text-sub)",
                      fontWeight: 850,
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    {displayRank}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <strong
                        style={{
                          fontSize: "1.04rem",
                          fontWeight: 800,
                          color: "var(--color-text-main)",
                          wordBreak: "keep-all",
                        }}
                      >
                        {company.name}
                      </strong>

                      {company.marketBoard && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            padding: "2px 7px",
                            borderRadius: "6px",
                            backgroundColor:
                              company.marketBoard === "KOSPI"
                                ? "rgba(37, 99, 235, 0.12)"
                                : "rgba(16, 185, 129, 0.12)",
                            color: company.marketBoard === "KOSPI" ? "#2563eb" : "#059669",
                          }}
                        >
                          {company.marketBoard}
                        </span>
                      )}

                      {company.newHires >= 5 && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            padding: "2px 7px",
                            borderRadius: "6px",
                            backgroundColor: "rgba(234, 88, 12, 0.12)",
                            color: "#ea580c",
                          }}
                        >
                          ⚡ 당월 +{company.newHires.toLocaleString("ko-KR")}명 채용
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "6px 10px",
                        marginTop: "5px",
                        fontSize: "0.8rem",
                        color: "var(--color-text-desc)",
                      }}
                    >
                      <span>{company.sector}</span>
                      <span>·</span>
                      <span>📍 {company.shortRegion}</span>
                      {company.representative && (
                        <>
                          <span>·</span>
                          <span>대표 {company.representative}</span>
                        </>
                      )}
                      <span>·</span>
                      <span style={{ fontFamily: "monospace", fontSize: "0.76rem" }}>
                        {formatBizNo(company.bNo)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 우측: 핵심 실데이터 3대 지표 칩 (임직원 · 추정연봉 · 결산매출) */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "12px",
                    justifyContent: "flex-end",
                  }}
                >
                  <div style={{ minWidth: "82px", textAlign: "right" }}>
                    <div style={{ fontSize: "0.71rem", color: "var(--color-text-desc)", fontWeight: 600 }}>
                      상시 임직원
                    </div>
                    <div style={{ fontSize: "0.94rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                      {company.employees > 0 ? `${company.employees.toLocaleString("ko-KR")}명` : "-"}
                    </div>
                  </div>

                  <div style={{ minWidth: "96px", textAlign: "right" }}>
                    <div style={{ fontSize: "0.71rem", color: "var(--color-text-desc)", fontWeight: 600 }}>
                      추정 평균연봉
                    </div>
                    <div
                      style={{
                        fontSize: "0.94rem",
                        fontWeight: 800,
                        color: company.estimatedSalaryLabel ? "var(--color-primary)" : "var(--color-text-desc)",
                      }}
                    >
                      {company.estimatedSalaryLabel || "-"}
                    </div>
                  </div>

                  <div style={{ minWidth: "102px", textAlign: "right" }}>
                    <div style={{ fontSize: "0.71rem", color: "var(--color-text-desc)", fontWeight: 600 }}>
                      {company.finYear ? `${company.finYear} 결산매출` : "결산매출"}
                    </div>
                    <div style={{ fontSize: "0.94rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                      {company.revenueEok && company.revenueEok > 0
                        ? formatEokToKorean(company.revenueEok)
                        : "-"}
                    </div>
                    {company.operatingIncomeEok !== null && company.revenueEok && company.revenueEok > 0 && (
                      <div
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: company.operatingIncomeEok >= 0 ? "#059669" : "var(--color-danger)",
                        }}
                      >
                        영업익 {company.operatingIncomeEok >= 0 ? "+" : ""}
                        {formatEokToKorean(company.operatingIncomeEok)}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 더 보기 버튼 */}
      {!showAll && !keyword.trim() && filteredAndSorted.length > INITIAL_VISIBLE && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="card"
          style={{
            width: "100%",
            padding: "14px 20px",
            borderRadius: "14px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--bg-color-card)",
            color: "var(--color-primary)",
            fontWeight: 800,
            fontSize: "0.92rem",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          나머지 {filteredAndSorted.length - INITIAL_VISIBLE}개 검증 기업 더 보기 ↓
        </button>
      )}
    </div>
  );
}
