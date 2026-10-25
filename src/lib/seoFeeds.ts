import { TEMPLATES } from "@/app/form/templatesData";
import { query } from "@/lib/db";
import { matchesTagRule } from "@/lib/tagRules";

export const SITE_URL = "https://www.maumdata.com";

/**
 * 1969-12-31 / 1970-01-01 Epoch 오염 타임스탬프를 원천 차단하기 위한 최소 유효 기준일
 */
const MIN_VALID_TIMESTAMP_MS = Date.UTC(2020, 0, 1, 0, 0, 0);

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

export interface RssFeedItem {
  title: string;
  link: string;
  guid: string;
  description: string;
  category: string;
  pubDate: Date;
}

/**
 * XML 1.0 비허용 제어문자 제거 및 표준 특수문자 이스케이프
 */
export function escapeXml(value: string): string {
  return String(value || "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * 실제 DB/Git에 기록된 유효 시각만 파싱하며,
 * 1970년 Epoch 오염값·잘못된 문자열·미래 오염값은 즉시 undefined 처리합니다.
 * (렌더링 시점 new Date() 폴백 절대 금지)
 */
export function parseValidDate(raw: unknown): Date | undefined {
  if (!raw) return undefined;

  let parsed: Date | undefined;

  if (raw instanceof Date) {
    parsed = raw;
  } else if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;

    if (/^\d{8}$/.test(trimmed)) {
      const y = Number(trimmed.slice(0, 4));
      const m = Number(trimmed.slice(4, 6)) - 1;
      const d = Number(trimmed.slice(6, 8));
      parsed = new Date(Date.UTC(y, m, d));
    } else if (/^\d{6}$/.test(trimmed)) {
      const y = Number(trimmed.slice(0, 4));
      const m = Number(trimmed.slice(4, 6)) - 1;
      parsed = new Date(Date.UTC(y, m, 1));
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      parsed = new Date(`${trimmed}T00:00:00.000Z`);
    } else {
      parsed = new Date(trimmed);
    }
  } else {
    return undefined;
  }

  const ms = parsed.getTime();
  if (Number.isNaN(ms)) return undefined;
  if (ms < MIN_VALID_TIMESTAMP_MS) return undefined;
  // KST 날짜 문자열('YYYY-MM-DD')의 UTC 시차를 감안해 현재 시각 + 48시간 초과 미래값 차단
  if (ms > Date.now() + 48 * 60 * 60 * 1000) return undefined;

  return parsed;
}

/**
 * W3C Datetime(ISO 8601) 포맷 변환 (유효 시각이 없으면 undefined 반환)
 */
export function toW3CDate(raw: unknown): string | undefined {
  const valid = parseValidDate(raw);
  return valid ? valid.toISOString() : undefined;
}

/**
 * RSS 2.0 표준 RFC 822(1123) 날짜 포맷 변환
 */
export function toRfc822Date(date: Date): string {
  return date.toUTCString();
}

/**
 * 상권 분석 허브(src/app/stats/market-area/page.tsx)에 공식 수록된 전국 20대 핵심 행정동 코드
 */
const MARKET_AREA_DONG_CODES = [
  "1168064000", // 서울 강남구 역삼1동
  "1168065000", // 서울 강남구 역삼2동
  "1159062000", // 서울 동작구 사당1동
  "1111061500", // 서울 종로구 종로1.2.3.4가동
  "4113565500", // 경기 성남시 분당구 삼평동
  "2820051000", // 인천 남동구 구월1동
  "5111066000", // 강원 춘천시 퇴계동
  "3017064000", // 대전 서구 둔산2동
  "3611056000", // 세종특별자치시 보람동
  "4413356600", // 충남 천안시 서북구 불당1동
  "4311154500", // 충북 청주시 상당구 성안동
  "2635051000", // 부산 해운대구 우1동
  "2726051000", // 대구 수성구 범어1동
  "4812353000", // 경남 창원시 성산구 상남동
  "3114057000", // 울산 남구 삼산동
  "4711157000", // 경북 포항시 남구 제철동
  "1224074500", // 광주 서구 치평동
  "5211173000", // 전북 전주시 완산구 효자5동
  "1213080000", // 전남 여수시 여천동
  "5011066000", // 제주 제주시 노형동
];

/**
 * 무료 서식 센터(FormCatalogClient.tsx)의 슬래시 없는 정규화 소분류 태그 목록
 */
const CANONICAL_FORM_TAGS = [
  // 노무
  "근로계약서",
  "사직서",
  "휴가신청서",
  "이력서",
  "인사",
  // 행정
  "기안서",
  "품의서",
  "회의록",
  "경위서",
  "사무일반",
  // 재무
  "지출결의서",
  "경리",
  "회계",
  "세무",
  // 계약
  "견적서",
  "발주서",
  "구매",
  "영업",
  "거래일반",
  // 법률
  "차용증",
  "내용증명",
  "채권",
  "민사",
  "법률일반",
  // 정부
  "주민등록",
  "가족관계",
  "사업자등록",
  "납세증명서",
  "정부서식일반",
];

/**
 * Sitemap Index(/sitemap.xml)용 하위 사이트맵 목록 및 각 섹션별 실제 최신 수정일 조회
 */
export async function getSitemapIndexEntries(): Promise<SitemapEntry[]> {
  let coreLastmod: string | undefined;
  let formsLastmod: string | undefined;
  let companiesLastmod: string | undefined;

  try {
    const res = await query(`
      WITH fin AS (
        SELECT DISTINCT b_no FROM business_history WHERE revenue > 0
      ),
      disc AS (
        SELECT DISTINCT b_no FROM business_disclosures
      )
      SELECT
        (SELECT MAX(created_at) FROM document_templates WHERE created_at >= '2020-01-01'::timestamptz) AS max_tpl_dt,
        (
          SELECT MAX(
            GREATEST(
              CASE WHEN b.nts_last_sync_at >= '2020-01-01'::timestamptz THEN b.nts_last_sync_at ELSE NULL END,
              CASE WHEN b.nps_last_sync_at >= '2020-01-01'::timestamptz THEN b.nps_last_sync_at ELSE NULL END,
              CASE WHEN b.dart_last_sync_at >= '2020-01-01'::timestamptz THEN b.dart_last_sync_at ELSE NULL END
            )
          )
          FROM businesses b
          LEFT JOIN fin ON b.b_no = fin.b_no
          LEFT JOIN disc ON b.b_no = disc.b_no
          WHERE b.b_stt_cd = '01'
            AND b.b_nm IS NOT NULL
            AND b.b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
            AND (
              COALESCE(b.nps_sbscrb_nmps, 0) > 0
              OR b.listing_status IN ('유가', '코스닥', '코넥스', '상장')
              OR fin.b_no IS NOT NULL
              OR disc.b_no IS NOT NULL
            )
        ) AS max_biz_dt
    `);

    const row = res.rows[0];
    if (row) {
      formsLastmod = toW3CDate(row.max_tpl_dt);
      companiesLastmod = toW3CDate(row.max_biz_dt);
      coreLastmod = companiesLastmod || formsLastmod;
    }
  } catch (err) {
    console.error("[seoFeeds] Failed to query sitemap index timestamps:", err);
  }

  return [
    { loc: `${SITE_URL}/sitemap/core.xml`, lastmod: coreLastmod },
    { loc: `${SITE_URL}/sitemap/forms.xml`, lastmod: formsLastmod },
    { loc: `${SITE_URL}/sitemap/companies.xml`, lastmod: companiesLastmod },
  ];
}

/**
 * 1) /sitemap/core.xml: 핵심 서비스 허브, 전자계약 보관함, 통계/인사이트, 전국 20대 상권 행정동 리포트
 */
export async function getCoreSitemapEntries(): Promise<SitemapEntry[]> {
  let statsLastmod: string | undefined;
  let formsLastmod: string | undefined;

  try {
    const res = await query(`
      SELECT
        (
          SELECT MAX(
            GREATEST(
              CASE WHEN nts_last_sync_at >= '2020-01-01'::timestamptz THEN nts_last_sync_at ELSE NULL END,
              CASE WHEN nps_last_sync_at >= '2020-01-01'::timestamptz THEN nps_last_sync_at ELSE NULL END,
              CASE WHEN dart_last_sync_at >= '2020-01-01'::timestamptz THEN dart_last_sync_at ELSE NULL END
            )
          )
          FROM businesses
          WHERE b_stt_cd = '01'
        ) AS max_biz_sync_dt,
        (SELECT MAX(created_at) FROM document_templates WHERE created_at >= '2020-01-01'::timestamptz) AS max_tpl_dt
    `);
    const row = res.rows[0];
    if (row) {
      statsLastmod = toW3CDate(row.max_biz_sync_dt);
      formsLastmod = toW3CDate(row.max_tpl_dt);
    }
  } catch (err) {
    console.error("[seoFeeds] Failed to query core sitemap timestamps:", err);
  }

  const entries: SitemapEntry[] = [
    { loc: `${SITE_URL}/` },
    { loc: `${SITE_URL}/contracts` },
    { loc: `${SITE_URL}/form`, lastmod: formsLastmod },
    { loc: `${SITE_URL}/insights`, lastmod: statsLastmod },
    { loc: `${SITE_URL}/stats/market-area` },
    { loc: `${SITE_URL}/stats/distribution`, lastmod: statsLastmod },
    { loc: `${SITE_URL}/stats/new-biz`, lastmod: statsLastmod },
    { loc: `${SITE_URL}/stats/active-rate`, lastmod: statsLastmod },
    { loc: `${SITE_URL}/terms` },
    { loc: `${SITE_URL}/privacy` },
  ];

  for (const dongCd of MARKET_AREA_DONG_CODES) {
    entries.push({
      loc: `${SITE_URL}/stats/market-area/${dongCd}`,
    });
  }

  return entries;
}

/**
 * 2) /sitemap/forms.xml: 로컬+DB 고유 서식 전체(316종) + 실제 서식이 1건 이상 존재하는 정규화 태그 허브
 */
export async function getFormsSitemapEntries(): Promise<SitemapEntry[]> {
  interface MergedTpl {
    id: string;
    title: string;
    category: string;
    desc: string;
    tags: string[];
    createdAt?: Date;
  }

  const merged = new Map<string, MergedTpl>();

  for (const tpl of TEMPLATES) {
    merged.set(tpl.id, {
      id: tpl.id,
      title: tpl.title,
      category: tpl.category,
      desc: tpl.desc,
      tags: Array.isArray(tpl.tags) ? tpl.tags : [],
    });
  }

  try {
    const res = await query(`
      SELECT id, title, category, description AS desc, tags, created_at
      FROM document_templates
      ORDER BY popular DESC, id ASC
    `);
    for (const row of res.rows) {
      const validCreated = parseValidDate(row.created_at);
      const existing = merged.get(row.id);
      if (existing) {
        if (!existing.createdAt && validCreated) {
          existing.createdAt = validCreated;
        }
      } else if (row.id) {
        merged.set(row.id, {
          id: row.id,
          title: row.title || "",
          category: row.category || "행정",
          desc: row.desc || "",
          tags: Array.isArray(row.tags) ? row.tags : [],
          createdAt: validCreated,
        });
      }
    }
  } catch (err) {
    console.error("[seoFeeds] Failed to query document_templates for sitemap:", err);
  }

  const allTemplates = Array.from(merged.values());
  const entries: SitemapEntry[] = [];

  // 개별 서식 상세 페이지
  for (const tpl of allTemplates) {
    entries.push({
      loc: `${SITE_URL}/form/${encodeURIComponent(tpl.id)}`,
      lastmod: tpl.createdAt ? tpl.createdAt.toISOString() : undefined,
    });
  }

  // 소분류 태그 허브 (실제 매칭 서식이 1건 이상 존재하는 태그만 수록)
  for (const tag of CANONICAL_FORM_TAGS) {
    const matched = allTemplates.filter((tpl) => matchesTagRule(tpl, tag));
    if (matched.length === 0) continue;

    let latestTagMs = 0;
    for (const m of matched) {
      if (m.createdAt && m.createdAt.getTime() > latestTagMs) {
        latestTagMs = m.createdAt.getTime();
      }
    }

    entries.push({
      loc: `${SITE_URL}/form/tag/${encodeURIComponent(tag)}`,
      lastmod: latestTagMs > 0 ? new Date(latestTagMs).toISOString() : undefined,
    });
  }

  return entries;
}

/**
 * 3) /sitemap/companies.xml: 실데이터(국민연금 가입자 > 0, 매출 재무제표, DART 공시, 상장 여부)가
 * 검증된 계속사업자 Tier 1 알짜 기업(~4,909개)만 엄선하여 수록
 */
export async function getTier1CompanySitemapEntries(): Promise<SitemapEntry[]> {
  try {
    const res = await query(`
      WITH fin AS (
        SELECT DISTINCT b_no FROM business_history WHERE revenue > 0
      ),
      disc AS (
        SELECT DISTINCT b_no FROM business_disclosures
      )
      SELECT
        b.b_no,
        GREATEST(
          CASE WHEN b.nts_last_sync_at >= '2020-01-01'::timestamptz THEN b.nts_last_sync_at ELSE NULL END,
          CASE WHEN b.nps_last_sync_at >= '2020-01-01'::timestamptz THEN b.nps_last_sync_at ELSE NULL END,
          CASE WHEN b.dart_last_sync_at >= '2020-01-01'::timestamptz THEN b.dart_last_sync_at ELSE NULL END
        ) AS last_sync_at
      FROM businesses b
      LEFT JOIN fin ON b.b_no = fin.b_no
      LEFT JOIN disc ON b.b_no = disc.b_no
      WHERE b.b_stt_cd = '01'
        AND b.b_nm IS NOT NULL
        AND b.b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        AND (
          COALESCE(b.nps_sbscrb_nmps, 0) > 0
          OR b.listing_status IN ('유가', '코스닥', '코넥스', '상장')
          OR fin.b_no IS NOT NULL
          OR disc.b_no IS NOT NULL
        )
      ORDER BY b.nps_sbscrb_nmps DESC NULLS LAST, b.b_no ASC
    `);

    const entries: SitemapEntry[] = [];
    for (const row of res.rows) {
      const cleanBNo = String(row.b_no || "").replace(/[^0-9]/g, "");
      if (cleanBNo.length !== 10) continue;

      entries.push({
        loc: `${SITE_URL}/biz/${cleanBNo}`,
        lastmod: toW3CDate(row.last_sync_at),
      });
    }
    return entries;
  } catch (err) {
    console.error("[seoFeeds] Failed to query Tier 1 companies for sitemap:", err);
    return [];
  }
}

/**
 * 4) /rss.xml: 신규 출시 기능(실제 Git 출시일 고정) + 최근 추가 DB 표준 서식 + 최근 실제 동기화된 알짜 기업 리포트
 */
export async function getRssFeedItems(): Promise<RssFeedItem[]> {
  const items: RssFeedItem[] = [
    {
      title: "[신규출시] 마음데이타 비대면 전자계약 및 클라우드 영구 계약 보관함 오픈",
      link: `${SITE_URL}/contracts`,
      guid: `${SITE_URL}/contracts#launch-2026-10-21`,
      description:
        "단일 보안 링크와 임시 비밀번호로 상대방과 즉시 비대면 전자서명을 체결하고 클라우드 영구 계약 보관함에서 안전하게 관리하세요.",
      category: "서비스출시",
      pubDate: new Date("2026-10-21T09:23:15+09:00"),
    },
    {
      title: "[업데이트] 마음데이타 무료 전자문서·표준서식 300+종 통합 센터 확장 오픈",
      link: `${SITE_URL}/form`,
      guid: `${SITE_URL}/form#update-2026-10-12`,
      description:
        "근로계약서, 사직서, 견적서, 발주서, 차용증, 내용증명 등 300여 종의 필수 기업·행정 표준 양식을 설치나 가입 없이 웹에서 즉시 작성하고 A4 PDF로 인쇄하세요.",
      category: "무료서식",
      pubDate: new Date("2026-10-12T16:39:04.344Z"),
    },
    {
      title: "[서비스안내] 전국 주요 행정동 실시간 상권 분석 및 점포 밀집도 리포트",
      link: `${SITE_URL}/stats/market-area`,
      guid: `${SITE_URL}/stats/market-area#launch-2026-06-11`,
      description:
        "서울 강남·판교·해운대·둔산·노형 등 전국 핵심 행정동 상권의 점포 분포와 업종별 밀집도를 지도 기반으로 분석합니다.",
      category: "상권분석",
      pubDate: new Date("2026-06-11T15:03:25+09:00"),
    },
    {
      title: "[서비스안내] 대한민국 기업 실데이터 인사이트 및 매출·고용 리더보드",
      link: `${SITE_URL}/insights`,
      guid: `${SITE_URL}/insights#launch-2026-06-11`,
      description:
        "국세청 납세상태 검증, 국민연금 가입 임직원 및 DART 재무제표를 실시간 SQL로 집계한 업종·지역별 분포와 상위 기업 리더보드를 확인하세요.",
      category: "데이터인사이트",
      pubDate: new Date("2026-06-11T15:03:25+09:00"),
    },
  ];

  // 최근 등록된 DB 서식 20건 (실제 유효 created_at 보유 항목만)
  try {
    const tplRes = await query(`
      SELECT id, title, category, description, created_at
      FROM document_templates
      WHERE created_at >= '2020-01-01'::timestamptz
      ORDER BY created_at DESC, id ASC
      LIMIT 20
    `);

    for (const row of tplRes.rows) {
      const pubDate = parseValidDate(row.created_at);
      if (!pubDate || !row.id || !row.title) continue;
      const url = `${SITE_URL}/form/${encodeURIComponent(row.id)}`;
      items.push({
        title: `[무료서식] ${row.title} 표준 양식 무료 작성 및 PDF 인쇄`,
        link: url,
        guid: url,
        description:
          row.description ||
          `${row.title} 표준 서식을 웹에서 바로 기입하고 A4 PDF 출력 및 전자서명을 진행할 수 있습니다.`,
        category: `무료서식/${row.category || "행정"}`,
        pubDate,
      });
    }
  } catch (err) {
    console.error("[seoFeeds] Failed to query recent templates for RSS:", err);
  }

  // 최근 실제 공공데이터 동기화가 수행된 Tier 1 알짜 기업 25건
  try {
    const bizRes = await query(`
      WITH fin AS (
        SELECT DISTINCT b_no FROM business_history WHERE revenue > 0
      ),
      disc AS (
        SELECT DISTINCT b_no FROM business_disclosures
      ),
      ranked AS (
        SELECT
          b.b_no,
          b.b_nm,
          b.b_sector,
          b.b_adr,
          b.nps_sbscrb_nmps,
          GREATEST(
            CASE WHEN b.nts_last_sync_at >= '2020-01-01'::timestamptz THEN b.nts_last_sync_at ELSE NULL END,
            CASE WHEN b.nps_last_sync_at >= '2020-01-01'::timestamptz THEN b.nps_last_sync_at ELSE NULL END,
            CASE WHEN b.dart_last_sync_at >= '2020-01-01'::timestamptz THEN b.dart_last_sync_at ELSE NULL END
          ) AS last_sync_at
        FROM businesses b
        LEFT JOIN fin ON b.b_no = fin.b_no
        LEFT JOIN disc ON b.b_no = disc.b_no
        WHERE b.b_stt_cd = '01'
          AND b.b_nm IS NOT NULL
          AND b.b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
          AND (
            COALESCE(b.nps_sbscrb_nmps, 0) > 0
            OR b.listing_status IN ('유가', '코스닥', '코넥스', '상장')
            OR fin.b_no IS NOT NULL
            OR disc.b_no IS NOT NULL
          )
      )
      SELECT b_no, b_nm, b_sector, b_adr, nps_sbscrb_nmps, last_sync_at
      FROM ranked
      WHERE last_sync_at IS NOT NULL
      ORDER BY last_sync_at DESC, nps_sbscrb_nmps DESC NULLS LAST
      LIMIT 25
    `);

    for (const row of bizRes.rows) {
      const cleanBNo = String(row.b_no || "").replace(/[^0-9]/g, "");
      const pubDate = parseValidDate(row.last_sync_at);
      if (cleanBNo.length !== 10 || !pubDate || !row.b_nm) continue;

      const formattedBNo = cleanBNo.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3");
      const url = `${SITE_URL}/biz/${cleanBNo}`;
      const details: string[] = ["상태: 계속사업자"];
      if (row.b_sector && row.b_sector !== "-") details.push(`주업종: ${row.b_sector}`);
      if (Number(row.nps_sbscrb_nmps) > 0) {
        details.push(`국민연금 가입자: ${Number(row.nps_sbscrb_nmps).toLocaleString("ko-KR")}명`);
      }
      if (row.b_adr && row.b_adr !== "-") details.push(`소재지: ${row.b_adr}`);

      items.push({
        title: `[기업분석] ${row.b_nm} (${formattedBNo}) 실시간 사업자 상태 및 기업 리포트`,
        link: url,
        guid: url,
        description: `${row.b_nm}(사업자등록번호 ${formattedBNo}) 공공데이터 검증 분석 정보 — ${details.join(" | ")}`,
        category: "기업분석",
        pubDate,
      });
    }
  } catch (err) {
    console.error("[seoFeeds] Failed to query recent Tier 1 companies for RSS:", err);
  }

  items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  return items;
}

/**
 * Sitemap Index XML 직렬화
 */
export function buildSitemapIndexXml(entries: SitemapEntry[]): string {
  const body = entries
    .map((entry) => {
      const lastmodTag = entry.lastmod ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : "";
      return `  <sitemap>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmodTag}\n  </sitemap>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

/**
 * 하위 Sitemap Urlset XML 직렬화
 */
export function buildUrlsetXml(entries: SitemapEntry[]): string {
  const body = entries
    .map((entry) => {
      const lastmodTag = entry.lastmod ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : "";
      return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmodTag}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/**
 * 표준 RSS 2.0 XML 직렬화 (Naver 웹마스터 도구 & Google/RSS 리더 완벽 호환)
 */
export function buildRssXml(items: RssFeedItem[]): string {
  const latestPubDate = items.length > 0 ? toRfc822Date(items[0].pubDate) : undefined;
  const lastBuildTag = latestPubDate ? `\n    <lastBuildDate>${escapeXml(latestPubDate)}</lastBuildDate>` : "";

  const itemsXml = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="${item.guid === item.link ? "true" : "false"}">${escapeXml(item.guid)}</guid>
      <description>${escapeXml(item.description)}</description>
      <category>${escapeXml(item.category)}</category>
      <pubDate>${escapeXml(toRfc822Date(item.pubDate))}</pubDate>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>마음데이타 (MaumData) — 기업 분석 · 무료 서식 · 전자계약 업데이트</title>
    <link>${SITE_URL}</link>
    <description>국세청 실시간 사업자 상태 조회, 검증된 기업 재무·고용 분석 리포트, 300+종 무료 전자문서 양식 및 비대면 전자계약 서비스의 최신 소식을 전해드립니다.</description>
    <language>ko</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />${lastBuildTag}
${itemsXml}
  </channel>
</rss>
`;
}
