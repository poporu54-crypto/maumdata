"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { BulkCheckResultItem } from "@/app/api/biz/bulk-status/route";
import { vibrateDevice } from "@/lib/appBridge";

type FilterTab = "all" | "danger" | "caution" | "safe";

const SAMPLE_PRESET_TEXT = [
  "삼성전자  124-81-00998",
  "SK하이닉스  126-81-03725",
  "대한항공  110-81-14794",
  "셀트리온  133-81-23603",
  "아모레퍼시픽  106-86-43373",
  "카카오  120-81-47521",
].join("\n");

/**
 * 엑셀 복붙(상호명 + 탭 + 사업자번호), 줄바꿈, 쉼표, 하이픈 유무와 무관하게
 * 텍스트에서 10자리 사업자등록번호 후보를 순서대로 최대 100개 추출합니다.
 */
function extractBizNumbersFromRawText(raw: string): string[] {
  if (!raw) return [];
  const matches = raw.match(/(?:\d{3}-\d{2}-\d{5}|\b\d{10}\b)/g) || [];
  const seen = new Set<string>();
  const out: string[] = [];

  for (const token of matches) {
    const digits = token.replace(/[^0-9]/g, "");
    if (digits.length !== 10) continue;
    if (seen.has(digits)) continue;
    seen.add(digits);
    out.push(digits);
    if (out.length >= 100) break;
  }

  // 만약 공백/하이픈 형식이 비정형인 줄 단위 숫자만 입력된 경우 보조 추출
  if (out.length === 0) {
    for (const line of raw.split(/[\r\n,;]+/)) {
      const digits = line.replace(/[^0-9]/g, "");
      if (digits.length === 10 && !seen.has(digits)) {
        seen.add(digits);
        out.push(digits);
        if (out.length >= 100) break;
      }
    }
  }

  return out;
}

