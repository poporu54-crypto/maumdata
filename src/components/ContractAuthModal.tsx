"use client";

import React, { useState } from "react";
import { ContractUser, setLoggedInUser } from "@/lib/contractStorage";
import {
  vibrateDevice,
  showAppToast,
  startSocialLogin,
  useAppModalBack,
  isAppEnvironment,
  isIOSAppEnvironment,
} from "@/lib/appBridge";

interface ContractAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: ContractUser) => void;
}

function isInAppMessengerWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  return /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line|DaumApps/i.test(navigator.userAgent);
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

  useAppModalBack(isOpen, onClose);

  if (!isOpen) return null;

  const handleQuickAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    if (password.trim().length < 4) {
      setErrorMsg("보안 비밀번호를 입력해 주세요. (신규 생성 시 6자리 이상)");
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
    setErrorMsg("");

    if (isAppEnvironment()) {
      startSocialLogin(provider);
      return;
    }

    const currentPath =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/contracts";

    // 카카오톡·네이버·인스타그램 인앱 브라우저 내 Google 403 disallowed_useragent 방어
    if (provider === "google" && isInAppMessengerWebView()) {
      const ua = navigator.userAgent || "";
      if (/Android/i.test(ua)) {
        const target = `${window.location.origin}/api/auth/google?returnTo=${encodeURIComponent(
          currentPath
        )}`;
        const hostAndPath = target.replace(/^https?:\/\//, "");
        const scheme = target.startsWith("https") ? "https" : "http";
        window.location.href = `intent://${hostAndPath}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(
          target
        )};end`;
        return;
      }
      setErrorMsg(
        "카카오톡·인앱 브라우저에서는 Google 보안 정책상 구글 로그인이 차단됩니다. 위의 [카카오로 1초 시작하기] 또는 아래 [이메일 간편 시작]을 이용해 주세요."
      );
      return;
    }

    window.location.href = `/api/auth/${provider}?returnTo=${encodeURIComponent(currentPath)}`;
  };

  // Apple App Store 가이드라인 4.8 준수: iOS 네이티브 앱에서는 당사 자체 보안 이메일 인증을 기본 제공
  const hideThirdPartyOAuthOnIOS = isIOSAppEnvironment();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="내 계약 보관함 로그인"
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
          backgroundColor: "var(--bg-color-card)",
          border: "1px solid var(--color-border)",
          width: "100%",
          maxWidth: "440px",
          borderRadius: "22px",
          padding: "26px 22px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
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
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                color: "var(--color-primary)",
                backgroundColor: "var(--color-primary-light)",
                padding: "3px 8px",
                borderRadius: "6px",
              }}
            >
              영구 클라우드 보관함
            </span>
            <h3 style={{ margin: "8px 0 0 0", fontSize: "1.28rem", fontWeight: 800, color: "var(--color-text-main)" }}>
              내 계약 보관함 로그인
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--color-text-sub)", lineHeight: 1.4 }}>
              한 번 로그인해 두면 파일을 따로 다운받지 않아도 내가 지우기 전까지 모든 계약서가 영구 보관됩니다.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="로그인 창 닫기"
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
        {!hideThirdPartyOAuthOnIOS && (
          <>
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
          </>
        )}

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
                border: "1.5px solid var(--color-border)",
                backgroundColor: "var(--bg-color-main)",
                color: "var(--color-text-main)",
                fontSize: "0.92rem",
              }}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-main)", display: "block", marginBottom: "4px" }}>
                비밀번호 (신규 6자 이상)
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
                  border: "1.5px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-main)",
                  color: "var(--color-text-main)",
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
                  border: "1.5px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-main)",
                  color: "var(--color-text-main)",
                  fontSize: "0.92rem",
                }}
              />
            </div>
          </div>

          {errorMsg && (
            <div style={{ fontSize: "0.8rem", color: "var(--color-danger)", fontWeight: 600, lineHeight: 1.45 }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <div style={{ fontSize: "0.74rem", color: "var(--color-text-desc)", lineHeight: 1.4 }}>
            🔒 처음 입력하시면 암호화 해싱된 비밀번호로 내 전용 보관함이 생성되며, 서버 서명 세션으로만 본인 계약서를 열람할 수 있습니다.
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
