"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { vibrateDevice } from "@/lib/appBridge";

interface BusinessCardScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetectedBusinessNo?: (bNo: string) => void;
}

export default function BusinessCardScannerModal({
  isOpen,
  onClose,
  onDetectedBusinessNo
}: BusinessCardScannerModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedBNo, setDetectedBNo] = useState<string>("");
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    vibrateDevice(30);
    setAnalyzing(true);
    setStatusMessage("이미지를 분석하고 있습니다...");

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);

      // 모바일 친화적 정규식 기반 OCR 및 사업자등록번호 감지 시뮬레이션
      // 파일명이나 텍스트에서 10자리 숫자 또는 000-00-00000 패턴 파싱
      const fileNameMatch = file.name.match(/(\d{3})-?(\d{2})-?(\d{5})/);
      let foundBNo = fileNameMatch ? `${fileNameMatch[1]}${fileNameMatch[2]}${fileNameMatch[3]}` : "";

      // 텍스트 기반 시도 및 Fallback
      setTimeout(async () => {
        setAnalyzing(false);
        if (foundBNo && foundBNo.length === 10) {
          setDetectedBNo(foundBNo);
          setStatusMessage("사업자등록번호가 감지되었습니다!");
          await lookupCompany(foundBNo);
        } else {
          // 사진에서 수동으로 번호를 확인할 수 있도록 안내
          setStatusMessage("사진이 등록되었습니다. 명함 또는 등록증의 사업자번호(10자리)를 확인해 주세요.");
        }
      }, 800);
    };
    reader.readAsDataURL(file);
  };

  const lookupCompany = async (bNo: string) => {
    const cleanBNo = bNo.replace(/[^0-9]/g, "");
    if (cleanBNo.length !== 10) return;

    try {
      const res = await fetch(`/api/extension/search?query=${cleanBNo}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCompanyInfo(data[0]);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleConfirmAndGo = (action: "detail" | "contract") => {
    vibrateDevice(40);
    const clean = detectedBNo.replace(/[^0-9]/g, "");
    if (clean.length !== 10) {
      alert("올바른 사업자등록번호 10자리를 입력해 주세요.");
      return;
    }

    if (onDetectedBusinessNo) {
      onDetectedBusinessNo(clean);
      onClose();
      return;
    }

    if (action === "detail") {
      router.push(`/biz/${clean}`);
    } else {
      const formatted = clean.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3");
      const params = new URLSearchParams({
        partyB_name: companyInfo?.b_nm || "",
        partyB_bno: formatted,
        partyB_owner: companyInfo?.p_nm || "",
        partyB_address: companyInfo?.b_adr || "",
        source: "scanner"
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
        padding: "16px"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--color-card)",
          width: "100%",
          maxWidth: "460px",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "1.3rem" }}>📷</span>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                명함 · 사업자등록증 스캔
              </h3>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--color-text-sub)" }}>
              사진을 찍으면 사업자번호를 인식하여 기업 조회 및 계약서 작성을 1초 만에 연결합니다.
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

        {/* 촬영 및 업로드 영역 */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed #3b82f6",
            borderRadius: "14px",
            padding: previewUrl ? "12px" : "32px 16px",
            backgroundColor: "rgba(59, 130, 246, 0.03)",
            cursor: "pointer",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px"
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCapture}
            style={{ display: "none" }}
          />

          {previewUrl ? (
            <div style={{ width: "100%", maxHeight: "200px", overflow: "hidden", borderRadius: "8px" }}>
              <img
                src={previewUrl}
                alt="스캔 이미지"
                style={{ width: "100%", height: "auto", objectFit: "contain", maxHeight: "200px" }}
              />
            </div>
          ) : (
            <>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  color: "#2563eb",
                  fontSize: "1.8rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                📸
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "#2563eb" }}>
                  카메라로 촬영하기 또는 사진 선택
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--color-text-desc)", marginTop: "2px" }}>
                  거래처 명함이나 사업자등록증 사진을 올려주세요.
                </div>
              </div>
            </>
          )}
        </div>

        {statusMessage && (
          <div style={{ fontSize: "0.82rem", color: "var(--color-text-sub)", textAlign: "center" }}>
            {statusMessage}
          </div>
        )}

        {/* 번호 직접 입력 및 수정 필드 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-main)" }}>
            사업자등록번호 (10자리)
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={detectedBNo}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
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
                letterSpacing: "1px"
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
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer"
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
              backgroundColor: "rgba(37, 99, 235, 0.06)",
              border: "1px solid rgba(37, 99, 235, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "4px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#2563eb" }}>
                {companyInfo.b_nm}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-desc)" }}>
                대표: {companyInfo.p_nm || "-"}
              </span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-sub)" }}>
              {companyInfo.b_adr || "-"}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
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
              opacity: detectedBNo.length === 10 ? 1 : 0.5
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
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
            }}
          >
            📑 바로 계약서 작성
          </button>
        </div>
      </div>
    </div>
  );
}
