import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { getTagTemplateSummariesServer } from "@/lib/formSummaries";
import AdSpace from "@/components/AdSpace";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata(props: TagPageProps): Promise<Metadata> {
  const { tag } = await props.params;
  const decodedTag = decodeURIComponent(tag);
  const canonicalPath = `/form/tag/${encodeURIComponent(decodedTag)}`;
  const matched = await getTagTemplateSummariesServer(decodedTag);

  return {
    title: `무료 ${decodedTag} 서식 양식 모음`,
    description: `${decodedTag} 관련 추천 표준 문서 양식들을 모았습니다. 회원가입이나 설치 없이 웹에서 바로 내용을 기입하고 깔끔한 A4 PDF로 다운로드 및 즉시 인쇄를 진행해보세요.`,
    keywords: [decodedTag, `${decodedTag} 양식`, `${decodedTag} 서식`, "무료서식", "마음데이타"],
    alternates: {
      canonical: canonicalPath,
    },
    ...(matched.length === 0
      ? {
          robots: {
            index: false,
            follow: true,
          },
        }
      : {}),
    openGraph: {
      title: `무료 ${decodedTag} 서식 양식 모음 | 마음데이타 FORM`,
      description: `${decodedTag} 관련 행정/법률/노무 서식을 웹에서 직접 작성하고 출력해보세요.`,
      url: `https://www.maumdata.com${canonicalPath}`,
      type: "website",
    },
  };
}

export default async function TagPage(props: TagPageProps) {
  const { tag } = await props.params;
  const decodedTag = decodeURIComponent(tag);
  const matchedTemplates = await getTagTemplateSummariesServer(decodedTag);

  return (
    <div className="container animate-fade-in" style={{ padding: "40px 24px" }}>
      <AdSpace format="horizontal" style={{ width: "100%", margin: "0 auto 32px auto" }} />

      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <Link
          href="/form"
          prefetch={false}
          style={{
            color: "var(--color-primary)",
            fontWeight: 700,
            fontSize: "0.9rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            marginBottom: "16px",
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

      <div style={{ marginBottom: "56px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
            📄 서식 검색 결과 ({matchedTemplates.length}개)
          </h2>
        </div>

        {matchedTemplates.length > 0 ? (
          <div className="docs-grid">
            {matchedTemplates.map((tpl, idx) => {
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

                  <Link href={`/form/${tpl.id}`} prefetch={false} style={{ textDecoration: "none", color: "inherit" }}>
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

                      <div className="doc-card-title" style={{ fontSize: "1.1rem" }}>
                        {tpl.title}
                      </div>
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
                          </div>
                        </div>
                      )}

                      <div
                        className="btn btn-outline"
                        style={{
                          width: "100%",
                          textAlign: "center",
                          padding: "10px",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          borderRadius: "10px",
                          marginTop: "auto",
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
              border: "1.5px dashed var(--color-border)",
            }}
          >
            <p style={{ color: "var(--color-text-sub)", fontSize: "1rem", marginBottom: "16px" }}>
              현재 &apos;{decodedTag}&apos; 관련 등록된 서식이 없거나 제작 중입니다.
            </p>
            <Link href="/form" prefetch={false} className="btn btn-primary" style={{ fontSize: "0.9rem", padding: "10px 24px" }}>
              ← 전체 무료 서식 센터에서 검색하기
            </Link>
          </div>
        )}
      </div>

      <AdSpace format="horizontal" style={{ width: "100%", marginTop: "32px" }} />
    </div>
  );
}
