import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "biz" | "form" | "default";
  showText?: boolean;
  className?: string;
}

export default function MaumDataLogo({
  size = "md",
  variant = "biz",
  showText = true,
  className = "",
}: LogoProps) {
  // 크기별 심볼 및 텍스트 치수
  const dimensions = {
    sm: { symbol: 26, fontSize: "1.05rem", badgeSize: "0.65rem", gap: "8px" },
    md: { symbol: 34, fontSize: "1.25rem", badgeSize: "0.72rem", gap: "10px" },
    lg: { symbol: 46, fontSize: "1.65rem", badgeSize: "0.82rem", gap: "14px" },
  }[size];

  const badgeConfig = {
    biz: { text: "BIZ", bg: "linear-gradient(135deg, #3182f6 0%, #1d4ed8 100%)", color: "#ffffff" },
    form: { text: "FORM", bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#ffffff" },
    default: null,
  }[variant];

  return (
    <div
      className={`maumdata-logo-wrapper ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: dimensions.gap,
        userSelect: "none",
        cursor: "pointer",
        textDecoration: "none",
      }}
    >
      {/* 모던 벡터 SVG 심볼 마크 (M + 하트 + 우상향 데이터 차트 융합) */}
      <svg
        width={dimensions.symbol}
        height={dimensions.symbol}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          flexShrink: 0,
          filter: "drop-shadow(0 4px 12px rgba(49, 130, 246, 0.25))",
          transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        className="logo-symbol-svg"
      >
        <defs>
          <linearGradient id="maumSymbolGrad1" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="45%" stopColor="#3182f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="maumSymbolGrad2" x1="20" y1="80" x2="80" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="60%" stopColor="#3182f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="maumBgGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
          </linearGradient>
          <filter id="maumGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 배경 라운디드 스퀘어 (섬세한 보더와 하이라이트) */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="24"
          fill="url(#maumBgGrad)"
          stroke="url(#maumSymbolGrad1)"
          strokeWidth="2.5"
          strokeOpacity="0.35"
        />

        {/* M 형태 우상향 성장 펄스 & 데이터 차트 라인 (두께감 있는 유기적 패스) */}
        <path
          d="M24 70 L24 44 C24 38 31 34 36 38 L48 49 C49.5 50.5 52 50.5 53.5 49 L67 36 C72 32 80 35 80 42 L80 70"
          stroke="url(#maumSymbolGrad1)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 우상향 피크 화살표 (미래 성장과 데이터 상승을 상징) */}
        <path
          d="M62 25 L80 25 L80 43"
          stroke="url(#maumSymbolGrad2)"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 데이터 노드 및 하트비트 펄스 포인트 */}
        <circle cx="50" cy="49" r="6" fill="#38bdf8" filter="url(#maumGlow)" />
        <circle cx="24" cy="70" r="5" fill="#8b5cf6" />
        <circle cx="80" cy="70" r="5" fill="#3182f6" />
      </svg>

      {/* 텍스트 로고 및 서비스 배지 */}
      {showText && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontSize: dimensions.fontSize,
              fontWeight: 850,
              letterSpacing: "-0.04em",
              color: "var(--color-text-main)",
              display: "flex",
              alignItems: "center",
            }}
          >
            마음데이타
          </span>

          {badgeConfig && (
            <span
              style={{
                fontSize: dimensions.badgeSize,
                fontWeight: 900,
                letterSpacing: "0.06em",
                padding: "2px 7px",
                borderRadius: "6px",
                background: badgeConfig.bg,
                color: badgeConfig.color,
                boxShadow: "0 2px 8px rgba(49, 130, 246, 0.3)",
                display: "inline-block",
                lineHeight: 1.2,
                transform: "translateY(-1px)",
              }}
            >
              {badgeConfig.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
