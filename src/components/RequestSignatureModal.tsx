"use client";

import React, { useState, useEffect } from "react";
import { vibrateDevice, showAppToast } from "@/lib/appBridge";
import { saveContractToLocal, getLoggedInUser, ContractUser } from "@/lib/contractStorage";
import ContractAuthModal from "@/components/ContractAuthModal";

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
  onRequireSignature,
}: RequestSignatureModalProps) {
  const [currentUser, setCurrentUser] = useState<ContractUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

  // 진행 중 임시 비밀번호 (기본 4자리 숫자 자동생성)
  const [accessPin, setAccessPin] = useState(() =>
    String(Math.floor(1000 + Math.random() * 9000))
  );

  const [loading, setLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    contractId: string;
    signUrl: string;
    signToken: string;
    accessPin: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const user = getLoggedInUser();
      setCurrentUser(user);
      if (user?.email && !partyAEmail) {
        setPartyAEmail(user.email);
      }
    }
  }, [isOpen]);

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
          partyAEmail: currentUser?.email || partyAEmail,
          partyASignature: currentSignature,
          partyAUserId: currentUser?.id || "",
          partyBName,
          partyBCompany,
          partyBEmail,
          accessPin: accessPin.trim(),
          formData,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "계약서 전용 주소 생성에 실패했습니다.");
      }

      setCreatedResult({
        contractId: data.contractId,
        signUrl: data.signUrl,
        signToken: data.signToken,
        accessPin: data.accessPin || "",
      });
      saveContractToLocal(data.contractId);
      vibrateDevice(50);
      showAppToast("전용 계약서 주소와 임시 비밀번호가 생성되었습니다!");
    } catch (err: any) {
      alert(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 상대방에게 보낼 초대 메시지 포맷
  const getInviteMessage = () => {
    if (!createdResult) return "";
    const senderDisplay = partyACompany ? `${partyACompany}(${partyAName})` : partyAName;
    const recipientDisplay = partyBCompany ? `${partyBCompany} ${partyBName}님` : `${partyBName}님`;
    const pinLine = createdResult.accessPin
      ? `\n🔑 열람용 임시 비밀번호: ${createdResult.accessPin}`
      : "";

    return `[마음데이터 전자계약 서명 요청]
안녕하세요, ${recipientDisplay}.
${senderDisplay}에서 작성한 '${templateTitle}' 계약서입니다.

아래 전용 주소로 접속하시어 내용을 확인하신 후 화면에서 바로 서명해 주세요. (서명 즉시 양측 모두 체결본이 자동 완성됩니다)

👉 계약서 전용 주소:
${createdResult.signUrl}${pinLine}`;
  };

  const handleCopyInvite = () => {
    if (!createdResult) return;
    vibrateDevice(25);
    const msg = getInviteMessage();
    navigator.clipboard.writeText(msg);
    showAppToast("계약서 주소와 임시 비밀번호가 복사되었습니다!");
    alert(
      "계약서 주소와 임시 비밀번호가 복사되었습니다!\n\n상대방 카카오톡, 문자, 이메일 등에 그대로 붙여넣어 보내주세요."
    );
  };

  const handleCopyUrlOnly = () => {
    if (!createdResult) return;
    vibrateDevice(20);
    navigator.clipboard.writeText(createdResult.signUrl);
    showAppToast("계약서 주소만 복사되었습니다.");
  };

  const handleNativeShare = () => {
    if (!createdResult) return;
    vibrateDevice(30);
    const msg = getInviteMessage();
    if (navigator.share) {
      navigator
        .share({
          title: `[전자계약] ${templateTitle} 서명 요청`,
          text: msg,
        })
        .catch(() => {});
    } else {
      handleCopyInvite();
    }
  };

  return (
    <>
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
          padding: "16px",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#ffffff",
            width: "100%",
            maxWidth: "500px",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          {/* 헤더 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "1.2rem" }}>🔗</span>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                  전용 계약서 주소로 서명 받기
                </h3>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "var(--color-text-sub)" }}>
                파일을 주고받을 필요 없이 <strong>단일 링크 + 임시 비밀번호</strong>만으로 즉시 체결됩니다.
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
                padding: "4px",
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
                  backgroundColor: currentSignature
                    ? "rgba(16, 185, 129, 0.08)"
                    : "rgba(245, 158, 11, 0.08)",
                  border: currentSignature
                    ? "1px solid rgba(16, 185, 129, 0.25)"
                    : "1px solid rgba(245, 158, 11, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{currentSignature ? "✅" : "⚠️"}</span>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                      {currentSignature ? "내 서명(도장) 날인 완료" : "내 서명을 먼저 날인해 주세요"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-sub)" }}>
                      {currentSignature
                        ? "내가 날인한 계약서 주소에 상대방이 서명하면 자동 합본됩니다."
                        : "내 서명이 먼저 날인되어야 상대방에게 주소를 보낼 수 있습니다."}
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
                      cursor: "pointer",
                    }}
                  >
                    서명하기
                  </button>
                )}
              </div>

              {/* 2. 내 영구 보관함 계정 연동 상태 */}
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  backgroundColor: "var(--bg-color-main)",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                }}
              >
                <div style={{ fontSize: "0.78rem", color: "var(--color-text-sub)" }}>
                  {currentUser ? (
                    <>
                      ☁️ <strong>{currentUser.name}</strong> ({currentUser.email})님의 영구 보관함에 자동 저장됩니다.
                    </>
                  ) : (
                    <>
                      💡 로그인해 두시면 기기를 바꿔도 <strong>내 보관함(/contracts)</strong>에 영구 보관됩니다.
                    </>
                  )}
                </div>
                {!currentUser && (
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "8px",
                      border: "1px solid #2563eb",
                      backgroundColor: "rgba(37, 99, 235, 0.08)",
                      color: "#2563eb",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    1초 로그인
                  </button>
                )}
              </div>

              {/* 3. 상대방 정보 및 임시 비밀번호 설정 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--bg-color-main)",
                        color: "var(--color-text-main)",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-main)", display: "block", marginBottom: "4px" }}>
                      상대방 성명 *
                    </label>
                    <input
                      type="text"
                      value={partyBName}
                      onChange={(e) => setPartyBName(e.target.value)}
                      placeholder="예: 김철수"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--bg-color-main)",
                        color: "var(--color-text-main)",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                </div>

                {/* 임시 비밀번호(PIN) 설정 */}
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(37, 99, 235, 0.05)",
                    border: "1px solid rgba(37, 99, 235, 0.2)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1e40af" }}>
                      🔑 진행 중 임시 비밀번호 (상대방 열람 보호용)
                    </label>
                    <button
                      type="button"
                      onClick={() => setAccessPin(String(Math.floor(1000 + Math.random() * 9000)))}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      랜덤 재설정
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={8}
                    value={accessPin}
                    onChange={(e) => setAccessPin(e.target.value)}
                    placeholder="4자리 숫자 (비워두면 비밀번호 없이 열림)"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #93c5fd",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      fontSize: "1rem",
                      fontWeight: 800,
                      letterSpacing: "3px",
                      textAlign: "center",
                    }}
                  />
                  <div style={{ fontSize: "0.73rem", color: "var(--color-text-sub)", marginTop: "6px", lineHeight: 1.4 }}>
                    * 계약 진행 중에 제3자가 링크를 눌러도 내용을 볼 수 없도록 보호하며, 계약이 끝나면 신경 쓰지 않으셔도 되는 일회용 비밀번호입니다.
                  </div>
                </div>
              </div>

              {/* 주소 생성 버튼 */}
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
                  gap: "8px",
                }}
              >
                <span>{loading ? "전용 계약서 주소 생성 중..." : "🚀 전용 계약서 주소 만들기"}</span>
              </button>
            </>
          ) : (
            /* 생성 완료 화면: 링크 + 임시 비밀번호 원클릭 복사 */
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.4rem", marginBottom: "4px" }}>🎉</div>
                <h4 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                  전용 계약서 주소가 준비되었습니다!
                </h4>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--color-text-sub)" }}>
                  아래 내용을 복사해 상대방에게 전달하면 그 주소에서 바로 서명이 완료됩니다.
                </p>
              </div>

              {/* 생성된 주소 & 임시 비밀번호 박스 */}
              <div
                style={{
                  backgroundColor: "var(--bg-color-main)",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: "14px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-desc)", marginBottom: "4px" }}>
                    📌 전용 계약서 주소
                  </div>
                  <div
                    style={{
                      fontSize: "0.84rem",
                      fontWeight: 700,
                      color: "#2563eb",
                      wordBreak: "break-all",
                      backgroundColor: "var(--color-card)",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {createdResult.signUrl}
                  </div>
                </div>

                {createdResult.accessPin && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                      🔑 진행 중 임시 비밀번호
                    </span>
                    <span
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 900,
                        color: "#1e40af",
                        backgroundColor: "rgba(37, 99, 235, 0.12)",
                        padding: "4px 12px",
                        borderRadius: "8px",
                        letterSpacing: "2px",
                      }}
                    >
                      {createdResult.accessPin}
                    </span>
                  </div>
                )}
              </div>

              {/* 메인 복사 버튼 */}
              <button
                type="button"
                onClick={handleCopyInvite}
                style={{
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  fontWeight: 800,
                  fontSize: "0.98rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <span>📋 계약서 주소 + 임시 비밀번호 한 번에 복사</span>
              </button>

              {/* 보조 버튼 (공유하기 / 주소만 복사) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button
                  type="button"
                  onClick={handleNativeShare}
                  style={{
                    backgroundColor: "#FEE500",
                    color: "#191919",
                    border: "none",
                    borderRadius: "10px",
                    padding: "11px",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  💬 카톡/문자 바로 공유
                </button>
                <button
                  type="button"
                  onClick={handleCopyUrlOnly}
                  style={{
                    backgroundColor: "var(--bg-color-main)",
                    color: "var(--color-text-main)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                    padding: "11px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  🔗 주소만 복사
                </button>
              </div>

              <div
                style={{
                  fontSize: "0.76rem",
                  color: "var(--color-text-sub)",
                  backgroundColor: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  lineHeight: 1.45,
                }}
              >
                ☁️ <strong>Cloudflare R2 영구 보관 완료</strong><br />
                상대방이 서명을 마치면 파일을 다시 돌려받을 필요 없이 <strong>내 계약 보관함(/contracts)</strong>에서 최종 체결본을 언제든 열람·인쇄할 수 있습니다.
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
                  marginTop: "2px",
                }}
              >
                닫기
              </button>
            </div>
          )}
        </div>
      </div>

      <ContractAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          if (user.email) setPartyAEmail(user.email);
        }}
      />
    </>
  );
}
