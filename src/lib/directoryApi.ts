import { cache } from "react";
import { query } from "@/lib/db";
import {
  RANKING_HUBS,
  REGION_HUBS,
  INDUSTRY_HUBS,
  getHubMeta,
  estimateAnnualSalaryManwon,
  type DirectoryHubKind,
  type AnyHubMeta,
} from "@/lib/directoryConfig";
import { extractShortRegion, sanitizeSectorLabel } from "@/lib/statFormatters";

export interface DirectoryCompanyItem {
  rank: number;
  bNo: string;
  name: string;
  representative: string;
  sector: string;
  shortRegion: string;
  address: string;
  startDt: string;
  marketBoard: "KOSPI" | "KOSDAQ" | null;
  employees: number;
  newHires: number;
  losses: number;
  estimatedSalaryManwon: number | null;
  estimatedSalaryLabel: string | null;
  salaryCapped: boolean;
  finYear: number | null;
  revenueEok: number | null;
  operatingIncomeEok: number | null;
  operatingMarginPct: number | null;
}

export interface DirectoryHubSummaryStats {
  totalMatchedCount: number;
  displayedCount: number;
  totalEmployees: number;
  totalNewHires: number;
  avgSalaryManwon: number | null;
  totalRevenueEok: number;
  kospiCount: number;
  kosdaqCount: number;
  updatedAt: string;
}

export interface DirectoryHubDetailPayload {
  kind: DirectoryHubKind;
  slug: string;
  meta: AnyHubMeta;
  stats: DirectoryHubSummaryStats;
  companies: DirectoryCompanyItem[];
}

export interface DirectoryHubCardPreview {
  kind: DirectoryHubKind;
  slug: string;
  title: string;
  shortTitle: string;
  emoji: string;
  subtitle: string;
  badgeOrArea?: string;
  companyCount: number;
  totalEmployees: number;
  avgSalaryManwon: number | null;
  sampleCompanies: Array<{
    bNo: string;
    name: string;
    metricText: string;
  }>;
}

export interface DirectoryOverviewPayload {
  globalSummary: {
    activeVerifiedCount: number;
    listedTotalCount: number;
    kospiCount: number;
    kosdaqCount: number;
    totalTrackedEmployees: number;
    financialVerifiedCount: number;
    updatedAt: string;
  };
  rankingHubs: DirectoryHubCardPreview[];
  regionHubs: DirectoryHubCardPreview[];
  industryHubs: DirectoryHubCardPreview[];
}

const OVERVIEW_SETTINGS_KEY = "directory_overview_v1";
const HUB_SETTINGS_PREFIX = "directory_hub_v1";
const MEMORY_TTL_MS = 5 * 60 * 1000; // 5분 프로세스 메모리 캐시
const SNAPSHOT_STALE_MS = 6 * 60 * 60 * 1000; // 6시간 경과 시 백그라운드 SWR 비블로킹 갱신

let memOverview: { data: DirectoryOverviewPayload; expiresAt: number } | null = null;
let overviewRefreshInFlight = false;

const memHubMap = new Map<string, { data: DirectoryHubDetailPayload; expiresAt: number }>();
const hubRefreshInFlight = new Set<string>();

