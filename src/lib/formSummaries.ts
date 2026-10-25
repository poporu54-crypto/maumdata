import { TEMPLATES } from "@/app/form/templatesData";
import { query } from "@/lib/db";
import { matchesTagRule } from "@/lib/tagRules";

export interface TemplateSummary {
  id: string;
  title: string;
  category: string;
  desc: string;
  popular: boolean;
  tags: string[];
  fieldLabels: string[];
  totalFields: number;
}

function summarizeFields(fields: any[] | undefined | null): {
  fieldLabels: string[];
  totalFields: number;
} {
  if (!Array.isArray(fields) || fields.length === 0) {
    return { fieldLabels: [], totalFields: 0 };
  }
  const nonList = fields.filter((f) => f && f.type !== "list" && typeof f.label === "string");
  return {
    fieldLabels: nonList.slice(0, 4).map((f) => f.label),
    totalFields: fields.length,
  };
}

/**
 * 서버 전용: 로컬(TEMPLATES) + DB(document_templates) 전체 서식을 병합한 뒤,
 * 무거운 본문 레이아웃(layout)과 초기값(initialValues)을 완전히 제거하고
 * 목록/태그 카드 렌더링에 필요한 최소 요약 데이터만 반환합니다.
 */
export async function getAllTemplateSummariesServer(): Promise<TemplateSummary[]> {
  const merged = new Map<string, TemplateSummary>();

  for (const tpl of TEMPLATES) {
    const { fieldLabels, totalFields } = summarizeFields(tpl.fields);
    merged.set(tpl.id, {
      id: tpl.id,
      title: tpl.title,
      category: tpl.category,
      desc: tpl.desc,
      popular: Boolean(tpl.popular),
      tags: Array.isArray(tpl.tags) ? tpl.tags : [],
      fieldLabels,
      totalFields,
    });
  }

  try {
    const res = await query(
      `SELECT id, title, category, description AS desc, popular, tags, fields
       FROM document_templates
       ORDER BY popular DESC, title ASC`
    );
    for (const row of res.rows) {
      if (!merged.has(row.id)) {
        const { fieldLabels, totalFields } = summarizeFields(row.fields);
        merged.set(row.id, {
          id: row.id,
          title: row.title || "",
          category: row.category || "행정",
          desc: row.desc || "",
          popular: Boolean(row.popular),
          tags: Array.isArray(row.tags) ? row.tags : [],
          fieldLabels,
          totalFields,
        });
      }
    }
  } catch (err) {
    console.error("[formSummaries] Failed to load DB template summaries:", err);
  }

  return Array.from(merged.values());
}

/**
 * 서버 전용: 특정 태그에 부합하는 경량 서식 요약 목록 반환
 */
export async function getTagTemplateSummariesServer(tag: string): Promise<TemplateSummary[]> {
  const all = await getAllTemplateSummariesServer();
  return all.filter((tpl) => matchesTagRule(tpl, tag));
}

/**
 * 서버 전용: 서식 상세 하단 내부 링크용 동일 카테고리 추천 서식 조회 (초경량 쿼리)
 */
export async function getRelatedTemplateSummariesServer(
  category: string,
  excludeId: string,
  limit: number = 8
): Promise<Pick<TemplateSummary, "id" | "title" | "category" | "desc" | "popular">[]> {
  const merged = new Map<string, Pick<TemplateSummary, "id" | "title" | "category" | "desc" | "popular">>();

  for (const tpl of TEMPLATES) {
    if (tpl.id !== excludeId && tpl.category === category) {
      merged.set(tpl.id, {
        id: tpl.id,
        title: tpl.title,
        category: tpl.category,
        desc: tpl.desc,
        popular: Boolean(tpl.popular),
      });
    }
  }

  try {
    const res = await query(
      `SELECT id, title, category, description AS desc, popular
       FROM document_templates
       WHERE category = $1 AND id != $2
       ORDER BY popular DESC, title ASC
       LIMIT $3`,
      [category, excludeId, limit]
    );
    for (const row of res.rows) {
      if (!merged.has(row.id)) {
        merged.set(row.id, {
          id: row.id,
          title: row.title || "",
          category: row.category || category,
          desc: row.desc || "",
          popular: Boolean(row.popular),
        });
      }
    }
  } catch (err) {
    console.error("[formSummaries] Failed to load related template summaries:", err);
  }

  return Array.from(merged.values()).slice(0, limit);
}
