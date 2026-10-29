import React from "react";
import { SectionSkeleton, TableSkeleton } from "./components/Skeletons";

export default function BusinessDetailLoading() {
  return (
    <div style={{ padding: "24px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* 스티키 탭 바 자리 스켈레톤 */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "8px",
            borderRadius: "14px",
            backgroundColor: "var(--bg-color-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-pulse" style={{ width: "76px", height: "32px", borderRadius: "10px" }} />
          ))}
        </div>

        {/* 기업 요약 헤더 카드 스켈레톤 */}
        <div className="card" style={{ padding: "32px", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div className="skeleton-pulse" style={{ width: "170px", height: "18px", borderRadius: "6px" }} />
            <div className="skeleton-pulse" style={{ width: "96px", height: "22px", borderRadius: "6px" }} />
          </div>
          <div className="skeleton-pulse" style={{ width: "62%", height: "34px", borderRadius: "10px" }} />
          <div className="skeleton-pulse" style={{ width: "45%", height: "16px", borderRadius: "6px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginTop: "8px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  padding: "14px 16px",
                  borderRadius: "12px",
                  backgroundColor: "var(--bg-color-main)",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div className="skeleton-pulse" style={{ width: "55%", height: "12px", borderRadius: "4px" }} />
                <div className="skeleton-pulse" style={{ width: "80%", height: "18px", borderRadius: "6px" }} />
              </div>
            ))}
          </div>
        </div>

        {/* 기본 개요 / 신용 지표 2열 카드 스켈레톤 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          <SectionSkeleton />
          <SectionSkeleton />
        </div>

        <TableSkeleton />
      </div>
    </div>
  );
}