function mapRowToDirectoryCompany(row: any, idx: number): DirectoryCompanyItem {
  const employees = Number(row.nps_sbscrb_nmps || 0);
  const newHires = Number(row.new_acqs_nmps || 0);
  const losses = Number(row.loss_sbscrb_nmps || 0);
  const chrgAmt = Number(row.nps_chrg_amt || 0);
  const sal = estimateAnnualSalaryManwon(chrgAmt, employees);

  const finYear = row.latest_fin_year ? Number(row.latest_fin_year) : null;
  const revRaw = row.latest_revenue !== null && row.latest_revenue !== undefined ? Number(row.latest_revenue) : null;
  const opRaw =
    row.latest_operating_income !== null && row.latest_operating_income !== undefined
      ? Number(row.latest_operating_income)
      : null;

  const revenueEok = revRaw !== null && Number.isFinite(revRaw) && revRaw !== 0 ? Math.round(revRaw * 10) / 10 : null;
  const operatingIncomeEok =
    opRaw !== null && Number.isFinite(opRaw) ? Math.round(opRaw * 10) / 10 : null;

  let operatingMarginPct: number | null = null;
  if (revenueEok && revenueEok > 0 && operatingIncomeEok !== null) {
    const pct = (operatingIncomeEok / revenueEok) * 100;
    if (Number.isFinite(pct) && Math.abs(pct) <= 999) {
      operatingMarginPct = Math.round(pct * 10) / 10;
    }
  }

  const board =
    row.market_board === "KOSPI"
      ? "KOSPI"
      : row.market_board === "KOSDAQ"
        ? "KOSDAQ"
        : null;

  return {
    rank: idx + 1,
    bNo: String(row.b_no || ""),
    name: String(row.b_nm || "").trim(),
    representative: row.p_nm && row.p_nm !== "-" ? String(row.p_nm).trim() : "",
    sector: sanitizeSectorLabel(row.b_sector),
    shortRegion: extractShortRegion(row.b_adr),
    address: row.b_adr && row.b_adr !== "-" ? String(row.b_adr).trim() : "",
    startDt: row.start_dt ? String(row.start_dt).trim() : "",
    marketBoard: board,
    employees,
    newHires,
    losses,
    estimatedSalaryManwon: sal ? sal.yearlyManwon : null,
    estimatedSalaryLabel: sal ? sal.shortLabel : null,
    salaryCapped: sal ? sal.isCapped : false,
    finYear,
    revenueEok,
    operatingIncomeEok,
    operatingMarginPct,
  };
}

const BASE_SELECT_COLS = `
  b_no, b_nm, p_nm, start_dt, b_adr, b_sector, market_board,
  nps_sbscrb_nmps, new_acqs_nmps, loss_sbscrb_nmps, nps_chrg_amt,
  latest_fin_year, latest_revenue, latest_operating_income
`;

/**
 * 복합 부분 B-Tree 인덱스(`Seq Scan = 0건`)만을 사용하여 개별 허브 데이터를 계산합니다.
 */
