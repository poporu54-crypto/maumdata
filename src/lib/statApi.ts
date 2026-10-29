import { query } from "./db";
import {
  sanitizeSectorLabel,
  extractShortRegion,
  formatStartDt,
  formatBizNo,
  formatEokToKorean,
} from "./statFormatters";

export {
  sanitizeSectorLabel,
  extractShortRegion,
  formatStartDt,
  formatBizNo,
  formatEokToKorean,
};

export interface PortalSummaryStats {
  verifiedTotalCount: number;
  activeBizCount: number;
  closedBizCount: number;
  generalTaxCount: number;
  taxFreeCount: number;
  simplifiedTaxCount: number;
  npsCompanyCount: number;
  totalTrackedEmployees: number;
  monthlyNewHires: number;
  monthlyLosses: number;
  financialCompanyCount: number;
  totalDisclosuresCount: number;
  latestSyncDate: string | null;
  latestEmploymentMonth: string | null;
}

export interface MonthlyEmploymentPoint {
  month: string; // YYYY-MM
  companyCount: number;
  employees: number;
  newHires: number;
  losses: number;
  retentionRate: number;
}

export interface RankedCompanyItem {
  bNo: string;
  name: string;
  sector: string;
  region: string;
  taxType: string;
  startDt: string;
  employees: number;
  newHires: number;
  losses: number;
  netChange: number;
  finYear: number | null;
  revenueEok: number | null;
  operatingIncomeEok: number | null;
}

export interface DbSectorStatItem {
  sector: string;
  bizCount: number;
  ratio: number;
  totalEmployees: number;
  topBNo: string | null;
  topBNm: string | null;
}

export interface RegionStatItem {
  region: string;
  bizCount: number;
  ratio: number;
  totalEmployees: number;
  newHires: number;
  topBNo: string | null;
  topBNm: string | null;
}

export interface FoundingYearItem {
  year: string;
  count: number;
}

export interface MacroSectorRatios {
  classifiedTotal: number;
  financeServices: number;
  constructionRealEstate: number;
  manufacturing: number;
  ictCommerce: number;
}

export interface DemoCompanyRealData {
  bNo: string;
  name: string;
  shortLabel: string;
  sector: string;
  listingStatus: string;
  taxStatus: string;
  startDt: string;
  employees: number;
  newHires: number;
  losses: number;
  finYear: number | null;
  revenueEok: number | null;
  operatingIncomeEok: number | null;
  disclosureCount: number;
}

export interface RealPortalStats {
  summary: PortalSummaryStats;
  macroRatios: MacroSectorRatios;
  monthlyEmployment: MonthlyEmploymentPoint[];
  topHiringCompanies: RankedCompanyItem[];
  recentFoundedCompanies: RankedCompanyItem[];
  topNetGrowthCompanies: RankedCompanyItem[];
  topEmployerCompanies: RankedCompanyItem[];
  topRevenueCompanies: RankedCompanyItem[];
  dbSectorDistribution: DbSectorStatItem[];
  regionDistribution: RegionStatItem[];
  foundingByYear: FoundingYearItem[];
  demoShowcaseCompanies: DemoCompanyRealData[];
}

export interface OfficialKosisIndustryRow {
  code: string;
  name: string;
  businessCount: number;
  employeeCount: number;
  ratio: number;
}

export interface OfficialKosisSurvey {
  referenceDateLabel: string; // "2023년 12월 31일 기준"
  sourceName: string; // "국가데이터처(통계청) 전국사업체조사 확정 통계"
  totalBusinesses: number;
  totalEmployees: number;
  industries: OfficialKosisIndustryRow[];
}

const SERVICE_KEY = process.env.DATA_PORTAL_SERVICE_KEY || "";
const SURVEY_API_URL =
  "https://api.odcloud.kr/api/15087673/v1/uddi:32e6d6f0-6d01-4f62-b76e-b0ae5b840573";

