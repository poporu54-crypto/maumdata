"use client";

import React, { useState } from "react";
import FeedbackModal from "./FeedbackModal";

export default function FooterFeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="footer-link"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          font: "inherit",
          cursor: "pointer",
          textAlign: "left",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          color: "var(--color-primary)",
          fontWeight: 600,
        }}
      >
        <span>💬 의견 및 버그 제안</span>
      </button>

      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
