import React from "react";

export default function FormCatalogLoading() {
  return (
    <div className="container" style={{ padding: "36px 24px 72px 24px", display: "flex", flexDirection: "column", gap: "28px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <div className="skeleton-pulse" style={{ width: "160px", height: "24px", borderRadius: "20px" }} />
        <div className="skeleton-pulse" style={{ width: "52%", height: "36px", borderRadius: "10px" }} />
        <div className="skeleton-pulse" style={{ width: "70%", height: "50px", borderRadius: "16px", marginTop: "6px" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "18px" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card" style={{ padding: "22px", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="skeleton-pulse" style={{ width: "70px", height: "20px", borderRadius: "6px" }} />
            <div className="skeleton-pulse" style={{ width: "78%", height: "22px", borderRadius: "6px" }} />
            <div className="skeleton-pulse" style={{ width: "95%", height: "14px", borderRadius: "4px" }} />
            <div className="skeleton-pulse" style={{ width: "60%", height: "14px", borderRadius: "4px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
