"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function RouteChangeCompleteListener({ onRouteSettled }: { onRouteSettled: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams?.toString() || "";
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onRouteSettled();
  }, [pathname, searchKey, onRouteSettled]);

  return null;
}

export default function NavigationProgressBar() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const trickleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (trickleTimerRef.current) {
      clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = null;
    }
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const startProgress = useCallback(() => {
    clearTimers();
    setVisible(true);
    setProgress(24);

    trickleTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 86) return prev;
        const step = prev < 55 ? 10 : prev < 75 ? 4 : 1.5;
        return Math.min(86, prev + step);
      });
    }, 180);

    // 네트워크 취소/예외 시 상단바가 영구 잔류하지 않도록 안전 타임아웃 부여
    safetyTimerRef.current = setTimeout(() => {
      clearTimers();
      setVisible(false);
      setProgress(0);
    }, 8000);
  }, [clearTimers]);

  const completeProgress = useCallback(() => {
    if (trickleTimerRef.current) {
      clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    setProgress(100);
    finishTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 180);
  }, []);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:") || rawHref.startsWith("javascript:")) {
        return;
      }

      try {
        const nextUrl = new URL(anchor.href, window.location.href);
        if (nextUrl.origin !== window.location.origin) return;
        if (nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search) {
          return;
        }
        startProgress();
      } catch {
        // ignore malformed href
      }
    };

    const handleProgrammaticNav = () => {
      startProgress();
    };

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("maumdata:nav-start", handleProgrammaticNav);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("maumdata:nav-start", handleProgrammaticNav);
      clearTimers();
    };
  }, [startProgress, clearTimers]);

  return (
    <>
      <Suspense fallback={null}>
        <RouteChangeCompleteListener onRouteSettled={completeProgress} />
      </Suspense>
      {visible && (
        <div
          aria-hidden="true"
          className="no-print"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "2.5px",
            zIndex: 10099,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #2563eb 0%, #3182f6 60%, #60a5fa 100%)",
              boxShadow: "0 0 10px rgba(49, 130, 246, 0.65)",
              transition: progress === 100 ? "width 140ms ease-out, opacity 180ms ease-out" : "width 180ms ease-out",
              opacity: progress === 100 ? 0 : 1,
            }}
          />
        </div>
      )}
    </>
  );
}
