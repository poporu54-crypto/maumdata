const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
        if (key && !key.startsWith('#')) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env.local", e);
}

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log("=== Database Query Performance Check ===");
  
  // 1. searchBusinesses 쿼리 테스트 (LIKE '기업')
  const q = '기업';
  const searchWord = `%${q}%`;
  const cleanQ = q.replace(/[^0-9]/g, "");
  
  const start1 = Date.now();
  const res1 = await pool.query(
    `SELECT b_no, b_nm, p_nm, b_adr, b_sector, is_sme, listing_status, data_source, brand_name 
     FROM businesses 
     WHERE b_nm LIKE $1 OR p_nm LIKE $1 OR b_adr LIKE $1 OR brand_name LIKE $1 OR b_no = $2`,
    [searchWord, cleanQ || "NOT_A_NUMBER"]
  );
  const end1 = Date.now();
  console.log(`1. searchBusinesses ('기업') Time: ${end1 - start1}ms (Rows: ${res1.rows.length})`);

  // 2. popularBizRes (최근 24시간 인기 기업 집계 쿼리) 테스트
  const start2 = Date.now();
  const res2 = await pool.query(`
    SELECT b.b_no, b.b_nm, b.brand_name, COUNT(l.id) AS recent_views
    FROM businesses b
    LEFT JOIN business_view_logs l ON b.b_no = l.b_no AND l.viewed_at >= NOW() - INTERVAL '24 hours'
    WHERE b.b_nm != '상호 정보 없음'
    GROUP BY b.b_no, b.b_nm, b.brand_name, b.view_count, b.nps_sbscrb_nmps
    ORDER BY recent_views DESC, b.view_count DESC, b.nps_sbscrb_nmps DESC
    LIMIT 4
  `);
  const end2 = Date.now();
  console.log(`2. popularBizRes (Quick links) Time: ${end2 - start2}ms (Rows: ${res2.rows.length})`);

  // 3. EXPLAIN ANALYZE 2번 쿼리
  console.log("\n=== EXPLAIN ANALYZE popularBizRes ===");
  try {
    const explain2 = await pool.query(`
      EXPLAIN ANALYZE
      SELECT b.b_no, b.b_nm, b.brand_name, COUNT(l.id) AS recent_views
      FROM businesses b
      LEFT JOIN business_view_logs l ON b.b_no = l.b_no AND l.viewed_at >= NOW() - INTERVAL '24 hours'
      WHERE b.b_nm != '상호 정보 없음'
      GROUP BY b.b_no, b.b_nm, b.brand_name, b.view_count, b.nps_sbscrb_nmps
      ORDER BY recent_views DESC, b.view_count DESC, b.nps_sbscrb_nmps DESC
      LIMIT 4
    `);
    explain2.rows.forEach(r => console.log(r['QUERY PLAN']));
  } catch (e) {
    console.error(e);
  }

  await pool.end();
}

main();
