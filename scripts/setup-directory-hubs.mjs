import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function resolveRegionHubSlug(rawAddress) {
  if (!rawAddress) return null;
  const adr = String(rawAddress).trim();
  if (!adr || adr === "-" || adr.includes("정보 없음")) return null;

  if (adr.includes("서울")) {
    if (adr.includes("강남구")) return "seoul-gangnam";
    if (adr.includes("서초구")) return "seoul-seocho";
    if (adr.includes("영등포구")) return "seoul-yeongdeungpo";
    if (adr.includes("종로구") || adr.includes("중구")) return "seoul-junggu-jongno";
    if (adr.includes("금천구") || adr.includes("구로구")) return "seoul-gasan-guro";
    if (adr.includes("성동구")) return "seoul-seongdong";
    if (adr.includes("송파구")) return "seoul-songpa";
    if (adr.includes("강서구")) return "seoul-magok";
    if (adr.includes("마포구")) return "seoul-mapo";
  }

  if (adr.includes("성남시") && (adr.includes("분당구") || adr.includes("수정구") || adr.includes("판교"))) {
    return "gyeonggi-pangyo";
  }
  if (adr.includes("수원시") || adr.includes("화성시")) {
    return "gyeonggi-suwon-hwaseong";
  }
  if (adr.includes("용인시") || adr.includes("안양시") || adr.includes("과천시")) {
    return "gyeonggi-yongin-anyang";
  }
  if (adr.includes("인천")) return "incheon";
  if (adr.includes("부산")) return "busan";
  if (
    adr.includes("대전") ||
    adr.includes("세종") ||
    adr.includes("충청") ||
    adr.includes("충남") ||
    adr.includes("충북") ||
    adr.includes("천안시") ||
    adr.includes("아산시") ||
    adr.includes("청주시")
  ) {
    return "daejeon-chungcheong";
  }
  if (adr.includes("대구") || adr.includes("경상북도") || adr.includes("경북") || adr.includes("포항시") || adr.includes("구미시")) {
    return "daegu-gyeongbuk";
  }
  if (adr.includes("울산") || adr.includes("경상남도") || adr.includes("경남") || adr.includes("창원시") || adr.includes("김해시")) {
    return "ulsan-changwon";
  }
  if (
    adr.includes("광주광역시") ||
    adr.startsWith("광주 ") ||
    adr.includes("전라") ||
    adr.includes("전북") ||
    adr.includes("전남") ||
    adr.includes("전주시") ||
    adr.includes("여수시") ||
    adr.includes("제주")
  ) {
    return "honam-jeju";
  }
  return null;
}

function matchSectorKeywordToIndustry(text) {
  if (!text) return null;
  if (/소프트웨어|프로그래밍|시스템 통합|정보 서비스|데이터베이스|포털|인터넷|클라우드|호스팅|게임/.test(text)) {
    return "software-it";
  }
  if (/반도체|전자부품|인쇄회로|디스플레이|액정|다이오드|컴퓨터|주변장치|전자집적회로/.test(text)) {
    return "semiconductor-electronics";
  }
  if (/의약품|제약|바이오|의료용|의료기기|진단|백신|생물학적|병원|의원|임플란트|안경렌즈/.test(text)) {
    return "bio-pharma-medical";
  }
  if (/자동차|트레일러|차체|모빌리티|선박|항공기|철도장비|운송장비/.test(text)) {
    return "automotive-mobility";
  }
  if (/로봇|기계|금형|전동기|발전기|배전반|전기장비|일차전지|축전지|이차전지|냉동장비|측정.*분석 기구|송전|배전|발전업|전력|가스 제조|열공급/.test(text)) {
    return "machinery-robotics";
  }
  if (/건설업|공사업|토목|건축|엔지니어링|감리/.test(text)) {
    return "construction-engineering";
  }
  if (/화장품|세제|광택제|의복|패션|섬유|가죽|신발|식료품|식품|음료|육류|수산물|농산물|제과|제빵/.test(text)) {
    return "cosmetics-fashion-consumer";
  }
  if (/화학|합성수지|플라스틱|고무|접착제|철강|금속|비금속|유리|세라믹|정유|석유/.test(text)) {
    return "chemical-materials";
  }
  if (/통신.*장비|전기통신|방송|영상|오디오|출판|영화|음악|엔터테인먼트|광고/.test(text)) {
    return "telecom-media-content";
  }
  if (/전자상거래|통신판매|도매|소매|백화점|면세점|무역|유통/.test(text)) {
    return "ecommerce-distribution";
  }
  if (/금융|투자|증권|은행|보험|신탁|컨설팅|연구개발|회계|세무|법무/.test(text)) {
    return "finance-consulting-rd";
  }
  if (/부동산|임대업|호텔|숙박|리조트|스포츠|레저|사업지원|인력공급|여행|보안|경비/.test(text)) {
    return "real-estate-hospitality";
  }
  return null;
}

