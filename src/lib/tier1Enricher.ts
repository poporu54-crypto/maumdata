import { query, pool } from "@/lib/db";
import { getNtsBatchCompanyStatus } from "@/lib/ntsApi";
import { getCorpFinanceInfo } from "@/lib/corpApi";
import { getNpsBplcInfo } from "@/lib/npsApi";
import {
  resolveRegionHubSlug,
  resolveIndustryHubSlug,
  resolveMarketBoard,
} from "@/lib/directoryConfig";
import { rebuildAndSaveOverviewSnapshot } from "@/lib/directoryApi";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface Tier1EnrichBatchOptions {
  limit?: number;
  delayMs?: number;
  refreshSnapshots?: boolean;
  pruneViewLogs?: boolean;
  pruneBatchSize?: number;
}

export interface Tier1EnrichBatchReport {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  candidatesCount: number;
  ntsVerifiedCount: number;
  closedMarkedCount: number;
  financeEnrichedCount: number;
  npsEnrichedCount: number;
  prunedViewLogsCount: number;
  snapshotsRefreshed: boolean;
  samples: Array<{
    bNo: string;
    name: string;
    bStt: string;
    finAdded: boolean;
    npsAdded: boolean;
    employees: number;
    latestRevenue: number | null;
  }>;
}

interface CandidateRow {
  b_no: string;
  b_nm: string;
  b_adr: string | null;
  b_sector: string | null;
  main_biz: string | null;
  listing_status: string | null;
  crno: string | null;
  corp_no: string | null;
  nps_sbscrb_nmps: number | null;
  nps_last_sync_at: string | null;
  latest_fin_year: number | null;
}

/**
 * 2단계 부분 B-Tree 인덱스 선조회 (`ORDER BY CASE WHEN` 및 `Seq Scan` 원천 금지):
 * 1순위: KOSPI/KOSDAQ 상장법인 중 재무 미동기화(또는 90일 경과) 기업
 * 2순위: 유효 법인등록번호(crno) 보유 비상장 계속법인
 */
async function pickEnrichmentCandidates(limit: number): Promise<CandidateRow[]> {
  const safeLimit = Math.min(100, Math.max(1, limit));

  const listedRes = await query(
    `SELECT b_no, b_nm, b_adr, b_sector, main_biz, listing_status,
            crno, corp_no, nps_sbscrb_nmps, nps_last_sync_at, latest_fin_year
     FROM public.businesses
     WHERE b_stt_cd = '01'
       AND market_board IN ('KOSPI', 'KOSDAQ')
     ORDER BY fin_last_sync_at ASC NULLS FIRST, view_count DESC NULLS LAST, b_no ASC
     LIMIT $1`,
    [safeLimit]
  );

  const picked: CandidateRow[] = [...listedRes.rows];
  const seen = new Set(picked.map((r) => r.b_no));

  if (picked.length < safeLimit) {
    const remaining = safeLimit - picked.length;
    const corpRes = await query(
      `SELECT b_no, b_nm, b_adr, b_sector, main_biz, listing_status,
              crno, corp_no, nps_sbscrb_nmps, nps_last_sync_at, latest_fin_year
       FROM public.businesses
       WHERE b_stt_cd = '01'
         AND crno IS NOT NULL AND crno <> ''
       ORDER BY fin_last_sync_at ASC NULLS FIRST, view_count DESC NULLS LAST, b_no ASC
       LIMIT $1`,
      [remaining + picked.length]
    );

    for (const r of corpRes.rows) {
      if (picked.length >= safeLimit) break;
      if (!seen.has(r.b_no)) {
        seen.add(r.b_no);
        picked.push(r);
      }
    }
  }

  return picked;
}

/**
 * 90일 경과 `business_view_logs` 배치 보존정리 (Retention Pruning — 인덱스 스캔)
 */