function mapRankedCompanyRow(row: any): RankedCompanyItem {
  const employees = Number(row.employees || 0);
  const newHires = Number(row.new_hires || 0);
  const losses = Number(row.losses || 0);
  const revenueRaw = row.revenue !== null && row.revenue !== undefined ? Number(row.revenue) : null;
  const opRaw =
    row.operating_income !== null && row.operating_income !== undefined
      ? Number(row.operating_income)
      : null;

  return {
    bNo: String(row.b_no || "").trim(),
    name: String(row.b_nm || "").trim(),
    sector: sanitizeSectorLabel(row.b_sector),
    region: extractShortRegion(row.b_adr),
    taxType: String(row.tax_type || "부가가치세 일반과세자").trim(),
    startDt: formatStartDt(row.start_dt),
    employees,
    newHires,
    losses,
    netChange: newHires - losses,
    finYear: row.fin_year ? Number(row.fin_year) : null,
    revenueEok: revenueRaw !== null && !Number.isNaN(revenueRaw) ? revenueRaw : null,
    operatingIncomeEok: opRaw !== null && !Number.isNaN(opRaw) ? opRaw : null,
  };
}

let cachedRealStats: RealPortalStats | null = null;
let cachedRealStatsTime = 0;
let inFlightRealStatsPromise: Promise<RealPortalStats> | null = null;
const REAL_STATS_CACHE_TTL_MS = 10 * 60 * 1000; // 10분 서버 인메모리 캐시 (만료 시 SWR 백그라운드 갱신)