export async function computeHubDetailFromIndex(
  kind: DirectoryHubKind,
  slug: string,
  limit = 80
): Promise<DirectoryHubDetailPayload | null> {
  const meta = getHubMeta(kind, slug);
  if (!meta) return null;

  const safeLimit = Math.min(100, Math.max(10, limit));
  let listSql = "";
  let listParams: any[] = [];
  let aggSql = "";
  let aggParams: any[] = [];

  if (kind === "region") {
    listSql = `
      SELECT ${BASE_SELECT_COLS}
      FROM public.businesses
      WHERE b_stt_cd = '01'
        AND region_hub_slug = $1
        AND region_hub_slug IS NOT NULL
        AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
      ORDER BY nps_sbscrb_nmps DESC NULLS LAST, latest_revenue DESC NULLS LAST, view_count DESC NULLS LAST, b_no ASC
      LIMIT $2
    `;
    listParams = [slug, safeLimit];

    aggSql = `
      SELECT
        COUNT(*)::int AS total_cnt,
        COALESCE(SUM(COALESCE(nps_sbscrb_nmps, 0)), 0)::int AS total_emp,
        COALESCE(SUM(COALESCE(new_acqs_nmps, 0)), 0)::int AS total_hires,
        COALESCE(SUM(COALESCE(latest_revenue, 0)), 0)::numeric AS total_rev,
        COUNT(*) FILTER (WHERE market_board = 'KOSPI')::int AS kospi_cnt,
        COUNT(*) FILTER (WHERE market_board = 'KOSDAQ')::int AS kosdaq_cnt,
        AVG(
          LEAST(6170000, GREATEST(370000, (nps_chrg_amt::numeric / nps_sbscrb_nmps) / 0.09)) * 12 / 10000
        ) FILTER (WHERE nps_sbscrb_nmps >= 5 AND nps_chrg_amt > 0) AS avg_sal
      FROM public.businesses
      WHERE b_stt_cd = '01'
        AND region_hub_slug = $1
        AND region_hub_slug IS NOT NULL
        AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
    `;
    aggParams = [slug];
  } else if (kind === "industry") {
    listSql = `
      SELECT ${BASE_SELECT_COLS}
      FROM public.businesses
      WHERE b_stt_cd = '01'
        AND industry_hub_slug = $1
        AND industry_hub_slug IS NOT NULL
        AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
      ORDER BY nps_sbscrb_nmps DESC NULLS LAST, latest_revenue DESC NULLS LAST, view_count DESC NULLS LAST, b_no ASC
      LIMIT $2
    `;
    listParams = [slug, safeLimit];

    aggSql = `
      SELECT
        COUNT(*)::int AS total_cnt,
        COALESCE(SUM(COALESCE(nps_sbscrb_nmps, 0)), 0)::int AS total_emp,
        COALESCE(SUM(COALESCE(new_acqs_nmps, 0)), 0)::int AS total_hires,
        COALESCE(SUM(COALESCE(latest_revenue, 0)), 0)::numeric AS total_rev,
        COUNT(*) FILTER (WHERE market_board = 'KOSPI')::int AS kospi_cnt,
        COUNT(*) FILTER (WHERE market_board = 'KOSDAQ')::int AS kosdaq_cnt,
        AVG(
          LEAST(6170000, GREATEST(370000, (nps_chrg_amt::numeric / nps_sbscrb_nmps) / 0.09)) * 12 / 10000
        ) FILTER (WHERE nps_sbscrb_nmps >= 5 AND nps_chrg_amt > 0) AS avg_sal
      FROM public.businesses
      WHERE b_stt_cd = '01'
        AND industry_hub_slug = $1
        AND industry_hub_slug IS NOT NULL
        AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
    `;
    aggParams = [slug];
  } else if (kind === "ranking") {
    if (slug === "top-salary") {
      listSql = `
        SELECT ${BASE_SELECT_COLS}
        FROM public.businesses
        WHERE b_stt_cd = '01'
          AND nps_sbscrb_nmps >= 10
          AND nps_chrg_amt > 0
          AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        ORDER BY (nps_chrg_amt::numeric / nps_sbscrb_nmps) DESC NULLS LAST, nps_sbscrb_nmps DESC NULLS LAST, b_no ASC
        LIMIT $1
      `;
      listParams = [safeLimit];
      aggSql = `
        SELECT
          COUNT(*)::int AS total_cnt,
          COALESCE(SUM(nps_sbscrb_nmps), 0)::int AS total_emp,
          COALESCE(SUM(COALESCE(new_acqs_nmps, 0)), 0)::int AS total_hires,
          COALESCE(SUM(COALESCE(latest_revenue, 0)), 0)::numeric AS total_rev,
          COUNT(*) FILTER (WHERE market_board = 'KOSPI')::int AS kospi_cnt,
          COUNT(*) FILTER (WHERE market_board = 'KOSDAQ')::int AS kosdaq_cnt,
          AVG(
            LEAST(6170000, GREATEST(370000, (nps_chrg_amt::numeric / nps_sbscrb_nmps) / 0.09)) * 12 / 10000
          ) AS avg_sal
        FROM public.businesses
        WHERE b_stt_cd = '01'
          AND nps_sbscrb_nmps >= 10
          AND nps_chrg_amt > 0
          AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
      `;
    } else if (slug === "hiring-surge") {
      listSql = `
        SELECT ${BASE_SELECT_COLS}
        FROM public.businesses
        WHERE b_stt_cd = '01'
          AND new_acqs_nmps > 0
          AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        ORDER BY new_acqs_nmps DESC NULLS LAST, nps_sbscrb_nmps DESC NULLS LAST, b_no ASC
        LIMIT $1
      `;
      listParams = [safeLimit];
      aggSql = `
        SELECT
          COUNT(*)::int AS total_cnt,
          COALESCE(SUM(COALESCE(nps_sbscrb_nmps, 0)), 0)::int AS total_emp,
          COALESCE(SUM(new_acqs_nmps), 0)::int AS total_hires,
          COALESCE(SUM(COALESCE(latest_revenue, 0)), 0)::numeric AS total_rev,
          COUNT(*) FILTER (WHERE market_board = 'KOSPI')::int AS kospi_cnt,
          COUNT(*) FILTER (WHERE market_board = 'KOSDAQ')::int AS kosdaq_cnt,
          AVG(
            LEAST(6170000, GREATEST(370000, (nps_chrg_amt::numeric / nps_sbscrb_nmps) / 0.09)) * 12 / 10000
          ) FILTER (WHERE nps_sbscrb_nmps >= 5 AND nps_chrg_amt > 0) AS avg_sal
        FROM public.businesses
        WHERE b_stt_cd = '01'
          AND new_acqs_nmps > 0
          AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
      `;
    } else if (slug === "top-employers") {
      listSql = `
        SELECT ${BASE_SELECT_COLS}
        FROM public.businesses
        WHERE b_stt_cd = '01'
          AND nps_sbscrb_nmps > 0
          AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        ORDER BY nps_sbscrb_nmps DESC NULLS LAST, b_no ASC
        LIMIT $1
      `;
      listParams = [safeLimit];
      aggSql = `
        SELECT
          COUNT(*)::int AS total_cnt,
          COALESCE(SUM(nps_sbscrb_nmps), 0)::int AS total_emp,
          COALESCE(SUM(COALESCE(new_acqs_nmps, 0)), 0)::int AS total_hires,
          COALESCE(SUM(COALESCE(latest_revenue, 0)), 0)::numeric AS total_rev,
          COUNT(*) FILTER (WHERE market_board = 'KOSPI')::int AS kospi_cnt,
          COUNT(*) FILTER (WHERE market_board = 'KOSDAQ')::int AS kosdaq_cnt,
          AVG(
            LEAST(6170000, GREATEST(370000, (nps_chrg_amt::numeric / nps_sbscrb_nmps) / 0.09)) * 12 / 10000
          ) FILTER (WHERE nps_sbscrb_nmps >= 5 AND nps_chrg_amt > 0) AS avg_sal
        FROM public.businesses
        WHERE b_stt_cd = '01'
          AND nps_sbscrb_nmps > 0
          AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
      `;
    } else if (slug === "top-revenue") {
      listSql = `
        SELECT ${BASE_SELECT_COLS}
        FROM public.businesses
        WHERE b_stt_cd = '01'
          AND latest_revenue > 0
          AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        ORDER BY latest_revenue DESC NULLS LAST, b_no ASC
        LIMIT $1
      `;
      listParams = [safeLimit];
      aggSql = `
        SELECT
          COUNT(*)::int AS total_cnt,
          COALESCE(SUM(COALESCE(nps_sbscrb_nmps, 0)), 0)::int AS total_emp,
          COALESCE(SUM(COALESCE(new_acqs_nmps, 0)), 0)::int AS total_hires,
          COALESCE(SUM(latest_revenue), 0)::numeric AS total_rev,
          COUNT(*) FILTER (WHERE market_board = 'KOSPI')::int AS kospi_cnt,
          COUNT(*) FILTER (WHERE market_board = 'KOSDAQ')::int AS kosdaq_cnt,
          AVG(
            LEAST(6170000, GREATEST(370000, (nps_chrg_amt::numeric / nps_sbscrb_nmps) / 0.09)) * 12 / 10000
          ) FILTER (WHERE nps_sbscrb_nmps >= 5 AND nps_chrg_amt > 0) AS avg_sal
        FROM public.businesses
        WHERE b_stt_cd = '01'
          AND latest_revenue > 0
          AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
      `;
    } else if (slug === "top-profit") {
      listSql = `
        SELECT ${BASE_SELECT_COLS}
        FROM public.businesses
        WHERE b_stt_cd = '01'
          AND latest_operating_income > 0
          AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        ORDER BY latest_operating_income DESC NULLS LAST, b_no ASC
        LIMIT $1
      `;
      listParams = [safeLimit];
      aggSql = `
        SELECT
          COUNT(*)::int AS total_cnt,
          COALESCE(SUM(COALESCE(nps_sbscrb_nmps, 0)), 0)::int AS total_emp,
          COALESCE(SUM(COALESCE(new_acqs_nmps, 0)), 0)::int AS total_hires,
          COALESCE(SUM(COALESCE(latest_revenue, 0)), 0)::numeric AS total_rev,
          COUNT(*) FILTER (WHERE market_board = 'KOSPI')::int AS kospi_cnt,
          COUNT(*) FILTER (WHERE market_board = 'KOSDAQ')::int AS kosdaq_cnt,
          AVG(
            LEAST(6170000, GREATEST(370000, (nps_chrg_amt::numeric / nps_sbscrb_nmps) / 0.09)) * 12 / 10000
          ) FILTER (WHERE nps_sbscrb_nmps >= 5 AND nps_chrg_amt > 0) AS avg_sal
        FROM public.businesses
        WHERE b_stt_cd = '01'
          AND latest_operating_income > 0
          AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
      `;
    } else if (slug === "kospi-leaders" || slug === "kosdaq-leaders") {
      const targetBoard = slug === "kospi-leaders" ? "KOSPI" : "KOSDAQ";
      listSql = `
        SELECT ${BASE_SELECT_COLS}
        FROM public.businesses
        WHERE b_stt_cd = '01'
          AND market_board = $1
          AND market_board IS NOT NULL
          AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        ORDER BY nps_sbscrb_nmps DESC NULLS LAST, latest_revenue DESC NULLS LAST, view_count DESC NULLS LAST, b_no ASC
        LIMIT $2
      `;
      listParams = [targetBoard, safeLimit];
      aggSql = `
        SELECT
          COUNT(*)::int AS total_cnt,
          COALESCE(SUM(COALESCE(nps_sbscrb_nmps, 0)), 0)::int AS total_emp,
          COALESCE(SUM(COALESCE(new_acqs_nmps, 0)), 0)::int AS total_hires,
          COALESCE(SUM(COALESCE(latest_revenue, 0)), 0)::numeric AS total_rev,
          COUNT(*) FILTER (WHERE market_board = 'KOSPI')::int AS kospi_cnt,
          COUNT(*) FILTER (WHERE market_board = 'KOSDAQ')::int AS kosdaq_cnt,
          AVG(
            LEAST(6170000, GREATEST(370000, (nps_chrg_amt::numeric / nps_sbscrb_nmps) / 0.09)) * 12 / 10000
          ) FILTER (WHERE nps_sbscrb_nmps >= 5 AND nps_chrg_amt > 0) AS avg_sal
        FROM public.businesses
        WHERE b_stt_cd = '01'
          AND market_board = $1
          AND market_board IS NOT NULL
          AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
      `;
      aggParams = [targetBoard];
    } else {
      return null;
    }
  } else {
    return null;
  }

  const [listRes, aggRes] = await Promise.all([
    query(listSql, listParams),
    query(aggSql, aggParams),
  ]);

  const companies = listRes.rows.map((r, i) => mapRowToDirectoryCompany(r, i));
  const agg = aggRes.rows[0] || {};
  const avgSal = agg.avg_sal ? Math.round(Number(agg.avg_sal)) : null;

  return {
    kind,
    slug,
    meta,
    stats: {
      totalMatchedCount: Number(agg.total_cnt || companies.length),
      displayedCount: companies.length,
      totalEmployees: Number(agg.total_emp || 0),
      totalNewHires: Number(agg.total_hires || 0),
      avgSalaryManwon: avgSal && Number.isFinite(avgSal) ? avgSal : null,
      totalRevenueEok: Math.round(Number(agg.total_rev || 0)),
      kospiCount: Number(agg.kospi_cnt || 0),
      kosdaqCount: Number(agg.kosdaq_cnt || 0),
      updatedAt: new Date().toISOString(),
    },
    companies,
  };
}

