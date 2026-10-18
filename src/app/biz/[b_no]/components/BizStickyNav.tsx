"use client";

import React, { useEffect, useState } from "react";

interface NavSection {
  id: string;
  label: string;
  icon: string;
}

const SECTIONS: NavSection[] = [
  { id: "section-overview", label: "기본개요", icon: "📋" },
  { id: "section-employment", label: "고용건강도", icon: "👥" },
  { id: "section-finance", label: "재무실적", icon: "💰" },
  { id: "section-bids", label: "정부입찰", icon: "🏛️" },
  { id: "section-ip", label: "특허·공시", icon: "💡" },
];

export default function BizStickyNav() {
  const [activeId, setActiveId] = useState("section-overview");

  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    });

    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -70; // 헤더 높이 및 여백 보정
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveId(id);
    }
  };

  return (
    <nav className="biz-sticky-nav" aria-label="기업 정보 섹션 바로가기">
      <div className="biz-sticky-nav-inner">
        {SECTIONS.map((s) => {
          const isActive = activeId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => scrollToSection(s.id)}
              className={`biz-sticky-tab ${isActive ? "active" : ""}`}
              type="button"
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
