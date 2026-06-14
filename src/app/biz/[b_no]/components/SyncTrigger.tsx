"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SyncTriggerProps {
  bNo: string;
  isNew?: boolean;
}

export default function SyncTrigger({ bNo, isNew }: SyncTriggerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isNew) return;

    let isMounted = true;
    const triggerSync = async () => {
      setStatus("syncing");
      setMessage("국세청 및 공공 데이터베이스 실시간 연동을 시작합니다...");

      try {
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (!isMounted) return;
        setMessage("기업 기본 정보 및 재무 지표를 빌드하는 중입니다. 잠시만 기다려 주세요...");

        const response = await fetch(`/api/biz/${bNo}/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("서버와의 통신에 실패했습니다.");
        }

        const result = await response.json();

        if (!isMounted) return;

        if (result.success) {
          if (result.isInvalid) {
            setStatus("error");
            setMessage("조회 결과 국세청에 등록되지 않은 사업자등록번호로 확인되었습니다. 잠시 후 안내 창으로 이동합니다.");
            setTimeout(() => {
              router.refresh();
            }, 2000);
          } else {
            setStatus("success");
            setMessage("실시간 동기화가 성공적으로 완료되었습니다! 잠시 후 화면이 갱신됩니다.");
            setTimeout(() => {
              router.refresh();
            }, 1500);
          }
        } else {
          throw new Error(result.message || "동기화 처리 오류가 발생했습니다.");
        }
      } catch (err: any) {
        if (!isMounted) return;
        setStatus("error");
        setMessage(err.message || "정보 수집 중 알 수 없는 오류가 발생했습니다.");
        console.error("[Sync Error]", err);
      }
    };

    triggerSync();

    return () => {
      isMounted = false;
    };
  }, [bNo, isNew, router]);

  if (!isNew || status === "idle") return null;

  const getThemeStyles = () => {
    switch (status) {
      case "syncing":
        return {
          borderColor: "rgba(49, 130, 246, 0.4)",
          textColor: "#1e293b",
          barColor: "linear-gradient(90deg, #3182f6, #60a5fa)",
          spinnerBorder: "#3182f6"
        };
      case "success":
        return {
          borderColor: "rgba(45, 202, 115, 0.4)",
          textColor: "#14532d",
          barColor: "#2dca73",
          spinnerBorder: "#2dca73"
        };
      case "error":
        return {
          borderColor: "rgba(240, 68, 56, 0.4)",
          textColor: "#7f1d1d",
          barColor: "#f04438",
          spinnerBorder: "#f04438"
        };
    }
  };

  const theme = getThemeStyles();

  return (
    <div style={{
      position: "relative",
      padding: "20px 24px",
      borderRadius: "16px",
      background: "rgba(255, 255, 255, 0.65)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: `1px solid ${theme.borderColor}`,
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      overflow: "hidden",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      marginBottom: "24px"
    }}>
      {status === "syncing" && (
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "4px",
          width: "100%",
          background: "rgba(49, 130, 246, 0.08)",
        }}>
          <div style={{
            height: "100%",
            width: "35%",
            background: theme.barColor,
            borderRadius: "2px",
            animation: "progressPulse 1.8s infinite ease-in-out"
          }} />
        </div>
      )}

      {status !== "syncing" && (
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "4px",
          width: "100%",
          background: theme.barColor,
          transition: "width 0.5s ease-out"
        }} />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {status === "syncing" ? (
            <div style={{
              width: "22px",
              height: "22px",
              border: "3px solid rgba(49, 130, 246, 0.15)",
              borderTop: `3px solid ${theme.spinnerBorder}`,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite"
            }} />
          ) : status === "success" ? (
            <div style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              backgroundColor: "rgba(45, 202, 115, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2dca73",
              fontWeight: 800,
              fontSize: "0.85rem"
            }}>
              ✓
            </div>
          ) : (
            <div style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              backgroundColor: "rgba(240, 68, 56, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f04438",
              fontWeight: 800,
              fontSize: "0.85rem"
            }}>
              !
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            color: theme.textColor,
            lineHeight: 1.4,
            transition: "all 0.3s ease"
          }}>
            {message}
          </div>
          {status === "syncing" && (
            <div style={{
              fontSize: "0.78rem",
              color: "#64748b",
              marginTop: "4px",
              fontWeight: 500
            }}>
              * 이 페이지는 국세청 검증 전 가상 프로필을 먼저 보여주고 있습니다.
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes progressPulse {
          0% { left: -35%; }
          100% { left: 100%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
