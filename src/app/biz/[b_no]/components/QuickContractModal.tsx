"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { vibrateDevice } from "@/lib/appBridge";

interface QuickContractModalProps {
  business: {
    b_no: string;
    b_nm: string;
    b_owner?: string;
    b_adr?: string;
    b_sector?: string;
  };
}

const TEMPLATE_OPTIONS = [
  {
    id: "generic_partnership",
    title: "용역 표준계약서",
    badge: "가장 인기",
    desc: "외주 용역, 개발, 디자인, 컨설팅 계약 시 상대방 기업 정보 자동 매핑",
    icon: "📝",
    color: "#2563eb"
  },
  {
    id: "estimate",
    title: "표준 견적서",
    badge: "영업 필수",
    desc: "공급받는 자(수신처)에 해당 기업 정보를 자동 입력하여 바로 견적서 발송",
    icon: "💼",
    color: "#059669"
  },
  {
    id: "order",
    title: "표준 발주서",
    badge: "구매/자재",
    desc: "공급처 기업 정보가 자동 반영된 정식 발주서 생성",
    icon: "📦",
    color: "#d97706"
  },
  {
    id: "generic_gov_transaction_statement",
    title: "거래명세서",
    badge: "세무/정산",
    desc: "물품 납품 및 서비스 제공 후 즉시 청구 가능한 거래명세서",
    icon: "🧾",
    color: "#4f46e5"
  },
  {
    id: "generic_nda",
    title: "비밀유지계약서 (NDA)",
    badge: "보안/미팅",
    desc: "기술 미팅이나 프로젝트 사전 제휴 시 필수인 법적 기밀유지 서약",
    icon: "🔒",
    color: "#dc2626"
  },
  {
    id: "generic_gov_mou",
    title: "업무제휴 협약서 (MOU)",
    badge: "신규 제휴",
    desc: "기업 간 전략적 제휴 및 상호 협력을 위한 기본 양해각서",
    icon: "🤝",
    color: "#7c3aed"
  },
  {
    id: "power_of_attorney",
    title: "위임장",
    badge: "대리 행정",
    desc: "업무 대리인 선임 및 권한 위임 공문서",
    icon: "📜",
    color: "#0891b2"
  },
  {
    id: "generic_gov_demand_letter",
    title: "최고장 (대금 독촉장)",
    badge: "미수금 회수",
    desc: "미지급 대금 청구 및 법적 조치 예고를 위한 표준 최고장",
    icon: "📬",
    color: "#e11d48"
  }
];

export default function QuickContractModal({ business }: QuickContractModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleOpen = () => {
    vibrateDevice(30);
    setIsOpen(true);
  };

  const handleSelectTemplate = (templateId: string) => {
    vibrateDevice(40);
    const cleanBNo = business.b_no.replace(/[^0-9]/g, "");
    const formattedBNo = cleanBNo.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3");

    const params = new URLSearchParams({
      partyB_name: business.b_nm || "",
      partyB_bno: formattedBNo,
      partyB_owner: business.b_owner || "",
      partyB_address: business.b_adr || "",
      partyB_sector: business.b_sector || "",
      source: "biz_detail"
    });

    router.push(`/form/${templateId}?${params.toString()}`);
  };

  return (
    <>
      {/* 1. 기업 상세 페이지 내 인터랙티브 배너 버튼 */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%)",
          border: "1.5px solid rgba(37, 99, 235, 0.2)",
          borderRadius: "16px",
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          boxShadow: "0 4px 12px rgba(37, 99, 235, 0.05)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
              color: "#ffffff",
              boxShadow: "0 4px 10px rgba(37, 99, 235, 0.3)",
              flexShrink: 0
            }}
          >
            📑
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                {business.b_nm} 맞춤 서식 1초 생성
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 700
                }}
              >
                자동 바인딩
              </span>
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "var(--color-text-sub)" }}>
              사업자번호, 대표자, 주소가 채워진 <strong>용역계약서·견적서·발주서</strong>를 즉시 작성합니다.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpen}
          type="button"
          style={{
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 18px",
            fontSize: "0.92rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease"
          }}
        >
          <span>서식 작성하기</span>
          <span style={{ fontSize: "1.1rem" }}>➔</span>
        </button>
      </div>

      {/* 2. 팝업 모달 */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "0"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--color-card)",
              width: "100%",
              maxWidth: "600px",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              padding: "24px 20px 32px 20px",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 -10px 30px rgba(0,0,0,0.2)",
              animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            {/* 모달 핸들 바 (모바일) */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
              <div style={{ width: "40px", height: "4px", borderRadius: "2px", backgroundColor: "var(--color-border)" }} />
            </div>

            {/* 헤더 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 700, letterSpacing: "0.5px" }}>
                  SMART DOCUMENT AUTOMATION
                </span>
                <h3 style={{ margin: "4px 0 0 0", fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                  {business.b_nm} 관련 서식 선택
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--color-text-sub)" }}>
                  선택 시 해당 기업의 인적사항 및 사업자 정보가 서식에 1초 만에 자동 기입됩니다.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  color: "var(--color-text-desc)",
                  cursor: "pointer",
                  padding: "4px 8px"
                }}
              >
                ✕
              </button>
            </div>

            {/* 서식 리스트 그리드 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {TEMPLATE_OPTIONS.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectTemplate(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--bg-color-main)",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = item.color;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      backgroundColor: `${item.color}15`,
                      color: item.color,
                      fontSize: "1.3rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-text-main)" }}>
                        {item.title}
                      </span>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          backgroundColor: `${item.color}20`,
                          color: item.color,
                          fontWeight: 600
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-text-sub)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {item.desc}
                    </div>
                  </div>
                  <span style={{ color: "var(--color-text-desc)", fontSize: "1.1rem" }}>➔</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => {
                  vibrateDevice(20);
                  router.push("/form");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline"
                }}
              >
                전체 300여 개 서식 보러가기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