function resolveIndustryHubSlug(rawSector, rawMainBiz, rawCompanyName) {
  const name = String(rawCompanyName || "").trim();
  if (/증권|자산운용|투자신탁|생명보험|손해보험|화재해상|저축은행|은행|캐피탈/.test(name)) {
    return "finance-consulting-rd";
  }

  const sec = String(rawSector || "").trim();
  const isGenericSector =
    !sec ||
    sec === "기타 제조업/금융업" ||
    sec === "상장 법인" ||
    sec === "BIZ_NO미존재사업장" ||
    sec === "해당없음" ||
    sec === "-" ||
    sec === "미상";

  if (!isGenericSector) {
    const byPrimarySector = matchSectorKeywordToIndustry(sec);
    if (byPrimarySector) return byPrimarySector;
  }

  const mb = String(rawMainBiz || "").trim();
  if (mb && mb !== sec && !mb.startsWith("전자상거래 (")) {
    return matchSectorKeywordToIndustry(mb);
  }
  return null;
}

function resolveMarketBoard(rawListingStatus) {
  if (!rawListingStatus) return null;
  const s = String(rawListingStatus).trim();
  if (s.startsWith("코스피") || s === "유가" || s.includes("유가증권")) return "KOSPI";
  if (s.startsWith("코스닥") || s === "코스닥") return "KOSDAQ";
  return null;
}

