"use client";

import React, { useState } from "react";
import { ContractUser, setLoggedInUser } from "@/lib/contractStorage";
import { vibrateDevice, showAppToast } from "@/lib/appBridge";

interface ContractAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: ContractUser) => void;
}

export default function ContractAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: ContractAuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleQuickAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    if (password.trim().length < 4) {
      setErrorMsg("보안 비밀번호를 4자리 이상 입력해 주세요.");
      return;
    }

    setLoading(true);
    vibrateDevice(20);

    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          name: name.trim(),
          provider: "quick",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "로그인에 실패했습니다.");
      }

      setLoggedInUser(data.user);
      showAppToast(
        data.isNewUser
          ? `${data.user.name}님의 영구 계약 보관함이 생성되었습니다!`
          : `${data.user.name}님 환영합니다! 계약 보관함이 연결되었습니다.`
      );
      if (onSuccess) onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: "kakao" | "google") => {
    vibrateDevice(25);
    window.location.href = `/api/auth/${provider}`;
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
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#ffffff",
          width: "100%",
          maxWidth: "440px",
          borderRadius: "22px",
          padding: "28px 24px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                color: "#2563eb",
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                padding: "3px 8px",
                borderRadius: "6px",
              }}
            >
              영구 클라우드 보관함
            </span>
            <h3 style={{ margin: "8px 0 0 0", fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)" }}>
              내 계약 보관함 로그인
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--color-text-sub)", lineHeight: 1.4 }}>
              한 번 로그인해 두면 파일을 따로 다운받지 않아도 내가 지우기 전까지 모든 계약서가 영구 보관됩니다.
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

        {/* 소셜 로그인 버튼 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            type="button"
            onClick={() => handleSocialLogin("kakao")}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#FEE500",
              color: "#191919",
              fontWeight: 800,
              fontSize: "0.92rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span>💬</span>
            <span>카카오로 1초 시작하기</span>
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid var(--color-border)",
              backgroundColor: "#ffffff",
              color: "#1e293b",
              fontWeight: 700,
              fontSize: "0.92rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontWeight: 900, color: "#ea4335" }}>G</span>
            <span>Google 계정으로 시작하기</span>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", fontWeight: 600 }}>
            또는 이메일 1초 간편 시작 (가입절차 없음)
          </span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
        </div>

        {/* 이메일 + 비밀번호 즉시 시작 폼 */}
        <form onSubmit={handleQuickAuth} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-main)", display: "block", marginBottom: "4px" }}>
              이메일 주소 (내 보관함 ID)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="예: ceo@company.com"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1.5px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                fontSize: "0.92rem",
              }}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-main)", display: "block", marginBottom: "4px" }}>
                비밀번호 (4자리 이상)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="보안 비밀번호"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  fontSize: "0.92rem",
                }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", display: "block", marginBottom: "4px" }}>
                성명/상호 (선택)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 홍길동 대표"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  fontSize: "0.92rem",
                }}
              />
            </div>
          </div>

          {errorMsg && (
            <div style={{ fontSize: "0.8rem", color: "#dc2626", fontWeight: 600 }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <div style={{ fontSize: "0.74rem", color: "var(--color-text-desc)", lineHeight: 1.4 }}>
            🔒 처음 입력하시면 해당 비밀번호로 내 전용 보관함이 자동 생성되며, 이후에는 비밀번호가 일치해야만 열람할 수 있어 타인의 접근이 100% 차단됩니다.
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "4px",
              padding: "13px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
            }}
          >
            {loading ? "보관함 연결 중..." : "🚀 내 영구 보관함 열기"}
          </button>
        </form>
      </div>
    </div>
  );
}
