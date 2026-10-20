"use client";

import React, { useState } from "react";
import { vibrateDevice, showAppToast } from "@/lib/appBridge";

interface RequestSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  templateTitle: string;
  formData: any;
  currentSignature?: string | null;
  onRequireSignature: () => void;
}

export default function RequestSignatureModal({
  isOpen,
  onClose,
  templateId,
  templateTitle,
  formData,
  currentSignature,
  onRequireSignature
}: RequestSignatureModalProps) {
  // 갑 정보 (내 정보)
  const [partyAName, setPartyAName] = useState(
    formData?.name || formData?.partyA_owner || formData?.owner || formData?.representative || "대표자"
  );
  const [partyACompany, setPartyACompany] = useState(
    formData?.company || formData?.partyA_name || "마음데이타 파트너"
  );
  const [partyAPhone, setPartyAPhone] = useState(formData?.phone || "");

  // 을 정보 (상대방 정보)
  const [partyBName, setPartyBName] = useState(
    formData?.client || formData?.partyB_owner || formData?.receiver || ""
  );
  const [partyBCompany, setPartyBCompany] = useState(
    formData?.target_company || formData?.partyB_name || ""
  );
  const [partyBPhone, setPartyBPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    contractId: string;
    signUrl: string;
    signToken: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCreateRequest = async () => {
    vibrateDevice(30);

    if (!currentSignature) {
      alert("먼저 내 서명 또는 인감도장을 날인해 주세요.");
      onRequireSignature();
      return;
    }

    if (!partyBName.trim() && !partyBCompany.trim()) {
      alert("서명받으실 상대방의 성함 또는 상호명을 입력해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/contracts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          title: templateTitle,
          partyAName,
          partyACompany,
          partyAPhone,
          partyASignature: currentSignature,
          partyBName,
          partyBCompany,
          partyBPhone,
          formData
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "서명 요청 링크 생성에 실패했습니다.");
      }

      setCreatedResult({
        contractId: data.contractId,
        signUrl: data.signUrl,
        signToken: data.signToken
      });
      vibrateDevice(50);
      showAppToast("비대면 서명 요청 링크가 생성되었습니다!");
    } catch (err: any) {
      alert(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdResult) return;
    vibrateDevice(20);
    navigator.clipboard.writeText(createdResult.signUrl);
    showAppToast("서명 요청 링크가 복사되었습니다!");
    alert("서명 링크가 클립보드에 복사되었습니다.\n거래처에 카카오톡이나 문자로 전송해 주세요.");
  };

  const handleShareKakao = () => {
    if (!createdResult) return;
    vibrateDevice(30);
    const message = `[마음데이터 전자계약 서명 요청]\n\n${partyACompany || partyAName}님께서 '${templateTitle}' 비대면 서명을 요청하셨습니다.\n\n아래 링크에서 내용을 확인하시고 화면에 서명해 주세요:\n${createdResult.signUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${templateTitle} 전자서명 요청`,
        text: message,
        url: createdResult.signUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(message);
      alert("서명 요청 메시지가 복사되었습니다. 카카오톡 창에 붙여넣어 전송하세요!");
    }
  };

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
        backgroundColor: "rgba(15, 23, 42, 0.75)",
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
          maxWidth: "480px",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "1.2rem" }}>🤝</span>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                비대면 전자서명 요청 (100% 무료)
              </h3>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "var(--color-text-sub)" }}>
              상대방에게 카카오톡/문자로 링크를 보내 폰에서 즉시 사인을 받습니다.
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

        {!createdResult ? (
          <>
            {/* 1. 내 서명 상태 점검 */}
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                backgroundColor: currentSignature ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
                border: currentSignature ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(245, 158, 11, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>{currentSignature ? "✅" : "⚠️"}</span>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                    {currentSignature ? "내 서명/인감 날인 완료" : "내 서명이 아직 날인되지 않았습니다"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-sub)" }}>
                    {currentSignature ? "상대방 서명란이 비어있는 상태로 전송됩니다." : "서명을 먼저 등록해야 법적 효력이 발생합니다."}
                  </div>
                </div>
              </div>
              {!currentSignature && (
                <button
                  type="button"
                  onClick={onRequireSignature}
                  style={{
                    backgroundColor: "#f59e0b",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  서명하기
                </button>
              )}
            </div>

            {/* 2. 상대방 정보 입력 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                서명받을 상대방(을) 정보
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", display: "block", marginBottom: "4px" }}>
                    상대방 상호/소속
                  </label>
                  <input
                    type="text"
                    value={partyBCompany}
                    onChange={(e) => setPartyBCompany(e.target.value)}
                    placeholder="예: (주)한국상사"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--bg-color-main)",
                      color: "var(--color-text-main)",
                      fontSize: "0.9rem"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", display: "block", marginBottom: "4px" }}>
                    성명/대표자명 *
                  </label>
                  <input
                    type="text"
                    value={partyBName}
                    onChange={(e) => setPartyBName(e.target.value)}
                    placeholder="예: 김철수"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--bg-color-main)",
                      color: "var(--color-text-main)",
                      fontSize: "0.9rem",
                      fontWeight: 600
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", display: "block", marginBottom: "4px" }}>
                  상대방 연락처 (선택)
                </label>
                <input
                  type="text"
                  value={partyBPhone}
                  onChange={(e) => setPartyBPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--bg-color-main)",
                    color: "var(--color-text-main)",
                    fontSize: "0.9rem"
                  }}
                />
              </div>
            </div>

            {/* 법적 효력 안내 */}
            <div
              style={{
                fontSize: "0.76rem",
                color: "var(--color-text-desc)",
                backgroundColor: "var(--bg-color-main)",
                padding: "10px 12px",
                borderRadius: "10px",
                lineHeight: 1.5
              }}
            >
              ⚖️ <strong>대한민국 전자서명법 제3조 준수</strong><br />
              양 당사자의 서명 완료 시 시점확인(타임스탬프), 접속 IP, 본인 확인 정보가 기록되어 법적 구속력을 갖습니다.
            </div>

            {/* 요청 생성 버튼 */}
            <button
              type="button"
              onClick={handleCreateRequest}
              disabled={loading}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "14px",
                fontWeight: 800,
                fontSize: "1rem",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <span>{loading ? "서명 요청 링크 생성 중..." : "🚀 무료 서명 요청 링크 생성"}</span>
            </button>
          </>
        ) : (
          /* 생성 완료 화면 */
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem" }}>🎉</div>
            <div>
              <h4 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                서명 요청 링크가 생성되었습니다!
              </h4>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--color-text-sub)" }}>
                상대방에게 링크를 전달하면 휴대폰에서 10초 만에 서명할 수 있습니다.
              </p>
            </div>

            {/* 링크 박스 */}
            <div
              style={{
                backgroundColor: "var(--bg-color-main)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                padding: "12px",
                fontSize: "0.82rem",
                color: "#2563eb",
                fontWeight: 600,
                wordBreak: "break-all",
                textAlign: "left"
              }}
            >
              {createdResult.signUrl}
            </div>

            {/* 공유 버튼들 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                type="button"
                onClick={handleShareKakao}
                style={{
                  backgroundColor: "#fee500",
                  color: "#191919",
                  border: "none",
                  borderRadius: "12px",
                  padding: "14px",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                }}
              >
                <span>💬 카카오톡으로 서명 요청 보내기</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  backgroundColor: "var(--bg-color-main)",
                  color: "var(--color-text-main)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  padding: "12px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer"
                }}
              >
                📋 링크 복사하기
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-text-desc)",
                fontSize: "0.85rem",
                cursor: "pointer",
                marginTop: "4px"
              }}
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