async function computeRealPortalStats(): Promise<RealPortalStats> {
  const [
    summaryRes,
    macroRes,
    monthlyEmpRes,
    topHiringRes,
    recentFoundedRes,
    topNetGrowthRes,
    topEmployerRes,
    topRevenueRes,
    sectorRes,
    regionRes,
    foundingYearRes,
    demoRes,
  ] = await Promise.all([
    // 1. 포털 전체 실데이터 요약
    query(`
      SELECT
        COUNT(*) FILTER (
          WHERE b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        )::int AS verified_total_count,
        COUNT(*) FILTER (
          WHERE b_stt_cd = '01' AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        )::int AS active_biz_count,
        COUNT(*) FILTER (
          WHERE b_stt_cd = '03' AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        )::int AS closed_biz_count,
        COUNT(*) FILTER (
          WHERE b_stt_cd = '01' AND tax_type_cd = '01' AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        )::int AS general_tax_count,
        COUNT(*) FILTER (
          WHERE b_stt_cd = '01' AND tax_type_cd = '03' AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        )::int AS tax_free_count,
        COUNT(*) FILTER (
          WHERE b_stt_cd = '01' AND tax_type_cd = '02' AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        )::int AS simplified_tax_count,
        COUNT(*) FILTER (
          WHERE b_stt_cd = '01' AND COALESCE(nps_sbscrb_nmps, 0) > 0 AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        )::int AS nps_company_count,
        COALESCE(SUM(nps_sbscrb_nmps) FILTER (
          WHERE b_stt_cd = '01' AND COALESCE(nps_sbscrb_nmps, 0) > 0 AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        ), 0)::int AS total_tracked_employees,
        COALESCE(SUM(new_acqs_nmps) FILTER (
          WHERE b_stt_cd = '01' AND COALESCE(nps_sbscrb_nmps, 0) > 0 AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        ), 0)::int AS monthly_new_hires,
        COALESCE(SUM(loss_sbscrb_nmps) FILTER (
          WHERE b_stt_cd = '01' AND COALESCE(nps_sbscrb_nmps, 0) > 0 AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        ), 0)::int AS monthly_losses,
        (SELECT COUNT(DISTINCT b_no)::int FROM business_history WHERE revenue > 0) AS financial_company_count,
        (SELECT COUNT(*)::int FROM business_disclosures) AS total_disclosures_count,
        TO_CHAR(
          MAX(
            GREATEST(
              CASE WHEN nts_last_sync_at >= '2020-01-01'::timestamptz AND nts_last_sync_at <= NOW() + INTERVAL '2 days' THEN nts_last_sync_at ELSE NULL END,
              CASE WHEN nps_last_sync_at >= '2020-01-01'::timestamptz AND nps_last_sync_at <= NOW() + INTERVAL '2 days' THEN nps_last_sync_at ELSE NULL END,
              CASE WHEN dart_last_sync_at >= '2020-01-01'::timestamptz AND dart_last_sync_at <= NOW() + INTERVAL '2 days' THEN dart_last_sync_at ELSE NULL END
            )
          ) AT TIME ZONE 'Asia/Seoul',
          'YYYY-MM-DD'
        ) AS latest_sync_date
      FROM businesses
    `),

    // 2. 도넛 차트용 4대 산업 그룹 실데이터 집계
    query(`
      WITH classified AS (
        SELECT
          CASE
            WHEN b_sector ~ '(제조|반도체|전자|자동차|기계|금속|화학|의약|섬유|식품|장비)' THEN 'manufacturing'
            WHEN b_sector ~ '(건설|공사|토목|부동산|건축)' THEN 'constructionRealEstate'
            WHEN b_sector ~ '(소프트웨어|IT|정보|통신|포털|데이터|게임|방송|출판|도매|소매|유통|무역|상사|운수|물류|항공|해운|숙박|음식|커피)' THEN 'ictCommerce'
            ELSE 'financeServices'
          END AS grp
        FROM businesses
        WHERE b_stt_cd = '01'
          AND b_nm IS NOT NULL
          AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
          AND b_sector IS NOT NULL
          AND b_sector NOT IN ('', '-', '상장 법인', '상장법인', 'BIZ_NO미존재사업장', '미등록 업종', '미등록업종', '일반기업', '중소기업', '대기업', '중견기업', '기타 제조업/금융업')
      )
      SELECT grp, COUNT(*)::int AS cnt
      FROM classified
      GROUP BY grp
    `),

    // 3. 국민연금 월별 실고용 시계열 (표본 100개사 이상 확보된 기준월만 추출)
    query(`
      SELECT
        record_month,
        COUNT(DISTINCT b_no)::int AS company_count,
        COALESCE(SUM(employees), 0)::int AS total_employees,
        COALESCE(SUM(new_acquisitions), 0)::int AS total_new_hires,
        COALESCE(SUM(losses), 0)::int AS total_losses
      FROM business_employment_history
      WHERE record_month ~ '^202[0-9]-(0[1-9]|1[0-2])$'
      GROUP BY record_month
      HAVING COUNT(DISTINCT b_no) >= 100
      ORDER BY record_month ASC
      LIMIT 12
    `),

    // 4. 최근 월 신규 채용(입사자) 상위 TOP 15 계속사업자
    query(`
      SELECT
        b_no, b_nm, b_sector, b_adr, tax_type, start_dt,
        COALESCE(nps_sbscrb_nmps, 0)::int AS employees,
        COALESCE(new_acqs_nmps, 0)::int AS new_hires,
        COALESCE(loss_sbscrb_nmps, 0)::int AS losses
      FROM businesses
      WHERE b_stt_cd = '01'
        AND b_nm IS NOT NULL
        AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        AND COALESCE(new_acqs_nmps, 0) > 0
      ORDER BY COALESCE(new_acqs_nmps, 0) DESC, COALESCE(nps_sbscrb_nmps, 0) DESC
      LIMIT 15
    `),

    // 5. 최근 실제 설립 검증 법인 TOP 12 (실제 고용/실체 법인 우선, SPC/스팩 후순위)
    query(`
      SELECT
        b_no, b_nm, b_sector, b_adr, tax_type, start_dt,
        COALESCE(nps_sbscrb_nmps, 0)::int AS employees,
        COALESCE(new_acqs_nmps, 0)::int AS new_hires,
        COALESCE(loss_sbscrb_nmps, 0)::int AS losses
      FROM businesses
      WHERE b_stt_cd = '01'
        AND b_nm IS NOT NULL
        AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        AND start_dt ~ '^202[3-6](0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$'
      ORDER BY
        CASE WHEN b_nm ~ '(기업인수목적|유동화|제[일이기삼사오육칠팔구십0-9]+차)' THEN 1 ELSE 0 END ASC,
        CASE WHEN COALESCE(nps_sbscrb_nmps, 0) > 0 THEN 0 ELSE 1 END ASC,
        start_dt DESC,
        COALESCE(nps_sbscrb_nmps, 0) DESC
      LIMIT 12
    `),

    // 6. 고용 순증가(입사 - 퇴사 > 0) 우수 계속사업자 TOP 12
    query(`
      SELECT
        b_no, b_nm, b_sector, b_adr, tax_type, start_dt,
        COALESCE(nps_sbscrb_nmps, 0)::int AS employees,
        COALESCE(new_acqs_nmps, 0)::int AS new_hires,
        COALESCE(loss_sbscrb_nmps, 0)::int AS losses
      FROM businesses
      WHERE b_stt_cd = '01'
        AND b_nm IS NOT NULL
        AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        AND COALESCE(nps_sbscrb_nmps, 0) >= 100
        AND (COALESCE(new_acqs_nmps, 0) - COALESCE(loss_sbscrb_nmps, 0)) > 0
      ORDER BY
        (COALESCE(new_acqs_nmps, 0) - COALESCE(loss_sbscrb_nmps, 0)) DESC,
        COALESCE(nps_sbscrb_nmps, 0) DESC
      LIMIT 12
    `),

    // 7. 국민연금 가입 임직원 규모 상위 TOP 12 계속사업자
    query(`
      SELECT
        b_no, b_nm, b_sector, b_adr, tax_type, start_dt,
        COALESCE(nps_sbscrb_nmps, 0)::int AS employees,
        COALESCE(new_acqs_nmps, 0)::int AS new_hires,
        COALESCE(loss_sbscrb_nmps, 0)::int AS losses
      FROM businesses
      WHERE b_stt_cd = '01'
        AND b_nm IS NOT NULL
        AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        AND COALESCE(nps_sbscrb_nmps, 0) > 0
      ORDER BY COALESCE(nps_sbscrb_nmps, 0) DESC, COALESCE(new_acqs_nmps, 0) DESC
      LIMIT 12
    `),

    // 8. DART 재무제표 결산 매출액 상위 TOP 12 계속사업자
    query(`
      WITH latest_fin AS (
        SELECT DISTINCT ON (b_no) b_no, year AS fin_year, revenue, operating_income
        FROM business_history
        WHERE revenue > 0
        ORDER BY b_no, year DESC
      )
      SELECT
        b.b_no, b.b_nm, b.b_sector, b.b_adr, b.tax_type, b.start_dt,
        COALESCE(b.nps_sbscrb_nmps, 0)::int AS employees,
        COALESCE(b.new_acqs_nmps, 0)::int AS new_hires,
        COALESCE(b.loss_sbscrb_nmps, 0)::int AS losses,
        f.fin_year, f.revenue, f.operating_income
      FROM latest_fin f
      JOIN businesses b ON b.b_no = f.b_no
      WHERE b.b_stt_cd = '01'
        AND b.b_nm IS NOT NULL
        AND b.b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
      ORDER BY f.revenue DESC
      LIMIT 12
    `),

    // 9. 마음데이타 DB 검증 기업 세부 업종별 분포 TOP 15 + 업종 대표 기업
    query(`
      WITH latest_fin AS (
        SELECT DISTINCT ON (b_no) b_no, revenue
        FROM business_history
        WHERE revenue > 0
        ORDER BY b_no, year DESC
      )
      SELECT
        b.b_sector AS sector,
        COUNT(*)::int AS biz_cnt,
        COALESCE(SUM(b.nps_sbscrb_nmps), 0)::int AS emp_cnt,
        (array_agg(
          b.b_no
          ORDER BY
            CASE WHEN b.b_nm ~ '(기업인수목적|유동화|제[일이기삼사오육칠팔구십0-9]+차)' THEN 1 ELSE 0 END ASC,
            COALESCE(f.revenue, 0) DESC,
            COALESCE(b.nps_sbscrb_nmps, 0) DESC,
            COALESCE(b.view_count, 0) DESC
        ))[1] AS top_b_no,
        (array_agg(
          b.b_nm
          ORDER BY
            CASE WHEN b.b_nm ~ '(기업인수목적|유동화|제[일이기삼사오육칠팔구십0-9]+차)' THEN 1 ELSE 0 END ASC,
            COALESCE(f.revenue, 0) DESC,
            COALESCE(b.nps_sbscrb_nmps, 0) DESC,
            COALESCE(b.view_count, 0) DESC
        ))[1] AS top_b_nm
      FROM businesses b
      LEFT JOIN latest_fin f ON f.b_no = b.b_no
      WHERE b.b_stt_cd = '01'
        AND b.b_nm IS NOT NULL
        AND b.b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        AND b.b_sector IS NOT NULL
        AND b.b_sector NOT IN ('', '-', '상장 법인', '상장법인', 'BIZ_NO미존재사업장', '미등록 업종', '미등록업종', '일반기업', '중소기업', '대기업', '중견기업', '기타 제조업/금융업', '기타 서비스업')
      GROUP BY b.b_sector
      ORDER BY biz_cnt DESC
      LIMIT 15
    `),

    // 10. 전국 17개 광역시·도 정규화 분포 + 시·도 대표 기업
    query(`
      WITH latest_fin AS (
        SELECT DISTINCT ON (b_no) b_no, revenue
        FROM business_history
        WHERE revenue > 0
        ORDER BY b_no, year DESC
      ),
      norm AS (
        SELECT
          b.b_no,
          b.b_nm,
          b.view_count,
          COALESCE(f.revenue, 0) AS revenue,
          COALESCE(b.nps_sbscrb_nmps, 0) AS emp,
          COALESCE(b.new_acqs_nmps, 0) AS new_emp,
          CASE
            WHEN b.b_adr ~ '^(서울|서울특별시|서울시)' THEN '서울특별시'
            WHEN b.b_adr ~ '^(경기|경기도)' THEN '경기도'
            WHEN b.b_adr ~ '^(부산|부산광역시|부산시)' THEN '부산광역시'
            WHEN b.b_adr ~ '^(인천|인천광역시|인천시)' THEN '인천광역시'
            WHEN b.b_adr ~ '^(대구|대구광역시|대구시)' THEN '대구광역시'
            WHEN b.b_adr ~ '^(대전|대전광역시|대전시)' THEN '대전광역시'
            WHEN b.b_adr ~ '^(광주|광주광역시|광주시)' THEN '광주광역시'
            WHEN b.b_adr ~ '^(울산|울산광역시|울산시)' THEN '울산광역시'
            WHEN b.b_adr ~ '^(세종|세종특별자치시|세종시)' THEN '세종특별자치시'
            WHEN b.b_adr ~ '^(강원|강원특별자치도|강원도)' THEN '강원특별자치도'
            WHEN b.b_adr ~ '^(충북|충청북도)' THEN '충청북도'
            WHEN b.b_adr ~ '^(충남|충청남도)' THEN '충청남도'
            WHEN b.b_adr ~ '^(전북|전북특별자치도|전라북도)' THEN '전북특별자치도'
            WHEN b.b_adr ~ '^(전남|전라남도)' THEN '전라남도'
            WHEN b.b_adr ~ '^(경북|경상북도)' THEN '경상북도'
            WHEN b.b_adr ~ '^(경남|경상남도)' THEN '경상남도'
            WHEN b.b_adr ~ '^(제주|제주특별자치도|제주도)' THEN '제주특별자치도'
            ELSE NULL
          END AS region
        FROM businesses b
        LEFT JOIN latest_fin f ON f.b_no = b.b_no
        WHERE b.b_stt_cd = '01'
          AND b.b_nm IS NOT NULL
          AND b.b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
      )
      SELECT
        region,
        COUNT(*)::int AS biz_cnt,
        SUM(emp)::int AS total_emp,
        SUM(new_emp)::int AS total_new_emp,
        (array_agg(b_no ORDER BY revenue DESC, emp DESC, COALESCE(view_count, 0) DESC))[1] AS top_b_no,
        (array_agg(b_nm ORDER BY revenue DESC, emp DESC, COALESCE(view_count, 0) DESC))[1] AS top_b_nm
      FROM norm
      WHERE region IS NOT NULL
      GROUP BY region
      ORDER BY biz_cnt DESC
    `),

    // 11. 설립연도별 실제 법인 분포 (최근 10개년: 2016~2025)
    query(`
      SELECT
        SUBSTRING(start_dt, 1, 4) AS yr,
        COUNT(*)::int AS cnt
      FROM businesses
      WHERE b_stt_cd = '01'
        AND b_nm IS NOT NULL
        AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
        AND start_dt ~ '^(201[6-9]|202[0-5])(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$'
      GROUP BY SUBSTRING(start_dt, 1, 4)
      ORDER BY yr ASC
    `),

    // 12. 메인 홈 1초 인터랙티브 미리보기용 실제 검증 기업 4선 조회
    query(`
      WITH latest_fin AS (
        SELECT DISTINCT ON (b_no) b_no, year AS fin_year, revenue, operating_income
        FROM business_history
        WHERE revenue > 0
        ORDER BY b_no, year DESC
      )
      SELECT
        b.b_no,
        b.b_nm,
        b.b_sector,
        b.listing_status,
        b.b_stt,
        b.tax_type,
        b.start_dt,
        COALESCE(b.nps_sbscrb_nmps, 0)::int AS employees,
        COALESCE(b.new_acqs_nmps, 0)::int AS new_hires,
        COALESCE(b.loss_sbscrb_nmps, 0)::int AS losses,
        f.fin_year,
        f.revenue,
        f.operating_income,
        (SELECT COUNT(*)::int FROM business_disclosures d WHERE d.b_no = b.b_no) AS disc_count
      FROM businesses b
      LEFT JOIN latest_fin f ON f.b_no = b.b_no
      WHERE b.b_no IN ('1198102316', '1208801280', '1108114794', '1248100998')
    `),
  ]);

  const sRow = summaryRes.rows[0] || {};
  const monthlyEmployment: MonthlyEmploymentPoint[] = monthlyEmpRes.rows.map((r: any) => {
    const emp = Number(r.total_employees || 0);
    const losses = Number(r.total_losses || 0);
    const retention =
      emp > 0 ? Number((((emp - Math.min(emp, losses)) / emp) * 100).toFixed(2)) : 0;
    return {
      month: String(r.record_month),
      companyCount: Number(r.company_count || 0),
      employees: emp,
      newHires: Number(r.total_new_hires || 0),
      losses,
      retentionRate: retention,
    };
  });

  const latestEmploymentMonth =
    monthlyEmployment.length > 0
      ? monthlyEmployment[monthlyEmployment.length - 1].month
      : null;

  const summary: PortalSummaryStats = {
    verifiedTotalCount: Number(sRow.verified_total_count || 0),
    activeBizCount: Number(sRow.active_biz_count || 0),
    closedBizCount: Number(sRow.closed_biz_count || 0),
    generalTaxCount: Number(sRow.general_tax_count || 0),
    taxFreeCount: Number(sRow.tax_free_count || 0),
    simplifiedTaxCount: Number(sRow.simplified_tax_count || 0),
    npsCompanyCount: Number(sRow.nps_company_count || 0),
    totalTrackedEmployees: Number(sRow.total_tracked_employees || 0),
    monthlyNewHires: Number(sRow.monthly_new_hires || 0),
    monthlyLosses: Number(sRow.monthly_losses || 0),
    financialCompanyCount: Number(sRow.financial_company_count || 0),
    totalDisclosuresCount: Number(sRow.total_disclosures_count || 0),
    latestSyncDate: sRow.latest_sync_date || null,
    latestEmploymentMonth,
  };

  // 도넛 차트용 4대 산업 그룹 비중 계산
  const macroMap: Record<string, number> = {
    financeServices: 0,
    constructionRealEstate: 0,
    manufacturing: 0,
    ictCommerce: 0,
  };
  for (const r of macroRes.rows) {
    if (r.grp in macroMap) {
      macroMap[r.grp] = Number(r.cnt || 0);
    }
  }
  const classifiedTotal =
    macroMap.financeServices +
    macroMap.constructionRealEstate +
    macroMap.manufacturing +
    macroMap.ictCommerce;

  let macroRatios: MacroSectorRatios = {
    classifiedTotal,
    financeServices: 0,
    constructionRealEstate: 0,
    manufacturing: 0,
    ictCommerce: 0,
  };
  if (classifiedTotal > 0) {
    const fs = Number(((macroMap.financeServices / classifiedTotal) * 100).toFixed(1));
    const cr = Number(((macroMap.constructionRealEstate / classifiedTotal) * 100).toFixed(1));
    const mf = Number(((macroMap.manufacturing / classifiedTotal) * 100).toFixed(1));
    const ic = Number(Math.max(0, 100 - (fs + cr + mf)).toFixed(1));
    macroRatios = {
      classifiedTotal,
      financeServices: fs,
      constructionRealEstate: cr,
      manufacturing: mf,
      ictCommerce: ic,
    };
  }

  const activeTotalForRatio = Math.max(1, summary.activeBizCount);

  const dbSectorDistribution: DbSectorStatItem[] = sectorRes.rows.map((r: any) => {
    const bizCount = Number(r.biz_cnt || 0);
    return {
      sector: sanitizeSectorLabel(r.sector),
      bizCount,
      ratio: Number(((bizCount / Math.max(1, classifiedTotal)) * 100).toFixed(1)),
      totalEmployees: Number(r.emp_cnt || 0),
      topBNo: r.top_b_no ? String(r.top_b_no).trim() : null,
      topBNm: r.top_b_nm ? String(r.top_b_nm).trim() : null,
    };
  });

  const regionTotalBiz = regionRes.rows.reduce(
    (acc: number, cur: any) => acc + Number(cur.biz_cnt || 0),
    0
  );
  const regionDistribution: RegionStatItem[] = regionRes.rows.map((r: any) => {
    const bizCount = Number(r.biz_cnt || 0);
    const denom = Math.max(1, regionTotalBiz || activeTotalForRatio);
    return {
      region: String(r.region),
      bizCount,
      ratio: Number(((bizCount / denom) * 100).toFixed(1)),
      totalEmployees: Number(r.total_emp || 0),
      newHires: Number(r.total_new_emp || 0),
      topBNo: r.top_b_no ? String(r.top_b_no).trim() : null,
      topBNm: r.top_b_nm ? String(r.top_b_nm).trim() : null,
    };
  });

  const foundingByYear: FoundingYearItem[] = foundingYearRes.rows.map((r: any) => ({
    year: String(r.yr),
    count: Number(r.cnt || 0),
  }));

  // 데모 쇼케이스 기업 순서 정렬 (기아 -> 비바리퍼블리카 -> 대한항공 -> 삼성전자)
  const demoOrder = ["1198102316", "1208801280", "1108114794", "1248100998"];
  const shortLabelMap: Record<string, string> = {
    "1198102316": "기아",
    "1208801280": "비바리퍼블리카(토스)",
    "1108114794": "대한항공",
    "1248100998": "삼성전자",
  };

  const demoShowcaseCompanies: DemoCompanyRealData[] = demoOrder
    .map((bNo) => demoRes.rows.find((r: any) => String(r.b_no) === bNo))
    .filter(Boolean)
    .map((r: any) => {
      const bNo = String(r.b_no).trim();
      const rev = r.revenue !== null && r.revenue !== undefined ? Number(r.revenue) : null;
      const op =
        r.operating_income !== null && r.operating_income !== undefined
          ? Number(r.operating_income)
          : null;
      return {
        bNo,
        name: String(r.b_nm || "").trim(),
        shortLabel: shortLabelMap[bNo] || String(r.b_nm || "").trim(),
        sector: sanitizeSectorLabel(r.b_sector),
        listingStatus: String(r.listing_status || "법인").trim(),
        taxStatus: `${String(r.b_stt || "계속사업자").trim()} · ${String(r.tax_type || "일반과세자").trim()}`,
        startDt: formatStartDt(r.start_dt),
        employees: Number(r.employees || 0),
        newHires: Number(r.new_hires || 0),
        losses: Number(r.losses || 0),
        finYear: r.fin_year ? Number(r.fin_year) : null,
        revenueEok: rev !== null && !Number.isNaN(rev) ? rev : null,
        operatingIncomeEok: op !== null && !Number.isNaN(op) ? op : null,
        disclosureCount: Number(r.disc_count || 0),
      };
    });

  const result: RealPortalStats = {
    summary,
    macroRatios,
    monthlyEmployment,
    topHiringCompanies: topHiringRes.rows.map(mapRankedCompanyRow),
    recentFoundedCompanies: recentFoundedRes.rows.map(mapRankedCompanyRow),
    topNetGrowthCompanies: topNetGrowthRes.rows.map(mapRankedCompanyRow),
    topEmployerCompanies: topEmployerRes.rows.map(mapRankedCompanyRow),
    topRevenueCompanies: topRevenueRes.rows.map(mapRankedCompanyRow),
    dbSectorDistribution,
    regionDistribution,
    foundingByYear,
    demoShowcaseCompanies,
  };

  cachedRealStats = result;
  cachedRealStatsTime = Date.now();
  return result;
}

