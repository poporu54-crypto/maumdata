import { cache } from "react";
import { query } from "@/lib/db";
import { estimateAnnualSalaryManwon, resolveMarketBoard } from "@/lib/directoryConfig";
import { extractShortRegion, sanitizeSectorLabel } from "@/lib/statFormatters";

export interface CompareYearlyFinance {
  year: number;
  revenueEok: number;
  operatingIncomeEok: number;
  netIncomeEok: number;
  totalAssetsEok: number;
  totalLiabilitiesEok: number;
  totalEquityEok: number;
  operatingMarginPct: number | null;
  debtRatioPct: number | null;
}

export interface CompanyCompareProfile {
  bNo: string;
  name: string;
  representative: string;
  sector: string;
  shortRegion: string;
  address: string;
  startDt: string;
  foundedYear: number | null;
  bStt: string;
  taxType: string;
  marketBoard: "KOSPI" | "KOSDAQ" | null;
  listingStatus: string;
  homepage: string;
  employees: number;
  newHires: number;
  losses: number;
  netEmpChange: number;
  joinRatePct: number | null;
  exitRatePct: number | null;
  estimatedSalaryManwon: number | null;
  estimatedSalaryLabel: string | null;
  salaryCapped: boolean;
  latestFinance: CompareYearlyFinance | null;
  financeHistory: CompareYearlyFinance[];
  disclosureCount: number;
  patentCount: number;
  bidCount: number;
}

export interface CompareMatchupPayload {
  companyA: CompanyCompareProfile;
  companyB: CompanyCompareProfile;
  highlights: Array<{
    metric: string;
    winner: "A" | "B" | "TIE";
    summaryText: string;
  }>;
}

function parseFoundedYear(startDt: string | null | undefined): number | null {
  if (!startDt) return null;
  const digits = String(startDt).replace(/[^0-9]/g, "");
  if (digits.length >= 4) {
    const yr = Number(digits.slice(0, 4));
    if (yr >= 1900 && yr <= 2100) return yr;
  }
  return null;
}

function buildFinanceRow(r: any): CompareYearlyFinance {
  const rev = Math.round(Number(r.revenue || 0) * 10) / 10;
  const op = Math.round(Number(r.operating_income || 0) * 10) / 10;
  const net = Math.round(Number(r.net_income || 0) * 10) / 10;
  const assets = Math.round(Number(r.total_assets || 0) * 10) / 10;
  const liab = Math.round(Number(r.total_liabilities || 0) * 10) / 10;
  const eq = Math.round(Number(r.total_equity || 0) * 10) / 10;

  let operatingMarginPct: number | null = null;
  if (rev > 0) {
    const pct = (op / rev) * 100;
    if (Number.isFinite(pct) && Math.abs(pct) <= 999) {
      operatingMarginPct = Math.round(pct * 10) / 10;
    }
  }

  let debtRatioPct: number | null = null;
  if (eq > 0 && liab >= 0) {
    const dr = (liab / eq) * 100;
    if (Number.isFinite(dr) && dr <= 99999) {
      debtRatioPct = Math.round(dr * 10) / 10;
    }
  }

  return {
    year: Number(r.year),
    revenueEok: rev,
    operatingIncomeEok: op,
    netIncomeEok: net,
    totalAssetsEok: assets,
    totalLiabilitiesEok: liab,
    totalEquityEok: eq,
    operatingMarginPct,
    debtRatioPct,
  };
}

/**
 * 두 기업의 PK(`b_no = ANY($1)`) 및 인덱스를 병렬 조회하여 풀스캔 없이(`~2ms`) 1:1 스펙 비교 데이터를 생성합니다.
 */
