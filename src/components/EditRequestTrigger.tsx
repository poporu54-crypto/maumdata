"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const EditRequestModal = dynamic(() => import("./EditRequestModal"), {
  ssr: false,
});

interface EditRequestTriggerProps {
  bNo: string;
  currentBusinessName: string;
  currentBrandName: string;
  currentHomepage: string;
  currentDescription: string;
}

export default function EditRequestTrigger({
  bNo,
  currentBusinessName,
  currentBrandName,
  currentHomepage,
  currentDescription
}: EditRequestTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-start" }}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "30px",
            border: "1px solid rgba(49, 130, 246, 0.3)",
            backgroundColor: "var(--color-primary-light)",
            color: "var(--color-primary)",
            fontSize: "0.88rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            outline: "none",
            boxShadow: "var(--shadow-sm)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(49, 130, 246, 0.16)";
            e.currentTarget.style.borderColor = "var(--color-primary)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-primary-light)";
            e.currentTarget.style.borderColor = "rgba(49, 130, 246, 0.3)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span>✏️ 이 기업 정보 수정 제안하기</span>
        </button>
      </div>

      {isOpen && (
        <EditRequestModal
          bNo={bNo}
          currentBusinessName={currentBusinessName}
          currentBrandName={currentBrandName}
          currentHomepage={currentHomepage}
          currentDescription={currentDescription}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
