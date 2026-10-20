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
  const [partyAEmail, setPartyAEmail] = useState(formData?.email || "");

  // 을 정보 (상대방 정보)
  const [partyBName, setPartyBName] = useState(
    formData?.client || formData?.partyB_owner || formData?.receiver || ""
  );
  const [partyBCompany, setPartyBCompany] = useState(
    formData?.target_company || formData?.partyB_name || ""
  );
  const [partyBEmail, setPartyBEmail] = useState("");

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
          partyAEmail,
          partyASignature: currentSignature,
          partyBName,
          partyBCompany,
          partyBEmail,
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
      showAppToast("비대면 서명 요청 준비가 완료되었습니다!");
    } catch (err: any) {
      alert(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 이메일 제목 및 본문 템플릿 생성기
  const getEmailContent = () => {
    if (!createdResult) return { subject: "", body: "" };

    const senderDisplay = partyACompany ? `${partyACompany}(${partyAName})` : partyAName;
    const recipientDisplay = partyBCompany ? `${partyBCompany} ${partyBName} 대표님(귀하)` : `${partyBName} 귀하`;

    const subject = `[전자계약 서명 요청] ${senderDisplay} - '${templateTitle}' 비대면 서명의 건`;
    const body = `안녕하세요, ${recipientDisplay}.

${senderDisplay}입니다.
합의된 조건에 따라 작성된 '${templateTitle}'의 비대면 서명을 요청드립니다.

아래의 안전한 전용 링크를 모바일이나 PC에서 클릭하시어,
계약서 내용을 확인하신 후 화면에서 직접 전자서명 날인해 주시기 바랍니다.

▶ 전자계약서 확인 및 서명 링크:
${createdResult.signUrl}

* 본 계약은 대한민국 전자서명법 제3조에 따라 법적 구속력을 갖습니다.
* 스마트폰 화면에서 손가락으로 10초 만에 자필 사인 또는 인감도장을 날인하실 수 있습니다.
* 서명 완료 시 상호 서명이 날인된 최종 계약서 및 감사증명서를 즉시 다운로드하실 수 있습니다.

감사합니다.
${senderDisplay} 드림
${partyAEmail ? `(회신용 이메일: ${partyAEmail})` : ""}`;

    return { subject, body };
  };

  // 1. Gmail 웹메일 작성창 바로 열기
  const handleOpenGmail = () => {
    if (!createdResult) return;
    vibrateDevice(20);
    const { subject, body } = getEmailContent();
    const to = partyBEmail.trim();
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank");
  };

  // 2. 네이버 메일 작성창 바로 열기
  const handleOpenNaverMail = () => {
    if (!createdResult) return;
    vibrateDevice(20);
    const { subject, body } = getEmailContent();
    const to = partyBEmail.trim();
    const naverUrl = `https://mail.naver.com/v2/folders/0/write?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(naverUrl, "_blank");
  };

  // 3. 스마트폰 기본 메일 앱 (또는 Outlook) 열기 (mailto)
  const handleOpenDefaultMail = () => {
    if (!createdResult) return;
    vibrateDevice(20);
    const { subject, body } = getEmailContent();
    const to = partyBEmail.trim();
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  // 4. 이메일 전문 복사
  const handleCopyEmailText = () => {
    if (!createdResult) return;
    vibrateDevice(20);
    const { subject, body } = getEmailContent();
    const fullText = `제목: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    showAppToast("이메일 전문이 클립보드에 복사되었습니다!");
    alert("이메일 제목과 본문이 모두 복사되었습니다.\n원하시는 메일 프로그램이나 메신저에 붙여넣어 전송하세요!");
  };

  // 5. 카카오톡/SNS 공유
  const handleShareMobile = () => {
    if (!createdResult) return;
    vibrateDevice(30);
    const { subject, body } = getEmailContent();
    if (navigator.share) {
      navigator.share({
        title: subject,
        text: body,
        url: createdResult.signUrl
      }).catch(() => {});
    } else {
      handleCopyEmailText();
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
          maxWidth: "500px",
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
              <span style={{ fontSize: "1.2rem" }}>✉️</span>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                직접 이메일로 서명 요청하기
              </h3>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "var(--color-text-sub)" }}>
              내 메일(Gmail, 네이버 등)에서 상대방에게 서명 요청 이메일을 직접 보냅니다.
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
                    {currentSignature ? "내 서명 날인 완료" : "내 서명을 먼저 날인해 주세요"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-sub)" }}>
                    {currentSignature ? "상대방 서명란이 빈 상태로 전송됩니다." : "서명이 있어야 상대방이 신뢰하고 서명합니다."}
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

            {/* 2. 발신자 & 수신자 이메일 정보 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* 내 회신 이메일 */}
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-main)", display: "block", marginBottom: "4px" }}>
                  내 이메일 주소 (상대방이 회신받을 주소)
                </label>
                <input
                  type="email"
                  value={partyAEmail}
                  onChange={(e) => setPartyAEmail(e.target.value)}
                  placeholder="예: mycompany@naver.com"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--bg-color-main)",
                    color: "var(--color-text-main)",
                    fontSize: "0.9rem"
                  }}
                />
              </div>

              {/* 상대방 정보 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", display: "block", marginBottom: "4px" }}>
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
                  <label style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", display: "block", marginBottom: "4px" }}>
                    상대방 성명 *
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
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-main)", display: "block", marginBottom: "4px" }}>
                  상대방 이메일 주소 (수신처)
                </label>
                <input
                  type="email"
                  value={partyBEmail}
                  onChange={(e) => setPartyBEmail(e.target.value)}
                  placeholder="예: partner@gmail.com (메일 작성창에 자동 기입됩니다)"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--bg-color-main)",
                    color: "var(--color-text-main)",
                    fontSize: "0.9rem"
                  }}
                />
              </div>
            </div>

            {/* 안내 배너 */}
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
              🔒 <strong>개인 간 직접 소통 방식 (P2P Email)</strong><br />
              마음데이터는 계약서를 임의로 열람하거나 통제하지 않으며, 회원님의 본인 이메일 계정을 통해 상대방과 직접 계약서 및 서명을 주고받습니다.
            </div>

            {/* 링크 생성 버튼 */}
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
              <span>{loading ? "서명 링크 생성 중..." : "🚀 이메일 발송 준비 완료"}</span>
            </button>
          </>
        ) : (
          /* 생성 완료 화면: 원클릭 이메일러 옵션들 */
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.4rem", marginBottom: "4px" }}>✉️</div>
              <h4 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                원하시는 메일 서비스로 바로 보내세요!
              </h4>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--color-text-sub)" }}>
                아래 버튼을 누르면 제목, 내용, 서명 링크가 모두 작성된 메일창이 열립니다.
              </p>
            </div>

            {/* 3대 이메일 작성 버튼 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* 1. Gmail */}
              <button
                type="button"
                onClick={handleOpenGmail}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#d93025",
                  border: "1.5px solid #ea4335",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontWeight: 800,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 6px rgba(234, 67, 53, 0.1)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1.3rem" }}>🔴</span>
                  <span>Gmail(구글)로 바로 보내기</span>
                </div>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>열기 ➔</span>
              </button>

              {/* 2. 네이버 메일 */}
              <button
                type="button"
                onClick={handleOpenNaverMail}
                style={{
                  backgroundColor: "#03c75a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontWeight: 800,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(3, 199, 90, 0.2)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1.2rem", fontWeight: 900 }}>N</span>
                  <span>네이버 메일로 바로 보내기</span>
                </div>
                <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>열기 ➔</span>
              </button>

              {/* 3. 스마트폰 기본 메일앱 / Outlook */}
              <button
                type="button"
                onClick={handleOpenDefaultMail}
                style={{
                  backgroundColor: "var(--bg-color-main)",
                  color: "var(--color-text-main)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1.2rem" }}>📱</span>
                  <span>스마트폰 기본 메일앱 / 아웃룩 열기</span>
                </div>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>열기 ➔</span>
              </button>
            </div>

            {/* 복사 & 카카오톡 보조 옵션 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                onClick={handleCopyEmailText}
                style={{
                  backgroundColor: "var(--bg-color-main)",
                  color: "var(--color-text-main)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  padding: "10px",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  cursor: "pointer"
                }}
              >
                📋 이메일 전문 복사
              </button>
              <button
                type="button"
                onClick={handleShareMobile}
                style={{
                  backgroundColor: "#fee500",
                  color: "#191919",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer"
                }}
              >
                💬 카톡/기타 공유
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
                marginTop: "2px"
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
