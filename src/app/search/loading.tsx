import React from "react";

export default function SearchLoading() {
  return (
    <div style={{ padding: "24px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "720px" }}>
        <div style={{ marginBottom: "32px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="skeleton-pulse" style={{ width: "55%", height: "30px", borderRadius: "8px" }} />
          <div className="skeleton-pulse" style={{ width: "78%", height: "16px", borderRadius: "6px" }} />
        </div>

        <div className="skeleton-pulse" style={{ width: "100%", height: "62px", borderRadius: "20px", marginBottom: "36px" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                padding: "24px",
                borderRadius: "18px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--bg-color-card)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                <div className="skeleton-pulse" style={{ width: "48%", height: "22px", borderRadius: "6px" }} />
                <div className="skeleton-pulse" style={{ width: "92px", height: "22px", borderRadius: "20px" }} />
              </div>
              <div className="skeleton-pulse" style={{ width: "72%", height: "14px", borderRadius: "4px" }} />
              <div className="skeleton-pulse" style={{ width: "45%", height: "14px", borderRadius: "4px" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
