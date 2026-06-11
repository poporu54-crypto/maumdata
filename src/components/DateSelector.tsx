"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface DateSelectorProps {
  dates: string[];
  currentDate: string;
  baseUrl: string;
}

export default function DateSelector({ dates, currentDate, baseUrl }: DateSelectorProps) {
  const router = useRouter();
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    router.push(`${baseUrl}?date=${val}`);
  };

  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: "12px", 
      marginBottom: "28px",
      backgroundColor: "rgba(255, 255, 255, 0.015)",
      border: "1px solid var(--color-border)",
      borderRadius: "16px",
      padding: "16px 20px",
      width: "fit-content"
    }}>
      <label htmlFor="date-select" style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-sub)" }}>
        📅 조회 일자 선택:
      </label>
      <select
        id="date-select"
        value={currentDate}
        onChange={handleChange}
        style={{
          backgroundColor: "var(--bg-color-card)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-main)",
          padding: "8px 16px",
          borderRadius: "10px",
          fontSize: "0.95rem",
          fontWeight: 700,
          cursor: "pointer",
          outline: "none",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        {dates.map(d => (
          <option key={d} value={d}>
            {d} {d === dates[dates.length - 1] ? "(최신)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