function buildSampleMetricText(kind: DirectoryHubKind, slug: string, c: DirectoryCompanyItem): string {
  if (kind === "ranking") {
    if (slug === "top-salary" && c.estimatedSalaryLabel) return c.estimatedSalaryLabel;
    if (slug === "hiring-surge" && c.newHires > 0) return `+${c.newHires.toLocaleString("ko-KR")}명 입사`;
    if (slug === "top-revenue" && c.revenueEok) return `매출 ${c.revenueEok.toLocaleString("ko-KR")}억`;
    if (slug === "top-profit" && c.operatingIncomeEok) return `영업익 ${c.operatingIncomeEok.toLocaleString("ko-KR")}억`;
  }
  if (c.employees > 0) return `${c.employees.toLocaleString("ko-KR")}명`;
  if (c.revenueEok && c.revenueEok > 0) return `매출 ${c.revenueEok.toLocaleString("ko-KR")}억`;
  return c.marketBoard || "검증기업";
}

async function rebuildAndSaveHubSnapshot(kind: DirectoryHubKind, slug: string): Promise<DirectoryHubDetailPayload | null> {
  const settingsKey = `${HUB_SETTINGS_PREFIX}:${kind}:${slug}`;
  const detail = await computeHubDetailFromIndex(kind, slug, 80);
  if (!detail) return null;

  try {
    await query(
      `INSERT INTO public.system_settings (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = NOW()`,
      [settingsKey, JSON.stringify(detail)]
    );
  } catch (err) {
    console.warn("[directoryApi] Failed to save hub snapshot:", settingsKey, err);
  }

  memHubMap.set(settingsKey, { data: detail, expiresAt: Date.now() + MEMORY_TTL_MS });
  return detail;
}