/**
 * 마음데이타 Neon PostgreSQL에 실제 동기화된 기업·국민연금·DART 데이터를
 * 일체의 추정 공식이나 가짜 폴백 없이 100% 실시간 SQL로 집계하여 반환합니다.
 * (동시 요청 In-flight 병합 및 Stale-While-Revalidate 백그라운드 갱신 적용)
 */
export async function getRealPortalStats(): Promise<RealPortalStats> {
  const now = Date.now();
  if (cachedRealStats && now - cachedRealStatsTime < REAL_STATS_CACHE_TTL_MS) {
    return cachedRealStats;
  }

  if (!inFlightRealStatsPromise) {
    inFlightRealStatsPromise = computeRealPortalStats().finally(() => {
      inFlightRealStatsPromise = null;
    });
  }

  if (cachedRealStats) {
    inFlightRealStatsPromise.catch((err) => {
      console.error("[statApi] Background stats refresh failed:", err);
    });
    return cachedRealStats;
  }

  return inFlightRealStatsPromise;
}

let cachedKosisSurvey: OfficialKosisSurvey | null = null;
let cachedKosisTime = 0;
let inFlightKosisPromise: Promise<OfficialKosisSurvey | null> | null = null;
const KOSIS_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 확정 공식 통계이므로 6시간 캐시

