import { query } from "./db";
import { INDUSTRY_HUBS } from "./directoryConfig";

export interface IndustryHubStatsBucket {
  slug: string;
  groupTitle: string;
  totalCompanies: number;
  closeRate: number;
  avgRevenue: number;
  avgDebtRatio: number;
  avgOperatingMargin: number;
  leaders: Array<{ b_no: string; b_nm: string; revenue: number }>;
  // 백분위 계산용 오름차순/내림차순 정렬 분포 배열 (Node.js 이진 탐색 ~0.01ms, SQL 풀스캔 0건)
  revenuesAsc: number[];
  marginsAsc: number[];
  debtRatiosAsc: number[]; // 부채비율은 낮을수록 상위 백분위
  employeesAsc: number[];
}

export interface IndustryStatsSnapshotPayload {
  updatedAt: string;
  hubs: Record<string, IndustryHubStatsBucket>;
}

const SNAPSHOT_KEY = "industry_stats_v1";
const SNAPSHOT_STALE_MS = 24 * 60 * 60 * 1000; // 24시간 SWR
const MEMORY_TTL_MS = 60 * 60 * 1000; // 1시간 메모리 캐시

let memSnapshot: { data: IndustryStatsSnapshotPayload; expiresAt: number } | null = null;
let refreshInFlight = false;

export async function rebuildAndSaveIndustryStatsSnapshot(): Promise<IndustryStatsSnapshotPayload> {
  const [aggRes, finRes, empRes] = await Promise.all([
    query(`
      SELECT
        industry_hub_slug AS slug,
        COUNT(*)::int AS total_companies,
        COALESCE(
          SUM(CASE WHEN b_stt_cd = '03' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0)::float * 100,
          0
        ) AS close_rate
      FROM public.businesses
      WHERE industry_hub_slug IS NOT NULL
        AND b_nm IS NOT NULL
        AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
      GROUP BY industry_hub_slug
    `),
    query(`
      WITH latest_h AS (
        SELECT DISTINCT ON (b_no)
          b_no, revenue, operating_income, total_liabilities, total_equity
        FROM public.business_history
        WHERE revenue > 0
        ORDER BY b_no, year DESC
      )
      SELECT
        b.industry_hub_slug AS slug,
        b.b_no,
        b.b_nm,
        b.b_stt_cd,
        h.revenue::float AS revenue,
        h.operating_income::float AS operating_income,
        h.total_liabilities::float AS total_liabilities,
        h.total_equity::float AS total_equity
      FROM public.businesses b
      JOIN latest_h h ON b.b_no = h.b_no
      WHERE b.industry_hub_slug IS NOT NULL
        AND b.b_nm IS NOT NULL
        AND b.b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
    `),
    query(`
      SELECT
        industry_hub_slug AS slug,
        nps_sbscrb_nmps::int AS emp
      FROM public.businesses
      WHERE industry_hub_slug IS NOT NULL
        AND b_stt_cd = '01'
        AND nps_sbscrb_nmps > 0
        AND b_nm IS NOT NULL
        AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
    `),
  ]);

  const titleBySlug = new Map<string, string>(
    INDUSTRY_HUBS.map((h) => [h.slug, h.shortTitle])
  );

  const aggMap = new Map<string, { totalCompanies: number; closeRate: number }>();
  for (const r of aggRes.rows) {
    aggMap.set(r.slug, {
      totalCompanies: Number(r.total_companies || 0),
      closeRate: Number(Number(r.close_rate || 0).toFixed(2)),
    });
  }

  const finBySlug = new Map<
    string,
    Array<{
      b_no: string;
      b_nm: string;
      b_stt_cd: string;
      revenue: number;
      margin: number;
      debtRatio: number | null;
    }>
  >();

  for (const r of finRes.rows) {
    const rev = Number(r.revenue || 0);
    if (rev <= 0) continue;
    const op = Number(r.operating_income || 0);
    const liab = Number(r.total_liabilities || 0);
    const eq = Number(r.total_equity || 0);
    const margin = Math.round((op / rev) * 10000) / 100; // % 소수점 2자리
    const debtRatio = eq > 0 ? Math.round((liab / eq) * 1000) / 10 : null;

    const list = finBySlug.get(r.slug) || [];
    list.push({
      b_no: r.b_no,
      b_nm: r.b_nm,
      b_stt_cd: r.b_stt_cd || "01",
      revenue: Math.round(rev * 10) / 10,
      margin,
      debtRatio,
    });
    finBySlug.set(r.slug, list);
  }

  const empBySlug = new Map<string, number[]>();
  for (const r of empRes.rows) {
    const list = empBySlug.get(r.slug) || [];
    list.push(Number(r.emp || 0));
    empBySlug.set(r.slug, list);
  }

  const hubs: Record<string, IndustryHubStatsBucket> = {};

  for (const hub of INDUSTRY_HUBS) {
    const slug = hub.slug;
    const agg = aggMap.get(slug) || { totalCompanies: 0, closeRate: 0 };
    const fins = finBySlug.get(slug) || [];
    const emps = (empBySlug.get(slug) || []).sort((a, b) => a - b);

    const revenuesAsc = fins.map((f) => f.revenue).sort((a, b) => a - b);
    const marginsAsc = fins.map((f) => f.margin).sort((a, b) => a - b);
    const debtRatiosAsc = fins
      .filter((f) => f.debtRatio !== null && Number.isFinite(f.debtRatio))
      .map((f) => f.debtRatio as number)
      .sort((a, b) => a - b);

    const avgRevenue =
      revenuesAsc.length > 0
        ? Math.round(revenuesAsc.reduce((a, b) => a + b, 0) / revenuesAsc.length)
        : 0;
    const avgOperatingMargin =
      marginsAsc.length > 0
        ? Number((marginsAsc.reduce((a, b) => a + b, 0) / marginsAsc.length).toFixed(2))
        : 0;
    const avgDebtRatio =
      debtRatiosAsc.length > 0
        ? Math.round(debtRatiosAsc.reduce((a, b) => a + b, 0) / debtRatiosAsc.length)
        : 0;

    const leaders = [...fins]
      .filter((f) => f.b_stt_cd === "01")
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
      .map((f) => ({
        b_no: f.b_no,
        b_nm: f.b_nm,
        revenue: f.revenue,
      }));

    hubs[slug] = {
      slug,
      groupTitle: titleBySlug.get(slug) || hub.shortTitle,
      totalCompanies: agg.totalCompanies,
      closeRate: agg.closeRate,
      avgRevenue,
      avgDebtRatio,
      avgOperatingMargin,
      leaders,
      revenuesAsc,
      marginsAsc,
      debtRatiosAsc,
      employeesAsc: emps,
    };
  }

  const payload: IndustryStatsSnapshotPayload = {
    updatedAt: new Date().toISOString(),
    hubs,
  };

  try {
    await query(
      `INSERT INTO public.system_settings (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = NOW()`,
      [SNAPSHOT_KEY, JSON.stringify(payload)]
    );
  } catch (err) {
    console.warn("[industryStatsSnapshot] Failed to save snapshot:", err);
  }

  memSnapshot = { data: payload, expiresAt: Date.now() + MEMORY_TTL_MS };
  return payload;
}

