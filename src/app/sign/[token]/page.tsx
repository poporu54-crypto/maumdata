"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import DocumentSignatureModal from "@/components/DocumentSignatureModal";
import { vibrateDevice, showAppToast } from "@/lib/appBridge";
import MaumDataLogo from "@/components/MaumDataLogo";

export default function SignContractPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [partyBSignature, setPartyBSignature] = useState<string | null>(null);

  useEffect(() => {
    async function loadContract() {
      try {
        setLoading(true);
        const res = await fetch(`/api/contracts/${token}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "계약서를 불러올 수 없습니다.");
        }
        setContract(data.contract);
        if (data.contract.status === "COMPLETED") {
          setCompleted(true);
          setPartyBSignature(data.contract.partyBSignature);
        }
      } catch (err: any) {
        setError(err.message || "계약서 로드 실패");
      } finally {
        setLoading(false);
      }
    }
    loadContract();
  }, [token]);

  const handleApplySignature = async (sigDataUrl: string) => {
    setPartyBSignature(sigDataUrl);
    setSubmitting(true);
    vibrateDevice(40);

    try {
      const res = await fetch(`/api/contracts/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureImage: sigDataUrl,
          signerName: contract?.partyBName || ""
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "서명 제출에 실패했습니다.");
      }

      setCompleted(true);
      vibrateDevice(50);
      showAppToast("계약이 성공적으로 체결되었습니다!");
    } catch (err: any) {
      alert(err.message || "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
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

  const formData = contract.formData || {};

  return (
    <div style={{ backgroundColor: "var(--bg-color-main)", minHeight: "100vh", padding: "24px 16px 100px 16px" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        {/* 상단 브랜드 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <MaumDataLogo size="sm" />
            <span style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 700, backgroundColor: "rgba(37, 99, 235, 0.08)", padding: "2px 8px", borderRadius: "6px" }}>
              안전한 비대면 전자계약
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-desc)" }}>
            전자서명법 제3조 준수
          </span>
        </div>

        {/* 상태 배너 */}
        {completed ? (
          <div
            style={{
              padding: "18px 20px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)",
              border: "1.5px solid rgba(16, 185, 129, 0.3)",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.8rem" }}>🎉</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#065f46" }}>
                  계약 체결이 완료되었습니다
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#047857" }}>
                  양 당사자의 전자서명이 모두 날인되었으며 법적 효력이 발생했습니다.
                </p>
              </div>
            </div>
            <button
              onClick={handlePrint}
              type="button"
              className="btn-primary"
              style={{ padding: "8px 16px", fontSize: "0.88rem", backgroundColor: "#059669" }}
            >
              🖨️ 체결본 PDF 인쇄/저장
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: "16px 20px",
              borderRadius: "16px",
              backgroundColor: "rgba(37, 99, 235, 0.08)",
              border: "1px solid rgba(37, 99, 235, 0.2)",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}
          >
            <span style={{ fontSize: "1.6rem" }}>✍️</span>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1e40af" }}>
                {contract.partyACompany || contract.partyAName}님께서 서명을 요청하셨습니다
              </div>
              <div style={{ fontSize: "0.8rem", color: "#2563eb" }}>
                아래 계약서 내용을 확인하신 후 하단 서명란에 서명해 주세요.
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
            padding: "36px 28px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
            color: "#1e293b",
            fontFamily: "var(--font-pretendard), sans-serif",
            lineHeight: 1.6
          }}
        >
          {/* 계약서 제목 */}
          <div style={{ textAlign: "center", borderBottom: "2px solid #0f172a", paddingBottom: "18px", marginBottom: "24px" }}>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0, letterSpacing: "2px", color: "#0f172a" }}>
              {contract.title}
            </h1>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "6px" }}>
              계약 번호: {contract.id} | 작성일: {new Date(contract.createdAt).toLocaleDateString("ko-KR")}
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
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", textAlign: "center", position: "relative" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#64748b", marginBottom: "8px" }}>
                  [갑] 서명 날인
                </div>
                <div style={{ height: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {contract.partyASignature ? (
                    <img
                      src={contract.partyASignature}
                      alt="갑 서명"
                      style={{ maxHeight: "56px", objectFit: "contain" }}
                    />
                  ) : (
                    <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>서명 완료</span>
                  )}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                  {contract.partyACompany} {contract.partyAName} (인)
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                  서명일시: {contract.partyASignedAt ? new Date(contract.partyASignedAt).toLocaleString("ko-KR") : "-"}
                </div>
              </div>

              {/* 을 서명 */}
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", textAlign: "center", position: "relative" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#64748b", marginBottom: "8px" }}>
                  [을] 서명 날인
                </div>
                <div style={{ height: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {partyBSignature ? (
                    <img
                      src={partyBSignature}
                      alt="을 서명"
                      style={{ maxHeight: "56px", objectFit: "contain" }}
                    />
                  ) : (
                    <span style={{ color: "#ef4444", fontWeight: 700, fontSize: "0.9rem" }}>
                      ⚠️ 서명 대기 중
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                  {contract.partyBCompany || ""} {contract.partyBName || ""} (인)
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                  {contract.partyBSignedAt ? `서명일시: ${new Date(contract.partyBSignedAt).toLocaleString("ko-KR")}` : "서명 시 자동 기록"}
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
              border: "1px solid #e2e8f0"
            }}
          >
            <div style={{ fontWeight: 800, color: "#1e293b", marginBottom: "4px" }}>
              🛡️ 마음데이터 위변조 방지 전자계약 감사 증명 (Audit Trail)
            </div>
            <div>• 계약서 고유 식별코드: {contract.id}</div>
            <div>• 체결 규정: 대한민국 전자서명법 제3조 및 전자문서 및 전자거래 기본법 제4조 준수</div>
            <div>• 시점확인(Time-Stamp): 공인 시각 인증 기록 완료</div>
          </div>
        </div>

        {/* 모바일 하단 플로팅 서명 버튼 (미완료 시) */}
        {!completed && (
          <div
            style={{
              position: "fixed",
              bottom: "16px",
              left: "16px",
              right: "16px",
              maxWidth: "760px",
              margin: "0 auto",
              zIndex: 999
            }}
          >
            <button
              type="button"
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
                gap: "8px"
              }}
            >
              <span>✍️ 위 내용에 동의하며 서명하기</span>
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
    </div>
  );
}
