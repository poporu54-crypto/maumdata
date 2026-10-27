"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { syncAppTheme, vibrateDevice } from "@/lib/appBridge";

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
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      syncAppTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme: Theme = prefersDark ? "dark" : "light";
      setTheme(initialTheme);
      document.documentElement.setAttribute("data-theme", initialTheme);
      syncAppTheme(initialTheme);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    vibrateDevice(15);
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    syncAppTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
      {mounted && <ThemeButtonPortal theme={theme} toggleTheme={toggleTheme} />}
    </ThemeContext.Provider>
  );
}

function ThemeButtonPortal({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
  const [targets, setTargets] = useState<Element[]>([]);

  useEffect(() => {
    const found: Element[] = [];
    const desktopSlot = document.getElementById("theme-toggle-container");
    const mobileSlot = document.getElementById("mobile-theme-toggle-slot");
    if (desktopSlot) found.push(desktopSlot);
    if (mobileSlot) found.push(mobileSlot);
    setTargets(found);
  }, []);

  if (targets.length === 0) return null;

  return (
    <>
      {targets.map((target, idx) =>
        createPortal(
          <button
            key={idx}
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="테마 전환"
          >
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
        )
      )}
    </>
  );
}
