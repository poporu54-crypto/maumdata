import React from "react";

export default function RootLoading() {
  return (
    <div style={{ padding: "28px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "780px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "8px" }}>
          <div className="skeleton-pulse" style={{ width: "130px", height: "24px", borderRadius: "20px" }} />
          <div className="skeleton-pulse" style={{ width: "68%", height: "34px", borderRadius: "10px" }} />
          <div className="skeleton-pulse" style={{ width: "86%", height: "16px", borderRadius: "6px" }} />
        </div>

        <div className="card" style={{ padding: "28px", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="skeleton-pulse" style={{ width: "40%", height: "18px", borderRadius: "6px" }} />
          <div className="skeleton-pulse" style={{ width: "100%", height: "52px", borderRadius: "14px" }} />
          <div style={{ display: "flex", gap: "8px" }}>
            <div className="skeleton-pulse" style={{ width: "78px", height: "26px", borderRadius: "14px" }} />
            <div className="skeleton-pulse" style={{ width: "78px", height: "26px", borderRadius: "14px" }} />
            <div className="skeleton-pulse" style={{ width: "78px", height: "26px", borderRadius: "14px" }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          {[1, 2].map((i) => (
            <div key={i} className="card" style={{ padding: "24px", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="skeleton-pulse" style={{ width: "45%", height: "14px", borderRadius: "4px" }} />
              <div className="skeleton-pulse" style={{ width: "75%", height: "28px", borderRadius: "8px" }} />
              <div className="skeleton-pulse" style={{ width: "90%", height: "14px", borderRadius: "4px" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
