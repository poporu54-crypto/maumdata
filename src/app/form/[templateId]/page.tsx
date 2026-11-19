import { cache } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplateByIdFromDB } from "@/lib/db";
import { getRelatedTemplateSummariesServer } from "@/lib/formSummaries";
import { getTemplateById } from "../templatesData";
import DocumentEditor from "./DocumentEditor";
import JsonLd from "@/components/JsonLd";
import { buildFormDetailJsonLd } from "@/lib/structuredData";
import { resolveFormPracticalGuide } from "@/lib/formGuides";

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

const loadTemplateCached = cache(async (templateId: string) => {
  return getTemplateById(templateId) || (await getTemplateByIdFromDB(templateId));
});

interface PageProps {
  params: Promise<{ templateId: string }>;
}

const CATEGORY_QUICK_TAGS: Record<string, string[]> = {
  노무: ["근로계약서", "사직서", "휴가신청서", "이력서", "인사"],
  행정: ["기안서", "품의서", "회의록", "경위서", "사무일반"],
  재무: ["지출결의서", "경리", "회계", "세무"],
  계약: ["견적서", "발주서", "구매", "영업", "거래일반"],
  법률: ["차용증", "내용증명", "채권", "민사", "법률일반"],
  정부: ["주민등록", "가족관계", "사업자등록", "납세증명서", "정부서식일반"],
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { templateId } = await props.params;
  const tpl = await loadTemplateCached(templateId);
  const canonicalPath = `/form/${templateId}`;

  if (!tpl) {
    return {
      title: "서식을 찾을 수 없습니다",
      description: "요청하신 무료 문서 서식 양식을 찾을 수 없거나 삭제되었습니다.",
      robots: {
        index: false,
        follow: false,
      },
      alternates: {
        canonical: canonicalPath,
      },
    };
  }

  return {
    // form/layout.tsx의 "%s | 마음데이타 FORM" 템플릿과 결합되어 중복 없이 1회만 출력됨
    title: `무료 ${tpl.title} 양식 (즉시 작성/인쇄)`,
    description:
      tpl.desc ||
      `${tpl.title} 서식의 필수 항목들을 회원가입 없이 실시간으로 작성하고, 최적화된 A4 비율의 PDF로 저장 및 즉시 인쇄해보세요.`,
    keywords: [...(tpl.tags || []), tpl.title, "무료서식", "A4인쇄", "마음데이타"],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `무료 ${tpl.title} 양식 (즉시 작성/인쇄) | 마음데이타 FORM`,
      description:
        tpl.desc || `${tpl.title} 서식을 웹에서 타이핑하여 즉시 PDF로 저장하고 A4 인쇄하세요.`,
      url: `https://www.maumdata.com${canonicalPath}`,
      type: "website",
    },
  };
}

