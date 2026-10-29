import React from "react";

export default function StatsLoading() {
  return (
    <div style={{ padding: "24px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "820px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="skeleton-pulse" style={{ width: "190px", height: "24px", borderRadius: "20px" }} />
          <div className="skeleton-pulse" style={{ width: "70%", height: "32px", borderRadius: "8px" }} />
          <div className="skeleton-pulse" style={{ width: "90%", height: "16px", borderRadius: "6px" }} />
        </div>

        <div className="card" style={{ padding: "28px", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "18px" }}>
          <div className="skeleton-pulse" style={{ width: "45%", height: "20px", borderRadius: "6px" }} />
          <div className="skeleton-pulse" style={{ width: "100%", height: "180px", borderRadius: "14px" }} />
        </div>

        <div className="card" style={{ padding: "28px", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="skeleton-pulse" style={{ width: "40%", height: "20px", borderRadius: "6px" }} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-pulse" style={{ width: "100%", height: "48px", borderRadius: "10px" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
