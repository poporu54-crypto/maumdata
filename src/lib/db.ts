import { Pool } from "pg";
import { getKsicName, getPeerSectorGroup } from "./ksicMap";
import {
  resolveRegionHubSlug,
  resolveIndustryHubSlug,
  resolveMarketBoard,
} from "./directoryConfig";
import {
  getIndustryStatsSnapshot,
  computeCumeDistAsc,
  computeRankDescFromAsc,
  computeCumeDistLowerIsBetter,
} from "./industryStatsSnapshot";


declare global {
  var pgPool: Pool | undefined;
}

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!global.pgPool) {
  global.pgPool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10, // 서버리스 환경을 고려한 커넥션 풀 개수 가드
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export const pool = global.pgPool;

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log(`[DB Query] Executed: ${text.substring(0, 80).replace(/\n/g, " ")}... in ${duration}ms`);
  return res;
}

// 1. 특정 사업자번호로 기업 상세 정보 및 재무이력 조회 (순수 조회 전용 — 조회수 증가 사이드이펙트 분리)
export async function getBusinessByBNo(bNo: string) {
  const clean = bNo.replace(/[^0-9]/g, "");
  const bizResult = await query("SELECT * FROM businesses WHERE b_no = $1 LIMIT 1", [clean]);
  if (bizResult.rows.length === 0) return null;

  const business = bizResult.rows[0];

  // 1:N 연도별 재무 이력 · 타임라인 연혁 · 월별 고용 이력을 병렬(Promise.all)로 동시에 조회하여 RTT 지연 최소화
  const [histResult, timelineResult, empHistResult] = await Promise.all([
    query(
      `SELECT year, revenue, operating_income as "operatingIncome", net_income as "netIncome", 
              total_assets as "totalAssets", total_liabilities as "totalLiabilities", 
              total_equity as "totalEquity", employees 
       FROM business_history 
       WHERE b_no = $1 
       ORDER BY year ASC`,
      [clean]
    ),
    query(
      `SELECT event_date as "eventDate", event_title as "eventTitle", event_description as "eventDescription"
       FROM business_timeline
       WHERE b_no = $1
       ORDER BY event_date DESC`,
      [clean]
    ),
    query(
      `SELECT record_month as "recordMonth", employees, new_acquisitions as "newAcquisitions", 
              losses, nps_charge_amount as "npsChargeAmount"
       FROM business_employment_history
       WHERE b_no = $1
       ORDER BY record_month ASC`,
      [clean]
    ),
  ]);

  return {
    b_no: business.b_no,
    b_nm: business.b_nm,
    p_nm: business.p_nm,
    start_dt: business.start_dt,
    b_adr: business.b_adr,
    b_sector: business.b_sector,
    b_type: business.b_type,
    corp_no: business.corp_no || "",
    dart_code: business.dart_code || "",
    description: business.description || "",
    credit_rating: business.credit_rating || "",
    industry_rank: business.industry_rank || "",
    is_sme: business.is_sme || "",
    listing_status: business.listing_status || "",
    homepage: business.homepage || "",
    main_biz: business.main_biz || "",
    is_audited: business.is_audited || false,
    bStt: business.b_stt || "계속사업자",
    bSttCd: business.b_stt_cd || "01",
    npsSbscrbNmps: business.nps_sbscrb_nmps || 0,
    npsLinked: business.nps_linked || false,
    npsChrgAmt: business.nps_chrg_amt ? parseInt(business.nps_chrg_amt, 10) : 0,
    corpEnm: business.corp_enm || "",
    crno: business.crno || "",
    enpTlno: business.enp_tlno || "",
    enpFxno: business.enp_fxno || "",
    enpPncd: business.enp_pncd || "",
    enpStacNm: business.enp_stac_nm || "",
    enpMainBizNm: business.enp_main_biz_nm || "",
    dataSource: business.data_source || "local",
    mailOrderNo: business.mail_order_no || "",
    declareOrg: business.declare_org || "",
    goodsType: business.goods_type || "",
    sellType: business.sell_type || "",
    closeDate: business.close_date || "",
    repEmail: business.rep_email || "",
    zipCd: business.zip_cd || "",
    newAcqsNmps: business.new_acqs_nmps || 0,
    lossSbscrbNmps: business.loss_sbscrb_nmps || 0,
    telNo: business.tel_no || "",
    brand_name: business.brand_name || "",
    ntsLastSyncAt: business.nts_last_sync_at,
    npsLastSyncAt: business.nps_last_sync_at,
    patentsLastSyncAt: business.patents_last_sync_at,
    bidsLastSyncAt: business.bids_last_sync_at,
    dartLastSyncAt: business.dart_last_sync_at,
    taxType: business.tax_type || "부가가치세 일반과세자",
    taxTypeCd: business.tax_type_cd || "01",
    historyTimeline: timelineResult.rows.map((r: any) => ({
      eventDate: r.eventDate,
      eventTitle: r.eventTitle,
      eventDescription: r.eventDescription
    })),
    employmentHistory: empHistResult.rows.map((r: any) => ({
      recordMonth: r.recordMonth,
      employees: parseInt(r.employees || "0", 10),
      newAcquisitions: parseInt(r.newAcquisitions || "0", 10),
      losses: parseInt(r.losses || "0", 10),
      npsChargeAmount: parseInt(r.npsChargeAmount || "0", 10)
    })),
    history: histResult.rows.map((r: any) => ({
      year: r.year,
      revenue: parseFloat(r.revenue || "0"),
      operatingIncome: parseFloat(r.operatingIncome || "0"),
      netIncome: parseFloat(r.netIncome || "0"),
      totalAssets: parseFloat(r.totalAssets || "0"),
      totalLiabilities: parseFloat(r.totalLiabilities || "0"),
      totalEquity: parseFloat(r.totalEquity || "0"),
      employees: parseInt(r.employees || "0", 10),
    }))
  };
}

// 2. 기업 기본정보 제한 조회 (전체 무제한 스캔 차단)
export async function getAllBusinesses(limit: number = 500) {
  const safeLimit = Math.min(1000, Math.max(1, limit));
  const result = await query(
    "SELECT b_no, b_nm, p_nm, b_adr, b_sector, is_sme, listing_status, data_source FROM businesses LIMIT $1",
    [safeLimit]
  );
  return result.rows.map((row) => ({
    b_no: row.b_no,
    b_nm: row.b_nm,
    p_nm: row.p_nm,
    b_adr: row.b_adr,
    b_sector: row.b_sector,
    is_sme: row.is_sme,
    listing_status: row.listing_status,
    dataSource: row.data_source || "local",
  }));
}

