"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  vibrateDevice,
  hasNativeOcrScanner,
  requestNativeOcrScan,
  extractBizNoFromText,
  useAppModalBack,
} from "@/lib/appBridge";

interface BusinessCardScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetectedBusinessNo?: (bNo: string) => void;
}

// 웹 브라우저 환경에서만 사용자 촬영/업로드 시 지연 로드되는 경량 숫자 OCR 로더 (초기 번들 0바이트)
let tesseractScriptPromise: Promise<any> | null = null;
function loadWebOcrEngineOnDemand(): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if ((window as any).Tesseract) return Promise.resolve((window as any).Tesseract);
  if (tesseractScriptPromise) return tesseractScriptPromise;

  tesseractScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    script.onload = () => resolve((window as any).Tesseract || null);
    script.onerror = () => {
      tesseractScriptPromise = null;
      resolve(null);
    };
    document.head.appendChild(script);
  });
  return tesseractScriptPromise;
}

async function runBrowserImageOcr(dataUrl: string): Promise<string> {
  // 1. 크롬 내장 Shape Detection API (지원 기기에서는 초고속 동작)
  if (typeof window !== "undefined" && "TextDetector" in window) {
    try {
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("img load error"));
        img.src = dataUrl;
      });
      const detector = new (window as any).TextDetector();
      const blocks = await detector.detect(img);
      if (Array.isArray(blocks) && blocks.length > 0) {
        const text = blocks.map((b: any) => b.rawValue || "").join("\n");
        const found = extractBizNoFromText(text);
        if (found) return found;
      }
    } catch {
      // 폴백으로 진행
    }
  }

  // 2. 온디맨드 Tesseract 숫자 인식 (사업자번호 000-00-00000은 아라비아 숫자이므로 eng로 빠르게 추출)
  const Tesseract = await loadWebOcrEngineOnDemand();
  if (!Tesseract) return "";
  try {
    const result = await Tesseract.recognize(dataUrl, "eng");
    const rawText = result?.data?.text || "";
    return extractBizNoFromText(rawText);
  } catch {
    return "";
  }
}

