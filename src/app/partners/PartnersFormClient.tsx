"use client";

import React, { useEffect, useState } from "react";
import { vibrateDevice } from "@/lib/appBridge";

type InquiryType = "claim_profile" | "closure_alert" | "contract_pro" | "data_partnership";

const INQUIRY_OPTIONS: Array<{
  key: InquiryType;
  emoji: string;
  title: string;
  desc: string;
}> = [
  {
    key: "claim_profile",
    emoji: "🛡️",
    title: "공식 기업 프로필 인증 · 등록",
    desc: "기업 상세페이지에 공식 소개글·로고·채용 링크·홈페이지 인증 배지 반영",
  },
  {
    key: "closure_alert",
    emoji: "🔔",
    title: "거래처 휴·폐업 변동 알림 (사전신청)",
    desc: "등록한 거래처의 폐업·휴업·간이과세 전환 시 이메일 자동 경보 우선 오픈",
  },
  {
    key: "contract_pro",
    emoji: "📁",
    title: "전자계약 팀 보관함 Pro 도입 문의",
    desc: "부서별 계약서 무제한 클라우드 보관·대량 서명 발송·권한 관리",
  },
  {
    key: "data_partnership",
    emoji: "🤝",
    title: "B2B 데이터 · 광고 · 제휴 문의",
    desc: "세무·노무·금융 제휴 및 기업 데이터 연동 협업 제안",
  },
];