export async function rebuildAndSaveOverviewSnapshot(): Promise<DirectoryOverviewPayload> {
  const globalRes = await query(`
    SELECT
      COUNT(*)::int AS active_cnt,
      COUNT(*) FILTER (WHERE market_board = 'KOSPI')::int AS kospi_cnt,
      COUNT(*) FILTER (WHERE market_board = 'KOSDAQ')::int AS kosdaq_cnt,
      COALESCE(SUM(COALESCE(nps_sbscrb_nmps, 0)), 0)::int AS total_emp,
      COUNT(*) FILTER (WHERE latest_revenue > 0)::int AS fin_cnt
    FROM public.businesses
    WHERE b_stt_cd = '01'
      AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
  `);
  const g = globalRes.rows[0] || {};

  const buildPreviews = async (
    hubs: readonly AnyHubMeta[]
  ): Promise<DirectoryHubCardPreview[]> => {
    const out: DirectoryHubCardPreview[] = [];
    for (const h of hubs) {
      const detail = await rebuildAndSaveHubSnapshot(h.kind, h.slug);
      if (!detail || detail.companies.length === 0) continue;
      out.push({
        kind: h.kind,
        slug: h.slug,
        title: h.title,
        shortTitle: h.shortTitle,
        emoji: h.emoji,
        subtitle: h.subtitle,
        badgeOrArea:
          h.kind === "ranking"
            ? h.badge
            : h.kind === "region"
              ? h.areaLabel
              : undefined,
        companyCount: detail.stats.totalMatchedCount,
        totalEmployees: detail.stats.totalEmployees,
        avgSalaryManwon: detail.stats.avgSalaryManwon,
        sampleCompanies: detail.companies.slice(0, 3).map((c) => ({
          bNo: c.bNo,
          name: c.name,
          metricText: buildSampleMetricText(h.kind, h.slug, c),
        })),
      });
    }
    return out;
  };

  const rankingHubs = await buildPreviews(RANKING_HUBS);
  const regionHubs = await buildPreviews(REGION_HUBS);
  const industryHubs = await buildPreviews(INDUSTRY_HUBS);

  const overview: DirectoryOverviewPayload = {
    globalSummary: {
      activeVerifiedCount: Number(g.active_cnt || 0),
      listedTotalCount: Number(g.kospi_cnt || 0) + Number(g.kosdaq_cnt || 0),
      kospiCount: Number(g.kospi_cnt || 0),
      kosdaqCount: Number(g.kosdaq_cnt || 0),
      totalTrackedEmployees: Number(g.total_emp || 0),
      financialVerifiedCount: Number(g.fin_cnt || 0),
      updatedAt: new Date().toISOString(),
    },
    rankingHubs,
    regionHubs,
    industryHubs,
  };

  try {
    await query(
      `INSERT INTO public.system_settings (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = NOW()`,
      [OVERVIEW_SETTINGS_KEY, JSON.stringify(overview)]
    );
  } catch (err) {
    console.warn("[directoryApi] Failed to save overview snapshot:", err);
  }

  memOverview = { data: overview, expiresAt: Date.now() + MEMORY_TTL_MS };
  return overview;
}

