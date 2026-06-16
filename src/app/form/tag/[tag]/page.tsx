import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { searchTemplatesFromDB } from "@/lib/db";
import { TEMPLATES } from "@/app/form/templatesData";
import AdSpace from "@/components/AdSpace";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

// 1. 태그 페이지 전용 동적 SEO 매핑
export async function generateMetadata(props: TagPageProps): Promise<Metadata> {
  const { tag } = await props.params;
  const decodedTag = decodeURIComponent(tag);
  
  return {
    title: `무료 ${decodedTag} 서식 양식 모음 | 마음데이터 FORM`,
    description: `${decodedTag} 관련 추천 표준 문서 양식들을 모았습니다. 회원가입이나 설치 없이 웹에서 바로 내용을 기입하고 깔끔한 A4 PDF로 다운로드 및 즉시 인쇄를 진행해보세요.`,
    keywords: [decodedTag, `${decodedTag} 양식`, `${decodedTag} 서식`, "무료서식", "마음데이터"],
    openGraph: {
      title: `무료 ${decodedTag} 서식 양식 모음 | 마음데이터 FORM`,
      description: `${decodedTag} 관련 행정/법률/노무 서식을 웹에서 직접 작성하고 출력해보세요.`,
      type: "website"
    }
  };
}

// 2. 태그 전용 서버 컴포넌트 렌더러
export default async function TagPage(props: TagPageProps) {
  const { tag } = await props.params;
  const decodedTag = decodeURIComponent(tag);

  // 로컬 템플릿 중 해당 태그 매칭 필터링
  const localMatched = TEMPLATES.filter((tpl) => tpl.tags.includes(decodedTag));

  // DB 템플릿 중 해당 태그 매칭 쿼리 (실시간)
  let dbMatched: any[] = [];
  try {
    dbMatched = await searchTemplatesFromDB("", decodedTag);
  } catch (err) {
    console.error("Failed to query DB templates for tag page:", err);
  }

  // 중복 ID 방지 병합
  const mergedMap = new Map();
  localMatched.forEach((tpl) => mergedMap.set(tpl.id, tpl));
  dbMatched.forEach((tpl) => {
    if (!mergedMap.has(tpl.id)) {
      mergedMap.set(tpl.id, {
        ...tpl,
        fields: tpl.fields || []
      });
    }
  });
  const matchedTemplates = Array.from(mergedMap.values());

  return (
    <div className="container animate-fade-in" style={{ padding: "40px 24px" }}>
      {/* 1. 상단 광고 배너 */}
      <AdSpace format="horizontal" style={{ width: "100%", margin: "0 auto 32px auto" }} />

      {/* 2. 헤더 정보 */}
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <Link 
          href="/form" 
          style={{ 
            color: "var(--color-primary)", 
            fontWeight: 700, 
            fontSize: "0.9rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            marginBottom: "16px"
          }}
        >
          ← 모든 무료 서식 홈으로 가기
        </Link>
        
        <h1 className="hero-title" style={{ marginTop: "8px", marginBottom: "12px" }}>
          <span className="emoji">🏛️</span> &apos;{decodedTag}&apos; 관련 추천 서식
        </h1>
        <p className="hero-subtitle" style={{ maxWidth: "650px", margin: "0 auto", fontSize: "1.05rem" }}>
          {decodedTag} 키워드와 관련된 표준 행정, 민원, 법률 및 노무 서식들입니다. 필요한 서식을 클릭하여 실시간으로 내용을 기입해보세요.
        </p>
      </div>

      {/* 3. 서식 목록 결과 영역 */}
      <div style={{ marginBottom: "56px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
            📄 서식 검색 결과 ({matchedTemplates.length}개)
          </h3>
        </div>

        {matchedTemplates.length > 0 ? (
          <div className="docs-grid">
            {matchedTemplates.map((tpl, idx) => {
              // 카테고리 뱃지
              const categoryBadge = 
                tpl.category === "노무" ? "📋 노무" : 
                tpl.category === "행정" ? "📂 행정" : 
                tpl.category === "재무" ? "💰 재무" : 
                tpl.category === "법률" ? "⚖️ 법률" : 
                tpl.category === "정부" ? "🏛️ 정부" : "🤝 계약";

              return (
                <React.Fragment key={tpl.id}>
                  {/* 중간 광고판 추가 배치 (광고 기회 확대) */}
                  {idx === 6 && (
                    <div style={{ gridColumn: "1 / -1", margin: "12px 0" }}>
                      <AdSpace slot="8888888888" style={{ width: "100%" }} />
                    </div>
                  )}

                  <Link 
                    href={`/form/${tpl.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className="doc-card" style={{ position: "relative", cursor: "pointer", height: "100%" }}>
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
                        </div>
                      </div>
                      
                      <div 
                        className="btn btn-outline" 
                        style={{ 
                          width: "100%", 
                          textAlign: "center", 
                          padding: "10px", 
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          borderRadius: "10px",
                          marginTop: "auto"
                        }}
                      >
                        ✍️ 서식 편집하기
                      </div>
                    </div>
                  </Link>
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <div 
            style={{ 
              textAlign: "center", 
              padding: "60px 24px", 
              backgroundColor: "var(--bg-color-card)", 
              borderRadius: "16px",
              border: "1.5px dashed var(--color-border)"
            }}
          >
            <p style={{ color: "var(--color-text-sub)", fontSize: "1rem", marginBottom: "16px" }}>
              현재 &apos;{decodedTag}&apos; 관련 등록된 서식이 없거나 제작 중입니다.
            </p>
            <Link 
              href={`https://docs.google.com/forms/d/e/1FAIpQLSf4d4R-Zz-r110p-M9_W5e6uYgGfQe2L5Hw-N3W_0g00/viewform?usp=pp_url&entry.123456=${decodedTag}`}
              target="_blank"
              className="btn btn-primary"
              style={{ fontSize: "0.9rem", padding: "10px 24px" }}
            >
              ⚡ &apos;{decodedTag}&apos; 서식 무료 제작 신청하기
            </Link>
          </div>
        )}
      </div>

      {/* 4. 하단 광고 배너 */}
      <AdSpace format="horizontal" style={{ width: "100%", marginTop: "32px" }} />
    </div>
  );
}
