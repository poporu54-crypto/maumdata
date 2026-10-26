"use client";

import React, { useState, useRef, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { TemplateSummary } from "@/lib/formSummaries";
import { matchesTagRule } from "@/lib/tagRules";
import AdSpace from "@/components/AdSpace";

const FeedbackModal = dynamic(() => import("@/components/FeedbackModal"), {
  ssr: false,
});

const FORM_CATEGORIES = [
  {
    key: "노무",
    title: "📋 인사 / 노무 서식",
    desc: "근로계약서, 사직서, 연차신청서, 이력서 등 노무 필수 양식",
    count: "60+종",
    color: "linear-gradient(135deg, rgba(49, 130, 246, 0.03) 0%, rgba(49, 130, 246, 0.09) 100%)",
    borderColor: "rgba(49, 130, 246, 0.15)",
    subcategories: [
      { name: "근로계약서", tag: "근로계약서" },
      { name: "사직서", tag: "사직서" },
      { name: "휴가신청서", tag: "휴가신청서" },
      { name: "이력서/자소서", tag: "이력서" },
      { name: "인사/노무일반", tag: "인사" },
    ],
  },
  {
    key: "행정",
    title: "📂 기획 / 행정 서식",
    desc: "기안서, 품의서, 회의록, 경위서 등 사내 행정 양식",
    count: "45+종",
    color: "linear-gradient(135deg, rgba(0, 180, 216, 0.03) 0%, rgba(0, 180, 216, 0.09) 100%)",
    borderColor: "rgba(0, 180, 216, 0.15)",
    subcategories: [
      { name: "기안서", tag: "기안서" },
      { name: "품의서", tag: "품의서" },
      { name: "회의록", tag: "회의록" },
      { name: "경위서/시말서", tag: "경위서" },
      { name: "행정/사무일반", tag: "사무일반" },
    ],
  },
  {
    key: "재무",
    title: "💰 세무 / 회계 / 경리",
    desc: "지출결의서, 영수증, 출납, 자금 관리 서식",
    count: "25+종",
    color: "linear-gradient(135deg, rgba(45, 202, 115, 0.03) 0%, rgba(45, 202, 115, 0.09) 100%)",
    borderColor: "rgba(45, 202, 115, 0.15)",
    subcategories: [
      { name: "지출결의서", tag: "지출결의서" },
      { name: "경리/출납", tag: "경리" },
      { name: "회계/재무", tag: "회계" },
      { name: "세무/소득세", tag: "세무" },
    ],
  },
  {
    key: "계약",
    title: "🤝 계약 / 영업 / 구매",
    desc: "견적서, 발주서, 표준 계약서 및 거래 양식",
    count: "100+종",
    color: "linear-gradient(135deg, rgba(255, 157, 0, 0.03) 0%, rgba(255, 157, 0, 0.09) 100%)",
    borderColor: "rgba(255, 157, 0, 0.15)",
    subcategories: [
      { name: "견적서", tag: "견적서" },
      { name: "발주서", tag: "발주서" },
      { name: "구매/자재", tag: "구매" },
      { name: "판매/영업", tag: "영업" },
      { name: "거래일반", tag: "거래일반" },
    ],
  },
  {
    key: "법률",
    title: "⚖️ 법률 / 민사 서식",
    desc: "차용증, 내용증명, 위임장 등 법적 권리 증빙 서식",
    count: "55+종",
    color: "linear-gradient(135deg, rgba(160, 32, 240, 0.03) 0%, rgba(160, 32, 240, 0.09) 100%)",
    borderColor: "rgba(160, 32, 240, 0.15)",
    subcategories: [
      { name: "차용증/금전", tag: "차용증" },
      { name: "내용증명", tag: "내용증명" },
      { name: "채권/채무", tag: "채권" },
      { name: "민사/가사", tag: "민사" },
      { name: "법률일반", tag: "법률일반" },
    ],
  },
  {
    key: "정부",
    title: "🏛️ 정부 / 공공 민원 서식",
    desc: "정부24, 대법원, 국세청 등의 대한민국 공식 민원 양식",
    count: "35+종",
    color: "linear-gradient(135deg, rgba(49, 130, 246, 0.03) 0%, rgba(49, 130, 246, 0.09) 100%)",
    borderColor: "rgba(49, 130, 246, 0.15)",
    subcategories: [
      { name: "주민등록", tag: "주민등록" },
      { name: "가족관계", tag: "가족관계" },
      { name: "사업자등록", tag: "사업자등록" },
      { name: "납세증명서", tag: "납세증명서" },
      { name: "정부서식일반", tag: "정부서식일반" },
    ],
  },
];

const INITIAL_VISIBLE_COUNT = 36;

export default function FormCatalogClient({
  initialSummaries,
}: {
  initialSummaries: TemplateSummary[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllUnfiltered, setShowAllUnfiltered] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const gridSectionRef = useRef<HTMLDivElement>(null);

  const handleSelectCategory = (catKey: string | null) => {
    if (selectedCategory === catKey) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(catKey);
      setSelectedTag(null);
    }
    setTimeout(() => {
      gridSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleSelectTag = (tag: string, parentCatKey?: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
      if (parentCatKey) {
        setSelectedCategory(parentCatKey);
      }
    }
    setTimeout(() => {
      gridSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const allTemplates = useMemo(() => {
    const qLower = searchQuery.trim().toLowerCase();
    return initialSummaries.filter((tpl) => {
      const matchesCategory = !selectedCategory || tpl.category === selectedCategory;
      const matchesTag = !selectedTag || matchesTagRule(tpl, selectedTag);
      const matchesSearch =
        !qLower ||
        tpl.title.toLowerCase().includes(qLower) ||
        tpl.desc.toLowerCase().includes(qLower) ||
        tpl.tags.some((t) => t.toLowerCase().includes(qLower));
      return matchesCategory && matchesTag && matchesSearch;
    });
  }, [initialSummaries, selectedCategory, selectedTag, searchQuery]);

  const isFiltered = Boolean(selectedCategory || selectedTag || searchQuery.trim());
  const visibleTemplates =
    isFiltered || showAllUnfiltered
      ? allTemplates
      : allTemplates.slice(0, INITIAL_VISIBLE_COUNT);

  return (
    <div className="container animate-fade-in" style={{ padding: "40px 24px" }}>
      {/* 1. 상단 광고 배너 */}
      <AdSpace format="horizontal" style={{ width: "100%", margin: "0 auto 32px auto" }} />

      {/* 2. 헤더 정보 */}
      <div className="docs-header" style={{ marginBottom: "32px", textAlign: "center" }}>
        <span
          style={{
            backgroundColor: "var(--color-primary-light)",
            color: "var(--color-primary)",
            padding: "6px 16px",
            borderRadius: "20px",
            fontSize: "0.85rem",
            fontWeight: 700,
          }}
        >
          마음데이타 FORM - {initialSummaries.length}+종 무료 서식 빅데이터 라이브러리
        </span>
        <h1 className="hero-title" style={{ marginTop: "16px", marginBottom: "12px" }}>
          스마트 무료 서식 센터
        </h1>
        <p className="hero-subtitle" style={{ maxWidth: "650px", margin: "0 auto", fontSize: "1.05rem" }}>
          계약·노무·법률·행정·세무 등 {initialSummaries.length}여 종의 실무 서식을 회원가입 없이 실시간 입력하고 최적화된 A4 비율의 PDF로 저장 및 즉시 인쇄하세요.
        </p>
      </div>

      {/* 3. 검색 폼 */}
      <div style={{ position: "relative", width: "100%", maxWidth: "600px", margin: "0 auto 24px auto" }}>
        <input
          type="text"
          placeholder="필요한 서식명 또는 카테고리 검색 (예: 사직서, 근로계약서, 지출결의서...)"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (selectedTag) setSelectedTag(null);
          }}
          style={{
            width: "100%",
            padding: "16px 20px",
            paddingRight: "50px",
            border: "1.5px solid var(--color-border)",
            borderRadius: "16px",
            backgroundColor: "var(--bg-color-card)",
            color: "var(--color-text-main)",
            fontSize: "1.05rem",
            boxShadow: "var(--shadow-sm)",
            outline: "none",
            transition: "all 0.3s ease",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
        />
        <span style={{ position: "absolute", right: "20px", top: "18px", fontSize: "1.2rem", opacity: 0.6 }}>🔍</span>
      </div>

      {/* 3-1. 카테고리 빠른 필터 바 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "48px",
        }}
      >
        <button
          onClick={() => handleSelectCategory(null)}
          style={{
            padding: "8px 16px",
            borderRadius: "24px",
            fontSize: "0.88rem",
            fontWeight: 700,
            border: !selectedCategory ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-border)",
            backgroundColor: !selectedCategory ? "var(--color-primary)" : "var(--bg-color-card)",
            color: !selectedCategory ? "#ffffff" : "var(--color-text-main)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          🌐 전체 ({initialSummaries.length})
        </button>
        {FORM_CATEGORIES.map((cat) => {
          const isCatActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => handleSelectCategory(cat.key)}
              style={{
                padding: "8px 16px",
                borderRadius: "24px",
                fontSize: "0.88rem",
                fontWeight: 700,
                border: isCatActive ? "1.5px solid var(--color-primary)" : "1.5px solid var(--color-border)",
                backgroundColor: isCatActive ? "var(--color-primary)" : "var(--bg-color-card)",
                color: isCatActive ? "#ffffff" : "var(--color-text-main)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isCatActive ? "0 4px 12px rgba(49, 130, 246, 0.25)" : "var(--shadow-sm)",
              }}
            >
              {cat.title.split(" ")[0]} {cat.key} ({cat.count})
            </button>
          );
        })}
      </div>

      {/* 4. 카테고리 대형 진열판 */}
      <div style={{ marginBottom: "56px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0, paddingLeft: "4px" }}>
            🗂️ 카테고리별 전체 서식 찾아보기
          </h2>
          {selectedCategory && (
            <button
              onClick={() => handleSelectCategory(null)}
              style={{
                fontSize: "0.82rem",
                color: "var(--color-primary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              전체 카테고리 보기 ↺
            </button>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {FORM_CATEGORIES.map((cat, i) => {
            const isCatActive = selectedCategory === cat.key;
            return (
              <div
                key={i}
                className="card"
                onClick={() => handleSelectCategory(cat.key)}
                style={{
                  padding: "24px",
                  border: isCatActive ? "2px solid var(--color-primary)" : `1.5px solid ${cat.borderColor}`,
                  background: cat.color,
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  borderRadius: "var(--radius-md)",
                  transition: "var(--transition-smooth)",
                  cursor: "pointer",
                  boxShadow: isCatActive ? "0 8px 24px rgba(49, 130, 246, 0.18)" : "var(--shadow-sm)",
                  transform: isCatActive ? "translateY(-2px)" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "6px" }}>
                      {cat.title}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--color-text-sub)", lineHeight: 1.4, margin: 0 }}>
                      {cat.desc}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: isCatActive ? "var(--color-primary)" : "var(--color-text-desc)",
                      backgroundColor: isCatActive ? "var(--color-primary-light)" : "var(--bg-color-card)",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      whiteSpace: "nowrap",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {isCatActive ? "선택됨 ✓" : `전체 (${cat.count}) →`}
                  </span>
                </div>

                {/* 하부 소분류 태그 리스트 */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                  {cat.subcategories.map((sub, idx) => {
                    const isActive = selectedTag === sub.tag;
                    return (
                      <Link
                        key={idx}
                        href={`/form/tag/${encodeURIComponent(sub.tag)}`}
                        prefetch={false}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        style={{
                          backgroundColor: isActive ? "var(--color-primary)" : "var(--bg-color-card)",
                          color: isActive ? "#ffffff" : "var(--color-text-sub)",
                          border: isActive ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                          borderRadius: "20px",
                          padding: "6px 12px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          textDecoration: "none",
                          transition: "var(--transition-smooth)",
                          boxShadow: "var(--shadow-sm)",
                        }}
                      >
                        {sub.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. 필터링된 서식 목록 영역 */}
      <div ref={gridSectionRef} style={{ scrollMarginTop: "20px", marginBottom: "56px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
              📄{" "}
              {selectedTag
                ? `"${selectedTag}" 관련 서식 목록`
                : selectedCategory
                  ? `"${selectedCategory}" 카테고리 전체 서식`
                  : "인기 · 대표 무료 서식"}
            </h3>
            {(selectedTag || selectedCategory) && (
              <button
                onClick={() => {
                  setSelectedTag(null);
                  setSelectedCategory(null);
                }}
                style={{
                  backgroundColor: "var(--color-primary-light)",
                  color: "var(--color-primary)",
                  border: "none",
                  borderRadius: "15px",
                  padding: "4px 12px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                전체 보기 ✕
              </button>
            )}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)" }}>
            검색 결과: <strong>{allTemplates.length}</strong>개 양식
          </div>
        </div>

        {visibleTemplates.length > 0 ? (
          <>
            <div className="docs-grid">
              {visibleTemplates.map((tpl, idx) => {
                const categoryBadge =
                  tpl.category === "노무"
                    ? "📋 노무"
                    : tpl.category === "행정"
                      ? "📂 행정"
                      : tpl.category === "재무"
                        ? "💰 재무"
                        : tpl.category === "법률"
                          ? "⚖️ 법률"
                          : tpl.category === "정부"
                            ? "🏛️ 정부"
                            : "🤝 계약";

                return (
                  <React.Fragment key={tpl.id}>
                    {idx === 6 && (
                      <div style={{ gridColumn: "1 / -1", margin: "12px 0" }}>
                        <AdSpace slot="8888888888" style={{ width: "100%" }} />
                      </div>
                    )}

                    <div className="doc-card" style={{ position: "relative" }}>
                      {tpl.popular && (
                        <span
                          style={{
                            position: "absolute",
                            top: "16px",
                            right: "16px",
                            backgroundColor: "var(--color-warning)",
                            color: "#ffffff",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          인기
                        </span>
                      )}

                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-primary)",
                          fontWeight: 700,
                          marginBottom: "6px",
                          display: "inline-block",
                        }}
                      >
                        {categoryBadge}
                      </span>

                      <Link
                        href={`/form/${tpl.id}`}
                        prefetch={false}
                        className="doc-card-title"
                        style={{
                          fontSize: "1.1rem",
                          textDecoration: "none",
                          display: "block",
                          color: "var(--color-text-main)",
                        }}
                      >
                        {tpl.title}
                      </Link>
                      <div className="doc-card-desc" style={{ minHeight: "60px", marginBottom: "16px" }}>
                        {tpl.desc}
                      </div>

                      {tpl.fieldLabels.length > 0 && (
                        <div style={{ marginBottom: "20px" }}>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: "var(--color-text-desc)",
                              marginBottom: "6px",
                            }}
                          >
                            포함되는 표준 항목:
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {tpl.fieldLabels.map((label, i) => (
                              <span
                                key={i}
                                style={{
                                  backgroundColor: "var(--bg-color-main)",
                                  border: "1px solid var(--color-border)",
                                  color: "var(--color-text-sub)",
                                  fontSize: "0.7rem",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                {label}
                              </span>
                            ))}
                            {tpl.totalFields > 4 && (
                              <span style={{ fontSize: "0.7rem", color: "var(--color-text-desc)", padding: "1px 4px" }}>
                                외 {tpl.totalFields - 4}개
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="doc-card-actions" style={{ marginTop: "auto" }}>
                        <Link
                          href={`/form/${tpl.id}`}
                          prefetch={false}
                          className="btn-card-action primary"
                          style={{ display: "block" }}
                        >
                          웹에서 작성 &amp; PDF 저장
                        </Link>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {!isFiltered && !showAllUnfiltered && allTemplates.length > INITIAL_VISIBLE_COUNT && (
              <div style={{ textAlign: "center", marginTop: "32px" }}>
                <button
                  type="button"
                  onClick={() => setShowAllUnfiltered(true)}
                  className="btn-secondary"
                  style={{
                    padding: "12px 28px",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    borderRadius: "12px",
                    cursor: "pointer",
                    border: "1.5px solid var(--color-border)",
                  }}
                >
                  📂 전체 무료 서식 {allTemplates.length}종 모두 펼쳐보기 (+{allTemplates.length - INITIAL_VISIBLE_COUNT}개)
                </button>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "64px 24px",
              backgroundColor: "var(--bg-color-card)",
              borderRadius: "var(--radius-md)",
              border: "1.5px dashed var(--color-primary)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <span style={{ fontSize: "3rem" }}>💡</span>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                marginTop: "16px",
                marginBottom: "8px",
                color: "var(--color-text-main)",
              }}
            >
              {selectedTag ? `"${selectedTag}" 관련 서식을 즉시 제작해 드립니다` : "검색 결과에 맞는 무료 서식이 없습니다"}
            </h3>
            <p
              style={{
                color: "var(--color-text-sub)",
                fontSize: "0.95rem",
                maxWidth: "550px",
                margin: "0 auto 24px auto",
                lineHeight: 1.6,
              }}
            >
              마음데이타 FORM은 회원가입 없는 순수 무료 서식 센터입니다. 요청하시는 양식을 전문 법적 검토를 거쳐 영업일 기준 1일 이내에 제작 및 시스템에 무료 배포해 드립니다.
            </p>
            <button
              type="button"
              onClick={() => setIsFeedbackOpen(true)}
              className="btn-primary"
              style={{
                padding: "12px 32px",
                fontSize: "0.95rem",
                borderRadius: "10px",
                cursor: "pointer",
                border: "none",
              }}
            >
              ⚡ {selectedTag ? `"${selectedTag}"` : ""} 서식 무료 제작 신청하기
            </button>
          </div>
        )}
      </div>

      {/* 6. 건의 및 문의 하단 배너 */}
      <div
        className="card"
        style={{
          textAlign: "center",
          background: "linear-gradient(135deg, var(--bg-color-card) 0%, var(--color-primary-light) 100%)",
          borderRadius: "var(--radius-md)",
          padding: "40px 24px",
        }}
      >
        <h3 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "10px" }}>
          💡 기업 대량 맞춤 서식 구축 문의
        </h3>
        <p
          style={{
            color: "var(--color-text-sub)",
            fontSize: "0.95rem",
            marginBottom: "20px",
            maxWidth: "600px",
            margin: "0 auto 20px auto",
          }}
        >
          사내 전용 결재라인 매핑, 자사 전용 템플릿의 실시간 A4 PDF 출력 자동화 솔루션이 필요한 기업 고객은 문의해 주세요.
        </p>
        <button
          type="button"
          onClick={() => setIsFeedbackOpen(true)}
          className="btn-secondary"
          style={{
            padding: "10px 24px",
            fontSize: "0.9rem",
            cursor: "pointer",
            border: "1px solid var(--color-border)",
          }}
        >
          기업 맞춤 서식 솔루션 문의
        </button>
      </div>

      {isFeedbackOpen && (
        <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      )}
    </div>
  );
}
