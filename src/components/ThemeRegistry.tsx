"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeRegistry");
  }
  return context;
};

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 최초 렌더링 시 로컬스토리지 또는 HTML 속성 확인
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme = prefersDark ? "dark" : "light";
      setTheme(initialTheme);
      document.documentElement.setAttribute("data-theme", initialTheme);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
      {mounted && <ThemeButtonPortal theme={theme} toggleTheme={toggleTheme} />}
    </ThemeContext.Provider>
  );
}

// 헤더의 #theme-toggle-container 에 포탈 느낌으로 React Portal을 써도 되고,
// 아니면 간단히 useEffect로 버튼을 마운트하는 컴포넌트를 정의합니다.
import { createPortal } from "react-dom";

function ThemeButtonPortal({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
  const [target, setTarget] = useState<Element | null>(null);

  useEffect(() => {
    setTarget(document.getElementById("theme-toggle-container"));
  }, []);

  if (!target) return null;

  return createPortal(
    <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="테마 전환">
      {theme === "light" ? (
        <>
          <span>🌙</span>
          <span>다크 모드</span>
        </>
      ) : (
        <>
          <span>☀️</span>
          <span>라이트 모드</span>
        </>
      )}
    </button>,
    target
  );
}
