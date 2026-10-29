import React from "react";

export default function FormEditorLoading() {
  return (
    <div className="container" style={{ padding: "28px 24px 72px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div className="skeleton-pulse" style={{ width: "260px", height: "30px", borderRadius: "8px" }} />
        <div style={{ display: "flex", gap: "8px" }}>
          <div className="skeleton-pulse" style={{ width: "100px", height: "38px", borderRadius: "10px" }} />
          <div className="skeleton-pulse" style={{ width: "110px", height: "38px", borderRadius: "10px" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        <div className="card" style={{ padding: "24px", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "14px" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-pulse" style={{ width: "100%", height: "46px", borderRadius: "10px" }} />
          ))}
        </div>
        <div className="card" style={{ padding: "28px", border: "1px solid var(--color-border)", minHeight: "420px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="skeleton-pulse" style={{ width: "45%", height: "28px", borderRadius: "6px", margin: "0 auto" }} />
          <div className="skeleton-pulse" style={{ width: "100%", height: "300px", borderRadius: "10px" }} />
        </div>
      </div>
    </div>
  );
}