// 3. 기업명 · 사업자번호 · 13자리 법인등록번호 검색 (전 구간 100% 인덱스 스캔: PK / 법인번호 / 1~2글자 FTS / 3글자+ Trigram MATERIALIZED CTE)
export async function searchBusinesses(q: string, limit: number = 60) {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const cleanQ = trimmed.replace(/[^0-9]/g, "");
  const isPureNumeric = /^[0-9-\s]+$/.test(trimmed);
  const safeLimit = Math.min(200, Math.max(1, limit));

  const mapRows = (rows: any[]) =>
    rows.map((row) => ({
      b_no: row.b_no,
      b_nm: row.b_nm,
      p_nm: row.p_nm,
      b_adr: row.b_adr,
      b_sector: row.b_sector,
      is_sme: row.is_sme,
      listing_status: row.listing_status,
      dataSource: row.data_source || "local",
      brand_name: row.brand_name || "",
    }));

  // Case 1: 10자리 사업자등록번호 정확 조회 (PK Index Scan ~0.05ms)
  if (isPureNumeric && cleanQ.length === 10) {
    const result = await query(
      `SELECT b_no, b_nm, p_nm, b_adr, b_sector, is_sme, listing_status, data_source, brand_name
       FROM businesses
       WHERE b_no = $1
         AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
       LIMIT 1`,
      [cleanQ]
    );
    return mapRows(result.rows);
  }

  // Case 2: 13자리 법인등록번호 조회 (idx_businesses_crno_clean / idx_businesses_corp_no_clean Index Scan ~0.1ms)
  if (isPureNumeric && cleanQ.length === 13) {
    const result = await query(
      `WITH matched AS (
         SELECT b_no, b_nm, p_nm, b_adr, b_sector, is_sme, listing_status, data_source, brand_name,
                COALESCE(nps_sbscrb_nmps, 0) AS emp, COALESCE(view_count, 0) AS views
         FROM businesses
         WHERE crno IS NOT NULL AND crno <> '' AND REPLACE(crno, '-', '') = $1
         UNION
         SELECT b_no, b_nm, p_nm, b_adr, b_sector, is_sme, listing_status, data_source, brand_name,
                COALESCE(nps_sbscrb_nmps, 0) AS emp, COALESCE(view_count, 0) AS views
         FROM businesses
         WHERE corp_no IS NOT NULL AND corp_no <> '' AND REPLACE(corp_no, '-', '') = $1
       )
       SELECT b_no, b_nm, p_nm, b_adr, b_sector, is_sme, listing_status, data_source, brand_name
       FROM matched
       WHERE b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
       ORDER BY emp DESC, views DESC
       LIMIT $2`,
      [cleanQ, safeLimit]
    );
    return mapRows(result.rows);
  }

  const searchWord = `%${trimmed}%`;
  const prefixWord = `${trimmed}%`;

  // Case 3: 3글자 미만 짧은 검색어 ('토스', '기아', '삼성' 등) -> Full-Text Search 접두사 GIN 인덱스 (Seq Scan 0건)
  if (trimmed.length < 3) {
    const tokens = trimmed
      .replace(/[&|!():*'\\<>]/g, " ")
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (tokens.length === 0) return [];
    const tsQueryStr = tokens.map((t) => `${t}:*`).join(" & ");

    const result = await query(
      `WITH cands AS MATERIALIZED (
         SELECT b_no, b_nm, p_nm, b_adr, b_sector, is_sme, listing_status, data_source, brand_name,
                COALESCE(nps_sbscrb_nmps, 0) AS emp, COALESCE(view_count, 0) AS views
         FROM businesses
         WHERE to_tsvector(
                 'simple',
                 COALESCE(b_nm, '') || ' ' || COALESCE(brand_name, '') || ' ' || COALESCE(p_nm, '') || ' ' || COALESCE(b_adr, '')
               ) @@ to_tsquery('simple', $1)
         LIMIT 300
       )
       SELECT b_no, b_nm, p_nm, b_adr, b_sector, is_sme, listing_status, data_source, brand_name
       FROM cands
       WHERE b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
       ORDER BY
         CASE
           WHEN b_nm = $2 THEN 1
           WHEN b_nm ILIKE $3 THEN 2
           WHEN brand_name ILIKE $3 THEN 3
           WHEN b_nm ILIKE $4 OR brand_name ILIKE $4 THEN 4
           WHEN p_nm ILIKE $4 THEN 5
           ELSE 6
         END ASC,
         emp DESC,
         views DESC
       LIMIT $5`,
      [tsQueryStr, trimmed, prefixWord, searchWord, safeLimit]
    );
    return mapRows(result.rows);
  }

  // Case 4: 3글자 이상 일반 검색어 -> pg_trgm GIN 인덱스 후보 350건 상한(MATERIALIZED CTE) 후 정확도 정렬
  const result = await query(
    `WITH cands AS MATERIALIZED (
       SELECT b_no, b_nm, p_nm, b_adr, b_sector, is_sme, listing_status, data_source, brand_name,
              COALESCE(nps_sbscrb_nmps, 0) AS emp, COALESCE(view_count, 0) AS views
       FROM businesses
       WHERE b_nm ILIKE $1
          OR brand_name ILIKE $1
          OR p_nm ILIKE $1
          OR b_adr ILIKE $1
       LIMIT 350
     )
     SELECT b_no, b_nm, p_nm, b_adr, b_sector, is_sme, listing_status, data_source, brand_name
     FROM cands
     WHERE b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
     ORDER BY
       CASE
         WHEN b_nm = $2 THEN 1
         WHEN b_nm ILIKE $3 THEN 2
         WHEN brand_name ILIKE $3 THEN 3
         WHEN b_nm ILIKE $1 OR brand_name ILIKE $1 THEN 4
         WHEN p_nm ILIKE $1 THEN 5
         ELSE 6
       END ASC,
       emp DESC,
       views DESC
     LIMIT $4`,
    [searchWord, trimmed, prefixWord, safeLimit]
  );
  return mapRows(result.rows);
}

// 상호명 정규화 필터 (법인 수식어 제거)
function extractCoreBrand(name: string): string {
  if (!name) return "";
  return name
    .replace(/\(.*?\)/g, "")
    .replace(/주식회사/g, "")
    .replace(/\(주\)/g, "")
    .replace(/（주）/g, "")
    .replace(/\(유\)/g, "")
    .replace(/유한회사/g, "")
    .replace(/\(사\)/g, "")
    .replace(/사단법인/g, "")
    .trim();
}

// 4. 기업 정보 등록/수정 (DART 및 API 크롤링 캐시용)
export async function upsertBusiness(biz: any) {
  const clean = biz.b_no.replace(/[^0-9]/g, "");
  
  // 업종 자가치유 (KSIC 코드 한글명 변환 및 삼성전자/SK하이닉스 수동 교정)
  const healedSector = getKsicName(biz.b_sector || "", clean);
  biz.b_sector = healedSector;
  
  const uselessSectors = ["상장 법인", "상장법인", "대기업", "중소기업", "일반기업", "중견기업", "기타 서비스업", "기타서비스업", "미등록 업종", "미등록업종", "-", ""];
  if (!biz.main_biz || uselessSectors.includes((biz.main_biz || "").trim())) {
    biz.main_biz = healedSector;
  }
  
  const core = extractCoreBrand(biz.b_nm);
  const brandVal = biz.brandName || biz.brand_name || (core ? `${core}, ${biz.b_nm}` : biz.b_nm);
  const regionHubSlug = resolveRegionHubSlug(biz.b_adr);
  const industryHubSlug = resolveIndustryHubSlug(biz.b_sector, biz.main_biz, biz.b_nm);
  const marketBoard = resolveMarketBoard(biz.listing_status);

  let latestFinYear: number | null = null;
  let latestRevenue: number | null = null;
  let latestOperatingIncome: number | null = null;
  if (Array.isArray(biz.history) && biz.history.length > 0) {
    const sortedHist = [...biz.history]
      .filter((h) => h && typeof h.year === "number")
      .sort((a, b) => b.year - a.year);
    if (sortedHist[0]) {
      latestFinYear = sortedHist[0].year;
      latestRevenue =
        sortedHist[0].revenue !== undefined && sortedHist[0].revenue !== null
          ? Number(sortedHist[0].revenue)
          : null;
      latestOperatingIncome =
        sortedHist[0].operatingIncome !== undefined && sortedHist[0].operatingIncome !== null
          ? Number(sortedHist[0].operatingIncome)
          : null;
    }
  }

  // 1. Main Business upsert
  await query(`
    INSERT INTO businesses (
      b_no, b_nm, p_nm, start_dt, b_adr, b_sector, b_type, corp_no, dart_code,
      description, credit_rating, industry_rank, is_sme, listing_status, homepage, main_biz,
      is_audited, nps_sbscrb_nmps, nps_linked, corp_enm, crno, enp_tlno, enp_fxno, enp_pncd,
      enp_stac_nm, enp_main_biz_nm, data_source,
      mail_order_no, declare_org, goods_type, sell_type, close_date, rep_email, zip_cd,
      new_acqs_nmps, loss_sbscrb_nmps, tel_no, brand_name,
      nts_last_sync_at, nps_last_sync_at,
      tax_type, tax_type_cd,
      b_stt, b_stt_cd, nps_chrg_amt,
      region_hub_slug, industry_hub_slug, market_board,
      latest_fin_year, latest_revenue, latest_operating_income
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27,
      $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
      $41, $42, $43, $44, $45,
      $46, $47, $48, $49, $50, $51
    ) ON CONFLICT (b_no) DO UPDATE SET
      b_nm = EXCLUDED.b_nm,
      p_nm = EXCLUDED.p_nm,
      start_dt = EXCLUDED.start_dt,
      b_adr = EXCLUDED.b_adr,
      b_sector = EXCLUDED.b_sector,
      b_type = EXCLUDED.b_type,
      corp_no = EXCLUDED.corp_no,
      dart_code = EXCLUDED.dart_code,
      description = EXCLUDED.description,
      credit_rating = EXCLUDED.credit_rating,
      industry_rank = EXCLUDED.industry_rank,
      is_sme = EXCLUDED.is_sme,
      listing_status = EXCLUDED.listing_status,
      homepage = EXCLUDED.homepage,
      main_biz = EXCLUDED.main_biz,
      is_audited = EXCLUDED.is_audited,
      nps_sbscrb_nmps = EXCLUDED.nps_sbscrb_nmps,
      nps_linked = EXCLUDED.nps_linked,
      corp_enm = EXCLUDED.corp_enm,
      crno = EXCLUDED.crno,
      enp_tlno = EXCLUDED.enp_tlno,
      enp_fxno = EXCLUDED.enp_fxno,
      enp_pncd = EXCLUDED.enp_pncd,
      enp_stac_nm = EXCLUDED.enp_stac_nm,
      enp_main_biz_nm = EXCLUDED.enp_main_biz_nm,
      data_source = EXCLUDED.data_source,
      mail_order_no = EXCLUDED.mail_order_no,
      declare_org = EXCLUDED.declare_org,
      goods_type = EXCLUDED.goods_type,
      sell_type = EXCLUDED.sell_type,
      close_date = EXCLUDED.close_date,
      rep_email = EXCLUDED.rep_email,
      zip_cd = EXCLUDED.zip_cd,
      new_acqs_nmps = EXCLUDED.new_acqs_nmps,
      loss_sbscrb_nmps = EXCLUDED.loss_sbscrb_nmps,
      tel_no = EXCLUDED.tel_no,
      brand_name = EXCLUDED.brand_name,
      nts_last_sync_at = COALESCE(EXCLUDED.nts_last_sync_at, businesses.nts_last_sync_at),
      nps_last_sync_at = COALESCE(EXCLUDED.nps_last_sync_at, businesses.nps_last_sync_at),
      tax_type = EXCLUDED.tax_type,
      tax_type_cd = EXCLUDED.tax_type_cd,
      b_stt = EXCLUDED.b_stt,
      b_stt_cd = EXCLUDED.b_stt_cd,
      nps_chrg_amt = EXCLUDED.nps_chrg_amt,
      region_hub_slug = EXCLUDED.region_hub_slug,
      industry_hub_slug = EXCLUDED.industry_hub_slug,
      market_board = COALESCE(EXCLUDED.market_board, businesses.market_board),
      latest_fin_year = COALESCE(EXCLUDED.latest_fin_year, businesses.latest_fin_year),
      latest_revenue = COALESCE(EXCLUDED.latest_revenue, businesses.latest_revenue),
      latest_operating_income = COALESCE(EXCLUDED.latest_operating_income, businesses.latest_operating_income)
  `, [
    clean, biz.b_nm, biz.p_nm, biz.start_dt, biz.b_adr, biz.b_sector, biz.b_type, biz.corp_no || "", biz.dart_code || "",
    biz.description || "", biz.credit_rating || "", biz.industry_rank || "", biz.is_sme || "", biz.listing_status || "",
    biz.homepage || "", biz.main_biz || "", biz.is_audited || false, biz.npsSbscrbNmps || 0, biz.npsLinked || false,
    biz.corpEnm || "", biz.crno || "", biz.enpTlno || "", biz.enpFxno || "", biz.enpPncd || "", biz.enpStacNm || "",
    biz.enpMainBizNm || "", biz.dataSource || "local",
    biz.mailOrderNo || "", biz.declareOrg || "", biz.goodsType || "", biz.sellType || "", biz.closeDate || "", biz.repEmail || "", biz.zipCd || "",
    biz.newAcqsNmps || 0, biz.lossSbscrbNmps || 0, biz.telNo || "", brandVal,
    biz.ntsLastSyncAt || null, biz.npsLastSyncAt || null,
    biz.taxType || "부가가치세 일반과세자", biz.taxTypeCd || "01",
    biz.bStt || biz.b_stt || "계속사업자", biz.bSttCd || biz.b_stt_cd || "01",
    biz.npsChrgAmt || 0,
    regionHubSlug, industryHubSlug, marketBoard,
    latestFinYear, latestRevenue, latestOperatingIncome
  ]);

  // 1.1. 신규 설립일 타임라인 자동 갱신
  if (biz.start_dt) {
    await query(`
      INSERT INTO business_timeline (b_no, event_date, event_title, event_description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (b_no, event_date, event_title) DO NOTHING
    `, [clean, biz.start_dt, "법인 설립", `${biz.b_nm} 설립 및 개업`]);
  }

  // 1.2. 국민연금 월별 고용 이력 적재 (API에서 최근 월별 리스트가 넘어온 경우 전체 적재, 아니면 당월 1건 적재)
  if (biz.employmentHistory && Array.isArray(biz.employmentHistory) && biz.employmentHistory.length > 0) {
    for (const eh of biz.employmentHistory) {
      if (!eh.recordMonth) continue;
      try {
        await query(`
          INSERT INTO business_employment_history (
            b_no, record_month, employees, new_acquisitions, losses, nps_charge_amount
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (b_no, record_month) DO UPDATE SET
            employees = EXCLUDED.employees,
            new_acquisitions = EXCLUDED.new_acquisitions,
            losses = EXCLUDED.losses,
            nps_charge_amount = EXCLUDED.nps_charge_amount
        `, [
          clean,
          eh.recordMonth,
          eh.employees || 0,
          eh.newAcquisitions || 0,
          eh.losses || 0,
          eh.npsChargeAmount || 0
        ]);
      } catch (e) {
        console.error("Failed to upsert employmentHistory item:", e);
      }
    }
  } else if (biz.npsLinked && biz.npsSbscrbNmps > 0) {
    let recordMonth = "";
    const cleanBasDt = (biz.npsDataCrtYm || biz.basDt || "").replace(/[^0-9]/g, "");
    if (cleanBasDt.length >= 6) {
      recordMonth = `${cleanBasDt.substring(0, 4)}-${cleanBasDt.substring(4, 6)}`;
    } else {
      const d = new Date();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      recordMonth = `${d.getFullYear()}-${mm}`;
    }

    try {
      await query(`
        INSERT INTO business_employment_history (
          b_no, record_month, employees, new_acquisitions, losses, nps_charge_amount
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (b_no, record_month) DO UPDATE SET
          employees = EXCLUDED.employees,
          new_acquisitions = EXCLUDED.new_acquisitions,
          losses = EXCLUDED.losses,
          nps_charge_amount = EXCLUDED.nps_charge_amount
      `, [
        clean,
        recordMonth,
        biz.npsSbscrbNmps || 0,
        biz.newAcqsNmps || 0,
        biz.lossSbscrbNmps || 0,
        biz.npsChrgAmt || 0
      ]);
      console.log(`[Employment History Cache] Saved history for ${biz.b_nm} (${clean}) at ${recordMonth}`);
    } catch (e) {
      console.error("Failed to upsert employment history:", e);
    }
  }

  // 2. 재무이력 갱신 (기존 구버전 추정 데이터를 정리하고 실제 수집된 재무 데이터로 교체)
  if (biz.history && Array.isArray(biz.history)) {
    const uniqueHistoryMap = new Map<number, any>();
    for (const h of biz.history) {
      if (h && typeof h.year === "number") {
        uniqueHistoryMap.set(h.year, h);
      }
    }

    if (uniqueHistoryMap.size > 0) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(`DELETE FROM business_history WHERE b_no = $1`, [clean]);
        for (const h of uniqueHistoryMap.values()) {
          await client.query(
            `INSERT INTO business_history (
              b_no, year, revenue, operating_income, net_income, total_assets, total_liabilities, total_equity, employees
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (b_no, year) DO UPDATE SET
              revenue = EXCLUDED.revenue,
              operating_income = EXCLUDED.operating_income,
              net_income = EXCLUDED.net_income,
              total_assets = EXCLUDED.total_assets,
              total_liabilities = EXCLUDED.total_liabilities,
              total_equity = EXCLUDED.total_equity,
              employees = EXCLUDED.employees`,
            [
              clean,
              h.year,
              h.revenue || 0,
              h.operatingIncome || 0,
              h.netIncome || 0,
              h.totalAssets || 0,
              h.totalLiabilities || 0,
              h.totalEquity || 0,
              h.employees || 0,
            ]
          );
        }
        await client.query("COMMIT");
      } catch (txErr) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("Failed to transactionally update business_history:", txErr);
      } finally {
        client.release();
      }
    }
  }
}