export default function BusinessCardScannerModal({
  isOpen,
  onClose,
  onDetectedBusinessNo,
}: BusinessCardScannerModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedBNo, setDetectedBNo] = useState<string>("");
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 안드로이드 물리 뒤로가기 연동 및 당겨서 새로고침 잠금
  useAppModalBack(isOpen, onClose);

  if (!isOpen) return null;

  const isNativeScannerReady = hasNativeOcrScanner();

  const lookupCompany = async (bNo: string) => {
    const cleanBNo = bNo.replace(/[^0-9]/g, "");
    if (cleanBNo.length !== 10) {
      setCompanyInfo(null);
      return;
    }

    try {
      const res = await fetch(`/api/extension/search?query=${cleanBNo}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCompanyInfo(data[0]);
        } else {
          setCompanyInfo(null);
        }
      }
    } catch {
      // ignore
    }
  };

  // 안드로이드 앱 전용: Google ML Kit 한국어 온디바이스 OCR 스캐너 실행
  const handleNativeScan = async (source: "camera" | "gallery") => {
    vibrateDevice(30);
    setAnalyzing(true);
    setCompanyInfo(null);
    setStatusMessage(
      source === "camera"
        ? "카메라 촬영 후 사업자등록번호를 자동 인식합니다..."
        : "선택한 사진에서 사업자등록번호를 분석하고 있습니다..."
    );

    const res = await requestNativeOcrScan(source);
    setAnalyzing(false);

    if (!res || res.cancelled) {
      setStatusMessage("");
      return;
    }

    if (res.previewDataUrl) {
      setPreviewUrl(res.previewDataUrl);
    }

    const foundBNo = res.bNo || extractBizNoFromText(res.rawText || "");
    if (foundBNo && foundBNo.length === 10) {
      vibrateDevice(45);
      setDetectedBNo(foundBNo);
      setStatusMessage("✅ 사업자등록번호(10자리)를 자동으로 인식했습니다!");
      await lookupCompany(foundBNo);
    } else if (res.error) {
      setStatusMessage(`⚠️ ${res.error}`);
    } else {
      setStatusMessage(
        "이미지에서 10자리 사업자번호를 찾지 못했습니다. 번호가 잘 보이게 다시 찍거나 아래에 직접 입력해 주세요."
      );
    }
  };

  // 모바일/PC 웹 브라우저 전용 파일 처리 및 실측 OCR 인식
  const handleWebFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    vibrateDevice(30);
    setAnalyzing(true);
    setCompanyInfo(null);
    setStatusMessage("이미지 속 사업자등록번호(000-00-00000)를 인식하고 있습니다...");

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);

      const foundBNo = await runBrowserImageOcr(dataUrl);
      setAnalyzing(false);

      if (foundBNo && foundBNo.length === 10) {
        vibrateDevice(45);
        setDetectedBNo(foundBNo);
        setStatusMessage("✅ 사업자등록번호(10자리)를 자동으로 인식했습니다!");
        await lookupCompany(foundBNo);
      } else {
        setStatusMessage(
          "이미지에서 10자리 사업자번호를 자동 추출하지 못했습니다. 사진을 보며 아래 칸에 번호를 입력해 주세요."
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmAndGo = (action: "detail" | "contract") => {
    vibrateDevice(40);
    const clean = detectedBNo.replace(/[^0-9]/g, "");
    if (clean.length !== 10) {
      alert("올바른 사업자등록번호 10자리를 입력해 주세요.");
      return;
    }

    if (action === "detail" && onDetectedBusinessNo) {
      onDetectedBusinessNo(clean);
      onClose();
      return;
    }

    if (action === "detail") {
      router.push(`/biz/${clean}`);
    } else {
      const formatted = clean.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3");
      try {
        window.sessionStorage.setItem(
          "maumdata_prefill_partyB",
          JSON.stringify({
            partyB_name: companyInfo?.b_nm || "",
            partyB_bno: formatted,
            partyB_owner: companyInfo?.p_nm || "",
            partyB_address: companyInfo?.b_adr || "",
            partyB_sector: companyInfo?.b_sector || "",
            ts: Date.now(),
          })
        );
      } catch {}
      const params = new URLSearchParams({
        partyB_name: companyInfo?.b_nm || "",
        partyB_bno: formatted,
        partyB_owner: companyInfo?.p_nm || "",
        partyB_address: companyInfo?.b_adr || "",
        source: "scanner",
      });
      router.push(`/form/generic_partnership?${params.toString()}`);
    }
    onClose();
  };

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
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(8px)",
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
          backgroundColor: "var(--bg-color-card)",
          border: "1px solid var(--color-border)",
          width: "100%",
          maxWidth: "460px",
          borderRadius: "20px",
          padding: "22px 20px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "1.3rem" }}>📷</span>
              <h3 style={{ margin: 0, fontSize: "1.18rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                명함 · 사업자등록증 OCR 스캔
              </h3>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.81rem", color: "var(--color-text-sub)", lineHeight: 1.4 }}>
              카메라 촬영 또는 앨범 사진에서 사업자번호(10자리)를 읽어 기업 조회·계약서 작성으로 즉시 연결합니다.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="스캐너 닫기"
            style={{
              background: "none",
              border: "none",
              fontSize: "1.4rem",
              cursor: "pointer",
              color: "var(--color-text-desc)",
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* 이미지 미리보기 영역 */}
        {previewUrl && (
          <div
            style={{
              width: "100%",
              maxHeight: "190px",
              overflow: "hidden",
              borderRadius: "12px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px",
            }}
          >
            <img
              src={previewUrl}
              alt="스캔된 문서 미리보기"
              style={{ width: "100%", height: "auto", objectFit: "contain", maxHeight: "176px", borderRadius: "8px" }}
            />
          </div>
        )}

        {/* 촬영 / 사진첩 선택 버튼 (앱 네이티브 ML Kit vs 웹 표준 분리) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleWebFileCapture}
          style={{ display: "none" }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleWebFileCapture}
          style={{ display: "none" }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button
            type="button"
            disabled={analyzing}
            onClick={() => {
              if (isNativeScannerReady) {
                handleNativeScan("camera");
              } else {
                cameraInputRef.current?.click();
              }
            }}
            style={{
              padding: "14px 12px",
              borderRadius: "14px",
              border: "1.5px solid #2563eb",
              background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.9rem",
              cursor: analyzing ? "wait" : "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              boxShadow: "0 6px 16px rgba(37, 99, 235, 0.25)",
            }}
          >
            <span style={{ fontSize: "1.35rem" }}>📸</span>
            <span>카메라로 촬영</span>
          </button>

          <button
            type="button"
            disabled={analyzing}
            onClick={() => {
              if (isNativeScannerReady) {
                handleNativeScan("gallery");
              } else {
                galleryInputRef.current?.click();
              }
            }}
            style={{
              padding: "14px 12px",
              borderRadius: "14px",
              border: "1.5px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              color: "var(--color-text-main)",
              fontWeight: 800,
              fontSize: "0.9rem",
              cursor: analyzing ? "wait" : "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: "1.35rem" }}>🖼️</span>
            <span>앨범에서 선택</span>
          </button>
        </div>

        {(analyzing || statusMessage) && (
          <div
            style={{
              fontSize: "0.81rem",
              color: statusMessage.startsWith("✅") ? "var(--color-success)" : "var(--color-text-sub)",
              fontWeight: statusMessage.startsWith("✅") ? 700 : 500,
              textAlign: "center",
              backgroundColor: "var(--bg-color-main)",
              padding: "8px 12px",
              borderRadius: "10px",
              lineHeight: 1.4,
            }}
          >
            {analyzing ? "⏳ " : ""}
            {statusMessage}
          </div>
        )}

        {/* 번호 직접 입력 및 수정 필드 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-main)" }}>
            사업자등록번호 (숫자 10자리)
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="tel"
              inputMode="numeric"
              value={detectedBNo}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                setDetectedBNo(val);
                if (val.length === 10) lookupCompany(val);
              }}
              placeholder="예: 1248100998"
              maxLength={10}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--bg-color-main)",
                color: "var(--color-text-main)",
                fontSize: "1rem",
                fontWeight: 700,
                letterSpacing: "1px",
              }}
            />
            <button
              type="button"
              onClick={() => lookupCompany(detectedBNo)}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--bg-color-main)",
                color: "var(--color-text-main)",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              조회
            </button>
          </div>
        </div>

        {/* 조회된 기업 프리뷰 카드 */}
        {companyInfo && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "12px",
              backgroundColor: "var(--color-primary-light)",
              border: "1px solid rgba(49, 130, 246, 0.28)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-primary)" }}>
                {companyInfo.b_nm}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-sub)", flexShrink: 0 }}>
                대표: {companyInfo.p_nm || "-"}
              </span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-sub)" }}>
              {companyInfo.b_adr || "-"}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
          <button
            type="button"
            onClick={() => handleConfirmAndGo("detail")}
            disabled={detectedBNo.length !== 10}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              color: "var(--color-text-main)",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: detectedBNo.length === 10 ? "pointer" : "not-allowed",
              opacity: detectedBNo.length === 10 ? 1 : 0.5,
            }}
          >
            🔍 기업 정보 조회
          </button>
          <button
            type="button"
            onClick={() => handleConfirmAndGo("contract")}
            disabled={detectedBNo.length !== 10}
            style={{
              flex: 1.2,
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.92rem",
              cursor: detectedBNo.length === 10 ? "pointer" : "not-allowed",
              opacity: detectedBNo.length === 10 ? 1 : 0.5,
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
            }}
          >
            📑 바로 계약서 작성
          </button>
        </div>
      </div>
    </div>
  );
}
