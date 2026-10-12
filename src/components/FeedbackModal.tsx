"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState<"suggestion" | "bug" | "data_error" | "inquiry">("suggestion");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
      if (typeof document !== "undefined") {
        document.body.style.overflow = "unset";
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setMessage("");
      setContact("");
      setError("");
      if (typeof document !== "undefined") {
        document.body.style.overflow = "hidden";
      }
    } else {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "unset";
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          category,
          userId: contact.trim() || "anonymous",
          url: typeof window !== "undefined" ? window.location.href : "",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setIsSuccess(true);
      } else {
        setError(data.error || "피드백 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "var(--bg-color-card)",
          borderRadius: "20px",
          border: "1px solid var(--color-border)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.3rem" }}>💬</span>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)" }}>
              사용자 의견 및 피드백
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "var(--color-text-desc)",
              padding: "4px 8px",
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* 바디 */}
        <div style={{ padding: "24px" }}>
          {isSuccess ? (
            <div style={{ textAlign: "center", padding: "24px 8px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎉</div>
              <h4 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "8px" }}>
                소중한 의견 감사합니다!
              </h4>
              <p style={{ color: "var(--color-text-sub)", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 24px 0" }}>
                보내주신 피드백은 마음데이터 운영팀이 꼼꼼히 검토하여 서비스 개선에 적극 반영하겠습니다.
              </p>
              <button
                onClick={onClose}
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  fontWeight: 700,
                }}
              >
                확인
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* 카테고리 선택 */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-sub)", marginBottom: "8px" }}>
                  피드백 유형
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  {[
                    { id: "suggestion", label: "💡 기능 제안 / 아이디어" },
                    { id: "bug", label: "🐛 버그 및 오류 신고" },
                    { id: "data_error", label: "🏢 기업 정보 수정 요청" },
                    { id: "inquiry", label: "❓ 일반 문의 / 기타" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id as any)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: `1.5px solid ${category === item.id ? "var(--color-primary)" : "var(--color-border)"}`,
                        backgroundColor: category === item.id ? "var(--color-primary-light)" : "var(--bg-color-main)",
                        color: category === item.id ? "var(--color-primary)" : "var(--color-text-sub)",
                        fontSize: "0.82rem",
                        fontWeight: category === item.id ? 700 : 500,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 내용 입력 */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-sub)", marginBottom: "8px" }}>
                  의견 내용 <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="불편하신 점이나 개선을 원하는 사항, 새로운 아이디어를 자유롭게 남겨주세요."
                  rows={5}
                  required
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--bg-color-main)",
                    color: "var(--color-text-main)",
                    fontSize: "0.92rem",
                    lineHeight: 1.5,
                    resize: "none",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* 회신받을 이메일/연락처 (선택) */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-sub)", marginBottom: "6px" }}>
                  답변받으실 이메일 / 연락처 <span style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", fontWeight: 400 }}>(선택 사항)</span>
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="답변이나 피드백 결과를 받으시려면 입력해주세요."
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--bg-color-main)",
                    color: "var(--color-text-main)",
                    fontSize: "0.88rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {error && (
                <div style={{ color: "var(--color-danger)", fontSize: "0.85rem", fontWeight: 600 }}>
                  ⚠️ {error}
                </div>
              )}

              {/* 제출 버튼 */}
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "transparent",
                    color: "var(--color-text-sub)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="btn-primary"
                  style={{
                    flex: 2,
                    padding: "14px",
                    borderRadius: "12px",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    opacity: isSubmitting || !message.trim() ? 0.6 : 1,
                    cursor: isSubmitting || !message.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? "전송 중..." : "의견 보내기"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
