import React from "react";

export default function DirectoryLoading() {
  return (
    <div className="container animate-fade-in" style={{ maxWidth: "980px", padding: "36px 20px 80px 20px" }}>
      <div
        className="card animate-pulse-subtle"
        style={{
          height: "160px",
          borderRadius: "20px",
          marginBottom: "24px",
          border: "1px solid var(--color-border)",
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "28px",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="card animate-pulse-subtle"
            style={{ height: "86px", borderRadius: "16px", border: "1px solid var(--color-border)" }}
          />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="card animate-pulse-subtle"
            style={{ height: "92px", borderRadius: "16px", border: "1px solid var(--color-border)" }}
          />
        ))}
      </div>
    </div>
  );
}