export const getCompareMatchup = cache(
  async (rawBNoA: string, rawBNoB: string): Promise<CompareMatchupPayload | null> => {
    const bNoA = String(rawBNoA || "").replace(/[^0-9]/g, "");
    const bNoB = String(rawBNoB || "").replace(/[^0-9]/g, "");
    if (bNoA.length !== 10 || bNoB.length !== 10 || bNoA === bNoB) {
      return null;
    }

    const pair = [bNoA, bNoB];

    const [bizRes, histRes, discRes, patRes, bidRes] = await Promise.all([
      query(
        `SELECT
           b_no, b_nm, p_nm, start_dt, b_adr, b_sector, b_stt, tax_type,
           listing_status, market_board, homepage,
           nps_sbscrb_nmps, new_acqs_nmps, loss_sbscrb_nmps, nps_chrg_amt
         FROM public.businesses
         WHERE b_no = ANY($1::varchar[])`,
        [pair]
      ),
      query(
        `SELECT b_no, year, revenue, operating_income, net_income, total_assets, total_liabilities, total_equity
         FROM public.business_history
         WHERE b_no = ANY($1::varchar[])
         ORDER BY year DESC`,
        [pair]
      ),
      query(
        `SELECT b_no, COUNT(*)::int AS cnt
         FROM public.business_disclosures
         WHERE b_no = ANY($1::varchar[])
         GROUP BY b_no`,
        [pair]
      ),
      query(
        `SELECT b_no, COUNT(*)::int AS cnt
         FROM public.business_patents
         WHERE b_no = ANY($1::varchar[])
         GROUP BY b_no`,
        [pair]
      ).catch(() => ({ rows: [] as any[] })),
      query(
        `SELECT b_no, COUNT(*)::int AS cnt
         FROM public.business_bids
         WHERE b_no = ANY($1::varchar[])
         GROUP BY b_no`,
        [pair]
      ).catch(() => ({ rows: [] as any[] })),
    ]);

    const bizMap = new Map<string, any>();
    for (const r of bizRes.rows) bizMap.set(String(r.b_no), r);

    // 아직 로컬 DB에 적재되지 않은 신규 상장/외감 법인을 선택한 경우 온디맨드 동기화 후 재조회
    if (!bizMap.has(bNoA) || !bizMap.has(bNoB)) {
      try {
        const { getUnifiedBusinessData } = await import("@/app/biz/[b_no]/utils/dataLoader");
        const missing = [!bizMap.has(bNoA) ? bNoA : null, !bizMap.has(bNoB) ? bNoB : null].filter(
          (v): v is string => Boolean(v)
        );
        await Promise.all(missing.map((m) => getUnifiedBusinessData(m)));
        const retryBiz = await query(
          `SELECT
             b_no, b_nm, p_nm, start_dt, b_adr, b_sector, b_stt, tax_type,
             listing_status, market_board, homepage,
             nps_sbscrb_nmps, new_acqs_nmps, loss_sbscrb_nmps, nps_chrg_amt
           FROM public.businesses
           WHERE b_no = ANY($1::varchar[])`,
          [pair]
        );
        for (const r of retryBiz.rows) bizMap.set(String(r.b_no), r);
      } catch (e) {
        console.warn("[compareApi] On-demand hydration skipped:", e);
      }
    }

    const rowA = bizMap.get(bNoA);
    const rowB = bizMap.get(bNoB);
    if (!rowA || !rowB) {
      return null;
    }

    const histMap = new Map<string, CompareYearlyFinance[]>();
    for (const r of histRes.rows) {
      const k = String(r.b_no);
      const list = histMap.get(k) || [];
      if (list.length < 3) {
        list.push(buildFinanceRow(r));
      }
      histMap.set(k, list);
    }

    const discMap = new Map<string, number>();
    for (const r of discRes.rows) discMap.set(String(r.b_no), Number(r.cnt || 0));

    const patMap = new Map<string, number>();
    for (const r of patRes.rows) patMap.set(String(r.b_no), Number(r.cnt || 0));

    const bidMap = new Map<string, number>();
    for (const r of bidRes.rows) bidMap.set(String(r.b_no), Number(r.cnt || 0));

    const buildProfile = (bNo: string, row: any): CompanyCompareProfile => {
      const employees = Number(row.nps_sbscrb_nmps || 0);
      const newHires = Number(row.new_acqs_nmps || 0);
      const losses = Number(row.loss_sbscrb_nmps || 0);
      const chrg = Number(row.nps_chrg_amt || 0);
      const sal = estimateAnnualSalaryManwon(chrg, employees);
      const finList = histMap.get(bNo) || [];

      const joinRatePct =
        employees > 0 ? Math.round((newHires / employees) * 1000) / 10 : null;
      const exitRatePct =
        employees > 0 ? Math.round((losses / employees) * 1000) / 10 : null;

      return {
        bNo,
        name: String(row.b_nm || "").trim(),
        representative: row.p_nm && row.p_nm !== "-" ? String(row.p_nm).trim() : "-",
        sector: sanitizeSectorLabel(row.b_sector),
        shortRegion: extractShortRegion(row.b_adr),
        address: row.b_adr && row.b_adr !== "-" ? String(row.b_adr).trim() : "-",
        startDt: row.start_dt ? String(row.start_dt).trim() : "",
        foundedYear: parseFoundedYear(row.start_dt),
        bStt: row.b_stt || "계속사업자",
        taxType: row.tax_type || "-",
        marketBoard:
          (row.market_board as "KOSPI" | "KOSDAQ" | null) ||
          resolveMarketBoard(row.listing_status),
        listingStatus: row.listing_status || "비상장",
        homepage: row.homepage && row.homepage !== "-" ? String(row.homepage).trim() : "",
        employees,
        newHires,
        losses,
        netEmpChange: newHires - losses,
        joinRatePct,
        exitRatePct,
        estimatedSalaryManwon: sal ? sal.yearlyManwon : null,
        estimatedSalaryLabel: sal ? sal.label : null,
        salaryCapped: sal ? sal.isCapped : false,
        latestFinance: finList[0] || null,
        financeHistory: finList,
        disclosureCount: discMap.get(bNo) || 0,
        patentCount: patMap.get(bNo) || 0,
        bidCount: bidMap.get(bNo) || 0,
      };
    };

    const companyA = buildProfile(bNoA, rowA);
    const companyB = buildProfile(bNoB, rowB);

    const highlights: CompareMatchupPayload["highlights"] = [];

    if (companyA.estimatedSalaryManwon && companyB.estimatedSalaryManwon) {
      const diff = companyA.estimatedSalaryManwon - companyB.estimatedSalaryManwon;
      highlights.push({
        metric: "추정 평균연봉",
        winner: diff > 0 ? "A" : diff < 0 ? "B" : "TIE",
        summaryText:
          diff === 0
            ? "국민연금 상한 기준 동일 수준"
            : `${diff > 0 ? companyA.name : companyB.name} +${Math.abs(diff).toLocaleString("ko-KR")}만원 우위`,
      });
    }

    if (companyA.employees > 0 && companyB.employees > 0) {
      const diff = companyA.employees - companyB.employees;
      highlights.push({
        metric: "고용 규모(임직원)",
        winner: diff > 0 ? "A" : diff < 0 ? "B" : "TIE",
        summaryText:
          diff === 0
            ? "임직원 수 동일"
            : `${diff > 0 ? companyA.name : companyB.name} +${Math.abs(diff).toLocaleString("ko-KR")}명 더 많음`,
      });
    }

    if (companyA.latestFinance?.revenueEok && companyB.latestFinance?.revenueEok) {
      const revA = companyA.latestFinance.revenueEok;
      const revB = companyB.latestFinance.revenueEok;
      highlights.push({
        metric: "최근 결산 매출액",
        winner: revA > revB ? "A" : revA < revB ? "B" : "TIE",
        summaryText: `${revA >= revB ? companyA.name : companyB.name} 매출 우위`,
      });
    }

    if (
      companyA.latestFinance?.operatingMarginPct !== null &&
      companyA.latestFinance?.operatingMarginPct !== undefined &&
      companyB.latestFinance?.operatingMarginPct !== null &&
      companyB.latestFinance?.operatingMarginPct !== undefined
    ) {
      const mA = companyA.latestFinance.operatingMarginPct;
      const mB = companyB.latestFinance.operatingMarginPct;
      const diff = Math.round((mA - mB) * 10) / 10;
      highlights.push({
        metric: "영업이익률(수익성)",
        winner: diff > 0 ? "A" : diff < 0 ? "B" : "TIE",
        summaryText:
          diff === 0
            ? "영업이익률 동일"
            : `${diff > 0 ? companyA.name : companyB.name} +${Math.abs(diff)}%p 우위`,
      });
    }

    return { companyA, companyB, highlights };
  }
);