// 1-1. 실제 사용자 상세 페이지 진입 시에만 조회수 및 실시간 로그 1회 기록 (프리패치 및 백그라운드 리프레시 제외)
export function recordBusinessView(bNo: string) {
  const clean = bNo.replace(/[^0-9]/g, "");
  if (clean.length !== 10) return;
  Promise.all([
    query("UPDATE businesses SET view_count = view_count + 1 WHERE b_no = $1", [clean]),
    query("INSERT INTO business_view_logs (b_no) VALUES ($1)", [clean]),
  ]).catch((err) => {
    console.error("Failed to record view metrics:", err);
  });
}

// 5. 미등록/폐업 블랙리스트 제한 조회 (단건 확인은 isInvalidBusiness 사용)
export async function getInvalidBusinesses(limit: number = 500) {
  const safeLimit = Math.min(2000, Math.max(1, limit));
  const result = await query("SELECT b_no FROM invalid_businesses LIMIT $1", [safeLimit]);
  return result.rows.map((r) => r.b_no);
}

// 5-1. 단일 사업자번호 블랙리스트 여부 초고속 단건 확인 (전체 테이블 풀스캔 방지)
export async function isInvalidBusiness(bNo: string): Promise<boolean> {
  const clean = bNo.replace(/[^0-9]/g, "");
  if (clean.length !== 10) return true;
  const result = await query("SELECT 1 FROM invalid_businesses WHERE b_no = $1 LIMIT 1", [clean]);
  return result.rows.length > 0;
}

// 6. 미등록 블랙리스트 등록
export async function addInvalidBusiness(bNo: string) {
  const clean = bNo.replace(/[^0-9]/g, "");
  await query("INSERT INTO invalid_businesses (b_no) VALUES ($1) ON CONFLICT (b_no) DO NOTHING", [clean]);
}

interface PopularQuickLinkItem {
  name: string;
  no: string;
}

let cachedPopularLinks: PopularQuickLinkItem[] | null = null;
let cachedPopularLinksAt = 0;
let inFlightPopularLinks: Promise<PopularQuickLinkItem[]> | null = null;
const POPULAR_LINKS_TTL_MS = 5 * 60 * 1000; // 5분 서버 인메모리 캐시

