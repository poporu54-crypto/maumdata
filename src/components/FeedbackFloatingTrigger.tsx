"use client";

import React, { useState } from "react";
import FeedbackModal from "./FeedbackModal";

export default function FeedbackFloatingTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="사용자 의견 보내기"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          backgroundColor: "var(--bg-color-card)",
          color: "var(--color-primary)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
          padding: "10px 16px",
          borderRadius: "30px",
          fontSize: "0.85rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          zIndex: 900,
          transition: "all 0.2s ease-in-out",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = "0 12px 28px rgba(49, 130, 246, 0.25)";
          e.currentTarget.style.borderColor = "var(--color-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.2)";
          e.currentTarget.style.borderColor = "var(--color-border)";
        }}
      >
        <span style={{ fontSize: "1.1rem" }}>💬</span>
        <span>피드백</span>
      </button>

      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
