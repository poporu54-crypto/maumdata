"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface EditRequestModalProps {
  bNo: string;
  currentBrandName: string;
  currentHomepage: string;
  currentDescription: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TimelineEventInput {
  date: string;  // YYYYMMDD
  title: string;
  desc: string;
}

export default function EditRequestModal({
  bNo,
  currentBrandName,
  currentHomepage,
  currentDescription,
  isOpen,
  onClose
}: EditRequestModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const [requesterType, setRequesterType] = useState<"visitor" | "relation">("visitor");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [proposedBrandName, setProposedBrandName] = useState(currentBrandName || "");
  const [proposedHomepage, setProposedHomepage] = useState(currentHomepage || "");
  const [proposedDescription, setProposedDescription] = useState(currentDescription || "");
  
  // 연혁 추가 제안 목록 상태
  const [proposedTimeline, setProposedTimeline] = useState<TimelineEventInput[]>([]);
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen || !mounted) return null;

  // 연혁 한 줄 추가 액션
  const handleAddTimelineEvent = () => {
    const cleanDate = newEventDate.replace(/[^0-9]/g, "");
    if (cleanDate.length !== 8) {
      setError("연혁 날짜는 YYYYMMDD 형태의 8자리 숫자여야 합니다. (예: 20211231)");
      return;
    }
    if (!newEventTitle.trim() || !newEventDesc.trim()) {
      setError("연혁의 제목과 상세 설명은 필수 입력 사항입니다.");
      return;
    }

    setProposedTimeline([
      ...proposedTimeline,
      { date: cleanDate, title: newEventTitle.trim(), desc: newEventDesc.trim() }
    ]);
    
    // 추가 폼 리셋
    setNewEventDate("");
    setNewEventTitle("");
    setNewEventDesc("");
    setError("");
  };

  // 연혁 삭제
  const handleRemoveTimelineEvent = (index: number) => {
    setProposedTimeline(proposedTimeline.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!requesterEmail.trim()) {
      setError("이메일을 입력해 주세요.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/biz/${bNo}/edit-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requesterType,
          requesterEmail,
          proposedBrandName,
          proposedHomepage,
          proposedDescription,
          proposedTimeline
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "수정 제안 등록에 실패했습니다.");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        // 폼 완전 초기화
        setProposedTimeline([]);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    if (dateStr.length === 8) {
      return `${dateStr.slice(0, 4)}년 ${dateStr.slice(4, 6)}월`;
    }
    return dateStr;
  };

  return createPortal(
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(6px)"
    }}>
      <div style={{
        width: "90%",
        maxWidth: "600px",
        maxHeight: "90vh",
        backgroundColor: "var(--bg-color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "20px",
        padding: "32px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
            ✏️ 기업 정보 수정 제안하기 (나무위키형)
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-desc)",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "4px"
            }}
          >
            ✕
          </button>
        </div>

        {success ? (
          <div style={{
            textAlign: "center",
            padding: "48px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px"
          }}>
            <span style={{ fontSize: "3rem" }}>🎉</span>
            <h4 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-success)" }}>
              수정 제안이 접수되었습니다!
            </h4>
            <p style={{ color: "var(--color-text-desc)", fontSize: "0.9rem" }}>
              관리자가 확인 후 적합할 경우 실제 데이터에 즉시 반영합니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {error && (
              <div style={{
                backgroundColor: "rgba(240, 68, 56, 0.1)",
                color: "var(--color-danger)",
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                border: "1px solid rgba(240, 68, 56, 0.2)",
                fontWeight: 600
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* 방문자/관계자 선택 */}
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-sub)", display: "block", marginBottom: "8px" }}>
                신청자 구분
              </label>
              <div style={{ display: "flex", gap: "16px" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.9rem", color: "var(--color-text-main)" }}>
                  <input 
                    type="radio" 
                    name="requesterType" 
                    checked={requesterType === "visitor"} 
                    onChange={() => setRequesterType("visitor")}
                    style={{ accentColor: "var(--color-primary)" }}
                  />
                  일반 방문자
                </label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.9rem", color: "var(--color-text-main)" }}>
                  <input 
                    type="radio" 
                    name="requesterType" 
                    checked={requesterType === "relation"} 
                    onChange={() => setRequesterType("relation")}
                    style={{ accentColor: "var(--color-primary)" }}
                  />
                  회사 관계자
                </label>
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-sub)", display: "block", marginBottom: "8px" }}>
                제출자 이메일 주소
              </label>
              <input 
                type="email" 
                required
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                placeholder="예: contact@company.com (진행상황 안내용)"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-main)",
                  color: "var(--color-text-main)",
                  fontSize: "0.9rem",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <hr style={{ border: 0, borderTop: "1px solid var(--color-border)", margin: "8px 0" }} />

            {/* 제안 브랜드명 */}
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-sub)", display: "block", marginBottom: "8px" }}>
                브랜드명 / 별칭 (쉼표로 여러개 입력 가능)
              </label>
              <input 
                type="text" 
                value={proposedBrandName}
                onChange={(e) => setProposedBrandName(e.target.value)}
                placeholder="예: 토스, Toss"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-main)",
                  color: "var(--color-text-main)",
                  fontSize: "0.9rem",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* 제안 홈페이지 */}
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-sub)", display: "block", marginBottom: "8px" }}>
                공식 홈페이지 주소
              </label>
              <input 
                type="text" 
                value={proposedHomepage}
                onChange={(e) => setProposedHomepage(e.target.value)}
                placeholder="예: https://toss.im"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-main)",
                  color: "var(--color-text-main)",
                  fontSize: "0.9rem",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* 제안 설명 */}
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-sub)", display: "block", marginBottom: "8px" }}>
                기업 소개 및 설명 제안
              </label>
              <textarea 
                rows={4}
                value={proposedDescription}
                onChange={(e) => setProposedDescription(e.target.value)}
                placeholder="기업의 실제 사업 모델이나 소개글을 자세히 적어주세요."
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-main)",
                  color: "var(--color-text-main)",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                  resize: "vertical",
                  lineHeight: 1.5
                }}
              />
            </div>

            <hr style={{ border: 0, borderTop: "1px solid var(--color-border)", margin: "8px 0" }} />

            {/* 연혁 타임라인 추가 제안 */}
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-sub)", display: "block", marginBottom: "8px" }}>
                📅 주요 연혁(히스토리) 추가 제안
              </label>
              
              {/* 추가된 연혁 목록 칩 */}
              {proposedTimeline.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                  {proposedTimeline.map((item, index) => (
                    <div key={index} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "var(--bg-color-main)",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                      fontSize: "0.82rem"
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>{formatDateLabel(item.date)}</span>
                        <strong style={{ color: "var(--color-text-main)" }}>{item.title}</strong>
                        <span style={{ color: "var(--color-text-desc)" }}>{item.desc}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTimelineEvent(index)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--color-danger)",
                          cursor: "pointer",
                          fontWeight: 700
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 연관 신규 연혁 추가 인풋들 */}
              <div style={{
                backgroundColor: "var(--bg-color-main)",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid var(--color-border)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <input 
                      type="text" 
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      placeholder="날짜 (YYYYMMDD)"
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--bg-color-card)",
                        color: "var(--color-text-main)",
                        fontSize: "0.85rem",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <input 
                      type="text" 
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="이벤트 제목 (예: 상호 변경)"
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--bg-color-card)",
                        color: "var(--color-text-main)",
                        fontSize: "0.85rem",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
                <div>
                  <input 
                    type="text" 
                    value={newEventDesc}
                    onChange={(e) => setNewEventDesc(e.target.value)}
                    placeholder="이벤트 상세 설명 (예: 스타벅스로 사명 변경)"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--bg-color-card)",
                      color: "var(--color-text-main)",
                      fontSize: "0.85rem",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <button 
                  type="button" 
                  onClick={handleAddTimelineEvent}
                  style={{
                    backgroundColor: "rgba(49, 130, 246, 0.1)",
                    color: "var(--color-primary)",
                    border: "1px dashed var(--color-primary)",
                    padding: "8px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 700
                  }}
                >
                  + 연혁 타임라인 항목 추가하기
                </button>
              </div>
            </div>

            {/* 버튼들 */}
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button 
                type="button" 
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--bg-color-main)",
                  color: "var(--color-text-sub)",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: 700
                }}
              >
                취소
              </button>
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  flex: 2,
                  padding: "14px",
                  borderRadius: "12px",
                  border: "none",
                  backgroundColor: "var(--color-primary)",
                  color: "white",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  fontSize: "0.95rem",
                  fontWeight: 700
                }}
              >
                {loading ? "전송 중..." : "수정 제안 제출하기"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