export default async function Page(props: PageProps) {
  const { templateId } = await props.params;
  const tpl = await loadTemplateCached(templateId);

  if (!tpl) {
    notFound();
  }

  const category = tpl.category || "행정";
  const relatedForms = await getRelatedTemplateSummariesServer(category, templateId, 8);
  const categoryTags = CATEGORY_QUICK_TAGS[category] || CATEGORY_QUICK_TAGS["행정"];
  const practicalGuide = resolveFormPracticalGuide({
    templateId,
    title: tpl.title,
    category,
  });

  const jsonLd = buildFormDetailJsonLd({
    templateId,
    title: tpl.title,
    desc: tpl.desc,
    category,
    tags: tpl.tags,
    faqs: practicalGuide.faqs,
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <DocumentEditor templateId={templateId} initialTemplate={tpl} />

      {/* A4 인쇄 시 제외(.no-print)되는 서식 실무 체크포인트 · FAQ · 마음계산기 시너지 가이드 */}
      <section
        aria-label={`${tpl.title} 실무 작성 체크포인트 및 자주 묻는 질문`}
        className="container no-print"
        style={{ padding: "0 24px 28px 24px" }}
      >
        <div
          style={{
            backgroundColor: "var(--bg-color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "20px",
            padding: "28px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* 1. 실무 작성 필수 체크포인트 */}
          <div>
            <span
              style={{
                display: "inline-block",
                fontSize: "0.74rem",
                fontWeight: 800,
                color: "var(--color-primary)",
                backgroundColor: "var(--color-primary-light)",
                padding: "4px 10px",
                borderRadius: "999px",
                marginBottom: "8px",
              }}
            >
              ✅ {practicalGuide.badge}
            </span>
            <h2
              style={{
                fontSize: "1.18rem",
                fontWeight: 850,
                color: "var(--color-text-main)",
                margin: "0 0 14px 0",
                wordBreak: "keep-all",
              }}
            >
              {practicalGuide.heading}
            </h2>
            <ul
              style={{
                margin: 0,
                paddingLeft: "18px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "0.88rem",
                color: "var(--color-text-sub)",
                lineHeight: 1.65,
              }}
            >
              {practicalGuide.checkpoints.map((cp, idx) => (
                <li key={idx} style={{ wordBreak: "keep-all" }}>
                  {cp}
                </li>
              ))}
            </ul>
          </div>

          {/* 2. 함께 쓰면 바로 해결되는 연관 계산기 · 검증도구 (마음계산기 & 마음데이타) */}
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "20px" }}>
            <h3
              style={{
                fontSize: "0.98rem",
                fontWeight: 800,
                color: "var(--color-text-main)",
                margin: "0 0 12px 0",
              }}
            >
              🧮 {tpl.title} 작성할 때 함께 많이 쓰는 무료 계산기 · 검증 도구
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "10px",
              }}
            >
              {practicalGuide.synergyTools.map((tool) =>
                tool.external ? (
                  <a
                    key={tool.href}
                    href={tool.href}
                    target="_blank"
                    rel="noopener"
                    className="related-card"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      padding: "14px 16px",
                      borderRadius: "14px",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--bg-color-main)",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <strong style={{ fontSize: "0.88rem", color: "var(--color-primary)" }}>
                      {tool.emoji} {tool.label} ↗
                    </strong>
                    <span style={{ fontSize: "0.77rem", color: "var(--color-text-desc)", lineHeight: 1.45 }}>
                      {tool.desc}
                    </span>
                  </a>
                ) : (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    prefetch={false}
                    className="related-card"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      padding: "14px 16px",
                      borderRadius: "14px",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--bg-color-main)",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <strong style={{ fontSize: "0.88rem", color: "var(--color-text-main)" }}>
                      {tool.emoji} {tool.label} ➔
                    </strong>
                    <span style={{ fontSize: "0.77rem", color: "var(--color-text-desc)", lineHeight: 1.45 }}>
                      {tool.desc}
                    </span>
                  </Link>
                )
              )}
            </div>
          </div>

          {/* 3. 실전 FAQ (FAQPage JSON-LD와 100% 일치) */}
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "20px" }}>
            <h3
              style={{
                fontSize: "0.98rem",
                fontWeight: 800,
                color: "var(--color-text-main)",
                margin: "0 0 12px 0",
              }}
            >
              ❓ {tpl.title} 자주 묻는 질문 (FAQ)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {practicalGuide.faqs.map((faq, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "12px",
                    backgroundColor: "var(--bg-color-main)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.89rem",
                      fontWeight: 800,
                      color: "var(--color-text-main)",
                      marginBottom: "6px",
                      wordBreak: "keep-all",
                    }}
                  >
                    Q. {faq.q}
                  </div>
                  <p
                    style={{
                      fontSize: "0.84rem",
                      color: "var(--color-text-sub)",
                      lineHeight: 1.6,
                      margin: 0,
                      wordBreak: "keep-all",
                    }}
                  >
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* A4 인쇄 시 제외(.no-print)되는 검색엔진·사용자용 연관 서식 표준 <a href> 내부 링크 섹션 */}
      <section
        aria-label="연관 추천 서식 및 카테고리 바로가기"
        className="container no-print"
        style={{ padding: "0 24px 72px 24px" }}
      >
        <div
          style={{
            backgroundColor: "var(--bg-color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "20px",
            padding: "28px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  color: "var(--color-text-main)",
                  margin: "0 0 4px 0",
                }}
              >
                🔗 함께 많이 찾는 {category} 연관 표준 서식
              </h2>
              <p style={{ fontSize: "0.84rem", color: "var(--color-text-desc)", margin: 0 }}>
                회원가입 없이 웹에서 바로 작성하고 깔끔한 A4 PDF로 저장할 수 있는 연관 양식입니다.
              </p>
            </div>
            <Link
              href="/form"
              prefetch={false}
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--color-primary)",
                textDecoration: "none",
              }}
            >
              전체 300+종 무료 서식 보기 ➔
            </Link>
          </div>

          {relatedForms.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              {relatedForms.map((item) => (
                <Link
                  key={item.id}
                  href={`/form/${item.id}`}
                  prefetch={false}
                  className="related-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--bg-color-main)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
                    <strong style={{ fontSize: "0.92rem", color: "var(--color-text-main)" }}>
                      {item.title}
                    </strong>
                    {item.popular && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          color: "var(--color-primary)",
                          backgroundColor: "var(--color-primary-light)",
                          padding: "2px 6px",
                          borderRadius: "6px",
                          flexShrink: 0,
                        }}
                      >
                        인기
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--color-text-desc)",
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.desc}
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "8px",
              borderTop: "1px solid var(--color-border)",
              paddingTop: "16px",
            }}
          >
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-desc)" }}>
              관련 분야 태그:
            </span>
            {categoryTags.map((tag) => (
              <Link
                key={tag}
                href={`/form/tag/${encodeURIComponent(tag)}`}
                prefetch={false}
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--color-text-sub)",
                  backgroundColor: "var(--bg-color-main)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "20px",
                  padding: "4px 12px",
                  textDecoration: "none",
                }}
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