export async function getIndustryStatsSnapshot(): Promise<IndustryStatsSnapshotPayload> {
  const now = Date.now();
  if (memSnapshot && memSnapshot.expiresAt > now) {
    return memSnapshot.data;
  }

  try {
    const res = await query(
      `SELECT value, updated_at FROM public.system_settings WHERE key = $1 LIMIT 1`,
      [SNAPSHOT_KEY]
    );
    const row = res.rows[0];
    if (row && row.value && row.value.hubs) {
      const payload = row.value as IndustryStatsSnapshotPayload;
      memSnapshot = { data: payload, expiresAt: now + MEMORY_TTL_MS };

      const updatedMs = row.updated_at ? new Date(row.updated_at).getTime() : 0;
      if (now - updatedMs > SNAPSHOT_STALE_MS && !refreshInFlight) {
        refreshInFlight = true;
        void rebuildAndSaveIndustryStatsSnapshot()
          .catch((e) => console.warn("[industryStatsSnapshot] SWR refresh failed:", e))
          .finally(() => {
            refreshInFlight = false;
          });
      }
      return payload;
    }
  } catch (err) {
    console.warn("[industryStatsSnapshot] Snapshot lookup fallback:", err);
  }

  return rebuildAndSaveIndustryStatsSnapshot();
}

/**
 * 오름차순 정렬 배열에서 `cume_dist()`(<= target 비율) 이진 탐색 계산 (O(log N))
 */
export function computeCumeDistAsc(sortedAsc: number[], value: number): number {
  const n = sortedAsc.length;
  if (n === 0) return 0.5;
  let lo = 0;
  let hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sortedAsc[mid] <= value) lo = mid + 1;
    else hi = mid;
  }
  return Math.max(1 / n, lo / n);
}

/**
 * 오름차순 정렬 배열에서 내림차순 순위(`RANK() OVER (ORDER BY val DESC)`) 계산 (O(log N))
 */
export function computeRankDescFromAsc(sortedAsc: number[], value: number): number {
  const n = sortedAsc.length;
  if (n === 0) return 1;
  // value보다 큰 첫 원소 위치 (upper_bound)
  let lo = 0;
  let hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sortedAsc[mid] <= value) lo = mid + 1;
    else hi = mid;
  }
  const strictlyGreaterCount = n - lo;
  return strictlyGreaterCount + 1;
}

/**
 * 부채비율처럼 "낮을수록 우수(DESC cume_dist)"한 지표의 상위 백분위 계산
 */
export function computeCumeDistLowerIsBetter(sortedAsc: number[], value: number): number {
  const n = sortedAsc.length;
  if (n === 0) return 0.5;
  // value 이상인 원소 수 = n - lower_bound(value)
  let lo = 0;
  let hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sortedAsc[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  const greaterOrEqualCount = n - lo;
  return Math.max(1 / n, greaterOrEqualCount / n);
}
