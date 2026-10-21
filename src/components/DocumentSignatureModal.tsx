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
  defaultSignerName = "홍길동",
}: DocumentSignatureModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "stamp" | "draw">("upload");
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [penColor, setPenColor] = useState<string>("#1e293b");

  // 1. 인감도장 사진 업로드 상태
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadCanvasRef = useRef<HTMLCanvasElement>(null);
  const [rawUploadedImg, setRawUploadedImg] = useState<HTMLImageElement | null>(null);
  const [processedUploadUrl, setProcessedUploadUrl] = useState<string | null>(null);
  const [autoRemoveWhiteBg, setAutoRemoveWhiteBg] = useState<boolean>(true);

  // 2. 디지털 도장 캔버스
  const stampCanvasRef = useRef<HTMLCanvasElement>(null);

  // 3. 터치 자필 서명 캔버스
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // 자필 서명 캔버스 초기화
  useEffect(() => {
    if (isOpen && activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = (rect.width || 400) * 2;
        canvas.height = (rect.height || 180) * 2;
        ctx.scale(2, 2);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 3;
        ctx.strokeStyle = penColor;
      }
    }
  }, [isOpen, activeTab, penColor]);

  // 디지털 도장 실시간 렌더링
  useEffect(() => {
    if (isOpen && activeTab === "stamp" && stampCanvasRef.current) {
      renderStamp(signerName);
    }
  }, [isOpen, activeTab, signerName]);

  // 업로드된 도장 이미지 배경 투명화(누끼) 처리
  useEffect(() => {
    if (!rawUploadedImg || !uploadCanvasRef.current) return;
    const canvas = uploadCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const maxDim = 320;
    const scale = Math.min(maxDim / rawUploadedImg.width, maxDim / rawUploadedImg.height, 1);
    const w = Math.max(1, Math.round(rawUploadedImg.width * scale));
    const h = Math.max(1, Math.round(rawUploadedImg.height * scale));

    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(rawUploadedImg, 0, 0, w, h);

    if (autoRemoveWhiteBg) {
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const a = d[i + 3];
        if (a === 0) continue;

        // 밝은 흰색/회색 종이 배경 픽셀은 투명화하고, 붉은 인주나 진한 선은 보존
        const brightness = (r + g + b) / 3;
        const redness = r - Math.max(g, b);
        if (brightness > 205 && redness < 25) {
          d[i + 3] = 0;
        } else if (brightness > 175 && redness < 18) {
          // 경계선 부드럽게 반투명 처리
          d[i + 3] = Math.round(a * 0.25);
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    setProcessedUploadUrl(canvas.toDataURL("image/png"));
  }, [rawUploadedImg, autoRemoveWhiteBg]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setRawUploadedImg(img);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const renderStamp = (name: string) => {
    const canvas = stampCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;
    ctx.clearRect(0, 0, 300, 300);

    const cleanName = (name || "홍길동").trim();
    let stampText = cleanName;
    if (cleanName.length === 2) stampText = cleanName + "지인";
    else if (cleanName.length === 3) stampText = cleanName + "인";
    else if (cleanName.length > 4) stampText = cleanName.substring(0, 4);

    const centerX = 150;
    const centerY = 150;
    const radius = 130;

    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#dc2626";
    ctx.font = "bold 60px 'Batang', 'KoPub Batang', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (stampText.length === 4) {
      ctx.fillText(stampText[0], 100, 100);
      ctx.fillText(stampText[1], 200, 100);
      ctx.fillText(stampText[2], 100, 200);
      ctx.fillText(stampText[3], 200, 200);
    } else {
      ctx.fillText(stampText, centerX, centerY);
    }
  };

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
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
    if (activeTab === "upload") {
      if (!processedUploadUrl) {
        alert("먼저 사용하실 법인/개인 인감도장 사진을 선택해 주세요.");
        return;
      }
      onApplySignature(processedUploadUrl);
    } else if (activeTab === "draw") {
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
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#ffffff",
          color: "#0f172a",
          width: "100%",
          maxWidth: "500px",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
          border: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
              ✍️ 법인·개인 인감도장 및 전자서명 날인
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#475569" }}>
              실제 법인인감 도장 사진을 불러오거나 디지털 인감·자필 서명을 날인합니다.
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
              color: "#64748b",
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* 3단 탭 버튼 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr",
            backgroundColor: "#f1f5f9",
            borderRadius: "12px",
            padding: "4px",
            gap: "4px",
          }}
        >
          <button
            type="button"
            onClick={() => {
              vibrateDevice(20);
              setActiveTab("upload");
            }}
            style={{
              padding: "9px 6px",
              borderRadius: "8px",
              border: "none",
              fontWeight: 800,
              fontSize: "0.82rem",
              cursor: "pointer",
              backgroundColor: activeTab === "upload" ? "#dc2626" : "transparent",
              color: activeTab === "upload" ? "#ffffff" : "#475569",
              transition: "all 0.15s ease",
            }}
          >
            📷 도장 사진 불러오기
          </button>
          <button
            type="button"
            onClick={() => {
              vibrateDevice(20);
              setActiveTab("stamp");
            }}
            style={{
              padding: "9px 6px",
              borderRadius: "8px",
              border: "none",
              fontWeight: 800,
              fontSize: "0.82rem",
              cursor: "pointer",
              backgroundColor: activeTab === "stamp" ? "#dc2626" : "transparent",
              color: activeTab === "stamp" ? "#ffffff" : "#475569",
              transition: "all 0.15s ease",
            }}
          >
            🔴 디지털 도장 생성
          </button>
          <button
            type="button"
            onClick={() => {
              vibrateDevice(20);
              setActiveTab("draw");
            }}
            style={{
              padding: "9px 6px",
              borderRadius: "8px",
              border: "none",
              fontWeight: 800,
              fontSize: "0.82rem",
              cursor: "pointer",
              backgroundColor: activeTab === "draw" ? "#2563eb" : "transparent",
              color: activeTab === "draw" ? "#ffffff" : "#475569",
              transition: "all 0.15s ease",
            }}
          >
            ✍️ 터치 자필 서명
          </button>
        </div>

        {/* 탭 1: 실제 법인/개인 인감도장 사진 불러오기 */}
        {activeTab === "upload" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <canvas ref={uploadCanvasRef} style={{ display: "none" }} />

            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%",
                minHeight: "190px",
                borderRadius: "14px",
                border: "2px dashed #cbd5e1",
                backgroundColor: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                cursor: "pointer",
                gap: "10px",
              }}
            >
              {processedUploadUrl ? (
                <>
                  <div
                    style={{
                      position: "relative",
                      padding: "14px 24px",
                      backgroundColor: "#ffffff",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      color: "#0f172a",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <span>대표이사 홍길동</span>
                    <span
                      style={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginLeft: "6px",
                      }}
                    >
                      <span>(인)</span>
                      <img
                        src={processedUploadUrl}
                        alt="업로드된 인감 미리보기"
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "58px",
                          height: "58px",
                          objectFit: "contain",
                          pointerEvents: "none",
                        }}
                      />
                    </span>
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "#2563eb", fontWeight: 700 }}>
                    🔄 다른 도장 사진으로 변경하려면 클릭하세요
                  </span>
                </>
              ) : (
                <>
                  <div style={{ fontSize: "2.4rem" }}>📷</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                    법인인감 / 사용인감 도장 사진 불러오기
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", textAlign: "center", lineHeight: 1.4 }}>
                    흰 종이에 찍어 촬영한 도장 사진(JPG)이나 투명 배경(PNG) 파일을 선택하세요.<br />
                    문서의 <strong>(인)</strong> 글자 위에 실제 도장처럼 정확히 겹쳐서 찍힙니다.
                  </div>
                </>
              )}
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#334155",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={autoRemoveWhiteBg}
                onChange={(e) => setAutoRemoveWhiteBg(e.target.checked)}
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              <span>✨ 흰 종이 배경 자동 투명화 (글자 위에 도장만 선명하게 겹쳐 찍기)</span>
            </label>
          </div>
        )}

        {/* 탭 2: 디지털 인감 도장 */}
        {activeTab === "stamp" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <div style={{ width: "100%" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px", display: "block" }}>
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
                  border: "1.5px solid #cbd5e1",
                  fontSize: "1rem",
                  fontWeight: 700,
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                }}
              />
            </div>

            <div
              style={{
                width: "160px",
                height: "160px",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 2px 6px rgba(0,0,0,0.05)",
              }}
            >
              <canvas ref={stampCanvasRef} style={{ width: "135px", height: "135px" }} />
            </div>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>
              * 문서의 <strong>(인)</strong> 글자 위치에 겹쳐서 날인됩니다.
            </p>
          </div>
        )}

        {/* 탭 3: 터치 자필 서명 */}
        {activeTab === "draw" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 700 }}>펜 색상:</span>
                {[
                  { color: "#1e293b", label: "블랙" },
                  { color: "#1d4ed8", label: "블루" },
                  { color: "#dc2626", label: "레드" },
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
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={clearCanvas}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                지우기
              </button>
            </div>

            <div
              style={{
                width: "100%",
                height: "180px",
                border: "2px dashed #94a3b8",
                borderRadius: "14px",
                backgroundColor: "#ffffff",
                position: "relative",
                overflow: "hidden",
                touchAction: "none",
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
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  이곳에 마우스나 손가락으로 서명해 주세요
                </div>
              )}
            </div>
          </div>
        )}

        {/* 하단 적용 버튼 */}
        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#f8fafc",
              color: "#334155",
              fontWeight: 700,
              fontSize: "0.92rem",
              cursor: "pointer",
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
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
            }}
          >
            문서 (인) 위치에 도장/서명 찍기
          </button>
        </div>
      </div>
    </div>
  );
}
