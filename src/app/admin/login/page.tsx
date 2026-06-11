"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 어드민 페이지는 기본적으로 다크 테마를 적용하여 프리미엄 느낌을 강화합니다.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "비밀번호가 일치하지 않습니다.");
      }
    } catch (err) {
      setError("로그인 요청 중 네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#070b13",
      padding: "24px",
      boxSizing: "border-box",
      fontFamily: "var(--font-family-sans)"
    }}>
      <div className="animate-fade-in" style={{
        width: "100%",
        maxWidth: "400px",
        backgroundColor: "rgba(23, 32, 51, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "24px",
        padding: "40px 32px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        gap: "28px"
      }}>
        {/* 헤더/로고 */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            backgroundColor: "rgba(49, 130, 246, 0.1)",
            color: "var(--color-primary)",
            fontSize: "1.8rem",
            marginBottom: "16px"
          }}>
            🔒
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff", margin: "0 0 8px 0" }}>
            마음데이터 관리자
          </h2>
          <p style={{ color: "#8b95a1", fontSize: "0.88rem", margin: 0 }}>
            어드민 세션을 시작하기 위해 비밀번호를 입력하세요.
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {error && (
            <div className="animate-pulse-subtle" style={{
              backgroundColor: "rgba(240, 68, 56, 0.1)",
              color: "#f87171",
              padding: "12px 16px",
              borderRadius: "12px",
              fontSize: "0.85rem",
              border: "1px solid rgba(240, 68, 56, 0.2)",
              fontWeight: 600,
              textAlign: "center"
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="관리자 비밀번호 입력"
              style={{
                width: "100%",
                padding: "16px",
                paddingRight: "50px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                color: "#ffffff",
                fontSize: "0.95rem",
                boxSizing: "border-box",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--color-primary)";
                e.target.style.backgroundColor = "rgba(49, 130, 246, 0.02)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.target.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#8b95a1",
                cursor: "pointer",
                fontSize: "0.9rem",
                padding: "4px",
                outline: "none"
              }}
            >
              {showPassword ? "숨기기" : "보기"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "14px",
              border: "none",
              backgroundColor: "var(--color-primary)",
              color: "#ffffff",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 8px 20px rgba(49, 130, 246, 0.2)"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "var(--color-primary-hover)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "var(--color-primary)";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? "인증 중..." : "비밀번호 인증"}
          </button>
        </form>

        {/* 풋터 */}
        <div style={{ textAlign: "center", marginTop: "8px" }}>
          <a
            href="/"
            style={{
              color: "#8b95a1",
              fontSize: "0.85rem",
              textDecoration: "underline",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-primary)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#8b95a1"}
          >
            ← 메인 서비스로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
