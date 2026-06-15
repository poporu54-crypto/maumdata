"use client";

import React, { useEffect, useState } from "react";

// 구글 애드센스 실제 연동 코드 소스화 (중앙 관리)
export const ADSENSE_CLIENT = "ca-pub-3713361723411048";
export const ADSENSE_SLOTS = {
  display: "2095684443",
  infeed: "6981214035",
  infeedLayout: "-gw-3+1f-3d+2z"
};

interface AdSpaceProps {
  client?: string; // ca-pub-XXXXX
  slot?: string;   // 10자리 숫자 슬롯 ID
  adType?: "display" | "infeed";
  format?: "auto" | "fluid" | "rectangle" | "horizontal";
  responsive?: string;
  style?: React.CSSProperties;
}

const MOCK_ADS = [
  {
    title: "🎁 마음데이터 FORM 공식 론칭!",
    desc: "사직서, 이력서, 계약서 등 직장인 필수 문서 12종 무료 편집 및 즉시 PDF/인쇄 다운로드 지원",
    badge: "공지사항",
    bgColor: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
    textColor: "#ffffff",
    actionText: "양식 보러가기",
  },
  {
    title: "⚡ 마음데이터 BIZ 기업 신용도 분석 출시",
    desc: "국민연금 공공 데이터 기반 실시간 퇴사율 추이 및 조직 건강도 등급 판별 엔진 가동 중",
    badge: "신기능",
    bgColor: "linear-gradient(135deg, #3182f6 0%, #1b64da 100%)",
    textColor: "#ffffff",
    actionText: "기업 조회하기",
  },
  {
    title: "☕ 무료 서식 센터 오픈 기념 커피 증정 이벤트",
    desc: "서식 작성 후 버그 제보나 의견을 남겨주시는 분들 중 추첨을 통해 스타벅스 기프티콘 증정",
    badge: "이벤트",
    bgColor: "linear-gradient(135deg, #059669 0%, #047857 100%)",
    textColor: "#ffffff",
    actionText: "이벤트 참여",
  }
];

export default function AdSpace({
  client,
  slot,
  adType = "display",
  format = "auto",
  responsive = "true",
  style = {}
}: AdSpaceProps) {
  const [isAdBlockActive, setIsAdBlockActive] = useState(false);
  const [currentMockAdIdx, setCurrentMockAdIdx] = useState(0);

  const targetClient = client || ADSENSE_CLIENT;
  const targetSlot = slot || (adType === "infeed" ? ADSENSE_SLOTS.infeed : ADSENSE_SLOTS.display);

  // 1. 애드센스 실제 스크립트 실행 및 AdBlocker 유무 판단
  useEffect(() => {
    if (typeof window !== "undefined") {
      // adsbygoogle 라이브러리 자체가 로드되지 않았거나 차단된 경우 ➔ AdBlock 활성화로 판정
      // @ts-ignore
      const isBlocked = !window.adsbygoogle || (window.adsbygoogle && !window.adsbygoogle.push);
      if (isBlocked) {
        setIsAdBlockActive(true);
        return;
      }
    }

    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      // 이미 렌더링된 요소나 중복 호출(TagError)은 치명적인 오류가 아니므로 무시합니다.
      console.log("AdSense non-critical push note:", err);
    }
  }, [adType, targetClient, targetSlot]);

  // 2. Mock 배너 4초 자동 롤링 캐러셀 (애드블록 상태이거나 로컬 테스트용)
  useEffect(() => {
    if (isAdBlockActive) {
      const interval = setInterval(() => {
        setCurrentMockAdIdx((prev) => (prev + 1) % MOCK_ADS.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isAdBlockActive]);

  const activeMock = MOCK_ADS[currentMockAdIdx];

  // 3. 실제 애드센스 모드가 켜진 경우
  if (!isAdBlockActive) {
    return (
      <div 
        className="ad-wrapper" 
        style={{ 
          margin: "24px auto", 
          padding: "12px", 
          border: "1px solid var(--color-border)", 
          borderRadius: "12px", 
          backgroundColor: "rgba(0,0,0,0.02)",
          textAlign: "center",
          overflow: "hidden",
          width: "100%",
          maxWidth: style.width || "100%",
          ...style 
        }}
      >
        <div style={{ fontSize: "0.65rem", color: "var(--color-text-desc)", marginBottom: "4px", textAlign: "right", letterSpacing: "1px" }}>ADVERTISEMENT</div>
        
        {adType === "infeed" ? (
          <ins
            className="adsbygoogle"
            style={{ display: "block", ...style }}
            data-ad-format="fluid"
            data-ad-layout-key={ADSENSE_SLOTS.infeedLayout}
            data-ad-client={targetClient}
            data-ad-slot={targetSlot}
          />
        ) : (
          <ins
            className="adsbygoogle"
            style={{ display: "block", ...style }}
            data-ad-client={targetClient}
            data-ad-slot={targetSlot}
            data-ad-format={format}
            data-full-width-responsive={responsive}
          />
        )}
      </div>
    );
  }

  // 4. 로컬/개발 환경이거나 애드센스가 비활성 상태인 경우 ➔ 프리미엄 캐러셀 Mock 광고 노출
  return (
    <div 
      className="ad-wrapper"
      style={{
        margin: "24px auto",
        width: "100%",
        maxWidth: style.width || "100%",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        transition: "var(--transition-smooth)",
        ...style
      }}
    >
      <div 
        style={{ 
          background: activeMock.bgColor,
          color: activeMock.textColor,
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          position: "relative",
          minHeight: "95px",
          transition: "background 0.5s ease"
        }}
      >
        {/* 광고 스켈레톤 레이블 */}
        <div 
          style={{ 
            position: "absolute", 
            top: "8px", 
            right: "12px", 
            fontSize: "0.65rem", 
            opacity: 0.4, 
            letterSpacing: "1px",
            fontWeight: 700
          }}
        >
          SPONSORED
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span 
              style={{ 
                backgroundColor: "rgba(255, 255, 255, 0.2)", 
                padding: "2px 8px", 
                borderRadius: "4px", 
                fontSize: "0.75rem", 
                fontWeight: 700 
              }}
            >
              {activeMock.badge}
            </span>
            <strong style={{ fontSize: "0.95rem", fontWeight: 700, letterSpacing: "-0.02em" }}>{activeMock.title}</strong>
          </div>
          <p style={{ fontSize: "0.82rem", opacity: 0.85, lineHeight: 1.4, wordBreak: "keep-all" }}>
            {activeMock.desc}
          </p>
        </div>

        <button 
          style={{
            backgroundColor: "#ffffff",
            color: "#111827",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            fontWeight: 700,
            fontSize: "0.8rem",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.2s ease"
          }}
          onClick={() => {
            if (activeMock.title.includes("FORM")) {
              window.location.href = "/form";
            } else if (activeMock.title.includes("BIZ")) {
              window.location.href = "/";
            }
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.03)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          {activeMock.actionText}
        </button>
      </div>
    </div>
  );
}
