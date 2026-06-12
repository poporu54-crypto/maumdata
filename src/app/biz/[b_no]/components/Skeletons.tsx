import React from "react";

// 스트리밍을 위한 스켈레톤 로딩 UI 컴포넌트
export function SectionSkeleton() {
  return (
    <div style={{
      width: "100%",
      minHeight: "120px",
      padding: "24px",
      borderRadius: "14px",
      border: "1px solid var(--color-border)",
      backgroundColor: "var(--bg-color-card)",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      boxSizing: "border-box"
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-custom {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
        .skeleton-item {
          animation: pulse-custom 1.5s infinite ease-in-out;
        }
      `}} />
      <div className="skeleton-item" style={{ width: "35%", height: "14px", borderRadius: "4px", backgroundColor: "var(--color-border)" }}></div>
      <div className="skeleton-item" style={{ width: "80%", height: "20px", borderRadius: "6px", backgroundColor: "var(--color-border)" }}></div>
      <div className="skeleton-item" style={{ width: "55%", height: "14px", borderRadius: "4px", backgroundColor: "var(--color-border)" }}></div>
    </div>
  );
}

// 테이블 형태의 스트리밍 스켈레톤 (CLS 완화용)
export function TableSkeleton() {
  return (
    <div style={{
      width: "100%",
      borderRadius: "14px",
      border: "1px solid var(--color-border)",
      backgroundColor: "var(--bg-color-card)",
      overflow: "hidden",
      boxSizing: "border-box"
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-custom {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
        .skeleton-item {
          animation: pulse-custom 1.5s infinite ease-in-out;
        }
      `}} />
      <div style={{ padding: "14px 16px", backgroundColor: "var(--bg-color-main)", borderBottom: "1px solid var(--color-border)", display: "flex", gap: "20px" }}>
        <div className="skeleton-item" style={{ width: "25%", height: "14px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
        <div className="skeleton-item" style={{ width: "40%", height: "14px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
        <div className="skeleton-item" style={{ width: "15%", height: "14px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
        <div className="skeleton-item" style={{ width: "10%", height: "14px", borderRadius: "4px", backgroundColor: "var(--color-border)", marginLeft: "auto" }} />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ padding: "20px 16px", borderBottom: i === 3 ? "none" : "1px solid var(--color-border)", display: "flex", gap: "20px", alignItems: "center" }}>
          <div className="skeleton-item" style={{ width: "20%", height: "16px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
          <div className="skeleton-item" style={{ width: "45%", height: "16px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
          <div className="skeleton-item" style={{ width: "15%", height: "16px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
          <div className="skeleton-item" style={{ width: "8%", height: "20px", borderRadius: "6px", backgroundColor: "var(--color-border)", marginLeft: "auto" }} />
        </div>
      ))}
    </div>
  );
}

// 추천 기업 스켈레톤 (그리드 CLS 완화용)
export function RecommendedSkeleton() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
      gap: "12px"
    }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="related-card skeleton-item"
          style={{
            height: "78px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            backgroundColor: "var(--bg-color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "16px",
            animation: "pulse-custom 1.5s infinite ease-in-out"
          }}
        >
          <div style={{ width: "60%", height: "12px", borderRadius: "3px", backgroundColor: "var(--color-border)" }} />
          <div style={{ width: "90%", height: "16px", borderRadius: "4px", backgroundColor: "var(--color-border)" }} />
        </div>
      ))}
    </div>
  );
}
