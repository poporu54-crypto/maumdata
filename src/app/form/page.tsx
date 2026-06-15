"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "./templatesData";
import AdSpace from "@/components/AdSpace";

// freeforms.co.kr 스타일의 세분화된 대분류-소분류 카테고리 정의
const FORM_CATEGORIES = [
  {
    key: "노무",
    title: "📋 인사 / 노무 서식",
    desc: "근로계약서, 사직서, 연차신청서, 이력서 등 노무 필수 양식",
    color: "linear-gradient(135deg, rgba(49, 130, 246, 0.03) 0%, rgba(49, 130, 246, 0.09) 100%)",
    borderColor: "rgba(49, 130, 246, 0.15)",
    subcategories: [
      { name: "근로계약서", tag: "근로계약서" },
      { name: "사직서", tag: "사직서" },
      { name: "휴가신청서", tag: "휴가신청서" },
      { name: "이력서/자소설", tag: "이력서" },
      { name: "인사/노무일반", tag: "인사" }
    ]
  },
  {
    key: "행정",
    title: "📂 기획 / 행정 서식",
    desc: "기안서, 품의서, 회의록, 경위서 등 사내 행정 양식",
    color: "linear-gradient(135deg, rgba(0, 180, 216, 0.03) 0%, rgba(0, 180, 216, 0.09) 100%)",
    borderColor: "rgba(0, 180, 216, 0.15)",
    subcategories: [
      { name: "기안서", tag: "기안서" },
      { name: "품의서", tag: "품의서" },
      { name: "회의록", tag: "회의록" },
      { name: "경위서/시말서", tag: "경위서/시말서" },
      { name: "행정/사무일반", tag: "행정" }
    ]
  },
  {
    key: "재무",
    title: "💰 세무 / 회계 / 경리",
    desc: "지출결의서, 영수증, 출납, 자금 관리 서식",
    color: "linear-gradient(135deg, rgba(45, 202, 115, 0.03) 0%, rgba(45, 202, 115, 0.09) 100%)",
    borderColor: "rgba(45, 202, 115, 0.15)",
    subcategories: [
      { name: "지출결의서", tag: "지출결의서" },
      { name: "경리/출납", tag: "경리" },
      { name: "회계/재무", tag: "회계" },
      { name: "세무/소득세", tag: "세무" }
    ]
  },
  {
    key: "계약",
    title: "🤝 계약 / 영업 / 구매",
    desc: "견적서, 발주서, 표준 계약서 및 거래 양식",
    color: "linear-gradient(135deg, rgba(255, 157, 0, 0.03) 0%, rgba(255, 157, 0, 0.09) 100%)",
    borderColor: "rgba(255, 157, 0, 0.15)",
    subcategories: [
      { name: "견적서", tag: "견적서" },
      { name: "발주서", tag: "발주서" },
      { name: "구매/자재", tag: "구매" },
      { name: "판매/영업", tag: "영업" },
      { name: "거래일반", tag: "계약" }
    ]
  },
  {
    key: "법률",
    title: "⚖️ 법률 / 민사 서식",
    desc: "차용증, 내용증명, 위임장 등 법적 권리 증빙 서식",
    color: "linear-gradient(135deg, rgba(160, 32, 240, 0.03) 0%, rgba(160, 32, 240, 0.09) 100%)",
    borderColor: "rgba(160, 32, 240, 0.15)",
    subcategories: [
      { name: "차용증/금전", tag: "차용증/금전" },
      { name: "내용증명", tag: "내용증명" },
      { name: "채권/채무", tag: "채권" },
      { name: "민사/가사", tag: "민사" },
      { name: "법률일반", tag: "법률" }
    ]
  },
  {
    key: "정부",
    title: "🏛️ 정부 / 공공 민원 서식",
    desc: "정부24, 대법원, 국세청 등의 대한민국 공식 민원 양식",
    color: "linear-gradient(135deg, rgba(49, 130, 246, 0.03) 0%, rgba(49, 130, 246, 0.09) 100%)",
    borderColor: "rgba(49, 130, 246, 0.15)",
    subcategories: [
      { name: "주민등록", tag: "주민등록" },
      { name: "가족관계", tag: "가족관계" },
      { name: "사업자등록", tag: "사업자등록" },
      { name: "납세증명서", tag: "납세증명서" },
      { name: "정부서식일반", tag: "정부서식" }
    ]
  }
];

