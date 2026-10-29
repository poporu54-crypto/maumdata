import React from "react";

export default function MarketAreaDetailLoading() {
  return (
    <div style={{ padding: "24px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "720px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="skeleton-pulse" style={{ width: "160px", height: "24px", borderRadius: "20px" }} />
          <div className="skeleton-pulse" style={{ width: "65%", height: "32px", borderRadius: "8px" }} />
          <div className="skeleton-pulse" style={{ width: "88%", height: "16px", borderRadius: "6px" }} />
        </div>

        <div className="card" style={{ padding: "20px", border: "1px solid var(--color-border)" }}>
          <div className="skeleton-pulse" style={{ width: "100%", height: "280px", borderRadius: "14px" }} />
        </div>

        <div className="card" style={{ padding: "24px", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="skeleton-pulse" style={{ width: "42%", height: "20px", borderRadius: "6px" }} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-pulse" style={{ width: "100%", height: "44px", borderRadius: "10px" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
