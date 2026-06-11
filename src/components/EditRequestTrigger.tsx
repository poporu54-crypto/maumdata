"use client";

import React, { useState } from "react";
import EditRequestModal from "./EditRequestModal";

interface EditRequestTriggerProps {
  bNo: string;
  currentBrandName: string;
  currentHomepage: string;
  currentDescription: string;
}

export default function EditRequestTrigger({
  bNo,
  currentBrandName,
  currentHomepage,
  currentDescription
}: EditRequestTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-start" }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "30px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            color: "var(--color-text-sub)",
            fontSize: "0.88rem",
            fontWeight: 600,
            cursor: "pointer",
            backdropFilter: "blur(4px)",
            transition: "all 0.2s ease-in-out",
            outline: "none",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(49, 130, 246, 0.15)";
            e.currentTarget.style.borderColor = "var(--color-primary)";
            e.currentTarget.style.color = "var(--color-primary)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
            e.currentTarget.style.color = "var(--color-text-sub)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span>✏️ 이 기업 정보 수정 제안하기</span>
        </button>
      </div>

      <EditRequestModal
        bNo={bNo}
        currentBrandName={currentBrandName}
        currentHomepage={currentHomepage}
        currentDescription={currentDescription}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
