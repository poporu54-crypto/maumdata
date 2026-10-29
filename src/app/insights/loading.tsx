import React from "react";

export default function InsightsLoading() {
  return (
    <div style={{ padding: "40px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "880px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="skeleton-pulse" style={{ width: "210px", height: "24px", borderRadius: "20px" }} />
          <div className="skeleton-pulse" style={{ width: "64%", height: "36px", borderRadius: "10px" }} />
          <div className="skeleton-pulse" style={{ width: "88%", height: "18px", borderRadius: "6px" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ padding: "18px 20px", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div className="skeleton-pulse" style={{ width: "55%", height: "12px", borderRadius: "4px" }} />
              <div className="skeleton-pulse" style={{ width: "75%", height: "24px", borderRadius: "6px" }} />
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: "28px", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-pulse" style={{ width: "96px", height: "34px", borderRadius: "10px" }} />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-pulse" style={{ width: "100%", height: "54px", borderRadius: "12px" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
