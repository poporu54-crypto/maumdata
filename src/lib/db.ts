import { Pool } from "pg";
import { getKsicName } from "./ksicMap";


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

// 1. 특정 사업자번호로 기업 상세 정보 및 재무이력 조회
export async function getBusinessByBNo(bNo: string) {
  const clean = bNo.replace(/[^0-9]/g, "");
  const bizResult = await query("SELECT * FROM businesses WHERE b_no = $1 LIMIT 1", [clean]);
  if (bizResult.rows.length === 0) return null;

  const business = bizResult.rows[0];
  
  // 조회수 및 실시간 로그 증가 (비동기 수행하여 응답 속도 영향 방지)
  Promise.all([
    query("UPDATE businesses SET view_count = view_count + 1 WHERE b_no = $1", [clean]),
    query("INSERT INTO business_view_logs (b_no) VALUES ($1)", [clean])
  ]).catch(err => {
    console.error("Failed to record view metrics:", err);
  });
  
  // 1:N 연도별 이력 조회
  const histResult = await query(
    `SELECT year, revenue, operating_income as "operatingIncome", net_income as "netIncome", 
            total_assets as "totalAssets", total_liabilities as "totalLiabilities", 
            total_equity as "totalEquity", employees 
     FROM business_history 
     WHERE b_no = $1 
     ORDER BY year ASC`,
    [clean]
  );

  // 1:N 타임라인 연혁 조회
  const timelineResult = await query(
    `SELECT event_date as "eventDate", event_title as "eventTitle", event_description as "eventDescription"
     FROM business_timeline
     WHERE b_no = $1
     ORDER BY event_date DESC`,
    [clean]
  );

  // 1:N 월별 고용 이력 조회
  const empHistResult = await query(
    `SELECT record_month as "recordMonth", employees, new_acquisitions as "newAcquisitions", 
            losses, nps_charge_amount as "npsChargeAmount"
     FROM business_employment_history
     WHERE b_no = $1
     ORDER BY record_month ASC`,
    [clean]
  );

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
      revenue: parseInt(r.revenue || "0", 10),
      operatingIncome: parseInt(r.operatingIncome || "0", 10),
      netIncome: parseInt(r.netIncome || "0", 10),
      totalAssets: parseInt(r.totalAssets || "0", 10),
      totalLiabilities: parseInt(r.totalLiabilities || "0", 10),
      totalEquity: parseInt(r.totalEquity || "0", 10),
      employees: parseInt(r.employees || "0", 10),
    }))
  };
}