export default function DocsPage() {
  const router = useRouter();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const gridSectionRef = useRef<HTMLDivElement>(null);

  // 태그 선택 핸들러 (태그별 고유 URL 라우팅으로 이동하여 SEO 및 광고 노출 효과 극대화)
  const handleSelectTag = (tag: string) => {
    router.push(`/form/tag/${encodeURIComponent(tag)}`);
  };

  // 검색어 및 태그가 바뀔 때마다 DB 템플릿 검색
  useEffect(() => {
    let active = true;
    const delayDebounceFn = setTimeout(async () => {
      try {
        const queryParams = new URLSearchParams();
        if (searchQuery) queryParams.set("q", searchQuery);
        if (selectedTag) queryParams.set("tag", selectedTag);

        const res = await fetch(`/api/form?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Search failed");
        
        const json = await res.json();
        if (json.success && active) {
          setDbTemplates(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch templates from DB:", err);
      }
    }, 300); // 300ms 디바운스

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [searchQuery, selectedTag]);

  // 로컬 필터링 적용
  const filteredTemplates = TEMPLATES.filter((tpl) => {
    const matchesTag = !selectedTag || tpl.tags.includes(selectedTag);
    const matchesSearch = 
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      tpl.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTag && matchesSearch;
  });

  // 로컬과 DB에서 나온 결과를 병합하고, 중복 ID는 제거
  const allTemplatesMap = new Map();
  filteredTemplates.forEach(tpl => allTemplatesMap.set(tpl.id, tpl));
  dbTemplates.forEach(tpl => {
    if (!allTemplatesMap.has(tpl.id)) {
      allTemplatesMap.set(tpl.id, {
        ...tpl,
        fields: tpl.fields || []
      });
    }
  });
  const allTemplates = Array.from(allTemplatesMap.values());


  return (
    <div className="container animate-fade-in" style={{ padding: "40px 24px" }}>
      
      {/* 1. 상단 광고 배너 */}
      <AdSpace format="horizontal" style={{ width: "100%", margin: "0 auto 32px auto" }} />

      {/* 2. 헤더 정보 */}
      <div className="docs-header" style={{ marginBottom: "40px", textAlign: "center" }}>
        <span 
          style={{ 
            backgroundColor: "var(--color-primary-light)", 
            color: "var(--color-primary)", 
            padding: "6px 16px", 
            borderRadius: "20px", 
            fontSize: "0.85rem", 
            fontWeight: 700 
          }}
        >
          마음데이터 FORM - 회원가입 없는 무료 서식 발전기
        </span>
        <h1 className="hero-title" style={{ marginTop: "16px", marginBottom: "12px" }}>
          스마트 무료 서식 센터
        </h1>
        <p className="hero-subtitle" style={{ maxWidth: "650px", margin: "0 auto", fontSize: "1.05rem" }}>
          필요한 직장 업무 및 법률 서식을 웹에서 실시간 입력하고 최적화된 A4 비율의 PDF로 저장 및 즉시 인쇄하세요.
        </p>
      </div>

      {/* 3. 검색 폼 */}
      <div style={{ position: "relative", width: "100%", maxWidth: "600px", margin: "0 auto 40px auto" }}>
        <input 
          type="text"
          placeholder="필요한 서식명 또는 카테고리 검색 (예: 사직서, 근로계약서, 지출결의서...)"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // 검색어 입력 시 소분류 태그 필터 해제하여 전체 검색 가능하게 유도
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
            transition: "all 0.3s ease"
          }}
          onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
          onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
        />
        <span style={{ position: "absolute", right: "20px", top: "18px", fontSize: "1.2rem", opacity: 0.6 }}>🔍</span>
      </div>

      {/* 4. A-Z 카테고리 대형 진열판 (freeforms 스타일 우리화) */}
      <div style={{ marginBottom: "56px" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "24px", paddingLeft: "4px" }}>
          🗂️ 카테고리별 전체 서식 찾아보기
        </h2>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px"
        }}>
          {FORM_CATEGORIES.map((cat, i) => (
            <div 
              key={i}
              className="card" 
              style={{
                padding: "24px",
                border: `1.5px solid ${cat.borderColor}`,
                background: cat.color,
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                borderRadius: "var(--radius-md)",
                transition: "var(--transition-smooth)"
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "6px" }}>
                  {cat.title}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-sub)", lineHeight: 1.4, margin: 0 }}>
                  {cat.desc}
                </p>
              </div>

              {/* 하부 소분류 태그 리스트 */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                {cat.subcategories.map((sub, idx) => {
                  const isActive = selectedTag === sub.tag;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectTag(sub.tag)}
                      style={{
                        backgroundColor: isActive ? "var(--color-primary)" : "var(--bg-color-card)",
                        color: isActive ? "#ffffff" : "var(--color-text-sub)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "20px",
                        padding: "6px 12px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "var(--transition-smooth)",
                        boxShadow: "var(--shadow-sm)"
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = "var(--color-primary)";
                          e.currentTarget.style.color = "var(--color-primary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = "var(--color-border)";
                          e.currentTarget.style.color = "var(--color-text-sub)";
                        }
                      }}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. 필터링된 서식 목록 영역 */}
      <div ref={gridSectionRef} style={{ scrollMarginTop: "20px", marginBottom: "56px" }}>
        
        {/* 필터 칩 바 (현재 어떤 카테고리가 켜져있는지 표시) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
              📄 {selectedTag ? `"${selectedTag}" 서식 목록` : "모든 무료 서식"}
            </h3>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
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
                  gap: "4px"
                }}
              >
                필터 해제 ✕
              </button>
            )}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)" }}>
            검색 결과: <strong>{allTemplates.length}</strong>개 양식
          </div>
        </div>

        {/* 서식 목록 Grid */}
        {allTemplates.length > 0 ? (
          <div className="docs-grid">
            {allTemplates.map((tpl, idx) => {
              // 카테고리별 이모지 뱃지
              const categoryBadge = 
                tpl.category === "노무" ? "📋 노무" : 
                tpl.category === "행정" ? "📂 행정" : 
                tpl.category === "재무" ? "💰 재무" : 
                tpl.category === "법률" ? "⚖️ 법률" : 
                tpl.category === "정부" ? "🏛️ 정부" : "🤝 계약";

              return (
                <React.Fragment key={tpl.id}>
                  {/* 6번째 카드 뒤에 중간 애드센스 광고 영역 삽입 */}
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
                          borderRadius: "4px"
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
                        display: "inline-block"
                      }}
                    >
                      {categoryBadge}
                    </span>

                    <div className="doc-card-title" style={{ fontSize: "1.1rem" }}>{tpl.title}</div>
                    <div className="doc-card-desc" style={{ minHeight: "60px", marginBottom: "16px" }}>{tpl.desc}</div>
                    
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-desc)", marginBottom: "6px" }}>
                        포함되는 표준 항목:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {tpl.fields.filter((f: any) => f.type !== "list").slice(0, 4).map((f: any, i: number) => (
                          <span 
                            key={i} 
                            style={{ 
                              backgroundColor: "var(--bg-color-main)", 
                              border: "1px solid var(--color-border)",
                              color: "var(--color-text-sub)",
                              fontSize: "0.7rem",
                              padding: "1px 6px",
                              borderRadius: "4px"
                            }}
                          >
                            {f.label}
                          </span>
                        ))}
                        {tpl.fields.length > 4 && (
                          <span style={{ fontSize: "0.7rem", color: "var(--color-text-desc)", padding: "1px 4px" }}>
                            외 {tpl.fields.length - 4}개
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="doc-card-actions" style={{ marginTop: "auto" }}>
                      <Link 
                        href={`/form/${tpl.id}`} 
                        className="btn-card-action primary"
                        style={{ display: "block" }}
                      >
                        웹에서 작성 & PDF 저장
                      </Link>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          /* 소분류는 있으나 매칭되는 서식이 없을 때 "무료 제작 요청"으로 1:1 유도하는 고품격 UI */
          <div 
            style={{ 
              textAlign: "center", 
              padding: "64px 24px", 
              backgroundColor: "var(--bg-color-card)", 
              borderRadius: "var(--radius-md)",
              border: "1.5px dashed var(--color-primary)",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <span style={{ fontSize: "3rem" }}>💡</span>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: "16px", marginBottom: "8px", color: "var(--color-text-main)" }}>
              {selectedTag ? `"${selectedTag}" 관련 서식을 즉시 제작해 드립니다` : "검색 결과에 맞는 무료 서식이 없습니다"}
            </h3>
            <p style={{ color: "var(--color-text-sub)", fontSize: "0.95rem", maxWidth: "550px", margin: "0 auto 24px auto", lineHeight: 1.6 }}>
              마음데이터 FORM은 회원가입 없는 순수 무료 서식 센터입니다. 요청하시는 양식을 전문 법적 검토를 거쳐 영업일 기준 1일 이내에 제작 및 시스템에 무료 배포해 드립니다.
            </p>
            <Link 
              href={`/admin?requestForm=${encodeURIComponent(selectedTag || searchQuery || "신규서식")}`} 
              className="btn-primary" 
              style={{ padding: "12px 32px", fontSize: "0.95rem", borderRadius: "10px" }}
            >
              ⚡ {selectedTag ? `"${selectedTag}"` : ""} 서식 무료 제작 신청하기
            </Link>
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
          padding: "40px 24px"
        }}
      >
        <h3 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "10px" }}>
          💡 기업 대량 맞춤 서식 구축 문의
        </h3>
        <p style={{ color: "var(--color-text-sub)", fontSize: "0.95rem", marginBottom: "20px", maxWidth: "600px", margin: "0 auto 20px auto" }}>
          사내 전용 결재라인 매핑, 자사 전용 템플릿의 실시간 A4 PDF 출력 자동화 솔루션이 필요한 기업 고객은 문의해 주세요.
        </p>
        <Link href="/admin" className="btn-secondary" style={{ padding: "10px 24px", fontSize: "0.9rem" }}>
          기업 맞춤 서식 솔루션 문의
        </Link>
      </div>

    </div>
  );
}