// 8-1. 24시간 실시간 조회 로그 기반 인기 추천 기업 (전체 테이블 LEFT JOIN + GROUP BY 풀스캔 차단)
export async function getPopularQuickLinks(limit: number = 6): Promise<PopularQuickLinkItem[]> {
  const safeLimit = Math.max(1, Math.min(10, limit));
  const now = Date.now();

  if (cachedPopularLinks && now - cachedPopularLinksAt < POPULAR_LINKS_TTL_MS) {
    return cachedPopularLinks.slice(0, safeLimit);
  }

  const refreshTask = async (): Promise<PopularQuickLinkItem[]> => {
    try {
      const popularBizRes = await query(
        `WITH recent_logs AS (
           SELECT b_no, COUNT(*)::int AS recent_views
           FROM business_view_logs
           WHERE viewed_at >= NOW() - INTERVAL '24 hours'
           GROUP BY b_no
           ORDER BY recent_views DESC
           LIMIT 20
         ),
         ranked AS (
           SELECT b.b_no, b.b_nm, b.brand_name, r.recent_views,
                  COALESCE(b.view_count, 0) AS view_count,
                  COALESCE(b.nps_sbscrb_nmps, 0) AS nps_sbscrb_nmps
           FROM recent_logs r
           JOIN businesses b ON b.b_no = r.b_no
           WHERE b.b_nm IS NOT NULL AND b.b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
           UNION ALL
           (
             SELECT b.b_no, b.b_nm, b.brand_name, 0 AS recent_views,
                    COALESCE(b.view_count, 0) AS view_count,
                    COALESCE(b.nps_sbscrb_nmps, 0) AS nps_sbscrb_nmps
             FROM businesses b
             WHERE b.b_nm IS NOT NULL
               AND b.b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
               AND NOT EXISTS (SELECT 1 FROM recent_logs r2 WHERE r2.b_no = b.b_no)
             ORDER BY COALESCE(b.view_count, 0) DESC, COALESCE(b.nps_sbscrb_nmps, 0) DESC
             LIMIT 10
           )
         )
         SELECT b_no, b_nm, brand_name
         FROM ranked
         ORDER BY recent_views DESC, view_count DESC, nps_sbscrb_nmps DESC
         LIMIT 10`
      );

      const mapped = popularBizRes.rows.map((row: any) => {
        let shortName = row.b_nm;
        if (row.brand_name) {
          const brandPrefix = row.brand_name.split(",")[0].trim();
          if (brandPrefix && brandPrefix !== "상호 미등록 사업자" && brandPrefix !== "상호 정보 없음") {
            shortName = brandPrefix;
          }
        }
        return { name: shortName, no: row.b_no };
      });

      cachedPopularLinks = mapped;
      cachedPopularLinksAt = Date.now();
      return mapped;
    } catch (err) {
      console.error("Failed to fetch popular quick links:", err);
      return cachedPopularLinks || [];
    } finally {
      inFlightPopularLinks = null;
    }
  };

  if (cachedPopularLinks) {
    if (!inFlightPopularLinks) {
      inFlightPopularLinks = refreshTask();
    }
    return cachedPopularLinks.slice(0, safeLimit);
  }

  if (!inFlightPopularLinks) {
    inFlightPopularLinks = refreshTask();
  }
  const fresh = await inFlightPopularLinks;
  return fresh.slice(0, safeLimit);
}

interface RecommendedCacheEntry {
  expiresAt: number;
  items: Array<{
    b_no: string;
    b_nm: string;
    b_adr: string;
    b_sector: string;
    is_sme: string;
    listing_status: string;
    dataSource: string;
  }>;
}

const recommendedBizCache = new Map<string, RecommendedCacheEntry>();
const RECOMMENDED_CACHE_TTL_MS = 30 * 60 * 1000; // 30분 지역·업종 허브별 서버 메모리 캐시

// 9. 주변 기업 및 유사 사업자 추천 조회 (100% 부분 복합 B-Tree 인덱스 스캔: LIKE / OR / ORDER BY CASE WHEN 풀스캔 완전 제거)
export async function getRecommendedBusinesses(
  bNo: string,
  bAdr: string,
  bSector: string,
  isSme: string
) {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  const regionSlug = resolveRegionHubSlug(bAdr);
  const industrySlug = resolveIndustryHubSlug(bSector);
  const cleanSector = (bSector || "").trim();
  const hasExactSector = Boolean(
    cleanSector && cleanSector !== "-" && cleanSector !== "미등록 업종"
  );

  const cacheKey = `${regionSlug || ""}|${industrySlug || ""}|${!regionSlug && !industrySlug ? cleanSector : ""}|${isSme || ""}`;
  const now = Date.now();
  const cached = recommendedBizCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.items.filter((item) => item.b_no !== cleanBNo).slice(0, 4);
  }

  const queries: Array<Promise<{ rows: any[] }>> = [];

  // 1) 동일 권역/업무지구 허브 인덱스 스캔 (idx_businesses_dir_region_top ~0.15ms)
  if (regionSlug) {
    queries.push(
      query(
        `SELECT b_no, b_nm, b_adr, b_sector, is_sme, listing_status, data_source
         FROM businesses
         WHERE b_stt_cd = '01'
           AND region_hub_slug = $1
           AND b_nm IS NOT NULL
           AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
         ORDER BY nps_sbscrb_nmps DESC NULLS LAST, latest_revenue DESC NULLS LAST, view_count DESC NULLS LAST, b_no ASC
         LIMIT 12`,
        [regionSlug]
      )
    );
  }

  // 2) 동일 산업군 허브 인덱스 스캔 (idx_businesses_dir_industry_top ~0.15ms)
  if (industrySlug) {
    queries.push(
      query(
        `SELECT b_no, b_nm, b_adr, b_sector, is_sme, listing_status, data_source
         FROM businesses
         WHERE b_stt_cd = '01'
           AND industry_hub_slug = $1
           AND b_nm IS NOT NULL
           AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
         ORDER BY nps_sbscrb_nmps DESC NULLS LAST, latest_revenue DESC NULLS LAST, view_count DESC NULLS LAST, b_no ASC
         LIMIT 12`,
        [industrySlug]
      )
    );
  }

  // 3) 허브 미매칭 시 업종 정확일치 부분 복합 인덱스 스캔 (idx_businesses_b_sector_view_top ~0.15ms)
  if (queries.length === 0 && hasExactSector) {
    queries.push(
      query(
        `SELECT b_no, b_nm, b_adr, b_sector, is_sme, listing_status, data_source
         FROM businesses
         WHERE b_stt_cd = '01'
           AND b_sector = $1
           AND b_nm IS NOT NULL
           AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
         ORDER BY view_count DESC NULLS LAST, b_no ASC
         LIMIT 10`,
        [cleanSector]
      )
    );
  }

  const results = await Promise.all(queries);
  const scoreMap = new Map<string, { score: number; row: any }>();

  results.forEach((res, idx) => {
    const baseBonus = idx === 0 && regionSlug ? 50 : 40;
    for (const row of res.rows) {
      const prev = scoreMap.get(row.b_no);
      const smeBonus = isSme && row.is_sme === isSme ? 10 : 0;
      const added = baseBonus + (prev ? 0 : smeBonus);
      if (prev) {
        prev.score += baseBonus;
      } else {
        scoreMap.set(row.b_no, { score: added, row });
      }
    }
  });

  // 4) 최종 보강: 후보가 5개 미만이면 대표 검증기업 인덱스(idx_businesses_dir_emp_top)에서 보충
  if (scoreMap.size < 5) {
    const fallbackRes = await query(
      `SELECT b_no, b_nm, b_adr, b_sector, is_sme, listing_status, data_source
       FROM businesses
       WHERE b_stt_cd = '01'
         AND nps_sbscrb_nmps > 0
         AND b_nm IS NOT NULL
         AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
       ORDER BY nps_sbscrb_nmps DESC NULLS LAST, b_no ASC
       LIMIT 8`
    );
    for (const row of fallbackRes.rows) {
      if (!scoreMap.has(row.b_no)) {
        scoreMap.set(row.b_no, { score: 10, row });
      }
    }
  }

  const items = Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ row }) => ({
      b_no: row.b_no,
      b_nm: row.b_nm,
      b_adr: row.b_adr,
      b_sector: row.b_sector,
      is_sme: row.is_sme,
      listing_status: row.listing_status,
      dataSource: row.data_source || "local",
    }));

  if (recommendedBizCache.size > 300) {
    const oldestKey = recommendedBizCache.keys().next().value;
    if (oldestKey) recommendedBizCache.delete(oldestKey);
  }
  recommendedBizCache.set(cacheKey, {
    expiresAt: now + RECOMMENDED_CACHE_TTL_MS,
    items,
  });

  return items.filter((item) => item.b_no !== cleanBNo).slice(0, 4);
}

// 10. 수정 요청 등록 (business_edit_requests)
export async function addEditRequest(req: {
  b_no: string;
  requester_type: string;
  requester_email: string;
  proposed_brand_name?: string;
  proposed_homepage?: string;
  proposed_description?: string;
  proposed_timeline?: any;
  proposed_b_nm?: string;
}) {
  const cleanBNo = req.b_no.replace(/[^0-9]/g, "");
  const result = await query(`
    INSERT INTO business_edit_requests (
      b_no, requester_type, requester_email, proposed_brand_name, proposed_homepage, proposed_description, proposed_timeline, proposed_b_nm
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `, [
    cleanBNo,
    req.requester_type,
    req.requester_email,
    req.proposed_brand_name || null,
    req.proposed_homepage || null,
    req.proposed_description || null,
    req.proposed_timeline ? JSON.stringify(req.proposed_timeline) : null,
    req.proposed_b_nm || null
  ]);
  return result.rows[0]?.id;
}