// 2. 전체 기업 기본정보 조회 (Sitemap / 전체 검색용)
export async function getAllBusinesses() {
  const result = await query("SELECT b_no, b_nm, p_nm, b_adr, b_sector, is_sme, listing_status, data_source FROM businesses");
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

// 3. 기업명 또는 업종 등 검색 (LIKE 쿼리)
export async function searchBusinesses(q: string) {
  const searchWord = `%${q}%`;
  const cleanQ = q.replace(/[^0-9]/g, "");
  const result = await query(
    `SELECT b_no, b_nm, p_nm, b_adr, b_sector, is_sme, listing_status, data_source, brand_name 
     FROM businesses 
     WHERE b_nm LIKE $1 OR p_nm LIKE $1 OR b_adr LIKE $1 OR brand_name LIKE $1 OR b_no = $2`,
    [searchWord, cleanQ || "NOT_A_NUMBER"]
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
    brand_name: row.brand_name || "",
  }));
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
      b_stt, b_stt_cd, nps_chrg_amt
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27,
      $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
      $41, $42, $43, $44, $45
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
      nps_chrg_amt = EXCLUDED.nps_chrg_amt
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
    biz.npsChrgAmt || 0
  ]);

  // 1.1. 신규 설립일 타임라인 자동 갱신
  if (biz.start_dt) {
    await query(`
      INSERT INTO business_timeline (b_no, event_date, event_title, event_description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (b_no, event_date, event_title) DO NOTHING
    `, [clean, biz.start_dt, "법인 설립", `${biz.b_nm} 설립 및 개업`]);
  }

  // 1.2. 국민연금 월별 고용 이력 적재
  if (biz.npsLinked && biz.npsSbscrbNmps > 0) {
    let recordMonth = "";
    const cleanBasDt = (biz.basDt || "").replace(/[^0-9]/g, "");
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

  // 2. 재무이력 갱신 (ON CONFLICT 방식으로 동시성 레이스 컨디션 해결 및 연도 중복 방어)
  if (biz.history && Array.isArray(biz.history)) {
    // 연도별 중복 제거 (동일 연도가 여러 개 존재할 경우, 마지막 항목을 사용하여 중복 방어)
    const uniqueHistoryMap = new Map<number, any>();
    for (const h of biz.history) {
      if (h && typeof h.year === "number") {
        uniqueHistoryMap.set(h.year, h);
      }
    }

    for (const h of uniqueHistoryMap.values()) {
      await query(`
        INSERT INTO business_history (
          b_no, year, revenue, operating_income, net_income, total_assets, total_liabilities, total_equity, employees
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (b_no, year) DO UPDATE SET
          revenue = EXCLUDED.revenue,
          operating_income = EXCLUDED.operating_income,
          net_income = EXCLUDED.net_income,
          total_assets = EXCLUDED.total_assets,
          total_liabilities = EXCLUDED.total_liabilities,
          total_equity = EXCLUDED.total_equity,
          employees = EXCLUDED.employees
      `, [
        clean, h.year, h.revenue || 0, h.operatingIncome || 0, h.netIncome || 0,
        h.totalAssets || 0, h.totalLiabilities || 0, h.totalEquity || 0, h.employees || 0
      ]);
    }
  }
}

// 5. 미등록/폐업 블랙리스트 조회
export async function getInvalidBusinesses() {
  const result = await query("SELECT b_no FROM invalid_businesses");
  return result.rows.map(r => r.b_no);
}

// 6. 미등록 블랙리스트 등록
export async function addInvalidBusiness(bNo: string) {
  const clean = bNo.replace(/[^0-9]/g, "");
  await query("INSERT INTO invalid_businesses (b_no) VALUES ($1) ON CONFLICT (b_no) DO NOTHING", [clean]);
}

// 7. 국가 통계 이력 조회
export async function getStatsHistory() {
  const result = await query(`
    SELECT bas_dt as "basDt", stats_data as "statsData" 
    FROM stats_history 
    ORDER BY bas_dt ASC
  `);
  return result.rows.map((row) => ({
    date: row.basDt,
    ...row.statsData
  }));
}

// 8. 국가 통계 이력 등록/갱신
export async function upsertStatsHistory(stat: any) {
  const { date, ...statsData } = stat;
  await query(`
    INSERT INTO stats_history (bas_dt, stats_data)
    VALUES ($1, $2)
    ON CONFLICT (bas_dt) DO UPDATE SET
      stats_data = EXCLUDED.stats_data
  `, [date, JSON.stringify(statsData)]);
}

