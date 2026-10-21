"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import DocumentSignatureModal from "@/components/DocumentSignatureModal";
import ContractAuthModal from "@/components/ContractAuthModal";
import { vibrateDevice, showAppToast } from "@/lib/appBridge";
import { saveContractToLocal, getLoggedInUser, ContractUser } from "@/lib/contractStorage";
import MaumDataLogo from "@/components/MaumDataLogo";

export default function SignContractPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<any>(null);
  const [requiresPin, setRequiresPin] = useState(false);
  const [pinInput, setPinInput] = useState("");
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
      if (user?.id) query.set("userId", user.id);

      const res = await fetch(`/api/contracts/${token}?${query.toString()}`);
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
      setContract(data.contract);
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

  useEffect(() => {
    loadContract();
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
    setPartyBSignature(sigDataUrl);
    setSubmitting(true);
    vibrateDevice(40);

    try {
      const user = getLoggedInUser();
      const res = await fetch(`/api/contracts/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureImage: sigDataUrl,
          signerName: contract?.partyBName || "",
          partyBUserId: user?.id || "",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "서명 제출에 실패했습니다.");
      }

      setCompleted(true);
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
      await fetch(`/api/contracts/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bind_user",
          partyBUserId: user.id,
        }),
      });
      setCurrentUser(user);
      setBoundToVault(true);
      showAppToast("내 영구 계약 보관함(/contracts)에 등록되었습니다!");
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
        <Link href="/" className="btn-primary" style={{ padding: "10px 20px" }}>
          마음데이터 홈으로 이동
        </Link>
      </div>
    );
  }

  // 계약 진행 중 임시 비밀번호 입력 화면
  if (requiresPin) {
    return (
      <div style={{ backgroundColor: "var(--bg-color-main)", minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div
          style={{
            backgroundColor: "var(--color-card)",
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
            진행 중인 비대면 계약서 보호
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
              maxLength={8}
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

  return (
    <div style={{ backgroundColor: "var(--bg-color-main)", minHeight: "100vh", padding: "28px 0 110px 0" }}>
      <div className="container">
        {/* 상단 브랜드 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 700, backgroundColor: "rgba(37, 99, 235, 0.08)", padding: "3px 10px", borderRadius: "6px" }}>
              안전한 단일 링크 전자계약
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/contracts"
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

        {/* 상태 배너 */}
        {completed ? (
          <div
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
                  아래 내용을 확인하시고 하단 <strong>[서명하기]</strong> 버튼을 누르면 카톡으로 파일을 다시 보낼 필요 없이 즉시 체결됩니다.
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
            lineHeight: 1.6,
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" }}>
            {/* 갑 */}
            <div style={{ border: "1px solid #cbd5e1", borderRadius: "10px", padding: "14px", backgroundColor: "#f8fafc" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#2563eb", marginBottom: "6px" }}>
                [갑] 의뢰인 / 공급자
              </div>
              <div style={{ fontSize: "0.85rem" }}>상호: <strong>{contract.partyACompany || "-"}</strong></div>
              <div style={{ fontSize: "0.85rem" }}>성명: {contract.partyAName || "-"}</div>
              {contract.partyABno && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>사업자번호: {contract.partyABno}</div>}
              {contract.partyAPhone && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>연락처: {contract.partyAPhone}</div>}
            </div>

            {/* 을 */}
            <div style={{ border: "1px solid #cbd5e1", borderRadius: "10px", padding: "14px", backgroundColor: "#f8fafc" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#059669", marginBottom: "6px" }}>
                [을] 수임인 / 수신자
              </div>
              <div style={{ fontSize: "0.85rem" }}>상호: <strong>{contract.partyBCompany || "-"}</strong></div>
              <div style={{ fontSize: "0.85rem" }}>성명: {contract.partyBName || "-"}</div>
              {contract.partyBBno && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>사업자번호: {contract.partyBBno}</div>}
              {contract.partyBPhone && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>연락처: {contract.partyBPhone}</div>}
            </div>
          </div>

          {/* 본문 조항 및 폼 데이터 테이블 */}
          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, borderLeft: "4px solid #2563eb", paddingLeft: "10px", marginBottom: "14px" }}>
              주요 계약 조건 및 내역
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <tbody>
                {Object.entries(formData)
                  .filter(([key, val]) => typeof val === "string" && val.trim().length > 0 && !["signatureImage", "stampImage"].includes(key))
                  .map(([key, value]: [string, any], idx) => (
                    <tr key={key} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                      <td style={{ padding: "10px 14px", width: "35%", fontWeight: 700, color: "#475569" }}>
                        {key}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#0f172a", whiteSpace: "pre-wrap" }}>
                        {value}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* 서명 날인 블록 */}
          <div style={{ borderTop: "2px solid #0f172a", paddingTop: "24px", marginTop: "32px" }}>
            <p style={{ textAlign: "center", fontSize: "0.9rem", color: "#475569", marginBottom: "24px" }}>
              본 계약의 성립을 증명하기 위하여 계약 당사자는 위 계약 내용을 확인하고 전자서명법에 따라 상호 전자서명 날인합니다.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
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
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "10px" }}>
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
                <div style={{ fontSize: "0.72rem", color: partyBSignature ? "#94a3b8" : "#ef4444", fontWeight: partyBSignature ? 400 : 700, marginTop: "10px" }}>
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
            }}
          >
            <div style={{ fontWeight: 800, color: "#1e293b", marginBottom: "4px" }}>
              🛡️ 마음데이터 위변조 방지 전자계약 감사 증명 (Cloudflare R2 불변 보관)
            </div>
            <div>• 계약서 고유 식별코드: {contract.id}</div>
            <div>• 체결 규정: 대한민국 전자서명법 제3조 및 전자문서 및 전자거래 기본법 제4조 준수</div>
            <div>• 시점확인(Time-Stamp) 및 클라우드 원본 보존: 활성화 완료</div>
          </div>
        </div>

        {/* 하단 플로팅 서명 버튼 (미완료 시) */}
        {!completed && (
          <div
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
              <span>✍️ 위 내용에 동의하며 서명(도장) 날인하기</span>
            </button>
          </div>
        )}
      </div>

      {/* 전자 서명 모달 */}
      <DocumentSignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onApplySignature={handleApplySignature}
        defaultSignerName={contract?.partyBName || "수임인"}
      />

      {/* 영구 보관함 로그인 모달 */}
      <ContractAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleBindToVault}
      />
    </div>
  );
}