async function main() {
  console.log("1. Creating system_settings & adding derived hub columns on businesses...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.system_settings (
      key VARCHAR(120) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE public.businesses
      ADD COLUMN IF NOT EXISTS region_hub_slug VARCHAR(48),
      ADD COLUMN IF NOT EXISTS industry_hub_slug VARCHAR(48),
      ADD COLUMN IF NOT EXISTS market_board VARCHAR(16),
      ADD COLUMN IF NOT EXISTS latest_fin_year INTEGER,
      ADD COLUMN IF NOT EXISTS latest_revenue NUMERIC,
      ADD COLUMN IF NOT EXISTS latest_operating_income NUMERIC;
  `);

  console.log("2. Loading latest fiscal financials map (2,038 companies)...");
  const finRes = await pool.query(`
    SELECT DISTINCT ON (b_no)
      b_no, year, revenue, operating_income
    FROM public.business_history
    ORDER BY b_no ASC, year DESC
  `);
  const finMap = new Map();
  for (const r of finRes.rows) {
    finMap.set(r.b_no, {
      year: Number(r.year),
      rev: r.revenue !== null ? Number(r.revenue) : null,
      op: r.operating_income !== null ? Number(r.operating_income) : null,
    });
  }
  console.log(`   Loaded latest financials for ${finMap.size} companies.`);

  console.log("3. PK-cursor chunked backfill (2,500 rows/chunk)...");
  let cursor = "";
  let totalProcessed = 0;

  while (true) {
    const batchRes = await pool.query(
      `SELECT b_no, b_nm, b_adr, b_sector, main_biz, listing_status
       FROM public.businesses
       WHERE b_no > $1
       ORDER BY b_no ASC
       LIMIT 2500`,
      [cursor]
    );
    if (batchRes.rows.length === 0) break;

    const bNos = [];
    const regionSlugs = [];
    const industrySlugs = [];
    const marketBoards = [];
    const finYears = [];
    const finRevs = [];
    const finOps = [];

    for (const r of batchRes.rows) {
      bNos.push(r.b_no);
      regionSlugs.push(resolveRegionHubSlug(r.b_adr));
      industrySlugs.push(resolveIndustryHubSlug(r.b_sector, r.main_biz, r.b_nm));
      marketBoards.push(resolveMarketBoard(r.listing_status));
      const f = finMap.get(r.b_no);
      finYears.push(f ? f.year : null);
      finRevs.push(f ? f.rev : null);
      finOps.push(f ? f.op : null);
    }

    await pool.query(
      `UPDATE public.businesses AS b
       SET
         region_hub_slug = u.region_slug,
         industry_hub_slug = u.industry_slug,
         market_board = u.market_board,
         latest_fin_year = u.fin_year,
         latest_revenue = u.fin_rev,
         latest_operating_income = u.fin_op
       FROM UNNEST(
         $1::varchar[],
         $2::varchar[],
         $3::varchar[],
         $4::varchar[],
         $5::int[],
         $6::numeric[],
         $7::numeric[]
       ) AS u(b_no, region_slug, industry_slug, market_board, fin_year, fin_rev, fin_op)
       WHERE b.b_no = u.b_no`,
      [bNos, regionSlugs, industrySlugs, marketBoards, finYears, finRevs, finOps]
    );

    cursor = batchRes.rows[batchRes.rows.length - 1].b_no;
    totalProcessed += batchRes.rows.length;
    console.log(`   Backfilled ${totalProcessed} rows (cursor=${cursor})`);
  }

  console.log("4. Creating composite partial B-Tree indexes & running ANALYZE...");
  const indexDdls = [
    `CREATE INDEX IF NOT EXISTS idx_businesses_dir_active_base
       ON public.businesses (b_no ASC)
       WHERE b_stt_cd = '01' AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')`,
    `CREATE INDEX IF NOT EXISTS idx_businesses_dir_region_top
       ON public.businesses (region_hub_slug, nps_sbscrb_nmps DESC NULLS LAST, latest_revenue DESC NULLS LAST, view_count DESC NULLS LAST, b_no ASC)
       WHERE b_stt_cd = '01' AND region_hub_slug IS NOT NULL
         AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')`,
    `CREATE INDEX IF NOT EXISTS idx_businesses_dir_industry_top
       ON public.businesses (industry_hub_slug, nps_sbscrb_nmps DESC NULLS LAST, latest_revenue DESC NULLS LAST, view_count DESC NULLS LAST, b_no ASC)
       WHERE b_stt_cd = '01' AND industry_hub_slug IS NOT NULL
         AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')`,
    `CREATE INDEX IF NOT EXISTS idx_businesses_dir_market_top
       ON public.businesses (market_board, nps_sbscrb_nmps DESC NULLS LAST, latest_revenue DESC NULLS LAST, view_count DESC NULLS LAST, b_no ASC)
       WHERE b_stt_cd = '01' AND market_board IS NOT NULL
         AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')`,
    `CREATE INDEX IF NOT EXISTS idx_businesses_dir_emp_top
       ON public.businesses (nps_sbscrb_nmps DESC NULLS LAST, b_no ASC)
       WHERE b_stt_cd = '01' AND nps_sbscrb_nmps > 0
         AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')`,
    `CREATE INDEX IF NOT EXISTS idx_businesses_dir_hiring_top
       ON public.businesses (new_acqs_nmps DESC NULLS LAST, nps_sbscrb_nmps DESC NULLS LAST, b_no ASC)
       WHERE b_stt_cd = '01' AND new_acqs_nmps > 0
         AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')`,
    `CREATE INDEX IF NOT EXISTS idx_businesses_dir_salary_top
       ON public.businesses (((nps_chrg_amt::numeric / nps_sbscrb_nmps)) DESC NULLS LAST, nps_sbscrb_nmps DESC NULLS LAST, b_no ASC)
       WHERE b_stt_cd = '01' AND nps_sbscrb_nmps >= 10 AND nps_chrg_amt > 0
         AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')`,
    `CREATE INDEX IF NOT EXISTS idx_businesses_dir_rev_top
       ON public.businesses (latest_revenue DESC NULLS LAST, b_no ASC)
       WHERE b_stt_cd = '01' AND latest_revenue > 0
         AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')`,
    `CREATE INDEX IF NOT EXISTS idx_businesses_dir_profit_top
       ON public.businesses (latest_operating_income DESC NULLS LAST, b_no ASC)
       WHERE b_stt_cd = '01' AND latest_operating_income > 0
         AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')`,
    `CREATE INDEX IF NOT EXISTS idx_business_disclosures_b_no
       ON public.business_disclosures (b_no)`,
  ];

  for (const ddl of indexDdls) {
    await pool.query(ddl);
  }
  await pool.query(`ANALYZE public.businesses;`);
  await pool.query(`ANALYZE public.system_settings;`);

  console.log("5. Verifying EXPLAIN (ANALYZE, BUFFERS) -> Seq Scan MUST BE 0!");
  const explainChecks = [
    {
      name: "Region Hub (seoul-gangnam)",
      sql: `EXPLAIN (ANALYZE, BUFFERS)
            SELECT b_no, b_nm FROM public.businesses
            WHERE b_stt_cd = '01' AND region_hub_slug = 'seoul-gangnam' AND region_hub_slug IS NOT NULL
              AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
            ORDER BY nps_sbscrb_nmps DESC NULLS LAST, latest_revenue DESC NULLS LAST, view_count DESC NULLS LAST, b_no ASC
            LIMIT 80`,
    },
    {
      name: "Industry Hub (software-it)",
      sql: `EXPLAIN (ANALYZE, BUFFERS)
            SELECT b_no, b_nm FROM public.businesses
            WHERE b_stt_cd = '01' AND industry_hub_slug = 'software-it' AND industry_hub_slug IS NOT NULL
              AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
            ORDER BY nps_sbscrb_nmps DESC NULLS LAST, latest_revenue DESC NULLS LAST, view_count DESC NULLS LAST, b_no ASC
            LIMIT 80`,
    },
    {
      name: "Salary Ranking (top-salary)",
      sql: `EXPLAIN (ANALYZE, BUFFERS)
            SELECT b_no, b_nm FROM public.businesses
            WHERE b_stt_cd = '01' AND nps_sbscrb_nmps >= 10 AND nps_chrg_amt > 0
              AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
            ORDER BY (nps_chrg_amt::numeric / nps_sbscrb_nmps) DESC NULLS LAST, nps_sbscrb_nmps DESC NULLS LAST, b_no ASC
            LIMIT 80`,
    },
    {
      name: "Revenue Ranking (top-revenue)",
      sql: `EXPLAIN (ANALYZE, BUFFERS)
            SELECT b_no, b_nm FROM public.businesses
            WHERE b_stt_cd = '01' AND latest_revenue > 0
              AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
            ORDER BY latest_revenue DESC NULLS LAST, b_no ASC
            LIMIT 80`,
    },
    {
      name: "Market Board (KOSPI)",
      sql: `EXPLAIN (ANALYZE, BUFFERS)
            SELECT b_no, b_nm FROM public.businesses
            WHERE b_stt_cd = '01' AND market_board = 'KOSPI' AND market_board IS NOT NULL
              AND b_nm IS NOT NULL AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')
            ORDER BY nps_sbscrb_nmps DESC NULLS LAST, latest_revenue DESC NULLS LAST, view_count DESC NULLS LAST, b_no ASC
            LIMIT 80`,
    },
  ];

  for (const chk of explainChecks) {
    const r = await pool.query(chk.sql);
    const planText = r.rows.map((x) => x["QUERY PLAN"]).join("\n");
    const hasSeqScan = planText.includes("Seq Scan");
    console.log(`\n[${hasSeqScan ? "FAIL - SEQ SCAN" : "PASS - INDEX SCAN"}] ${chk.name}`);
    console.log(planText);
    if (hasSeqScan) {
      throw new Error(`Seq Scan detected in ${chk.name}`);
    }
  }

  await pool.end();
  console.log("\n✅ Schema, chunked backfill, partial B-Tree indexes, and EXPLAIN ANALYZE all verified!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