// 9. 주변 기업 및 유사 사업자 하이브리드 스코어링 추천 조회
export async function getRecommendedBusinesses(
  bNo: string,
  bAdr: string,
  bSector: string,
  isSme: string
) {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  
  // 시/군/구 추출 (예: "마포구", "강남구", "안양시" 등)
  let sigungu = "";
  const adrMatch = bAdr.match(/\s([^\s]+(?:구|군|시))\s/);
  if (adrMatch) {
    sigungu = `%${adrMatch[1]}%`;
  } else {
    const tokens = bAdr.split(" ");
    sigungu = tokens.length > 1 ? `%${tokens[1]}%` : "%서울%";
  }

  // 업종 핵심 키워드 추출 (예: "음식점", "제조업", "소프트웨어")
  let sectorKeyword = "%";
  if (bSector) {
    const cleanSector = bSector.split(",")[0].split(" 및 ")[0].trim();
    sectorKeyword = `%${cleanSector}%`;
  }

  const queryText = `
    SELECT b_no, b_nm, b_adr, b_sector, is_sme, listing_status, data_source
    FROM businesses
    WHERE b_no != $1 AND b_nm != '상호 정보 없음'
    ORDER BY 
      (CASE WHEN b_adr LIKE $2 THEN 50 ELSE 0 END) +
      (CASE WHEN b_sector LIKE $3 THEN 40 ELSE 0 END) +
      (CASE WHEN is_sme = $4 THEN 10 ELSE 0 END) DESC,
      start_dt DESC
    LIMIT 4
  `;

  const result = await query(queryText, [cleanBNo, sigungu, sectorKeyword, isSme || ""]);
  return result.rows.map((row) => ({
    b_no: row.b_no,
    b_nm: row.b_nm,
    b_adr: row.b_adr,
    b_sector: row.b_sector,
    is_sme: row.is_sme,
    listing_status: row.listing_status,
    dataSource: row.data_source || "local"
  }));
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

// 17. 특허 캐시 저장
export async function savePatents(bNo: string, patents: any[]) {
  const clean = bNo.replace(/[^0-9]/g, "");
  await query("DELETE FROM business_patents WHERE b_no = $1", [clean]);
  for (const p of patents) {
    await query(`
      INSERT INTO business_patents (
        b_no, application_number, application_date, invention_title,
        register_number, register_date, applicant_name, patent_status, detail_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (application_number) DO UPDATE SET
        b_no = EXCLUDED.b_no,
        application_date = EXCLUDED.application_date,
        invention_title = EXCLUDED.invention_title,
        register_number = EXCLUDED.register_number,
        register_date = EXCLUDED.register_date,
        applicant_name = EXCLUDED.applicant_name,
        patent_status = EXCLUDED.patent_status,
        detail_url = EXCLUDED.detail_url
    `, [
      clean, p.applicationNumber, p.applicationDate, p.inventionTitle,
      p.registerNumber || null, p.registerDate || null, p.applicantName, p.patentStatus, p.detailUrl || null
    ]);
  }
  await query("UPDATE businesses SET patents_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1", [clean]);
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
  return result.rows.map(r => ({
    ...r,
    presmptPrce: parseFloat(r.presmptPrce || "0")
  }));
}

// 19. 입찰/낙찰 캐시 저장
export async function saveBids(bNo: string, bids: any[]) {
  const clean = bNo.replace(/[^0-9]/g, "");
  await query("DELETE FROM business_bids WHERE b_no = $1", [clean]);
  for (const b of bids) {
    await query(`
      INSERT INTO business_bids (
        b_no, bid_ntce_no, bid_ntce_ord, bid_ntce_nm, dminstt_nm,
        opng_dt, bid_ntce_dt, cntrct_cncl_mthd_nm, presmpt_prce, detail_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (bid_ntce_no, bid_ntce_ord) DO UPDATE SET
        b_no = EXCLUDED.b_no,
        bid_ntce_nm = EXCLUDED.bid_ntce_nm,
        dminstt_nm = EXCLUDED.dminstt_nm,
        opng_dt = EXCLUDED.opng_dt,
        bid_ntce_dt = EXCLUDED.bid_ntce_dt,
        cntrct_cncl_mthd_nm = EXCLUDED.cntrct_cncl_mthd_nm,
        presmpt_prce = EXCLUDED.presmpt_prce,
        detail_url = EXCLUDED.detail_url
    `, [
      clean, b.bidNtceNo, b.bidNtceOrd, b.bidNtceNm, b.dminsttNm,
      b.opngDt, b.bidNtceDt, b.cntrctCnclMthdNm, b.presmptPrce, b.detailUrl
    ]);
  }
  await query("UPDATE businesses SET bids_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1", [clean]);
}

// 20. 공시 캐시 조회
export async function getDisclosuresByBNo(bNo: string) {
  const clean = bNo.replace(/[^0-9]/g, "");
  const result = await query(
    `SELECT rcept_no as "rceptNo", corp_code as "corpCode",
            report_nm as "reportNm", flr_nm as "flrNm",
            rcept_dt as "rceptDt", rm, detail_url as "detailUrl",
            is_key_disclosure as "isKeyDisclosure"
     FROM business_disclosures
     WHERE b_no = $1
     ORDER BY rcept_dt DESC`,
    [clean]
  );
  return result.rows;
}

// 21. 공시 캐시 저장
export async function saveDisclosures(bNo: string, disclosures: any[]) {
  const clean = bNo.replace(/[^0-9]/g, "");
  await query("DELETE FROM business_disclosures WHERE b_no = $1", [clean]);
  for (const d of disclosures) {
    await query(`
      INSERT INTO business_disclosures (
        b_no, rcept_no, corp_code, report_nm, flr_nm, rcept_dt, rm, detail_url, is_key_disclosure
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (rcept_no) DO UPDATE SET
        b_no = EXCLUDED.b_no,
        corp_code = EXCLUDED.corp_code,
        report_nm = EXCLUDED.report_nm,
        flr_nm = EXCLUDED.flr_nm,
        rcept_dt = EXCLUDED.rcept_dt,
        rm = EXCLUDED.rm,
        detail_url = EXCLUDED.detail_url,
        is_key_disclosure = EXCLUDED.is_key_disclosure
    `, [
      clean, d.rceptNo, d.corpCode || null, d.reportNm, d.flrNm,
      d.rceptDt, d.rm || null, d.detailUrl, d.isKeyDisclosure || false
    ]);
  }
  await query("UPDATE businesses SET dart_last_sync_at = CURRENT_TIMESTAMP WHERE b_no = $1", [clean]);
}

// 22. 동일 업종 내 통계 및 상대적 위치 연산
export async function getIndustryAnalysis(bSector: string, bNo: string) {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  const uselessSectors = ["미등록 업종", "상장 법인", "상장법인", "대기업", "중소기업", "일반기업", "중견기업", "기타 서비스업", "기타서비스업", "-", ""];
  
  if (!bSector || uselessSectors.includes(bSector.trim())) {
    return {
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
      leaders: []
    };
  }

  try {
    // 1. 업종 내 기본 통계 조회 (전체 기업 수, 평균 폐업률, 평균 매출액 등)
    const statsResult = await query(`
      WITH latest_history AS (
        SELECT DISTINCT ON (b_no) b_no, revenue, operating_income, total_liabilities, total_equity, employees
        FROM business_history
        ORDER BY b_no, year DESC
      )
      SELECT 
        COUNT(*) as total_companies,
        COALESCE(SUM(CASE WHEN b_stt_cd = '03' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0)::float * 100, 0) as close_rate,
        COALESCE(AVG(h.revenue), 0) as avg_revenue,
        COALESCE(AVG(CASE WHEN h.total_equity > 0 THEN (h.total_liabilities::float / h.total_equity::float)*100 ELSE NULL END), 0) as avg_debt_ratio,
        COALESCE(AVG(CASE WHEN h.revenue > 0 THEN (h.operating_income::float / h.revenue::float)*100 ELSE NULL END), 0) as avg_operating_margin
      FROM businesses b
      LEFT JOIN latest_history h ON b.b_no = h.b_no
      WHERE b.b_sector = $1 AND b.b_nm != '상호 정보 없음'
    `, [bSector]);

    const stats = statsResult.rows[0] || {
      total_companies: 0,
      close_rate: 0,
      avg_revenue: 0,
      avg_debt_ratio: 0,
      avg_operating_margin: 0
    };

    // 2. 현재 기업의 업종 내 상대적 백분위 위치 연산
    const rankingResult = await query(`
      WITH latest_history AS (
        SELECT DISTINCT ON (b_no) b_no, revenue, operating_income, total_liabilities, total_equity, employees
        FROM business_history
        ORDER BY b_no, year DESC
      ),
      percentiles AS (
        SELECT 
          b.b_no,
          percent_rank() OVER (ORDER BY COALESCE(h.revenue, 0) ASC) as rev_pct,
          percent_rank() OVER (ORDER BY COALESCE(CASE WHEN h.revenue > 0 THEN (h.operating_income::float / h.revenue::float)*100 ELSE NULL END, -999) ASC) as margin_pct,
          percent_rank() OVER (ORDER BY COALESCE(CASE WHEN h.total_equity > 0 THEN (h.total_liabilities::float / h.total_equity::float)*100 ELSE NULL END, 9999) DESC) as debt_pct,
          percent_rank() OVER (ORDER BY COALESCE(b.nps_sbscrb_nmps, 0) ASC) as emp_pct
        FROM businesses b
        LEFT JOIN latest_history h ON b.b_no = h.b_no
        WHERE b.b_sector = $1 AND b.b_nm != '상호 정보 없음'
      )
      SELECT * FROM percentiles WHERE b_no = $2
    `, [bSector, cleanBNo]);

    let rankings = {
      revenuePercentile: 50,
      operatingMarginPercentile: 50,
      debtRatioPercentile: 50,
      employeePercentile: 50
    };

    if (rankingResult.rows.length > 0) {
      const row = rankingResult.rows[0];
      rankings = {
        revenuePercentile: Math.round(row.rev_pct * 100),
        operatingMarginPercentile: Math.round(row.margin_pct * 100),
        debtRatioPercentile: Math.round(row.debt_pct * 100),
        employeePercentile: Math.round(row.emp_pct * 100)
      };
    }

    // 3. 업종 내 순위 리스트 (매출액 기준 상위 3개 업체)
    const leadersResult = await query(`
      WITH latest_history AS (
        SELECT DISTINCT ON (b_no) b_no, revenue, year
        FROM business_history
        ORDER BY b_no, year DESC
      )
      SELECT b.b_no, b.b_nm, COALESCE(h.revenue, 0) as revenue
      FROM businesses b
      JOIN latest_history h ON b.b_no = h.b_no
      WHERE b.b_sector = $1 AND b.b_nm != '상호 정보 없음' AND b.b_stt_cd = '01'
      ORDER BY revenue DESC
      LIMIT 3
    `, [bSector]);

    const leaders = leadersResult.rows.map(r => ({
      b_no: r.b_no,
      b_nm: r.b_nm,
      revenue: parseInt(r.revenue, 10)
    }));

    return {
      totalCompanies: parseInt(stats.total_companies || "0", 10),
      closeRate: parseFloat(parseFloat(stats.close_rate || "0").toFixed(2)),
      avgRevenue: Math.round(parseFloat(stats.avg_revenue || "0")),
      avgDebtRatio: Math.round(parseFloat(stats.avg_debt_ratio || "0")),
      avgOperatingMargin: parseFloat(parseFloat(stats.avg_operating_margin || "0").toFixed(2)),
      rankings,
      leaders
    };

  } catch (err) {
    console.error("Failed to compute industry analysis:", err);
    return {
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
      leaders: []
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

// 9. DB 기반 서식 검색 및 필터링
export async function searchTemplatesFromDB(q: string, tag: string | null) {
  try {
    let queryText = "SELECT id, title, category, description as desc, popular, tags FROM document_templates WHERE 1=1";
    const params: any[] = [];
    
    if (tag) {
      params.push(tag);
      queryText += ` AND $${params.length} = ANY(tags)`;
    }
    
    if (q && q.trim().length > 0) {
      params.push(`%${q.trim()}%`);
      queryText += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }
    
    queryText += " ORDER BY title ASC";
    
    const res = await query(queryText, params);
    return res.rows;
  } catch (err) {
    console.error("Failed to search templates from DB:", err);
    return [];
  }
}




