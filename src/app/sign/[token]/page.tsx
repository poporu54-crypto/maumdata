"use client";

import React, { useEffect, useState, use, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { vibrateDevice, showAppToast, printDocument } from "@/lib/appBridge";
import {
  saveContractToLocal,
  getLoggedInUser,
  setLoggedInUser,
  getContractAuthHeaders,
  ContractUser,
} from "@/lib/contractStorage";

const DocumentSignatureModal = dynamic(
  () => import("@/components/DocumentSignatureModal"),
  { ssr: false }
);
const ContractAuthModal = dynamic(
  () => import("@/components/ContractAuthModal"),
  { ssr: false }
);
const LegacyTemplateRenderer = dynamic(
  () => import("@/app/form/[templateId]/LegacyTemplateRenderer"),
  { ssr: false }
);

const LEGACY_TEMPLATE_IDS = new Set([
  "resignation",
  "contract",
  "contract_short_time",
  "contract_minor",
  "contract_freelance",
  "estimate",
  "order",
  "transaction",
  "iou",
  "poa",
  "proof_of_emp",
  "career_cert",
  "resume",
]);

const FALLBACK_KOREAN_LABELS: Record<string, string> = {
  employerName: "사업주 상호 (회사명)",
  employerCEO: "사업주 대표자명",
  employerAddr: "사업주 소재지",
  employerPhone: "사업주 연락처",
  workerName: "근로자 성명",
  workerAddr: "근로자 주소",
  workerPhone: "근로자 연락처",
  workerBirth: "근로자 생년월일",
  workStartDate: "근로개시일",
  workEndDate: "근로종료일",
  workPlace: "근무장소",
  jobDesc: "담당 업무 내용",
  workStartTime: "시업 시각",
  workEndTime: "종업 시각",
  breakStartTime: "휴게 시작 시각",
  breakEndTime: "휴게 종료 시각",
  workDaysPerWeek: "주 소정근로일",
  weeklyHoliday: "주휴일",
  salaryType: "임금 유형",
  salaryAmt: "임금액",
  bonusYn: "상여금 여부",
  bonusAmt: "상여금 금액",
  otherPayYn: "기타급여 여부",
  otherPayAmt: "기타급여 금액",
  payDay: "임금 지급일",
  payMethod: "임금 지급 방법",
  contractDate: "계약 체결일",
  companyName: "상호 (회사명)",
  ceo: "대표자",
  address: "주소",
  bizNum: "사업자등록번호",
  phone: "연락처",
  email: "이메일",
  name: "성명",
  dept: "소속 부서",
  rank: "직위 / 직급",
  reason: "사유",
  title: "문서 제목",
  content: "상세 내용",
  specialTerms: "특약 사항",
  partyAEmail: "발송자(갑) 이메일",
  partyBEmail: "수신자(을) 이메일",
};

const NOOP = () => {};

export default function SignContractPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<any>(null);
  const [templateMeta, setTemplateMeta] = useState<any>(null);
  const [requiresPin, setRequiresPin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [verifiedPin, setVerifiedPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [error, setError] = useState<string>("");
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<ContractUser | null>(null);
  const [boundToVault, setBoundToVault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [partyBSignature, setPartyBSignature] = useState<string | null>(null);

  const loadContract = async (pinValue = "") => {
    try {
      setLoading(true);
      setPinError("");
      const user = getLoggedInUser();
      setCurrentUser(user);

      const query = new URLSearchParams();
      if (pinValue) query.set("pin", pinValue);

      const res = await fetch(`/api/contracts/${token}?${query.toString()}`, {
        headers: getContractAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "계약서를 불러올 수 없습니다.");
      }

      if (data.requiresPin) {
        setRequiresPin(true);
        setContract(data.contract);
        if (data.pinError) setPinError(data.pinError);
        return;
      }

      setRequiresPin(false);
      if (pinValue) setVerifiedPin(pinValue);
      setContract(data.contract);
      setTemplateMeta(data.template || null);
      saveContractToLocal(data.contract.id);

      if (data.contract.status === "COMPLETED") {
        setCompleted(true);
        setPartyBSignature(data.contract.partyBSignature);
      }
    } catch (err: any) {
      setError(err.message || "계약서 로드 실패");
    } finally {
      setLoading(false);
    }
  };

  // OAuth 복귀 시 서명 토큰 교환 및 자동 보관함 바인딩 지원
  useEffect(() => {
    const init = async () => {
      if (typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        const oauthSession = searchParams.get("oauth_session");
        if (oauthSession) {
          window.history.replaceState({}, "", window.location.pathname);
          try {
            const exRes = await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "exchange_oauth",
                oauthToken: oauthSession,
              }),
            });
            const exData = await exRes.json();
            if (exRes.ok && exData.success && exData.user?.id) {
              setLoggedInUser(exData.user);
              setCurrentUser(exData.user);
              await fetch(`/api/contracts/${token}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${exData.user.sessionToken}`,
                },
                body: JSON.stringify({ action: "bind_user" }),
              }).catch(() => {});
              setBoundToVault(true);
              showAppToast(`${exData.user.name}님의 영구 계약 보관함에 자동 연결되었습니다!`);
            }
          } catch {
            // ignore
          }
        }
      }
      await loadContract();
    };
    init();
  }, [token]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setPinError("전달받으신 임시 비밀번호를 입력해 주세요.");
      return;
    }
    vibrateDevice(20);
    loadContract(pinInput.trim());
  };

  const handleApplySignature = async (sigDataUrl: string) => {
    setSubmitting(true);
    vibrateDevice(40);

    try {
      const res = await fetch(`/api/contracts/${token}`, {
        method: "POST",
        headers: getContractAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          signatureImage: sigDataUrl,
          signerName: contract?.partyBName || "",
          pin: verifiedPin,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "서명 제출에 실패했습니다.");
      }

      setPartyBSignature(sigDataUrl);
      setCompleted(true);
      const user = getLoggedInUser();
      if (user?.id) setBoundToVault(true);
      saveContractToLocal(data.contractId || contract.id);
      vibrateDevice(50);
      showAppToast("계약 체결이 완료되었으며 클라우드 보관소에 영구 저장되었습니다!");
    } catch (err: any) {
      alert(err.message || "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBindToVault = async (user: ContractUser) => {
    try {
      const res = await fetch(`/api/contracts/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user.sessionToken ? { Authorization: `Bearer ${user.sessionToken}` } : {}),
        },
        body: JSON.stringify({
          action: "bind_user",
          pin: verifiedPin,
        }),
      });
      if (res.ok) {
        setCurrentUser(user);
        setBoundToVault(true);
        showAppToast("내 영구 계약 보관함(/contracts)에 등록되었습니다!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    printDocument(contract?.title || "마음데이타_전자계약서");
  };

  // 필드 한글명 매핑 사전 생성
  const fieldLabelMap = useMemo(() => {
    const map: Record<string, string> = { ...FALLBACK_KOREAN_LABELS };
    if (Array.isArray(templateMeta?.fields)) {
      for (const f of templateMeta.fields) {
        if (f?.key && f?.label) {
          map[f.key] = f.label;
        }
        if (Array.isArray(f?.subFields)) {
          for (const sf of f.subFields) {
            if (sf?.key && sf?.label) {
              map[`${f.key}.${sf.key}`] = sf.label;
              if (!map[sf.key]) map[sf.key] = sf.label;
            }
          }
        }
      }
    }
    return map;
  }, [templateMeta]);

  if (loading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-text-sub)" }}>계약서를 안전하게 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="container" style={{ maxWidth: "600px", padding: "80px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-text-main)" }}>
          계약서를 열 수 없습니다
        </h2>
        <p style={{ color: "var(--color-text-sub)", margin: "8px 0 24px 0" }}>
          {error || "만료되었거나 유효하지 않은 서명 링크입니다."}
        </p>
        <Link href="/" prefetch={false} className="btn-primary" style={{ padding: "10px 20px" }}>
          마음데이타 홈으로 이동
        </Link>
      </div>
    );
  }

  if (requiresPin) {
    return (
      <div style={{ backgroundColor: "var(--bg-color-main)", minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div
          style={{
            backgroundColor: "var(--bg-color-card)",
            width: "100%",
            maxWidth: "420px",
            borderRadius: "22px",
            border: "1px solid var(--color-border)",
            padding: "32px 24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.8rem", marginBottom: "10px" }}>🔒</div>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "#2563eb",
              backgroundColor: "rgba(37, 99, 235, 0.1)",
              padding: "3px 10px",
              borderRadius: "6px",
            }}
          >
            비대면 전자계약서 열람 보호
          </span>
          <h2 style={{ margin: "10px 0 6px 0", fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)" }}>
            {contract.title}
          </h2>
          <p style={{ margin: "0 0 20px 0", fontSize: "0.85rem", color: "var(--color-text-sub)", lineHeight: 1.5 }}>
            <strong>{contract.partyACompany || contract.partyAName}</strong>님께서 보낸 계약서입니다.<br />
            함께 전달받으신 <strong>임시 비밀번호</strong>를 입력해 주세요.
          </p>

          <form onSubmit={handlePinSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="password"
              inputMode="numeric"
              maxLength={12}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="임시 비밀번호 입력"
              autoFocus
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1.5px solid #93c5fd",
                backgroundColor: "var(--bg-color-main)",
                color: "var(--color-text-main)",
                fontSize: "1.2rem",
                fontWeight: 800,
                textAlign: "center",
                letterSpacing: "4px",
              }}
            />

            {pinError && (
              <div style={{ fontSize: "0.82rem", color: "#dc2626", fontWeight: 700 }}>
                ⚠️ {pinError}
              </div>
            )}

            <button
              type="submit"
              style={{
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
              }}
            >
              계약서 열람 및 서명하기 ➔
            </button>
          </form>
        </div>
      </div>
    );
  }

  const formData = contract.formData || {};
  const isLegacyTemplate = LEGACY_TEMPLATE_IDS.has(contract.templateId);
  const layoutElements: any[] = Array.isArray(templateMeta?.layout) ? templateMeta.layout : [];

  const bindTemplateText = (rawText?: string) => {
    if (!rawText) return "";
    return String(rawText).replace(/\{(\w+)\}/g, (_match, key) => {
      const val = formData[key];
      if (val === undefined || val === null || val === "") return "________";
      return String(val);
    });
  };

  return (
    <div style={{ backgroundColor: "var(--bg-color-main)", minHeight: "100vh", padding: "28px 0 110px 0" }}>
      <div className="container">
        {/* 상단 브랜드 헤더 (인쇄 시 자동 숨김) */}
        <div
          className="no-print"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 700, backgroundColor: "rgba(37, 99, 235, 0.08)", padding: "3px 10px", borderRadius: "6px" }}>
              안전한 단일 링크 전자계약
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/contracts"
              prefetch={false}
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#2563eb",
                textDecoration: "none",
              }}
            >
              📁 내 계약 보관함 바로가기 ➔
            </Link>
          </div>
        </div>

        {/* 상태 배너 (인쇄 시 자동 숨김) */}
        {completed ? (
          <div
            className="no-print"
            style={{
              padding: "20px 24px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)",
              border: "1.5px solid rgba(16, 185, 129, 0.3)",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "2rem" }}>🎉</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#065f46" }}>
                  계약 체결 및 클라우드 영구 보관이 완료되었습니다
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.84rem", color: "#047857" }}>
                  서로 파일을 다시 주고받을 필요 없이, 양측 모두 이 주소와 <strong>내 계약 보관함(/contracts)</strong>에서 언제든 열람하실 수 있습니다.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              {!currentUser && !boundToVault ? (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  type="button"
                  style={{
                    padding: "9px 16px",
                    fontSize: "0.88rem",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  ☁️ 내 영구 보관함에 저장하기 (로그인)
                </button>
              ) : (
                <Link
                  href="/contracts"
                  prefetch={false}
                  style={{
                    padding: "9px 16px",
                    fontSize: "0.88rem",
                    backgroundColor: "#ffffff",
                    color: "#065f46",
                    border: "1px solid #10b981",
                    borderRadius: "10px",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  📁 내 영구 보관함에서 보기
                </Link>
              )}
              <button
                onClick={handlePrint}
                type="button"
                className="btn-primary"
                style={{ padding: "9px 16px", fontSize: "0.88rem", backgroundColor: "#059669", borderRadius: "10px" }}
              >
                🖨️ 체결본 PDF 인쇄/저장
              </button>
            </div>
          </div>
        ) : (
          <div
            className="no-print"
            style={{
              padding: "18px 22px",
              borderRadius: "16px",
              backgroundColor: "rgba(37, 99, 235, 0.08)",
              border: "1px solid rgba(37, 99, 235, 0.2)",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.6rem" }}>✍️</span>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1e40af" }}>
                  {contract.partyACompany || contract.partyAName}님께서 작성한 계약서입니다
                </div>
                <div style={{ fontSize: "0.82rem", color: "#2563eb" }}>
                  아래 계약 조항 전문을 확인하시고 하단 <strong>[서명하기]</strong> 버튼을 누르면 즉시 체결됩니다.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 계약서 본문 페이퍼 카드 */}
        <div
          id="contract-paper-area"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid var(--color-border)",
            padding: "40px 36px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
            color: "#1e293b",
            fontFamily: "var(--font-pretendard), sans-serif",
            lineHeight: 1.65,
          }}
        >
          {/* 계약서 제목 */}
          <div style={{ textAlign: "center", borderBottom: "2px solid #0f172a", paddingBottom: "18px", marginBottom: "24px" }}>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0, letterSpacing: "2px", color: "#0f172a" }}>
              {contract.title}
            </h1>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "6px" }}>
              계약 고유번호: {contract.id} | 작성일: {new Date(contract.createdAt).toLocaleDateString("ko-KR")}
            </div>
          </div>

          {/* 당사자 개요 표 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            <div style={{ border: "1px solid #cbd5e1", borderRadius: "10px", padding: "14px", backgroundColor: "#f8fafc" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#2563eb", marginBottom: "6px" }}>
                [갑] 의뢰인 / 사용자 / 공급자
              </div>
              <div style={{ fontSize: "0.85rem" }}>상호: <strong>{contract.partyACompany || "-"}</strong></div>
              <div style={{ fontSize: "0.85rem" }}>성명: {contract.partyAName || "-"}</div>
              {contract.partyABno && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>사업자번호: {contract.partyABno}</div>}
              {contract.partyAPhone && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>연락처: {contract.partyAPhone}</div>}
            </div>

            <div style={{ border: "1px solid #cbd5e1", borderRadius: "10px", padding: "14px", backgroundColor: "#f8fafc" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#059669", marginBottom: "6px" }}>
                [을] 수임인 / 근로자 / 수신자
              </div>
              <div style={{ fontSize: "0.85rem" }}>상호: <strong>{contract.partyBCompany || "-"}</strong></div>
              <div style={{ fontSize: "0.85rem" }}>성명: {contract.partyBName || "-"}</div>
              {contract.partyBBno && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>사업자번호: {contract.partyBBno}</div>}
              {contract.partyBPhone && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>연락처: {contract.partyBPhone}</div>}
            </div>
          </div>

          {/* 계약 본문 조항 전문 렌더링 (표준 양식 렌더러 / 동적 조항 레이아웃 / 한글 항목 표) */}
          <div style={{ marginBottom: "32px" }}>
            {isLegacyTemplate ? (
              <div
                style={{
                  pointerEvents: "none",
                  userSelect: "text",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "24px",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                }}
              >
                <LegacyTemplateRenderer
                  templateId={contract.templateId}
                  data={{
                    ...formData,
                    signatureImage: contract.partyASignature || formData.signatureImage,
                    partyBSignatureImage: contract.partyBSignature || formData.partyBSignatureImage,
                  }}
                  readOnly={true}
                  handleFieldInputDirect={NOOP}
                  handleFieldChange={NOOP}
                  handleArrayFieldChange={NOOP}
                />
              </div>
            ) : layoutElements.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {layoutElements.map((el: any, idx: number) => {
                  if (!el || el.type === "page-break" || el.type === "title") return null;
                  if (el.type === "spacer") {
                    return <div key={idx} style={{ height: "12px" }} />;
                  }
                  if (el.type === "subtitle") {
                    return (
                      <h3
                        key={idx}
                        style={{
                          fontSize: "1.02rem",
                          fontWeight: 800,
                          color: "#0f172a",
                          borderLeft: "4px solid #2563eb",
                          paddingLeft: "10px",
                          margin: "16px 0 6px 0",
                        }}
                      >
                        {bindTemplateText(el.value)}
                      </h3>
                    );
                  }
                  if (el.type === "paragraph") {
                    return (
                      <p
                        key={idx}
                        style={{
                          fontSize: "0.92rem",
                          color: "#1e293b",
                          lineHeight: 1.7,
                          margin: "4px 0 8px 0",
                          whiteSpace: "pre-wrap",
                          wordBreak: "keep-all",
                        }}
                      >
                        {bindTemplateText(el.value)}
                      </p>
                    );
                  }
                  if (el.type === "table" && Array.isArray(el.rows)) {
                    return (
                      <table
                        key={idx}
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          border: "1px solid #cbd5e1",
                          margin: "8px 0 14px 0",
                          fontSize: "0.88rem",
                        }}
                      >
                        <tbody>
                          {el.rows.flatMap((row: any, rIdx: number) => {
                            if (row.repeatKey) {
                              const items = Array.isArray(formData[row.repeatKey])
                                ? formData[row.repeatKey]
                                : [];
                              return items.map((item: any, itemIdx: number) => (
                                <tr key={`${rIdx}-${itemIdx}`}>
                                  {row.cells?.map((cell: any, cIdx: number) => {
                                    const val = cell.key
                                      ? item?.[cell.key] ?? ""
                                      : String(cell.label || "").replace(
                                          /\{(\w+)\}/g,
                                          (_m, k) => item?.[k] ?? ""
                                        );
                                    return (
                                      <td
                                        key={cIdx}
                                        colSpan={cell.colSpan}
                                        rowSpan={cell.rowSpan}
                                        style={{
                                          border: "1px solid #cbd5e1",
                                          padding: "8px 10px",
                                          textAlign: cell.align || "left",
                                          whiteSpace: "pre-wrap",
                                        }}
                                      >
                                        {val}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ));
                            }

                            return (
                              <tr key={rIdx}>
                                {row.cells?.map((cell: any, cIdx: number) => {
                                  const isHeader =
                                    cell.bg === "#f9fafb" || cell.bg === "var(--bg-color-app)" || cell.bold;
                                  const val = cell.key
                                    ? formData[cell.key] ?? bindTemplateText(cell.label)
                                    : bindTemplateText(cell.label);
                                  return (
                                    <td
                                      key={cIdx}
                                      colSpan={cell.colSpan}
                                      rowSpan={cell.rowSpan}
                                      style={{
                                        border: "1px solid #cbd5e1",
                                        padding: "8px 10px",
                                        backgroundColor: isHeader ? "#f8fafc" : "#ffffff",
                                        fontWeight: isHeader ? 700 : 400,
                                        textAlign: cell.align || "left",
                                        width: cell.width,
                                        whiteSpace: "pre-wrap",
                                      }}
                                    >
                                      {val}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, borderLeft: "4px solid #2563eb", paddingLeft: "10px", marginBottom: "14px" }}>
                  주요 계약 조건 및 약정 내역
                </h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", border: "1px solid #e2e8f0" }}>
                  <tbody>
                    {Object.entries(formData)
                      .filter(
                        ([key, val]) =>
                          !["signatureImage", "stampImage", "brandLogo", "partyAEmail", "partyBEmail"].includes(key) &&
                          val !== null &&
                          val !== undefined &&
                          (typeof val !== "string" || val.trim().length > 0) &&
                          (!Array.isArray(val) || val.length > 0)
                      )
                      .map(([key, value]: [string, any], idx) => {
                        const koreanLabel = fieldLabelMap[key] || key;
                        return (
                          <tr key={key} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                            <td style={{ padding: "10px 14px", width: "34%", fontWeight: 700, color: "#334155", borderRight: "1px solid #e2e8f0" }}>
                              {koreanLabel}
                            </td>
                            <td style={{ padding: "10px 14px", color: "#0f172a", whiteSpace: "pre-wrap" }}>
                              {Array.isArray(value) ? (
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                                  <tbody>
                                    {value.map((rowObj: any, rIdx: number) => (
                                      <tr key={rIdx} style={{ borderBottom: "1px dashed #cbd5e1" }}>
                                        {typeof rowObj === "object" && rowObj !== null ? (
                                          Object.entries(rowObj).map(([subK, subV]) => (
                                            <td key={subK} style={{ padding: "4px 6px" }}>
                                              <span style={{ color: "#64748b", fontWeight: 600 }}>
                                                {fieldLabelMap[`${key}.${subK}`] || fieldLabelMap[subK] || subK}:{" "}
                                              </span>
                                              <span>{String(subV ?? "-")}</span>
                                            </td>
                                          ))
                                        ) : (
                                          <td style={{ padding: "4px 6px" }}>{String(rowObj)}</td>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                String(value)
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* 상호 전자서명 날인 블록 */}
          <div style={{ borderTop: "2px solid #0f172a", paddingTop: "24px", marginTop: "32px", breakInside: "avoid" }}>
            <p style={{ textAlign: "center", fontSize: "0.9rem", color: "#475569", marginBottom: "24px" }}>
              본 계약의 성립을 증명하기 위하여 계약 당사자는 위 계약 조항 전문을 확인하고 전자서명법에 따라 상호 전자서명 날인합니다.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
              {/* 갑 서명 */}
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "22px 16px", textAlign: "center", position: "relative" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#64748b", marginBottom: "14px" }}>
                  [갑] 서명 날인
                </div>
                <div style={{ minHeight: "52px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                  <span>{contract.partyACompany} {contract.partyAName}</span>
                  <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", marginLeft: "6px" }}>
                    <span>(인)</span>
                    {contract.partyASignature && (
                      <img
                        src={contract.partyASignature}
                        alt="갑 서명"
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "58px",
                          height: "58px",
                          objectFit: "contain",
                          pointerEvents: "none",
                          opacity: 0.92,
                          mixBlendMode: "multiply",
                        }}
                      />
                    )}
                  </span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "10px" }}>
                  서명일시: {contract.partyASignedAt ? new Date(contract.partyASignedAt).toLocaleString("ko-KR") : "-"}
                </div>
              </div>

              {/* 을 서명 */}
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "22px 16px", textAlign: "center", position: "relative" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#64748b", marginBottom: "14px" }}>
                  [을] 서명 날인
                </div>
                <div style={{ minHeight: "52px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                  <span>{contract.partyBCompany || ""} {contract.partyBName || ""}</span>
                  <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", marginLeft: "6px" }}>
                    <span>(인)</span>
                    {partyBSignature && (
                      <img
                        src={partyBSignature}
                        alt="을 서명"
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "58px",
                          height: "58px",
                          objectFit: "contain",
                          pointerEvents: "none",
                          opacity: 0.92,
                          mixBlendMode: "multiply",
                        }}
                      />
                    )}
                  </span>
                </div>
                <div style={{ fontSize: "0.72rem", color: partyBSignature ? "#64748b" : "#dc2626", fontWeight: partyBSignature ? 400 : 700, marginTop: "10px" }}>
                  {partyBSignature
                    ? `서명일시: ${contract.partyBSignedAt ? new Date(contract.partyBSignedAt).toLocaleString("ko-KR") : new Date().toLocaleString("ko-KR")}`
                    : "⚠️ 서명 대기 중 (하단 버튼을 눌러 날인해 주세요)"}
                </div>
              </div>
            </div>
          </div>

          {/* 법적 효력 감사 추적 로그 (Audit Trail) */}
          <div
            style={{
              marginTop: "32px",
              padding: "14px 16px",
              backgroundColor: "#f8fafc",
              borderRadius: "10px",
              fontSize: "0.75rem",
              color: "#64748b",
              lineHeight: 1.5,
              border: "1px solid #e2e8f0",
              breakInside: "avoid",
            }}
          >
            <div style={{ fontWeight: 800, color: "#1e293b", marginBottom: "4px" }}>
              🛡️ 마음데이타 위변조 방지 전자계약 감사 증명 (Cloudflare R2 불변 보관)
            </div>
            <div>• 계약서 고유 식별코드: {contract.id}</div>
            <div>• 체결 규정: 대한민국 전자서명법 제3조 및 전자문서 및 전자거래 기본법 제4조 준수</div>
            <div>• 시점확인(Time-Stamp) 및 클라우드 원본 보존: 활성화 완료</div>
          </div>
        </div>

        {/* 하단 플로팅 서명 버튼 (미완료 시, 인쇄 시 숨김) */}
        {!completed && (
          <div
            className="sign-floating-cta no-print"
            style={{
              position: "fixed",
              bottom: "16px",
              left: "16px",
              right: "16px",
              maxWidth: "1032px",
              margin: "0 auto",
              zIndex: 999,
            }}
          >
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                vibrateDevice(30);
                setIsSignModalOpen(true);
              }}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "16px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                fontWeight: 800,
                fontSize: "1.05rem",
                cursor: "pointer",
                boxShadow: "0 10px 25px rgba(37, 99, 235, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span>✍️ 위 계약 조항에 동의하며 서명(도장) 날인하기</span>
            </button>
          </div>
        )}
      </div>

      {/* 전자 서명 모달 (열렸을 때만 마운트) */}
      {isSignModalOpen && (
        <DocumentSignatureModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          onApplySignature={handleApplySignature}
          defaultSignerName={contract?.partyBName || "수임인"}
        />
      )}

      {/* 영구 보관함 로그인 모달 (열렸을 때만 마운트) */}
      {isAuthModalOpen && (
        <ContractAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleBindToVault}
        />
      )}
    </div>
  );
}