// 11. 대기중인 수정 요청 목록 조회 (businesses 상호명 조인)
export async function getPendingEditRequests() {
  const result = await query(`
    SELECT r.id, r.b_no, b.b_nm, b.brand_name as "currentBrandName", b.homepage as "currentHomepage",
           b.description as "currentDescription", r.requester_type as "requesterType", r.requester_email as "requesterEmail",
           r.proposed_brand_name as "proposedBrandName", r.proposed_homepage as "proposedHomepage",
           r.proposed_description as "proposedDescription", r.proposed_timeline as "proposedTimeline",
           r.status, r.created_at as "createdAt", r.proposed_b_nm as "proposedBusinessName"
    FROM business_edit_requests r
    JOIN businesses b ON r.b_no = b.b_no
    WHERE r.status = 'pending'
    ORDER BY r.created_at DESC
  `);
  return result.rows.map(row => ({
    id: row.id,
    b_no: row.b_no,
    b_nm: row.b_nm,
    currentBrandName: row.currentBrandName || "",
    currentHomepage: row.currentHomepage || "",
    currentDescription: row.currentDescription || "",
    requesterType: row.requesterType,
    requesterEmail: row.requesterEmail,
    proposedBrandName: row.proposedBrandName || "",
    proposedHomepage: row.proposedHomepage || "",
    proposedDescription: row.proposedDescription || "",
    proposedTimeline: typeof row.proposedTimeline === 'string' 
      ? JSON.parse(row.proposedTimeline) 
      : (row.proposedTimeline || []),
    status: row.status,
    createdAt: row.createdAt,
    proposedBusinessName: row.proposedBusinessName || ""
  }));
}

// 12. 특정 ID의 수정 요청 상세 조회
export async function getEditRequestById(id: number) {
  const result = await query(
    "SELECT * FROM business_edit_requests WHERE id = $1 LIMIT 1",
    [id]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    b_no: row.b_no,
    requesterType: row.requester_type,
    requesterEmail: row.requester_email,
    proposedBrandName: row.proposed_brand_name || "",
    proposedHomepage: row.proposed_homepage || "",
    proposedDescription: row.proposed_description || "",
    proposedTimeline: typeof row.proposed_timeline === 'string'
      ? JSON.parse(row.proposed_timeline)
      : (row.proposed_timeline || []),
    status: row.status,
    createdAt: row.created_at,
    proposedBusinessName: row.proposed_b_nm || ""
  };
}

// 13. 수정 요청 상태 변경
export async function updateEditRequestStatus(id: number, status: string) {
  await query(
    "UPDATE business_edit_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    [status, id]
  );
}

// 14. 관리자용 종합 통계 조회
export async function getAdminStats() {
  const totalCountResult = await query("SELECT COUNT(*) as count FROM businesses");
  const noNameCountResult = await query("SELECT COUNT(*) as count FROM businesses WHERE b_nm = '상호 정보 없음'");
  const pendingRequestsResult = await query("SELECT COUNT(*) as count FROM business_edit_requests WHERE status = 'pending'");
  const totalViewsResult = await query("SELECT SUM(view_count) as count FROM businesses");

  return {
    totalBusinesses: parseInt(totalCountResult.rows[0]?.count || "0", 10),
    noNameBusinesses: parseInt(noNameCountResult.rows[0]?.count || "0", 10),
    pendingRequests: parseInt(pendingRequestsResult.rows[0]?.count || "0", 10),
    totalViews: parseInt(totalViewsResult.rows[0]?.count || "0", 10),
  };
}