export default function PartnersFormClient() {
  const [inquiryType, setInquiryType] = useState<InquiryType>("claim_profile");
  const [companyName, setCompanyName] = useState("");
  const [bNo, setBNo] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [watchlistCount, setWatchlistCount] = useState("50");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("type");
    if (t === "claim_profile" || t === "closure_alert" || t === "contract_pro" || t === "data_partnership") {
      setInquiryType(t);
    }
    const qBNo = (sp.get("b_no") || "").replace(/[^0-9]/g, "");
    if (qBNo.length === 10) {
      setBNo(qBNo.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3"));
    }
    const qCompany = (sp.get("company") || "").trim();
    if (qCompany) {
      setCompanyName(qCompany);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg("");
    vibrateDevice(20);

    try {
      const res = await fetch("/api/partners/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryType,
          companyName: companyName.trim(),
          bNo: bNo.replace(/[^0-9]/g, ""),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          watchlistCount: inquiryType === "closure_alert" ? Number(watchlistCount || 0) : 0,
          message: message.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "신청 접수에 실패했습니다.");
      }
      setSubmittedId(json.id || 1);
    } catch (err: any) {
      setErrorMsg(err.message || "네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedId) {
    return (
      <div
        className="card"
        style={{
          padding: "40px 26px",
          textAlign: "center",
          border: "1.5px solid rgba(16, 185, 129, 0.35)",
        }}
      >
        <div style={{ fontSize: "2.6rem", marginBottom: "12px" }}>✅</div>
        <h3 style={{ fontSize: "1.3rem", fontWeight: 850, color: "var(--color-text-main)", margin: "0 0 8px 0" }}>
          B2B 비즈니스 신청이 정상 접수되었습니다
        </h3>
        <p style={{ fontSize: "0.92rem", color: "var(--color-text-sub)", lineHeight: 1.6, margin: "0 0 20px 0" }}>
          접수 번호 <strong>#{submittedId}</strong>로 기록되었습니다. 검토 후 입력하신 이메일(
          <strong>{contactEmail}</strong>)로 <code>contact@maumdata.com</code>에서 순차 회신드리겠습니다.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmittedId(null);
            setMessage("");
          }}
          className="btn-secondary"
          style={{ padding: "10px 20px", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}
        >
          추가 문의 작성하기
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card"
      style={{
        padding: "28px 26px",
        border: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >
      <div>
        <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "10px" }}>
          1. 신청 / 문의 유형 선택
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "10px",
          }}
        >
          {INQUIRY_OPTIONS.map((opt) => {
            const active = inquiryType === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setInquiryType(opt.key)}
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  textAlign: "left",
                  cursor: "pointer",
                  border: active ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                  backgroundColor: active ? "var(--color-primary-light)" : "var(--bg-color-main)",
                  color: "inherit",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: "0.88rem", color: active ? "var(--color-primary)" : "var(--color-text-main)" }}>
                  {opt.emoji} {opt.title}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-desc)", marginTop: "4px", lineHeight: 1.45 }}>
                  {opt.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.83rem", fontWeight: 700, color: "var(--color-text-sub)", marginBottom: "6px" }}>
            기업명 (상호) <span style={{ color: "var(--color-danger)" }}>*</span>
          </label>
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="예: 주식회사 마음데이타"
            style={{
              width: "100%",
              padding: "11px 13px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              color: "var(--color-text-main)",
              fontSize: "0.9rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.83rem", fontWeight: 700, color: "var(--color-text-sub)", marginBottom: "6px" }}>
            사업자등록번호 (선택)
          </label>
          <input
            type="text"
            value={bNo}
            onChange={(e) => setBNo(e.target.value)}
            placeholder="예: 123-45-67890"
            style={{
              width: "100%",
              padding: "11px 13px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              color: "var(--color-text-main)",
              fontSize: "0.9rem",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.83rem", fontWeight: 700, color: "var(--color-text-sub)", marginBottom: "6px" }}>
            담당자 성함 / 직책 <span style={{ color: "var(--color-danger)" }}>*</span>
          </label>
          <input
            type="text"
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="예: 홍길동 팀장"
            style={{
              width: "100%",
              padding: "11px 13px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              color: "var(--color-text-main)",
              fontSize: "0.9rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.83rem", fontWeight: 700, color: "var(--color-text-sub)", marginBottom: "6px" }}>
            회신받을 회사 이메일 <span style={{ color: "var(--color-danger)" }}>*</span>
          </label>
          <input
            type="email"
            required
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="예: manager@company.co.kr"
            style={{
              width: "100%",
              padding: "11px 13px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              color: "var(--color-text-main)",
              fontSize: "0.9rem",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {inquiryType === "closure_alert" && (
        <div>
          <label style={{ display: "block", fontSize: "0.83rem", fontWeight: 700, color: "var(--color-text-sub)", marginBottom: "6px" }}>
            월간 모니터링 희망 거래처 수 (예상)
          </label>
          <select
            value={watchlistCount}
            onChange={(e) => setWatchlistCount(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "300px",
              padding: "11px 13px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--bg-color-main)",
              color: "var(--color-text-main)",
              fontSize: "0.9rem",
            }}
          >
            <option value="50">50개사 이하 (소규모 세무/경리)</option>
            <option value="200">50 ~ 200개사 (중소기업 구매/회계팀)</option>
            <option value="1000">200 ~ 1,000개사 (중견/유통·세무법인)</option>
            <option value="5000">1,000개사 이상 (엔터프라이즈 API)</option>
          </select>
        </div>
      )}

      <div>
        <label style={{ display: "block", fontSize: "0.83rem", fontWeight: 700, color: "var(--color-text-sub)", marginBottom: "6px" }}>
          상세 요청 내용 (선택)
        </label>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="반영을 원하시는 공식 홈페이지·회사 소개 문구, 필요 기능 또는 제휴 제안을 자유롭게 적어주세요."
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--bg-color-main)",
            color: "var(--color-text-main)",
            fontSize: "0.9rem",
            lineHeight: 1.55,
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
      </div>

      {errorMsg && (
        <div
          style={{
            padding: "11px 14px",
            borderRadius: "10px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            color: "var(--color-danger)",
            fontSize: "0.84rem",
            fontWeight: 700,
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <span style={{ fontSize: "0.78rem", color: "var(--color-text-desc)" }}>
          직접 메일 문의:{" "}
          <a href="mailto:contact@maumdata.com" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 700 }}>
            contact@maumdata.com
          </a>
        </span>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
          style={{
            padding: "12px 26px",
            borderRadius: "12px",
            fontSize: "0.94rem",
            fontWeight: 800,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.65 : 1,
          }}
        >
          {submitting ? "접수 중..." : "B2B 신청 / 문의 접수하기 ➔"}
        </button>
      </div>
    </form>
  );
}