function escapeCsvCell(val: string | number | null | undefined): string {
  const s = String(val ?? "");
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export default function BulkCheckClient() {
  const [rawInput, setRawInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [results, setResults] = useState<BulkCheckResultItem[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    safeCount: number;
    cautionCount: number;
    dangerCount: number;
    invalidChecksumCount: number;
  } | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [copiedNotice, setCopiedNotice] = useState(false);

  const detectedBNos = useMemo(() => extractBizNumbersFromRawText(rawInput), [rawInput]);

  const filteredResults = useMemo(() => {
    if (filterTab === "all") return results;
    return results.filter((r) => r.statusLevel === filterTab);
  }, [results, filterTab]);

  const runCheck = async (targetBNos: string[]) => {
    if (targetBNos.length === 0) {
      setErrorMsg("10자리 사업자등록번호가 인식되지 않았습니다. 번호를 붙여넣어 주세요.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setFilterTab("all");
    vibrateDevice(20);

    try {
      const res = await fetch("/api/biz/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bNos: targetBNos }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "상태 조회 요청 처리에 실패했습니다.");
      }
      setResults(json.results || []);
      setSummary(json.summary || null);
      setCheckedAt(json.checkedAt || new Date().toISOString());
    } catch (err: any) {
      setErrorMsg(err.message || "네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    setRawInput(SAMPLE_PRESET_TEXT);
    const parsed = extractBizNumbersFromRawText(SAMPLE_PRESET_TEXT);
    void runCheck(parsed);
  };

  const handleDownloadCsv = () => {
    if (results.length === 0) return;
    const headers = [
      "순번",
      "사업자등록번호",
      "상호명(DB매칭)",
      "대표자",
      "판정등급",
      "국세청납세상태",
      "과세유형",
      "폐업일자",
      "과세유형전환일",
      "세무체크메모",
    ];
    const rows = results.map((r) => [
      r.inputOrder,
      r.formattedBNo,
      r.companyName || "-",
      r.representative || "-",
      r.statusBadge,
      r.bStt,
      r.taxType,
      r.endDt ? `${r.endDt.slice(0, 4)}-${r.endDt.slice(4, 6)}-${r.endDt.slice(6, 8)}` : "-",
      r.taxTypeChangeDt
        ? `${r.taxTypeChangeDt.slice(0, 4)}-${r.taxTypeChangeDt.slice(4, 6)}-${r.taxTypeChangeDt.slice(6, 8)}`
        : "-",
      r.advisoryNote,
    ]);

    const csvBody = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
      .join("\r\n");

    // 한글 엑셀 깨짐 방지를 위한 UTF-8 BOM 추가
    const blob = new Blob(["\uFEFF" + csvBody], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    a.href = url;
    a.download = `마음데이타_거래처휴폐업검증_${ymd}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyTsvForExcel = async () => {
    if (results.length === 0) return;
    const headers = [
      "순번",
      "사업자등록번호",
      "상호명",
      "판정",
      "납세상태",
      "과세유형",
      "폐업일",
      "세무체크메모",
    ];
    const lines = [
      headers.join("\t"),
      ...results.map((r) =>
        [
          r.inputOrder,
          r.formattedBNo,
          r.companyName || "-",
          r.statusBadge,
          r.bStt,
          r.taxType,
          r.endDt ? `${r.endDt.slice(0, 4)}-${r.endDt.slice(4, 6)}-${r.endDt.slice(6, 8)}` : "-",
          r.advisoryNote,
        ].join("\t")
      ),
    ];

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
    } catch {
      setErrorMsg("클립보드 복사에 실패했습니다. CSV 다운로드를 이용해 주세요.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* 입력 카드 */}
      <div className="card" style={{ padding: "26px", border: "1px solid var(--color-border)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <div>
            <strong style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--color-text-main)" }}>
              📋 거래처 사업자등록번호 일괄 입력 (최대 100건 동시 조회)
            </strong>
            <p style={{ fontSize: "0.82rem", color: "var(--color-text-desc)", margin: "4px 0 0 0" }}>
              엑셀 표에서 상호명과 번호 열을 통째로 복사해 붙여넣어도 사업자번호만 자동으로 추출합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadSample}
            disabled={loading}
            style={{
              padding: "7px 13px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              color: "var(--color-primary)",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            ⚡ 예시 번호 6건으로 1초 체험하기
          </button>
        </div>

        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          rows={7}
          placeholder={
            "예시 (줄바꿈·쉼표·탭·하이픈 유무 모두 자동 인식):\n124-81-00998\n(주)거래처상사\t220-81-62517\n1208147521, 131-86-27632"
          }
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "14px",
            border: "1.5px solid var(--color-border)",
            backgroundColor: "var(--bg-color-main)",
            color: "var(--color-text-main)",
            fontSize: "0.93rem",
            lineHeight: 1.6,
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.84rem" }}>
            <span style={{ color: "var(--color-text-sub)", fontWeight: 700 }}>
              자동 인식된 사업자번호:{" "}
              <strong style={{ color: "var(--color-primary)" }}>{detectedBNos.length}건</strong> / 100건
            </span>
            {rawInput.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setRawInput("");
                  setResults([]);
                  setSummary(null);
                  setErrorMsg("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-text-desc)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                비우기
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={loading || detectedBNos.length === 0}
            onClick={() => runCheck(detectedBNos)}
            className="btn-primary"
            style={{
              padding: "12px 26px",
              borderRadius: "12px",
              fontSize: "0.96rem",
              fontWeight: 800,
              opacity: loading || detectedBNos.length === 0 ? 0.55 : 1,
              cursor: loading || detectedBNos.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "국세청 실시간 검증 중..."
              : `🔍 ${detectedBNos.length > 0 ? `${detectedBNos.length}건 ` : ""}실시간 휴·폐업 일괄 검증`}
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              marginTop: "14px",
              padding: "12px 16px",
              borderRadius: "10px",
              backgroundColor: "rgba(240, 68, 56, 0.1)",
              color: "var(--color-danger)",
              fontSize: "0.86rem",
              fontWeight: 700,
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}
      </div>

      {/* 검증 결과 요약 & 표 */}
      {summary && results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* 4대 판정 요약 카드 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className="card"
              style={{
                padding: "18px",
                textAlign: "left",
                cursor: "pointer",
                border:
                  filterTab === "all"
                    ? "2px solid var(--color-primary)"
                    : "1px solid var(--color-border)",
              }}
            >
              <div style={{ fontSize: "0.76rem", color: "var(--color-text-desc)", fontWeight: 700 }}>
                전체 조회 거래처
              </div>
              <div style={{ fontSize: "1.45rem", fontWeight: 850, color: "var(--color-text-main)", marginTop: "4px" }}>
                {summary.total}건
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("safe")}
              className="card"
              style={{
                padding: "18px",
                textAlign: "left",
                cursor: "pointer",
                border:
                  filterTab === "safe" ? "2px solid #059669" : "1px solid var(--color-border)",
              }}
            >
              <div style={{ fontSize: "0.76rem", color: "#059669", fontWeight: 800 }}>
                🟢 정상 (계속 · 일반과세)
              </div>
              <div style={{ fontSize: "1.45rem", fontWeight: 850, color: "#059669", marginTop: "4px" }}>
                {summary.safeCount}건
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("caution")}
              className="card"
              style={{
                padding: "18px",
                textAlign: "left",
                cursor: "pointer",
                border:
                  filterTab === "caution" ? "2px solid #d97706" : "1px solid var(--color-border)",
              }}
            >
              <div style={{ fontSize: "0.76rem", color: "#d97706", fontWeight: 800 }}>
                🟠 주의 (간이 · 면세 · 전환)
              </div>
              <div style={{ fontSize: "1.45rem", fontWeight: 850, color: "#d97706", marginTop: "4px" }}>
                {summary.cautionCount}건
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab("danger")}
              className="card"
              style={{
                padding: "18px",
                textAlign: "left",
                cursor: "pointer",
                border:
                  filterTab === "danger" ? "2px solid #dc2626" : "1px solid var(--color-border)",
              }}
            >
              <div style={{ fontSize: "0.76rem", color: "#dc2626", fontWeight: 800 }}>
                🔴 위험 (폐업 · 휴업 · 오류)
              </div>
              <div style={{ fontSize: "1.45rem", fontWeight: 850, color: "#dc2626", marginTop: "4px" }}>
                {summary.dangerCount}건
              </div>
            </button>
          </div>

          {/* 액션 툴바 (엑셀 CSV 다운로드 / 클립보드 복사) */}
          <div
            className="card"
            style={{
              padding: "14px 18px",
              border: "1px solid var(--color-border)",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div style={{ fontSize: "0.82rem", color: "var(--color-text-desc)" }}>
              {checkedAt && (
                <span>
                  국세청 실시간 검증 시각: <strong>{new Date(checkedAt).toLocaleString("ko-KR")}</strong>
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <button
                type="button"
                onClick={handleCopyTsvForExcel}
                style={{
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-main)",
                  color: "var(--color-text-main)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {copiedNotice ? "✅ 복사 완료 (엑셀에 Ctrl+V 하세요)" : "📋 표 복사 (엑셀 붙여넣기용)"}
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                style={{
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(5, 150, 105, 0.35)",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  color: "#059669",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                📥 엑셀(CSV) 파일 다운로드
              </button>
            </div>
          </div>

          {/* 상세 결과 표 */}
          <div
            className="card"
            style={{
              border: "1px solid var(--color-border)",
              overflowX: "auto",
              padding: 0,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.86rem",
                minWidth: "740px",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "var(--bg-color-main)",
                    borderBottom: "1px solid var(--color-border)",
                    color: "var(--color-text-desc)",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "12px 14px", fontWeight: 800, width: "52px" }}>#</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800 }}>사업자등록번호</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800 }}>상호명 · 대표자</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800 }}>판정 결과</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800 }}>국세청 과세유형</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800 }}>세금계산서 실무 체크</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((row) => {
                  const badgeStyle =
                    row.statusLevel === "safe"
                      ? { bg: "rgba(16, 185, 129, 0.12)", color: "#059669" }
                      : row.statusLevel === "caution"
                        ? { bg: "rgba(245, 158, 11, 0.14)", color: "#d97706" }
                        : { bg: "rgba(239, 68, 68, 0.14)", color: "#dc2626" };

                  return (
                    <tr
                      key={row.bNo}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        backgroundColor:
                          row.statusLevel === "danger"
                            ? "rgba(239, 68, 68, 0.03)"
                            : "transparent",
                      }}
                    >
                      <td style={{ padding: "13px 14px", color: "var(--color-text-desc)", fontWeight: 700 }}>
                        {row.inputOrder}
                      </td>
                      <td style={{ padding: "13px 14px", fontFamily: "monospace", fontWeight: 700 }}>
                        {row.checksumValid ? (
                          <Link
                            href={`/biz/${row.bNo}`}
                            prefetch={false}
                            style={{ color: "var(--color-primary)", textDecoration: "none" }}
                          >
                            {row.formattedBNo} ↗
                          </Link>
                        ) : (
                          <span style={{ color: "#dc2626" }}>{row.formattedBNo}</span>
                        )}
                      </td>
                      <td style={{ padding: "13px 14px" }}>
                        {row.companyName ? (
                          <div>
                            <Link
                              href={`/biz/${row.bNo}`}
                              prefetch={false}
                              style={{
                                fontWeight: 800,
                                color: "var(--color-text-main)",
                                textDecoration: "none",
                              }}
                            >
                              {row.companyName}
                            </Link>
                            {row.representative && (
                              <span
                                style={{
                                  fontSize: "0.77rem",
                                  color: "var(--color-text-desc)",
                                  marginLeft: "6px",
                                }}
                              >
                                ({row.representative})
                              </span>
                            )}
                          </div>
                        ) : row.checksumValid ? (
                          <Link
                            href={`/biz/${row.bNo}`}
                            prefetch={false}
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--color-text-desc)",
                              textDecoration: "underline",
                            }}
                          >
                            상세 기업분석 열기 ↗
                          </Link>
                        ) : (
                          <span style={{ color: "var(--color-text-desc)" }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "13px 14px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 9px",
                            borderRadius: "999px",
                            backgroundColor: badgeStyle.bg,
                            color: badgeStyle.color,
                            fontWeight: 800,
                            fontSize: "0.77rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.statusBadge}
                        </span>
                      </td>
                      <td style={{ padding: "13px 14px", color: "var(--color-text-sub)", fontWeight: 600 }}>
                        {row.taxType || "-"}
                      </td>
                      <td style={{ padding: "13px 14px", color: "var(--color-text-desc)", fontSize: "0.8rem" }}>
                        {row.advisoryNote}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