async function pruneExpiredViewLogs(batchSize: number): Promise<number> {
  const safeBatch = Math.min(10000, Math.max(500, batchSize));
  const res = await query(
    `DELETE FROM public.business_view_logs
     WHERE id IN (
       SELECT id
       FROM public.business_view_logs
       WHERE viewed_at < NOW() - INTERVAL '90 days'
       ORDER BY viewed_at ASC
       LIMIT $1
     )`,
    [safeBatch]
  );
  return res.rowCount || 0;
}

/**
 * 저속·안전 Tier-1 알짜 기업 자동 확충 + 영구 스냅샷 갱신 + 로그 보존정리 통합 배치
 * (가짜/폴백 데이터 전면 금지 원칙 준수: 공식 API 응답이 없으면 빈 상태 유지)
 */
export async function runSafeTier1EnrichmentBatch(
  options: Tier1EnrichBatchOptions = {}
): Promise<Tier1EnrichBatchReport> {
  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();
  const limit = Math.min(100, Math.max(1, options.limit ?? 10));
  const delayMs = Math.max(200, options.delayMs ?? 350);
  const refreshSnapshots = options.refreshSnapshots ?? false;
  const pruneViewLogs = options.pruneViewLogs ?? true;
  const pruneBatchSize = options.pruneBatchSize ?? 5000;

  const candidates = await pickEnrichmentCandidates(limit);
  let ntsVerifiedCount = 0;
  let closedMarkedCount = 0;
  let financeEnrichedCount = 0;
  let npsEnrichedCount = 0;
  const samples: Tier1EnrichBatchReport["samples"] = [];

  // 1. 국세청 단 1회 배치 호출로 전체 후보의 최신 납세상태·과세유형 검증
  const ntsList =
    candidates.length > 0
      ? await getNtsBatchCompanyStatus(candidates.map((c) => c.b_no))
      : [];
  const ntsMap = new Map<string, any>();
  for (const item of ntsList || []) {
    const clean = String(item.b_no || "").replace(/[^0-9]/g, "");
    if (clean) ntsMap.set(clean, item);
  }
  ntsVerifiedCount = ntsMap.size;

  // 2. 저속 순차 보강 (외부 공공 API 한도 보호)
  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    if (i > 0) await sleep(delayMs);

    const nts = ntsMap.get(cand.b_no);
    const newBStt = nts?.b_stt || "계속사업자";
    const newBSttCd = nts?.b_stt_cd || "01";
    const newTaxType = nts?.tax_type || null;
    const newTaxTypeCd = nts?.tax_type_cd || null;

    // 폐업(03) · 휴업(02) 감지 시 즉시 상태 반영 후 재무/연금 보강 생략
    if (newBSttCd === "02" || newBSttCd === "03") {
      await query(
        `UPDATE public.businesses
         SET b_stt = $2,
             b_stt_cd = $3,
             tax_type = COALESCE($4, tax_type),
             tax_type_cd = COALESCE($5, tax_type_cd),
             nts_last_sync_at = NOW(),
             fin_last_sync_at = NOW()
         WHERE b_no = $1`,
        [cand.b_no, newBStt, newBSttCd, newTaxType, newTaxTypeCd]
      );
      closedMarkedCount++;
      samples.push({
        bNo: cand.b_no,
        name: cand.b_nm,
        bStt: newBStt,
        finAdded: false,
        npsAdded: false,
        employees: Number(cand.nps_sbscrb_nmps || 0),
        latestRevenue: null,
      });
      continue;
    }

    let finAdded = false;
    let latestFinYear: number | null = cand.latest_fin_year ? Number(cand.latest_fin_year) : null;
    let latestRevenue: number | null = null;
    let latestOpIncome: number | null = null;

    const rawCrno = (cand.crno || cand.corp_no || "").replace(/[^0-9]/g, "");
    if (rawCrno.length === 13 && !/^0+$/.test(rawCrno)) {
      const finHistory = await getCorpFinanceInfo(rawCrno);
      if (finHistory.length > 0) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          for (const h of finHistory) {
            await client.query(
              `INSERT INTO public.business_history (
                 b_no, year, revenue, operating_income, net_income,
                 total_assets, total_liabilities, total_equity, employees
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (b_no, year) DO UPDATE SET
                 revenue = EXCLUDED.revenue,
                 operating_income = EXCLUDED.operating_income,
                 net_income = EXCLUDED.net_income,
                 total_assets = EXCLUDED.total_assets,
                 total_liabilities = EXCLUDED.total_liabilities,
                 total_equity = EXCLUDED.total_equity`,
              [
                cand.b_no,
                h.year,
                h.revenue,
                h.operatingIncome,
                h.netIncome,
                h.totalAssets,
                h.totalLiabilities,
                h.totalEquity,
                Number(cand.nps_sbscrb_nmps || 0),
              ]
            );
          }
          await client.query("COMMIT");
          const newest = finHistory[finHistory.length - 1];
          latestFinYear = newest.year;
          latestRevenue = newest.revenue;
          latestOpIncome = newest.operatingIncome;
          finAdded = true;
          financeEnrichedCount++;
        } catch (e) {
          await client.query("ROLLBACK").catch(() => {});
          console.warn("[tier1Enricher] Finance insert failed for", cand.b_no, e);
        } finally {
          client.release();
        }
      }
    }

    // 국민연금 가입자·추정연봉 보강 (미보유이거나 60일 경과 시)
    let npsAdded = false;
    let employees = Number(cand.nps_sbscrb_nmps || 0);
    let newAcqs: number | null = null;
    let losses: number | null = null;
    let chrgAmt: number | null = null;
    let npsSector: string | null = null;

    const npsLastMs = cand.nps_last_sync_at ? new Date(cand.nps_last_sync_at).getTime() : 0;
    const npsStale = employees === 0 || Date.now() - npsLastMs > 60 * 24 * 60 * 60 * 1000;

    if (npsStale && cand.b_nm) {
      const npsInfo = await getNpsBplcInfo(cand.b_no, cand.b_nm);
      const isSuspiciousBranchDrop =
        employees >= 50 && npsInfo && npsInfo.npsSbscrbNmps < Math.floor(employees * 0.1);
      if (npsInfo && npsInfo.npsSbscrbNmps > 0 && !isSuspiciousBranchDrop) {
        employees = npsInfo.npsSbscrbNmps;
        newAcqs = npsInfo.newAcqsNmps ?? 0;
        losses = npsInfo.lossSbscrbNmps ?? 0;
        chrgAmt = npsInfo.npsChrgAmt ?? 0;
        npsSector = npsInfo.npsSector || null;
        npsAdded = true;
        npsEnrichedCount++;

        if (Array.isArray(npsInfo.monthlyHistory) && npsInfo.monthlyHistory.length > 0) {
          for (const eh of npsInfo.monthlyHistory.slice(0, 6)) {
            if (!eh.recordMonth) continue;
            await query(
              `INSERT INTO public.business_employment_history (
                 b_no, record_month, employees, new_acquisitions, losses, nps_charge_amount
               ) VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (b_no, record_month) DO UPDATE SET
                 employees = EXCLUDED.employees,
                 new_acquisitions = EXCLUDED.new_acquisitions,
                 losses = EXCLUDED.losses,
                 nps_charge_amount = EXCLUDED.nps_charge_amount`,
              [
                cand.b_no,
                eh.recordMonth,
                eh.employees || 0,
                eh.newAcquisitions || 0,
                eh.losses || 0,
                eh.npsChargeAmount || 0,
              ]
            ).catch(() => {});
          }
        }
      }
    }

    const effectiveSector =
      npsSector && (!cand.b_sector || cand.b_sector === "상장 법인" || cand.b_sector === "기타 제조업/금융업")
        ? npsSector
        : cand.b_sector;

    const regionSlug = resolveRegionHubSlug(cand.b_adr);
    const industrySlug = resolveIndustryHubSlug(effectiveSector, cand.main_biz, cand.b_nm);
    const marketBoard = resolveMarketBoard(cand.listing_status);

    await query(
      `UPDATE public.businesses
       SET
         b_stt = $2,
         b_stt_cd = $3,
         tax_type = COALESCE($4, tax_type),
         tax_type_cd = COALESCE($5, tax_type_cd),
         b_sector = COALESCE($6, b_sector),
         nps_sbscrb_nmps = CASE WHEN $7 THEN $8 ELSE nps_sbscrb_nmps END,
         nps_linked = CASE WHEN $7 THEN true ELSE nps_linked END,
         new_acqs_nmps = COALESCE($9, new_acqs_nmps),
         loss_sbscrb_nmps = COALESCE($10, loss_sbscrb_nmps),
         nps_chrg_amt = COALESCE($11, nps_chrg_amt),
         latest_fin_year = COALESCE($12, latest_fin_year),
         latest_revenue = COALESCE($13, latest_revenue),
         latest_operating_income = COALESCE($14, latest_operating_income),
         region_hub_slug = COALESCE($15, region_hub_slug),
         industry_hub_slug = COALESCE($16, industry_hub_slug),
         market_board = COALESCE($17, market_board),
         nts_last_sync_at = NOW(),
         nps_last_sync_at = CASE WHEN $18 THEN NOW() ELSE nps_last_sync_at END,
         fin_last_sync_at = NOW()
       WHERE b_no = $1`,
      [
        cand.b_no,
        newBStt,
        newBSttCd,
        newTaxType,
        newTaxTypeCd,
        effectiveSector,
        npsAdded,
        employees,
        newAcqs,
        losses,
        chrgAmt,
        latestFinYear,
        latestRevenue,
        latestOpIncome,
        regionSlug,
        industrySlug,
        marketBoard,
        npsStale,
      ]
    );

    if (samples.length < 15) {
      samples.push({
        bNo: cand.b_no,
        name: cand.b_nm,
        bStt: newBStt,
        finAdded,
        npsAdded,
        employees,
        latestRevenue,
      });
    }
  }

  // 3. 90일 경과 조회 로그 안전 배치 정리
  let prunedViewLogsCount = 0;
  if (pruneViewLogs) {
    prunedViewLogsCount = await pruneExpiredViewLogs(pruneBatchSize).catch(() => 0);
  }

  // 4. 필요 시 영구 디렉토리 스냅샷 원자적 UPSERT 갱신 (DELETE 무중단 공백 방지)
  let snapshotsRefreshed = false;
  if (refreshSnapshots && (financeEnrichedCount > 0 || npsEnrichedCount > 0 || closedMarkedCount > 0)) {
    try {
      await rebuildAndSaveOverviewSnapshot();
      snapshotsRefreshed = true;
    } catch (e) {
      console.warn("[tier1Enricher] Snapshot refresh failed:", e);
    }
  }

  const finishedAt = new Date().toISOString();
  const report: Tier1EnrichBatchReport = {
    startedAt,
    finishedAt,
    durationMs: Date.now() - startedMs,
    candidatesCount: candidates.length,
    ntsVerifiedCount,
    closedMarkedCount,
    financeEnrichedCount,
    npsEnrichedCount,
    prunedViewLogsCount,
    snapshotsRefreshed,
    samples,
  };

  // 실행 이력 영구 기록 (PK 단건 UPSERT)
  await query(
    `INSERT INTO public.system_settings (key, value, updated_at)
     VALUES ('tier1_enrichment_last_run_v1', $1::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET
       value = EXCLUDED.value,
       updated_at = NOW()`,
    [JSON.stringify(report)]
  ).catch(() => {});

  return report;
}
