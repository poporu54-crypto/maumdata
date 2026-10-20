"use client";

import React, { useRef, useState, useEffect } from "react";
import { vibrateDevice } from "@/lib/appBridge";

interface DocumentSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySignature: (signatureDataUrl: string) => void;
  defaultSignerName?: string;
}

export default function DocumentSignatureModal({
  isOpen,
  onClose,
  onApplySignature,
  defaultSignerName = "홍길동"
}: DocumentSignatureModalProps) {
  const [activeTab, setActiveTab] = useState<"draw" | "stamp">("draw");
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [penColor, setPenColor] = useState<string>("#1e293b");

  // 서명 캔버스
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // 도장 캔버스
  const stampCanvasRef = useRef<HTMLCanvasElement>(null);

  // 캔버스 초기화
  useEffect(() => {
    if (isOpen && activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // 고해상도 레티나 디스플레이 보정
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 3;
        ctx.strokeStyle = penColor;
      }
    }
  }, [isOpen, activeTab, penColor]);

  // 도장 실시간 렌더링
  useEffect(() => {
    if (isOpen && activeTab === "stamp" && stampCanvasRef.current) {
      renderStamp(signerName);
    }
  }, [isOpen, activeTab, signerName]);

  const renderStamp = (name: string) => {
    const canvas = stampCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;
    ctx.clearRect(0, 0, 300, 300);

    const cleanName = (name || "홍길동").trim();
    // 3자면 '홍길동인', 2자면 '홍길동인', 4자면 그대로
    let stampText = cleanName;
    if (cleanName.length === 2) stampText = cleanName + "지인";
    else if (cleanName.length === 3) stampText = cleanName + "인";
    else if (cleanName.length > 4) stampText = cleanName.substring(0, 4);

    const centerX = 150;
    const centerY = 150;
    const radius = 130;

    // 1. 빨간색 원형 테두리 (약간의 인주 질감 효과)
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 2. 내부 얇은 보조원
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 12, 0, Math.PI * 2);
    ctx.stroke();

    // 3. 도장 텍스트 (한글 고문체/궁서체 2x2 배치)
    ctx.fillStyle = "#dc2626";
    ctx.font = "bold 60px 'Batang', 'KoPub Batang', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (stampText.length === 4) {
      // 우상 -> 우하 -> 좌상 -> 좌하 전통 인장 배치 (또는 좌상 우상 좌하 우하)
      ctx.fillText(stampText[0], 100, 100);
      ctx.fillText(stampText[1], 200, 100);
      ctx.fillText(stampText[2], 100, 200);
      ctx.fillText(stampText[3], 200, 200);
    } else {
      ctx.fillText(stampText, centerX, centerY);
    }
  };

  // 터치 및 마우스 드로잉 이벤트
  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawn(true);
    const pos = getCanvasPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = penColor;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    vibrateDevice(20);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
      }
    }
  };

  const handleApply = () => {
    vibrateDevice(40);
    if (activeTab === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        alert("서명을 먼저 화면에 작성해 주세요.");
        return;
      }
      const dataUrl = canvas.toDataURL("image/png");
      onApplySignature(dataUrl);
    } else {
      const canvas = stampCanvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/png");
      onApplySignature(dataUrl);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        backdropFilter: "blur(6px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--color-card)",
          width: "100%",
          maxWidth: "480px",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)" }}>
              ✍️ 전자 서명 · 인감 도장 생성
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--color-text-sub)" }}>
              손가락으로 사인하거나 디지털 인감 도장을 즉시 만듭니다.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: "none",
              border: "none",
              fontSize: "1.4rem",
              cursor: "pointer",
              color: "var(--color-text-desc)",
              padding: "4px"
            }}
          >
            ✕
          </button>
        </div>

        {/* 탭 버튼 */}
        <div
          style={{
            display: "flex",
            backgroundColor: "var(--bg-color-main)",
            borderRadius: "10px",
            padding: "4px",
            gap: "4px"
          }}
        >
          <button
            type="button"
            onClick={() => {
              vibrateDevice(20);
              setActiveTab("draw");
            }}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "8px",
              border: "none",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
              backgroundColor: activeTab === "draw" ? "#2563eb" : "transparent",
              color: activeTab === "draw" ? "#ffffff" : "var(--color-text-sub)",
              transition: "all 0.2s ease"
            }}
          >
            터치 자필 서명
          </button>
          <button
            type="button"
            onClick={() => {
              vibrateDevice(20);
              setActiveTab("stamp");
            }}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "8px",
              border: "none",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
              backgroundColor: activeTab === "stamp" ? "#dc2626" : "transparent",
              color: activeTab === "stamp" ? "#ffffff" : "var(--color-text-sub)",
              transition: "all 0.2s ease"
            }}
          >
            디지털 인감 도장
          </button>
        </div>

        {/* 탭 1: 터치 자필 서명 */}
        {activeTab === "draw" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-sub)", fontWeight: 600 }}>펜 색상:</span>
                {[
                  { color: "#1e293b", label: "블랙" },
                  { color: "#1d4ed8", label: "블루" },
                  { color: "#dc2626", label: "레드" }
                ].map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => setPenColor(p.color)}
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      backgroundColor: p.color,
                      border: penColor === p.color ? "2px solid #ffffff" : "none",
                      outline: penColor === p.color ? "2px solid #2563eb" : "none",
                      cursor: "pointer"
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={clearCanvas}
                style={{
                  background: "none",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "0.75rem",
                  color: "var(--color-text-sub)",
                  cursor: "pointer"
                }}
              >
                지우기
              </button>
            </div>

            {/* 터치 서명 캔버스 박스 */}
            <div
              style={{
                width: "100%",
                height: "200px",
                border: "2px dashed #94a3b8",
                borderRadius: "14px",
                backgroundColor: "#ffffff",
                position: "relative",
                overflow: "hidden",
                touchAction: "none"
              }}
            >
              <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", cursor: "crosshair" }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    color: "#94a3b8",
                    fontSize: "0.9rem",
                    pointerEvents: "none",
                    fontWeight: 500,
                    textAlign: "center"
                  }}
                >
                  이곳에 손가락으로 서명해 주세요
                </div>
              )}
            </div>
          </div>
        )}

        {/* 탭 2: 디지털 인감 도장 */}
        {activeTab === "stamp" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <div style={{ width: "100%" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px", display: "block" }}>
                도장에 새길 이름 (대표자/성명)
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="예: 홍길동"
                maxLength={4}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  fontSize: "1rem",
                  fontWeight: 700,
                  backgroundColor: "var(--bg-color-main)",
                  color: "var(--color-text-main)"
                }}
              />
            </div>

            <div
              style={{
                width: "180px",
                height: "180px",
                borderRadius: "16px",
                border: "1px solid var(--color-border)",
                backgroundColor: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 2px 6px rgba(0,0,0,0.05)"
              }}
            >
              <canvas
                ref={stampCanvasRef}
                style={{ width: "150px", height: "150px" }}
              />
            </div>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-desc)" }}>
              * 붉은색 인주 질감의 표준 원형 법인/개인 인감이 생성됩니다.
            </p>
          </div>
        )}

        {/* 하단 적용 버튼 */}
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              color: "var(--color-text-main)",
              fontWeight: 700,
              fontSize: "0.92rem",
              cursor: "pointer"
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            style={{
              flex: 2,
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
            }}
          >
            문서에 서명/도장 삽입하기
          </button>
        </div>
      </div>
    </div>
  );
}
