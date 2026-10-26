import React from "react";
import Link from "next/link";
import { getAllTemplateSummariesServer, TemplateSummary } from "@/lib/formSummaries";
import FormCatalogClient from "./FormCatalogClient";

export const revalidate = 3600;

const DIRECTORY_GROUPS: { key: string; label: string }[] = [
  { key: "노무", label: "📋 인사 · 노무 표준 서식" },
  { key: "행정", label: "📂 기획 · 총무 · 행정 서식" },
  { key: "재무", label: "💰 세무 · 회계 · 경리 서식" },
  { key: "계약", label: "🤝 계약 · 영업 · 구매 서식" },
  { key: "법률", label: "⚖️ 법률 · 민사 · 채권 서식" },
  { key: "정부", label: "🏛️ 정부 · 공공 민원 서식" },
];

export default async function DocsPage() {
  const summaries = await getAllTemplateSummariesServer();

  const grouped = new Map<string, TemplateSummary[]>();
  for (const group of DIRECTORY_GROUPS) {
    grouped.set(group.key, []);
  }
  for (const item of summaries) {
    const bucket = grouped.get(item.category) || grouped.get("행정")!;
    bucket.push(item);
  }

  return (
    <>
      <FormCatalogClient initialSummaries={summaries} />

      {/* 검색엔진 크롤러 및 사용자를 위한 전체 무료 서식 표준 <a href> 디렉토리 */}
      <section
        id="all-forms-directory"
        aria-label="카테고리별 전체 무료 서식 디렉토리"
        className="container no-print"
        style={{ padding: "0 24px 64px 24px" }}
      >
        <div
          style={{
            backgroundColor: "var(--bg-color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "20px",
            padding: "32px 28px",
          }}
        >
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                color: "var(--color-text-main)",
                margin: "0 0 6px 0",
              }}
            >
              📚 분야별 전체 무료 서식 디렉토리 ({summaries.length}종)
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", margin: 0 }}>
              원하시는 문서 양식을 클릭하면 회원가입 없이 즉시 작성 및 A4 PDF 인쇄 페이지로 이동합니다.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {DIRECTORY_GROUPS.map((group) => {
              const items = grouped.get(group.key) || [];
              if (items.length === 0) return null;
              return (
                <div
                  key={group.key}
                  style={{
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "18px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      color: "var(--color-text-main)",
                      margin: "0 0 10px 0",
                    }}
                  >
                    {group.label}{" "}
                    <span style={{ fontSize: "0.8rem", color: "var(--color-primary)", fontWeight: 700 }}>
                      ({items.length})
                    </span>
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
                    {items.map((tpl) => (
                      <Link
                        key={tpl.id}
                        href={`/form/${tpl.id}`}
                        prefetch={false}
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--color-text-sub)",
                          textDecoration: "none",
                          lineHeight: 1.7,
                        }}
                      >
                        {tpl.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
