"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBizNo } from "@/lib/statFormatters";
import { vibrateDevice } from "@/lib/appBridge";

export interface PickedCompanyMini {
  bNo: string;
  name: string;
  sector?: string;
}

interface SearchCandidate {
  b_no: string;
  b_nm: string;
  p_nm?: string;
  b_sector?: string;
  b_adr?: string;
}

const searchMemCache = new Map<string, SearchCandidate[]>();

function CompanySearchSlot({
  slotLabel,
  accentColor,
  selected,
  onSelect,
  onClear,
}: {
  slotLabel: string;
  accentColor: string;
  selected: PickedCompanyMini | null;
  onSelect: (c: PickedCompanyMini) => void;
  onClear: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const cached = searchMemCache.get(trimmed);
    if (cached) {
      setResults(cached);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);

      try {
        const res = await fetch(`/api/extension/search?query=${encodeURIComponent(trimmed)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        const arr: SearchCandidate[] = Array.isArray(data) ? data.slice(0, 10) : [];
        searchMemCache.set(trimmed, arr);
        setResults(arr);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setResults([]);
        }
      } finally {
        if (abortRef.current === ctrl) {
          setLoading(false);
        }
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [q]);

  return (
    <div
      style={{
        flex: "1 1 280px",
        padding: "18px",
        borderRadius: "16px",
        border: selected ? `2px solid ${accentColor}` : "1.5px solid var(--color-border)",
        backgroundColor: "var(--bg-color-main)",
        position: "relative",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 800,
          color: accentColor,
          marginBottom: "8px",
          letterSpacing: "0.03em",
        }}
      >
        {slotLabel}
      </div>

      {selected ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            minHeight: "46px",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "1.05rem",
                fontWeight: 850,
                color: "var(--color-text-main)",
                wordBreak: "keep-all",
              }}
            >
              {selected.name}
            </div>
            <div style={{ fontSize: "0.77rem", color: "var(--color-text-desc)", marginTop: "2px" }}>
              {formatBizNo(selected.bNo)} {selected.sector ? `· ${selected.sector}` : ""}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClear();
              setQ("");
            }}
            style={{
              padding: "6px 11px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
              color: "var(--color-text-sub)",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            변경
          </button>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={q}
            onFocus={() => setOpenDropdown(true)}
            onBlur={() => setTimeout(() => setOpenDropdown(false), 180)}
            onChange={(e) => {
              setQ(e.target.value);
              setOpenDropdown(true);
            }}
            placeholder="기업명 또는 사업자번호 입력 (예: 삼성전자, 셀트리온)"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "11px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-card)",
              color: "var(--color-text-main)",
              fontSize: "0.9rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          {openDropdown && q.trim().length >= 2 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                zIndex: 50,
                backgroundColor: "var(--bg-color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                boxShadow: "0 14px 32px rgba(0, 0, 0, 0.22)",
                maxHeight: "260px",
                overflowY: "auto",
              }}
            >
              {loading ? (
                <div style={{ padding: "14px", fontSize: "0.84rem", color: "var(--color-text-desc)" }}>
                  기업 검색 중...
                </div>
              ) : results.length === 0 ? (
                <div style={{ padding: "14px", fontSize: "0.84rem", color: "var(--color-text-desc)" }}>
                  일치하는 기업이 없습니다.
                </div>
              ) : (
                results.map((item) => (
                  <button
                    key={item.b_no}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      vibrateDevice(20);
                      onSelect({
                        bNo: item.b_no.replace(/[^0-9]/g, ""),
                        name: item.b_nm,
                        sector: item.b_sector && item.b_sector !== "-" ? item.b_sector : undefined,
                      });
                      setOpenDropdown(false);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "11px 14px",
                      border: "none",
                      borderBottom: "1px solid var(--color-border)",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      color: "inherit",
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--color-text-main)" }}>
                      {item.b_nm}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", marginTop: "2px" }}>
                      {formatBizNo(item.b_no)} {item.p_nm && item.p_nm !== "-" ? `· 대표 ${item.p_nm}` : ""}{" "}
                      {item.b_sector && item.b_sector !== "-" ? `· ${item.b_sector}` : ""}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CompareSelectorClient({
  initialA = null,
  initialB = null,
}: {
  initialA?: PickedCompanyMini | null;
  initialB?: PickedCompanyMini | null;
}) {
  const router = useRouter();
  const [companyA, setCompanyA] = useState<PickedCompanyMini | null>(initialA);
  const [companyB, setCompanyB] = useState<PickedCompanyMini | null>(initialB);
  const [copied, setCopied] = useState(false);

  // /biz/[b_no] 상세페이지에서 ?a=사업자번호&nameA=상호명 쿼리로 넘어온 경우 클라이언트에서 자동 세팅 (ISR 캐싱 보존)
  useEffect(() => {
    if (initialA) return;
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const a = (sp.get("a") || "").replace(/[^0-9]/g, "");
    const nameA = (sp.get("nameA") || "").trim();
    if (a.length === 10) {
      setCompanyA({ bNo: a, name: nameA || `사업자 ${formatBizNo(a)}` });
    }
  }, [initialA]);

  const canCompare = Boolean(companyA && companyB && companyA.bNo !== companyB.bNo);

  const handleGoCompare = () => {
    if (!companyA || !companyB || companyA.bNo === companyB.bNo) return;
    vibrateDevice(25);
    router.push(`/compare/${companyA.bNo}-vs-${companyB.bNo}`);
  };

  const handleSwap = () => {
    const prevA = companyA;
    const prevB = companyB;
    setCompanyA(prevB);
    setCompanyB(prevA);
    if (prevA && prevB && initialA && initialB) {
      router.push(`/compare/${prevB.bNo}-vs-${prevA.bNo}`);
    }
  };

  const handleCopyShareLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // ignore
    }
  };

  return (
    <div className="card" style={{ padding: "24px", border: "1px solid var(--color-border)" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "stretch",
          gap: "12px",
        }}
      >
        <CompanySearchSlot
          slotLabel="🅰️ 비교 기업 A"
          accentColor="#2563eb"
          selected={companyA}
          onSelect={setCompanyA}
          onClear={() => setCompanyA(null)}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button
            type="button"
            onClick={handleSwap}
            title="좌우 기업 바꾸기"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "999px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              color: "var(--color-text-sub)",
              fontWeight: 900,
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            ⇄
          </button>
        </div>

        <CompanySearchSlot
          slotLabel="🅱️ 비교 기업 B"
          accentColor="#0d9488"
          selected={companyB}
          onSelect={setCompanyB}
          onClear={() => setCompanyB(null)}
        />
      </div>

      {companyA && companyB && companyA.bNo === companyB.bNo && (
        <p style={{ color: "var(--color-danger)", fontSize: "0.83rem", fontWeight: 700, marginTop: "10px", marginBottom: 0 }}>
          서로 다른 두 기업을 선택해 주세요.
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "flex-end",
          gap: "10px",
          marginTop: "16px",
        }}
      >
        {initialA && initialB && (
          <button
            type="button"
            onClick={handleCopyShareLink}
            style={{
              padding: "11px 18px",
              borderRadius: "12px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              color: "var(--color-text-main)",
              fontSize: "0.88rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {copied ? "✅ 비교 결과 링크 복사됨!" : "🔗 비교 결과 링크 공유하기"}
          </button>
        )}

        <button
          type="button"
          disabled={!canCompare}
          onClick={handleGoCompare}
          className="btn-primary"
          style={{
            padding: "11px 24px",
            borderRadius: "12px",
            fontSize: "0.92rem",
            fontWeight: 800,
            opacity: canCompare ? 1 : 0.5,
            cursor: canCompare ? "pointer" : "not-allowed",
          }}
        >
          ⚖️ 1:1 스펙 정밀 비교 실행
        </button>
      </div>
    </div>
  );
}