/**
 * `/directory` 통합 허브 로더:
 * 1) 프로세스 메모리 캐시(5분) -> 2) `system_settings` PK 단건 조회(`~1ms`) + 만료 시 비블로킹 SWR 갱신
 */
export const getDirectoryOverview = cache(async (): Promise<DirectoryOverviewPayload> => {
  const now = Date.now();
  if (memOverview && memOverview.expiresAt > now) {
    return memOverview.data;
  }

  try {
    const snapRes = await query(
      `SELECT value, updated_at FROM public.system_settings WHERE key = $1 LIMIT 1`,
      [OVERVIEW_SETTINGS_KEY]
    );
    const row = snapRes.rows[0];
    if (row && row.value) {
      const payload = row.value as DirectoryOverviewPayload;
      memOverview = { data: payload, expiresAt: now + MEMORY_TTL_MS };

      const updatedMs = row.updated_at ? new Date(row.updated_at).getTime() : 0;
      if (now - updatedMs > SNAPSHOT_STALE_MS && !overviewRefreshInFlight) {
        overviewRefreshInFlight = true;
        void rebuildAndSaveOverviewSnapshot()
          .catch((e) => console.warn("[directoryApi] SWR overview refresh failed:", e))
          .finally(() => {
            overviewRefreshInFlight = false;
          });
      }
      return payload;
    }
  } catch (err) {
    console.warn("[directoryApi] Snapshot lookup fallback:", err);
  }

  return rebuildAndSaveOverviewSnapshot();
});