/**
 * 공공데이터포털 통계청 전국사업체조사(19대 산업 대분류) 공식 확정 통계를 조회합니다.
 * - 실제 공식 발표 기준일("2023년 12월 31일 기준")을 정직하게 고정 표기합니다.
 * - 외부 API가 실패하거나 비정상일 경우 가짜 폴백 데이터를 절대로 반환하지 않고 null을 반환합니다.
 */
export async function getOfficialKosisSurvey(): Promise<OfficialKosisSurvey | null> {
  const now = Date.now();
  if (cachedKosisSurvey && now - cachedKosisTime < KOSIS_CACHE_TTL_MS) {
    return cachedKosisSurvey;
  }

  if (!SERVICE_KEY) {
    return null;
  }

  if (!inFlightKosisPromise) {
    inFlightKosisPromise = (async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4500);
        const surveyUrl = `${SURVEY_API_URL}?serviceKey=${SERVICE_KEY}&page=1&perPage=2000`;
        const res = await fetch(surveyUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
          next: { revalidate: 21600 },
          signal: controller.signal,
        });
        clearTimeout(timer);

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    const items = Array.isArray(json?.data) ? json.data : [];
    const majors = items.filter(
      (x: any) =>
        typeof x?.["산업분류코드"] === "string" &&
        x["산업분류코드"].length === 8 &&
        /[A-Z]$/.test(x["산업분류코드"])
    );

    if (majors.length === 0) {
      return null;
    }

    let totalBusinesses = 0;
    let totalEmployees = 0;

    const rawRows = majors.map((item: any) => {
      const code = String(item["산업분류코드"]).trim();
      const name = String(item["산업분류명"] || code).trim();
      const businessCount = parseInt(String(item["총사업체수"] || "0").replace(/,/g, ""), 10) || 0;
      const employeeCount = parseInt(String(item["총종사자수"] || "0").replace(/,/g, ""), 10) || 0;
      totalBusinesses += businessCount;
      totalEmployees += employeeCount;
      return { code, name, businessCount, employeeCount };
    });

    if (totalBusinesses <= 0) {
      return null;
    }

    const industries: OfficialKosisIndustryRow[] = rawRows
      .map((row: any) => ({
        ...row,
        ratio: Number(((row.businessCount / totalBusinesses) * 100).toFixed(2)),
      }))
      .sort((a: OfficialKosisIndustryRow, b: OfficialKosisIndustryRow) => b.businessCount - a.businessCount);

    const survey: OfficialKosisSurvey = {
      referenceDateLabel: "2023년 12월 31일 기준",
      sourceName: "국가데이터처(통계청) 전국사업체조사 확정 통계",
      totalBusinesses,
      totalEmployees,
      industries,
    };

        cachedKosisSurvey = survey;
        cachedKosisTime = Date.now();
        return survey;
      } catch (err) {
        console.error("[statApi] Official KOSIS survey API unavailable (no fallback used):", err);
        return cachedKosisSurvey;
      } finally {
        inFlightKosisPromise = null;
      }
    })();
  }

  if (cachedKosisSurvey) {
    return cachedKosisSurvey;
  }

  return inFlightKosisPromise;
}
