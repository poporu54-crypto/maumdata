import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log("1. Adding fin_last_sync_at column & creating b2b_partner_inquiries table...");
  await pool.query(`
    ALTER TABLE public.businesses
      ADD COLUMN IF NOT EXISTS fin_last_sync_at TIMESTAMPTZ;

    CREATE TABLE IF NOT EXISTS public.b2b_partner_inquiries (
      id SERIAL PRIMARY KEY,
      inquiry_type VARCHAR(32) NOT NULL,
      company_name VARCHAR(160) NOT NULL,
      b_no VARCHAR(20) DEFAULT '',
      contact_name VARCHAR(80) NOT NULL,
      contact_email VARCHAR(160) NOT NULL,
      watchlist_count INTEGER DEFAULT 0,
      message TEXT DEFAULT '',
      status VARCHAR(24) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  console.log("2. Backfilling fin_last_sync_at for companies that already have latest_fin_year...");
  await pool.query(`
    UPDATE public.businesses
    SET fin_last_sync_at = COALESCE(dart_last_sync_at, nts_last_sync_at, NOW())
    WHERE latest_fin_year IS NOT NULL AND fin_last_sync_at IS NULL
  `);

  console.log("3. Creating partial B-Tree indexes for zero-Seq-Scan cron enrichment & B2B inquiries...");
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_businesses_cron_listed_enrich
      ON public.businesses (fin_last_sync_at ASC NULLS FIRST, view_count DESC NULLS LAST, b_no ASC)
      WHERE b_stt_cd = '01' AND market_board IN ('KOSPI', 'KOSDAQ');

    CREATE INDEX IF NOT EXISTS idx_businesses_cron_corp_enrich
      ON public.businesses (fin_last_sync_at ASC NULLS FIRST, view_count DESC NULLS LAST, b_no ASC)
      WHERE b_stt_cd = '01' AND crno IS NOT NULL AND crno <> '';

    CREATE INDEX IF NOT EXISTS idx_b2b_partner_inquiries_status_dt
      ON public.b2b_partner_inquiries (status, created_at DESC);
  `);

  await pool.query(`ANALYZE public.businesses;`);
  await pool.query(`ANALYZE public.business_view_logs;`);
  await pool.query(`ANALYZE public.b2b_partner_inquiries;`);

  console.log("4. Verifying EXPLAIN (ANALYZE, BUFFERS) -> Seq Scan MUST BE 0!");
  const checks = [
    {
      name: "Cron Priority 1 (Listed KOSPI/KOSDAQ enrichment)",
      sql: `EXPLAIN (ANALYZE, BUFFERS)
            SELECT b_no, b_nm, crno, corp_no, nps_sbscrb_nmps, nps_last_sync_at, latest_fin_year
            FROM public.businesses
            WHERE b_stt_cd = '01' AND market_board IN ('KOSPI', 'KOSDAQ')
            ORDER BY fin_last_sync_at ASC NULLS FIRST, view_count DESC NULLS LAST, b_no ASC
            LIMIT 12`,
    },
    {
      name: "Cron Priority 2 (Non-listed Corp enrichment)",
      sql: `EXPLAIN (ANALYZE, BUFFERS)
            SELECT b_no, b_nm, crno, corp_no, nps_sbscrb_nmps, nps_last_sync_at, latest_fin_year
            FROM public.businesses
            WHERE b_stt_cd = '01' AND crno IS NOT NULL AND crno <> ''
            ORDER BY fin_last_sync_at ASC NULLS FIRST, view_count DESC NULLS LAST, b_no ASC
            LIMIT 12`,
    },
    {
      name: "Retention Pruning (90d+ business_view_logs selection)",
      sql: `EXPLAIN (ANALYZE, BUFFERS)
            SELECT id FROM public.business_view_logs
            WHERE viewed_at < NOW() - INTERVAL '90 days'
            ORDER BY viewed_at ASC
            LIMIT 5000`,
    },
  ];

  for (const c of checks) {
    const r = await pool.query(c.sql);
    const plan = r.rows.map((x) => x["QUERY PLAN"]).join("\n");
    const hasSeq = plan.includes("Seq Scan");
    console.log(`\n[${hasSeq ? "FAIL - SEQ SCAN" : "PASS - INDEX SCAN"}] ${c.name}`);
    console.log(plan);
    if (hasSeq) throw new Error(`Seq Scan detected in ${c.name}`);
  }

  await pool.end();
  console.log("\n✅ Track 4 DB schema, partial cron indexes, and EXPLAIN ANALYZE verified!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
