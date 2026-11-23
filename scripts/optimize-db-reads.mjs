import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const INDEX_STATEMENTS = [
  // 1. DART 공시 조인 및 조회용 인덱스 (기존 businesses/business_disclosures 풀스캔 98% 제거)
  `CREATE INDEX IF NOT EXISTS idx_businesses_dart_code
   ON public.businesses (dart_code)
   WHERE dart_code IS NOT NULL AND dart_code <> ''`,

  `CREATE INDEX IF NOT EXISTS idx_business_disclosures_b_no_dt
   ON public.business_disclosures (b_no, rcept_dt DESC)`,

  `CREATE INDEX IF NOT EXISTS idx_business_disclosures_key_b_no_dt
   ON public.business_disclosures (b_no, rcept_dt DESC)
   WHERE is_key_disclosure = true`,

  `CREATE INDEX IF NOT EXISTS idx_business_disclosures_corp_code_dt
   ON public.business_disclosures (corp_code, rcept_dt DESC)
   WHERE corp_code IS NOT NULL AND corp_code <> ''`,

  // 2. 업종 정확일치 추천/분석용 복합 B-Tree 인덱스
  `CREATE INDEX IF NOT EXISTS idx_businesses_b_sector_view_top
   ON public.businesses (b_sector, view_count DESC NULLS LAST, b_no)
   WHERE b_stt_cd = '01'
     AND b_nm IS NOT NULL
     AND b_nm NOT IN ('', '상호 정보 없음', '상호 미등록 사업자')`,

  // 3. 1~2글자 검색어 풀스캔 차단용 Full-Text Search GIN 인덱스 + 법인번호 정규화 인덱스
  `CREATE INDEX IF NOT EXISTS idx_businesses_search_fts
   ON public.businesses USING gin (
     to_tsvector(
       'simple',
       COALESCE(b_nm, '') || ' ' || COALESCE(brand_name, '') || ' ' || COALESCE(p_nm, '') || ' ' || COALESCE(b_adr, '')
     )
   )`,

  `CREATE INDEX IF NOT EXISTS idx_businesses_crno_clean
   ON public.businesses (REPLACE(crno, '-', ''))
   WHERE crno IS NOT NULL AND crno <> ''`,

  `CREATE INDEX IF NOT EXISTS idx_businesses_corp_no_clean
   ON public.businesses (REPLACE(corp_no, '-', ''))
   WHERE corp_no IS NOT NULL AND corp_no <> ''`,

  // 4. 특허 · 입찰 b_no 인덱스 (향후 적재 시 풀스캔 원천 차단)
  `CREATE INDEX IF NOT EXISTS idx_business_patents_b_no_dt
   ON public.business_patents (b_no, application_date DESC)`,

  `CREATE INDEX IF NOT EXISTS idx_business_bids_b_no_dt
   ON public.business_bids (b_no, bid_ntce_dt DESC)`,
];

async function main() {
  console.log("🚀 Step 1: Creating missing performance indexes on Neon DB...");
  for (const sql of INDEX_STATEMENTS) {
    const nameMatch = sql.match(/EXISTS\s+(\S+)/i);
    const idxName = nameMatch ? nameMatch[1] : "index";
    const t0 = Date.now();
    await pool.query(sql);
    console.log(`  ✅ ${idxName} ready (${Date.now() - t0}ms)`);
  }

  console.log("\n🧹 Step 2: Pruning expired business_view_logs (> 90 days) in 10,000-row safe chunks...");
  let totalDeleted = 0;
  let chunk = 0;
  const MAX_CHUNKS = 85; // 최대 85만 행까지 안전 상한
  while (chunk < MAX_CHUNKS) {
    chunk++;
    const t0 = Date.now();
    const res = await pool.query(`
      DELETE FROM public.business_view_logs
      WHERE id IN (
        SELECT id
        FROM public.business_view_logs
        WHERE viewed_at < NOW() - INTERVAL '90 days'
        ORDER BY viewed_at ASC
        LIMIT 10000
      )
    `);
    const deleted = res.rowCount || 0;
    totalDeleted += deleted;
    if (deleted > 0 && (chunk <= 3 || chunk % 10 === 0 || deleted < 10000)) {
      console.log(`  chunk #${chunk}: deleted ${deleted} rows (total=${totalDeleted}, ${Date.now() - t0}ms)`);
    }
    if (deleted < 10000) break;
  }
  console.log(`  ✅ Finished view_logs retention pruning: totalDeleted=${totalDeleted}`);

  console.log("\n🧼 Step 3: Running VACUUM ANALYZE on core tables...");
  const vacuumTables = [
    "public.businesses",
    "public.business_disclosures",
    "public.business_history",
    "public.business_view_logs",
    "public.business_patents",
    "public.business_bids",
  ];
  for (const tbl of vacuumTables) {
    const t0 = Date.now();
    await pool.query(`VACUUM ANALYZE ${tbl}`);
    console.log(`  ✅ VACUUM ANALYZE ${tbl} (${Date.now() - t0}ms)`);
  }

  const sizeCheck = await pool.query(`
    SELECT
      relname AS table_name,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
      n_live_tup,
      n_dead_tup
    FROM pg_stat_user_tables
    WHERE relname IN ('businesses', 'business_disclosures', 'business_history', 'business_view_logs', 'business_patents', 'business_bids')
    ORDER BY pg_total_relation_size(relid) DESC
  `);
  console.log("\n📊 Table Status After Optimization:");
  console.table(sizeCheck.rows);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