/**
 * `/directory/[kind]/[slug]` 상세 로더:
 * 1) 프로세스 메모리 캐시(5분) -> 2) `system_settings` PK 단건 조회(`~1ms`) + 만료 시 비블로킹 SWR 갱신 -> 3) 미존재 시 복합 인덱스 즉시 조회
 */
export const getDirectoryHubDetail = cache(
  async (kind: string, slug: string): Promise<DirectoryHubDetailPayload | null> => {
    if (kind !== "ranking" && kind !== "region" && kind !== "industry") {
      return null;
    }
    const meta = getHubMeta(kind, slug);
    if (!meta) return null;

    const settingsKey = `${HUB_SETTINGS_PREFIX}:${kind}:${slug}`;
    const now = Date.now();
    const cached = memHubMap.get(settingsKey);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    try {
      const snapRes = await query(
        `SELECT value, updated_at FROM public.system_settings WHERE key = $1 LIMIT 1`,
        [settingsKey]
      );
      const row = snapRes.rows[0];
      if (row && row.value) {
        const payload = row.value as DirectoryHubDetailPayload;
        // 최신 메타 텍스트 동기화 보장
        payload.meta = meta;
        memHubMap.set(settingsKey, { data: payload, expiresAt: now + MEMORY_TTL_MS });

        const updatedMs = row.updated_at ? new Date(row.updated_at).getTime() : 0;
        if (now - updatedMs > SNAPSHOT_STALE_MS && !hubRefreshInFlight.has(settingsKey)) {
          hubRefreshInFlight.add(settingsKey);
          void rebuildAndSaveHubSnapshot(kind, slug)
            .catch((e) => console.warn("[directoryApi] SWR hub refresh failed:", settingsKey, e))
            .finally(() => {
              hubRefreshInFlight.delete(settingsKey);
            });
        }
        return payload;
      }
    } catch (err) {
      console.warn("[directoryApi] Hub snapshot lookup fallback:", settingsKey, err);
    }

    return rebuildAndSaveHubSnapshot(kind, slug);
  }
);