// 15. 상호 정보 없는 기업 리스트 조회 (정렬: b_no DESC)
export async function getNoNameBusinesses(limit = 100, offset = 0) {
  const result = await query(
    `SELECT b_no, b_nm, p_nm, b_adr, b_sector, view_count as "viewCount"
     FROM businesses
     WHERE b_nm = '상호 정보 없음'
     ORDER BY b_no DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows.map(row => ({
    b_no: row.b_no,
    b_nm: row.b_nm,
    p_nm: row.p_nm || "",
    b_adr: row.b_adr || "",
    b_sector: row.b_sector || "",
    viewCount: row.viewCount || 0
  }));
}

// 16. 특허 캐시 조회
export async function getPatentsByBNo(bNo: string) {
  const clean = bNo.replace(/[^0-9]/g, "");
  const result = await query(
    `SELECT application_number as "applicationNumber", application_date as "applicationDate",
            invention_title as "inventionTitle", register_number as "registerNumber",
            register_date as "registerDate", applicant_name as "applicantName",
            patent_status as "patentStatus", detail_url as "detailUrl"
     FROM business_patents
     WHERE b_no = $1
     ORDER BY application_date DESC`,
    [clean]
  );
  return result.rows;
}

// 17. 특허 캐시 저장 (트랜잭션 보장 및 복합키 정합성 일치)
export async function savePatents(bNo: string, patents: any[]) {
  const clean = bNo.replace(/[^0-9]/g, "");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM business_patents WHERE b_no = $1", [clean]);
    for (const p of patents) {
      await client.query(
        `INSERT INTO business_patents (
          b_no, application_number, application_date, invention_title,
          register_number, register_date, applicant_name, patent_status, detail_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (b_no, application_number) DO UPDATE SET
          application_date = EXCLUDED.application_date,
          invention_title = EXCLUDED.invention_title,
          register_number = EXCLUDED.register_number,
          register_date = EXCLUDED.register_date,
          applicant_name = EXCLUDED.applicant_name,
          patent_status = EXCLUDED.patent_status,
          detail_url = EXCLUDED.detail_url`,
        [
          clean,
          p.applicationNumber,
          p.applicationDate,
          p.inventionTitle,
          p.registerNumber || null,
          p.registerDate || null,
          p.applicantName,
          p.patentStatus,
          p.detailUrl || null,
        ]
      );
    }
    await client.query("UPDATE businesses SET patents_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1", [clean]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// 18. 입찰/낙찰 캐시 조회
export async function getBidsByBNo(bNo: string) {
  const clean = bNo.replace(/[^0-9]/g, "");
  const result = await query(
    `SELECT bid_ntce_no as "bidNtceNo", bid_ntce_ord as "bidNtceOrd",
            bid_ntce_nm as "bidNtceNm", dminstt_nm as "dminsttNm",
            opng_dt as "opngDt", bid_ntce_dt as "bidNtceDt",
            cntrct_cncl_mthd_nm as "cntrctCnclMthdNm", presmpt_prce as "presmptPrce",
            detail_url as "detailUrl"
     FROM business_bids
     WHERE b_no = $1
     ORDER BY bid_ntce_dt DESC`,
    [clean]
  );
  return result.rows.map((r) => ({
    ...r,
    presmptPrce: parseFloat(r.presmptPrce || "0"),
  }));
}

// 19. 입찰/낙찰 캐시 저장 (트랜잭션 보장 및 복합키 정합성 일치)
export async function saveBids(bNo: string, bids: any[]) {
  const clean = bNo.replace(/[^0-9]/g, "");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM business_bids WHERE b_no = $1", [clean]);
    for (const b of bids) {
      await client.query(
        `INSERT INTO business_bids (
          b_no, bid_ntce_no, bid_ntce_ord, bid_ntce_nm, dminstt_nm,
          opng_dt, bid_ntce_dt, cntrct_cncl_mthd_nm, presmpt_prce, detail_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (b_no, bid_ntce_no, bid_ntce_ord) DO UPDATE SET
          bid_ntce_nm = EXCLUDED.bid_ntce_nm,
          dminstt_nm = EXCLUDED.dminstt_nm,
          opng_dt = EXCLUDED.opng_dt,
          bid_ntce_dt = EXCLUDED.bid_ntce_dt,
          cntrct_cncl_mthd_nm = EXCLUDED.cntrct_cncl_mthd_nm,
          presmpt_prce = EXCLUDED.presmpt_prce,
          detail_url = EXCLUDED.detail_url`,
        [
          clean,
          b.bidNtceNo,
          b.bidNtceOrd,
          b.bidNtceNm,
          b.dminsttNm,
          b.opngDt,
          b.bidNtceDt,
          b.cntrctCnclMthdNm,
          b.presmptPrce,
          b.detailUrl,
        ]
      );
    }
    await client.query("UPDATE businesses SET bids_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1", [clean]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// 20. 공시 캐시 조회 (OR 서브쿼리 풀스캔 제거 -> b_no / corp_code 2단계 복합 인덱스 조회)
export async function getDisclosuresByBNo(bNo: string) {
  const clean = bNo.replace(/[^0-9]/g, "");

  const [byBNoRes, dartCodeRes] = await Promise.all([
    query(
      `SELECT rcept_no as "rceptNo", corp_code as "corpCode",
              report_nm as "reportNm", flr_nm as "flrNm",
              rcept_dt as "rceptDt", rm, detail_url as "detailUrl",
              is_key_disclosure as "isKeyDisclosure"
       FROM business_disclosures
       WHERE b_no = $1
       ORDER BY rcept_dt DESC
       LIMIT 50`,
      [clean]
    ),
    query(
      `SELECT dart_code FROM businesses WHERE b_no = $1 LIMIT 1`,
      [clean]
    ),
  ]);

  const dartCode = String(dartCodeRes.rows[0]?.dart_code || "").trim();
  if (!dartCode) {
    return byBNoRes.rows;
  }

  const byCorpRes = await query(
    `SELECT rcept_no as "rceptNo", corp_code as "corpCode",
            report_nm as "reportNm", flr_nm as "flrNm",
            rcept_dt as "rceptDt", rm, detail_url as "detailUrl",
            is_key_disclosure as "isKeyDisclosure"
     FROM business_disclosures
     WHERE corp_code = $1
     ORDER BY rcept_dt DESC
     LIMIT 50`,
    [dartCode]
  );

  const merged = new Map<string, any>();
  for (const row of [...byBNoRes.rows, ...byCorpRes.rows]) {
    if (row.rceptNo && !merged.has(row.rceptNo)) {
      merged.set(row.rceptNo, row);
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => String(b.rceptDt || "").localeCompare(String(a.rceptDt || "")))
    .slice(0, 50);
}

// 21. 공시 캐시 저장 (트랜잭션 보장 및 본·지점 공유 corp_code 보존)
export async function saveDisclosures(bNo: string, disclosures: any[]) {
  const clean = bNo.replace(/[^0-9]/g, "");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM business_disclosures WHERE b_no = $1", [clean]);
    for (const d of disclosures) {
      await client.query(
        `
        INSERT INTO business_disclosures (
          b_no, rcept_no, corp_code, report_nm, flr_nm, rcept_dt, rm, detail_url, is_key_disclosure
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (rcept_no) DO UPDATE SET
          corp_code = COALESCE(EXCLUDED.corp_code, business_disclosures.corp_code),
          report_nm = EXCLUDED.report_nm,
          flr_nm = EXCLUDED.flr_nm,
          rcept_dt = EXCLUDED.rcept_dt,
          rm = EXCLUDED.rm,
          detail_url = EXCLUDED.detail_url,
          is_key_disclosure = EXCLUDED.is_key_disclosure
      `,
        [
          clean,
          d.rceptNo,
          d.corpCode || null,
          d.reportNm,
          d.flrNm,
          d.rceptDt,
          d.rm || null,
          d.detailUrl,
          d.isKeyDisclosure || false,
        ]
      );
    }
    await client.query(
      "UPDATE businesses SET dart_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1",
      [clean]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

interface CachedIndustryGroupStats {
  expiresAt: number;
  totalCompanies: number;
  closeRate: number;
  avgRevenue: number;
  avgDebtRatio: number;
  avgOperatingMargin: number;
  leaders: Array<{ b_no: string; b_nm: string; revenue: number }>;
}

const industryGroupStatsCache = new Map<string, CachedIndustryGroupStats>();

// 22. 동일 업종 내 통계 및 상대적 위치 연산 (영구 스냅샷 PK 1ms + 단건 PK 조회 + O(log N) 이진탐색 -> 풀스캔 0건)
export async function getIndustryAnalysis(bSector: string, bNo: string) {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  const uselessSectors = [
    "미등록 업종", "상장 법인", "상장법인", "대기업", "중소기업", "일반기업",
    "중견기업", "기타 서비스업", "기타서비스업", "기타 제조업/금융업", "기타 산업", "-", ""
  ];

  if (!bSector || uselessSectors.includes(bSector.trim())) {
    return {
      groupTitle: bSector || "미분류 업종",
      totalCompanies: 0,
      closeRate: 0,
      avgRevenue: 0,
      avgDebtRatio: 0,
      avgOperatingMargin: 0,
      rankings: {
        revenuePercentile: 50,
        operatingMarginPercentile: 50,
        debtRatioPercentile: 50,
        employeePercentile: 50
      },
      leaders: [],
      myRankItem: null
    };
  }

  const clampPct = (v: number) => Math.min(99, Math.max(1, Math.round(v * 100)));

  try {
    // 1) 대상 기업 본인 단건 지표(PK 조회 ~0.1ms) + 12대 산업 허브 영구 스냅샷 병렬 조회
    const [selfBizRes, selfHistRes] = await Promise.all([
      query(
        `SELECT b_no, b_nm, b_sector, main_biz, industry_hub_slug, nps_sbscrb_nmps
         FROM businesses
         WHERE b_no = $1
         LIMIT 1`,
        [cleanBNo]
      ),
      query(
        `SELECT revenue, operating_income, total_liabilities, total_equity
         FROM business_history
         WHERE b_no = $1 AND revenue > 0
         ORDER BY year DESC
         LIMIT 1`,
        [cleanBNo]
      ),
    ]);

    const selfBiz = selfBizRes.rows[0];
    const selfHist = selfHistRes.rows[0];
    const hubSlug =
      selfBiz?.industry_hub_slug ||
      resolveIndustryHubSlug(bSector, selfBiz?.main_biz, selfBiz?.b_nm);

    // 2) 12대 핵심 산업군 매칭 시: system_settings 영구 스냅샷(24h SWR) + Node.js 이진탐색 (SQL 풀스캔 0건!)
    if (hubSlug) {
      const snapshot = await getIndustryStatsSnapshot();
      const bucket = snapshot.hubs[hubSlug];
      if (bucket && bucket.totalCompanies > 0) {
        const myRev = selfHist ? Math.round(Number(selfHist.revenue || 0) * 10) / 10 : 0;
        const myOp = selfHist ? Number(selfHist.operating_income || 0) : 0;
        const myLiab = selfHist ? Number(selfHist.total_liabilities || 0) : 0;
        const myEq = selfHist ? Number(selfHist.total_equity || 0) : 0;
        const myEmp = Number(selfBiz?.nps_sbscrb_nmps || 0);

        const myMargin = myRev > 0 ? Math.round((myOp / myRev) * 10000) / 100 : null;
        const myDebt = myEq > 0 ? Math.round((myLiab / myEq) * 1000) / 10 : null;

        const rankings = {
          revenuePercentile: myRev > 0 ? clampPct(computeCumeDistAsc(bucket.revenuesAsc, myRev)) : 50,
          operatingMarginPercentile:
            myMargin !== null ? clampPct(computeCumeDistAsc(bucket.marginsAsc, myMargin)) : 50,
          debtRatioPercentile:
            myDebt !== null ? clampPct(computeCumeDistLowerIsBetter(bucket.debtRatiosAsc, myDebt)) : 50,
          employeePercentile: myEmp > 0 ? clampPct(computeCumeDistAsc(bucket.employeesAsc, myEmp)) : 50,
        };

        let myRankItem: { rank: number; b_no: string; b_nm: string; revenue: number } | null = null;
        if (myRev > 0 && selfBiz?.b_nm && !bucket.leaders.some((l) => l.b_no === cleanBNo)) {
          myRankItem = {
            rank: computeRankDescFromAsc(bucket.revenuesAsc, myRev),
            b_no: cleanBNo,
            b_nm: selfBiz.b_nm,
            revenue: myRev,
          };
        }

        return {
          groupTitle: bucket.groupTitle,
          totalCompanies: bucket.totalCompanies,
          closeRate: bucket.closeRate,
          avgRevenue: bucket.avgRevenue,
          avgDebtRatio: bucket.avgDebtRatio,
          avgOperatingMargin: bucket.avgOperatingMargin,
          rankings,
          leaders: bucket.leaders,
          myRankItem,
        };
      }
    }

    // 3) 12대 허브 외 희소 세분류 업종: B-Tree 인덱스(idx_businesses_b_sector) 정확일치 조회 (LIKE 풀스캔 전면 제거)
    const exactSector = bSector.trim();
    const cacheKey = `exact:${exactSector}`;
    const now = Date.now();
    let cachedGroup = industryGroupStatsCache.get(cacheKey);

    if (!cachedGroup || cachedGroup.expiresAt <= now) {
      const sectorRowsRes = await query(
        `SELECT b_no, b_nm, b_stt_cd, latest_revenue, latest_operating_income, nps_sbscrb_nmps
         FROM businesses
         WHERE b_sector = $1
           AND b_nm IS NOT NULL
           AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
         LIMIT 500`,
        [exactSector]
      );

      const rows = sectorRowsRes.rows;
      const totalCompanies = rows.length;
      const closedCount = rows.filter((r: any) => r.b_stt_cd === "03").length;
      const finRows = rows
        .filter((r: any) => Number(r.latest_revenue || 0) > 0)
        .map((r: any) => ({
          b_no: r.b_no,
          b_nm: r.b_nm,
          b_stt_cd: r.b_stt_cd,
          revenue: Math.round(Number(r.latest_revenue) * 10) / 10,
          margin:
            Number(r.latest_revenue) > 0
              ? (Number(r.latest_operating_income || 0) / Number(r.latest_revenue)) * 100
              : 0,
        }));

      const avgRevenue =
        finRows.length > 0
          ? Math.round(finRows.reduce((s: number, x: any) => s + x.revenue, 0) / finRows.length)
          : 0;
      const avgOperatingMargin =
        finRows.length > 0
          ? Number((finRows.reduce((s: number, x: any) => s + x.margin, 0) / finRows.length).toFixed(2))
          : 0;

      const leaders = finRows
        .filter((x: any) => x.b_stt_cd === "01")
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 3)
        .map((x: any) => ({ b_no: x.b_no, b_nm: x.b_nm, revenue: x.revenue }));

      cachedGroup = {
        expiresAt: now + 30 * 60 * 1000,
        totalCompanies,
        closeRate: totalCompanies > 0 ? Number(((closedCount / totalCompanies) * 100).toFixed(2)) : 0,
        avgRevenue,
        avgDebtRatio: 0,
        avgOperatingMargin,
        leaders,
      };
      if (industryGroupStatsCache.size > 200) {
        const oldest = industryGroupStatsCache.keys().next().value;
        if (oldest) industryGroupStatsCache.delete(oldest);
      }
      industryGroupStatsCache.set(cacheKey, cachedGroup);
    }

    return {
      groupTitle: getPeerSectorGroup(exactSector).groupTitle,
      totalCompanies: cachedGroup.totalCompanies,
      closeRate: cachedGroup.closeRate,
      avgRevenue: cachedGroup.avgRevenue,
      avgDebtRatio: cachedGroup.avgDebtRatio,
      avgOperatingMargin: cachedGroup.avgOperatingMargin,
      rankings: {
        revenuePercentile: 50,
        operatingMarginPercentile: 50,
        debtRatioPercentile: 50,
        employeePercentile: 50,
      },
      leaders: cachedGroup.leaders,
      myRankItem: null,
    };
  } catch (err) {
    console.error("Failed to compute industry analysis:", err);
    return {
      groupTitle: bSector || "미분류 업종",
      totalCompanies: 0,
      closeRate: 0,
      avgRevenue: 0,
      avgDebtRatio: 0,
      avgOperatingMargin: 0,
      rankings: {
        revenuePercentile: 50,
        operatingMarginPercentile: 50,
        debtRatioPercentile: 50,
        employeePercentile: 50
      },
      leaders: [],
      myRankItem: null
    };
  }
}

// 8. DB 기반 서식 단건 조회
export async function getTemplateByIdFromDB(id: string) {
  try {
    const res = await query(
      "SELECT id, title, category, description as desc, popular, tags, fields, initial_values as \"initialValues\" FROM document_templates WHERE id = $1 LIMIT 1",
      [id]
    );
    if (res.rows.length === 0) return null;
    return res.rows[0];
  } catch (err) {
    console.error(`Failed to fetch template by id [${id}] from DB:`, err);
    return null;
  }
}

// 9. DB 기반 서식 검색 및 필터링 (지능형 키워드 확장 및 카테고리 필터 지원)
export async function searchTemplatesFromDB(
  q: string = "",
  tag: string | null = null,
  category: string | null = null,
  limit: number = 150
) {
  try {
    let queryText = "SELECT id, title, category, description as desc, popular, tags FROM document_templates WHERE 1=1";
    const params: any[] = [];
    const safeLimit = Math.min(350, Math.max(1, limit));
    
    // 1. 대분류 카테고리 필터
    if (category && category.trim().length > 0) {
      params.push(category.trim());
      queryText += ` AND category = $${params.length}`;
    }

    // 2. 태그 스마트 매칭 필터
    if (tag && tag.trim().length > 0) {
      const cleanTag = tag.trim();
      const { TAG_RULES } = await import("./tagRules");
      const rule = TAG_RULES[cleanTag];

      if (rule) {
        const orClauses: string[] = [];
        
        // (1) 기본 태그 완전 일치
        params.push(cleanTag);
        orClauses.push(`$${params.length} = ANY(tags)`);

        // (2) 규칙 관련 태그 교집합 매칭
        if (rule.tags && rule.tags.length > 0) {
          params.push(rule.tags);
          orClauses.push(`tags && $${params.length}`);
        }

        // (3) 규칙 키워드 제목/설명 매칭
        if (rule.keywords && rule.keywords.length > 0) {
          rule.keywords.forEach(kw => {
            params.push(`%${kw}%`);
            orClauses.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
          });
        }

        queryText += ` AND (${orClauses.join(" OR ")})`;
      } else {
        // 정의된 규칙이 없는 경우 기본 태그 일치 및 제목 매칭
        params.push(cleanTag);
        const pTagIdx = params.length;
        params.push(`%${cleanTag}%`);
        const pKwIdx = params.length;
        queryText += ` AND ($${pTagIdx} = ANY(tags) OR title ILIKE $${pKwIdx} OR description ILIKE $${pKwIdx})`;
      }
    }
    
    // 3. 검색어 필터
    if (q && q.trim().length > 0) {
      params.push(`%${q.trim()}%`);
      queryText += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }
    
    params.push(safeLimit);
    queryText += ` ORDER BY popular DESC, title ASC LIMIT $${params.length}`;
    
    const res = await query(queryText, params);
    return res.rows;
  } catch (err) {
    console.error("Failed to search templates from DB:", err);
    return [];
  }
}

// 10. 모든 DB 기반 서식 ID 조회 (사이트맵 연동용)
export async function getAllTemplatesFromDB() {
  try {
    const res = await query("SELECT id FROM document_templates ORDER BY id ASC", []);
    return res.rows;
  } catch (err) {
    console.error("Failed to fetch all templates from DB:", err);
    return [];
  }
}

// 11. 사용자 피드백(버그신고/제안) 데이터베이스 헬퍼
export interface FeedbackItem {
  id: number;
  message: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  category?: string;
  status: string;
  createdAt: string;
}

export async function createFeedback(data: {
  message: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  category?: string;
}) {
  const res = await query(
    `INSERT INTO feedbacks (message, url, user_agent, user_id, category, status)
     VALUES ($1, $2, $3, $4, $5, 'PENDING')
     RETURNING id, message, url, user_agent as "userAgent", user_id as "userId", category, status, created_at as "createdAt"`,
    [data.message, data.url || null, data.userAgent || null, data.userId || null, data.category || "suggestion"]
  );
  return res.rows[0];
}

export async function getAllFeedbacks(status?: string) {
  let queryText = `SELECT id, message, url, user_agent as "userAgent", user_id as "userId", category, status, created_at as "createdAt"
                   FROM feedbacks`;
  const params: any[] = [];
  if (status && status !== "ALL") {
    params.push(status);
    queryText += ` WHERE status = $1`;
  }
  queryText += ` ORDER BY id DESC LIMIT 200`;
  const res = await query(queryText, params);
  return res.rows;
}

export async function updateFeedbackStatus(id: number, status: string) {
  const res = await query(
    `UPDATE feedbacks SET status = $1 WHERE id = $2 RETURNING id, status`,
    [status, id]
  );
  return res.rows[0];
}

export async function deleteFeedback(id: number) {
  await query(`DELETE FROM feedbacks WHERE id = $1`, [id]);
  return true;
}

// ----------------------------------------------------
// 무료 전자계약 플랫폼 (e-Contract) DB 함수군
// ----------------------------------------------------

let contractsTableEnsuredPromise: Promise<void> | null = null;

export async function ensureContractsTable() {
  if (contractsTableEnsuredPromise) {
    return contractsTableEnsuredPromise;
  }

  contractsTableEnsuredPromise = (async () => {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS contracts (
          id VARCHAR(64) PRIMARY KEY,
          template_id VARCHAR(64) NOT NULL,
          title VARCHAR(255) NOT NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'WAITING_PARTY_B',
          party_a_name VARCHAR(128),
          party_a_company VARCHAR(128),
          party_a_bno VARCHAR(32),
          party_a_phone VARCHAR(32),
          party_a_signature TEXT,
          party_a_signed_at TIMESTAMPTZ,
          party_a_ip VARCHAR(64),
          party_b_name VARCHAR(128),
          party_b_company VARCHAR(128),
          party_b_bno VARCHAR(32),
          party_b_phone VARCHAR(32),
          party_b_signature TEXT,
          party_b_signed_at TIMESTAMPTZ,
          party_b_ip VARCHAR(64),
          form_data JSONB NOT NULL,
          sign_token VARCHAR(64) UNIQUE NOT NULL,
          access_pin VARCHAR(16),
          party_a_user_id VARCHAR(128),
          party_b_user_id VARCHAR(128),
          r2_key VARCHAR(255),
          deleted_by_a BOOLEAN DEFAULT FALSE,
          deleted_by_b BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE contracts ADD COLUMN IF NOT EXISTS access_pin VARCHAR(16);
        ALTER TABLE contracts ADD COLUMN IF NOT EXISTS party_a_user_id VARCHAR(128);
        ALTER TABLE contracts ADD COLUMN IF NOT EXISTS party_b_user_id VARCHAR(128);
        ALTER TABLE contracts ADD COLUMN IF NOT EXISTS r2_key VARCHAR(255);
        ALTER TABLE contracts ADD COLUMN IF NOT EXISTS deleted_by_a BOOLEAN DEFAULT FALSE;
        ALTER TABLE contracts ADD COLUMN IF NOT EXISTS deleted_by_b BOOLEAN DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS idx_contracts_sign_token ON contracts(sign_token);
        CREATE INDEX IF NOT EXISTS idx_contracts_party_a_user ON contracts(party_a_user_id);
        CREATE INDEX IF NOT EXISTS idx_contracts_party_b_user ON contracts(party_b_user_id);

        CREATE TABLE IF NOT EXISTS contract_users (
          id VARCHAR(128) PRIMARY KEY,
          provider VARCHAR(32) NOT NULL DEFAULT 'quick',
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(128),
          company VARCHAR(128),
          password_hash VARCHAR(255),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    } catch (err) {
      contractsTableEnsuredPromise = null;
      throw err;
    }
  })();

  return contractsTableEnsuredPromise;
}

export async function upsertContractUser(data: {
  id: string;
  provider: string;
  email: string;
  name?: string;
  company?: string;
  passwordHash?: string;
}) {
  await ensureContractsTable();
  const res = await query(
    `INSERT INTO contract_users (id, provider, email, name, company, password_hash, created_at)
     VALUES ($1, $2, LOWER($3), $4, $5, $6, NOW())
     ON CONFLICT (email) DO UPDATE SET
       name = COALESCE(NULLIF($4, ''), contract_users.name),
       company = COALESCE(NULLIF($5, ''), contract_users.company),
       password_hash = COALESCE(NULLIF($6, ''), contract_users.password_hash)
     RETURNING id, provider, email, name, company, created_at`,
    [
      data.id,
      data.provider,
      data.email.trim(),
      data.name || "",
      data.company || "",
      data.passwordHash || "",
    ]
  );
  return res.rows[0];
}

export async function getContractUserByEmail(email: string) {
  await ensureContractsTable();
  const res = await query(
    `SELECT * FROM contract_users WHERE email = LOWER($1) LIMIT 1`,
    [email.trim()]
  );
  return res.rows[0] || null;
}

export async function deleteContractUser(userId: string, email: string) {
  await ensureContractsTable();
  const cleanId = (userId || "").trim();
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanId && !cleanEmail) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (cleanId) {
      await client.query(
        `UPDATE contracts
         SET party_a_user_id = CASE WHEN party_a_user_id = $1 THEN '' ELSE party_a_user_id END,
             party_b_user_id = CASE WHEN party_b_user_id = $1 THEN '' ELSE party_b_user_id END,
             updated_at = NOW()
         WHERE party_a_user_id = $1 OR party_b_user_id = $1`,
        [cleanId]
      );
    }
    await client.query(
      `DELETE FROM contract_users
       WHERE ($1 != '' AND id = $1)
          OR ($2 != '' AND LOWER(email) = $2)`,
      [cleanId, cleanEmail]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function createContract(data: {
  id: string;
  templateId: string;
  title: string;
  partyAName?: string;
  partyACompany?: string;
  partyABno?: string;
  partyAPhone?: string;
  partyASignature?: string;
  partyAIp?: string;
  partyAUserId?: string;
  partyBName?: string;
  partyBCompany?: string;
  partyBBno?: string;
  partyBPhone?: string;
  formData: any;
  signToken: string;
  accessPin?: string;
  r2Key?: string;
}) {
  await ensureContractsTable();
  const res = await query(
    `INSERT INTO contracts (
      id, template_id, title, status,
      party_a_name, party_a_company, party_a_bno, party_a_phone,
      party_a_signature, party_a_signed_at, party_a_ip, party_a_user_id,
      party_b_name, party_b_company, party_b_bno, party_b_phone,
      form_data, sign_token, access_pin, r2_key, created_at, updated_at
    ) VALUES (
      $1, $2, $3, 'WAITING_PARTY_B',
      $4, $5, $6, $7,
      $8, NOW(), $9, $10,
      $11, $12, $13, $14,
      $15, $16, $17, $18, NOW(), NOW()
    ) RETURNING *`,
    [
      data.id,
      data.templateId,
      data.title,
      data.partyAName || "",
      data.partyACompany || "",
      data.partyABno || "",
      data.partyAPhone || "",
      data.partyASignature || "",
      data.partyAIp || "",
      data.partyAUserId || "",
      data.partyBName || "",
      data.partyBCompany || "",
      data.partyBBno || "",
      data.partyBPhone || "",
      JSON.stringify(data.formData),
      data.signToken,
      data.accessPin || "",
      data.r2Key || "",
    ]
  );
  return res.rows[0];
}

export async function getContractBySignToken(token: string) {
  await ensureContractsTable();
  const res = await query(
    `SELECT * FROM contracts WHERE sign_token = $1 LIMIT 1`,
    [token]
  );
  return res.rows[0] || null;
}

export async function getContractById(id: string) {
  await ensureContractsTable();
  const res = await query(
    `SELECT * FROM contracts WHERE id = $1 LIMIT 1`,
    [id]
  );
  return res.rows[0] || null;
}

export async function completePartyBSignature(
  token: string,
  partyBSignature: string,
  partyBIp: string,
  partyBName?: string,
  partyBUserId?: string,
  r2Key?: string
) {
  await ensureContractsTable();
  const res = await query(
    `UPDATE contracts SET
      party_b_signature = $1,
      party_b_signed_at = NOW(),
      party_b_ip = $2,
      party_b_name = COALESCE(NULLIF($3, ''), party_b_name),
      party_b_user_id = COALESCE(NULLIF($4, ''), party_b_user_id),
      r2_key = COALESCE(NULLIF($5, ''), r2_key),
      status = 'COMPLETED',
      updated_at = NOW()
     WHERE sign_token = $6
       AND status = 'WAITING_PARTY_B'
     RETURNING *`,
    [partyBSignature, partyBIp, partyBName || "", partyBUserId || "", r2Key || "", token]
  );
  return res.rows[0] || null;
}

export async function bindUserToContract(token: string, userId: string, role: "A" | "B") {
  await ensureContractsTable();
  if (!userId) return;
  if (role === "A") {
    await query(
      `UPDATE contracts
       SET party_a_user_id = $1, deleted_by_a = FALSE, updated_at = NOW()
       WHERE sign_token = $2 AND (party_a_user_id IS NULL OR party_a_user_id = '' OR party_a_user_id = $1)`,
      [userId, token]
    );
  } else {
    await query(
      `UPDATE contracts
       SET party_b_user_id = $1, deleted_by_b = FALSE, updated_at = NOW()
       WHERE sign_token = $2 AND (party_b_user_id IS NULL OR party_b_user_id = '' OR party_b_user_id = $1)`,
      [userId, token]
    );
  }
}

export async function getContractsByUserId(userId: string, userEmail?: string) {
  if (!userId && !userEmail) return [];
  await ensureContractsTable();
  const emailLower = (userEmail || "").trim().toLowerCase();

  const res = await query(
    `SELECT id, template_id, title, status,
            party_a_name, party_a_company, party_a_bno, party_a_phone, party_a_signed_at, party_a_user_id,
            party_b_name, party_b_company, party_b_bno, party_b_phone, party_b_signed_at, party_b_user_id,
            form_data->>'partyAEmail' AS party_a_email,
            form_data->>'partyBEmail' AS party_b_email,
            sign_token, access_pin, r2_key, created_at, updated_at
     FROM contracts
     WHERE (
       ($1 != '' AND party_a_user_id = $1 AND COALESCE(deleted_by_a, FALSE) = FALSE)
       OR ($1 != '' AND party_b_user_id = $1 AND COALESCE(deleted_by_b, FALSE) = FALSE)
       OR ($2 != '' AND LOWER(form_data->>'partyAEmail') = $2 AND COALESCE(deleted_by_a, FALSE) = FALSE)
       OR ($2 != '' AND LOWER(form_data->>'partyBEmail') = $2 AND COALESCE(deleted_by_b, FALSE) = FALSE)
     )
     ORDER BY created_at DESC
     LIMIT 100`,
    [userId || "", emailLower]
  );
  return res.rows;
}

export async function getContractsByIds(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  await ensureContractsTable();
  const res = await query(
    `SELECT id, template_id, title, status,
            party_a_name, party_a_company, party_a_signed_at, party_a_user_id,
            party_b_name, party_b_company, party_b_signed_at, party_b_user_id,
            sign_token, r2_key, created_at, updated_at
     FROM contracts
     WHERE id = ANY($1::varchar[])
       AND COALESCE(deleted_by_a, FALSE) = FALSE
     ORDER BY created_at DESC
     LIMIT 50`,
    [ids]
  );
  return res.rows;
}

export async function deleteContractForUser(
  contractId: string,
  userId?: string,
  userEmail?: string
) {
  await ensureContractsTable();
  const cleanId = (userId || "").trim();
  const cleanEmail = (userEmail || "").trim().toLowerCase();
  if (!cleanId && !cleanEmail) {
    return false;
  }

  await query(
    `UPDATE contracts SET
      deleted_by_a = CASE
        WHEN ($2 != '' AND party_a_user_id = $2)
          OR ($3 != '' AND LOWER(form_data->>'partyAEmail') = $3)
        THEN TRUE
        ELSE deleted_by_a
      END,
      deleted_by_b = CASE
        WHEN ($2 != '' AND party_b_user_id = $2)
          OR ($3 != '' AND LOWER(form_data->>'partyBEmail') = $3)
        THEN TRUE
        ELSE deleted_by_b
      END,
      updated_at = NOW()
     WHERE id = $1`,
    [contractId, cleanId, cleanEmail]
  );
  return true;
}




