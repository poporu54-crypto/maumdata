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
  console.log("=== Neon DB Double Query Performance Check ===");
  
  const q = '기업';
  const searchWord = `%${q}%`;
  const cleanQ = q.replace(/[^0-9]/g, "");

  // [1회차 호출]
  const start1 = Date.now();
  const res1 = await pool.query(
    `SELECT b_no, b_nm, p_nm, b_adr, b_sector, is_sme, listing_status, data_source, brand_name 
     FROM businesses 
     WHERE b_nm LIKE $1 OR p_nm LIKE $1 OR b_adr LIKE $1 OR brand_name LIKE $1 OR b_no = $2`,
    [searchWord, cleanQ || "NOT_A_NUMBER"]
  );
  const end1 = Date.now();
  console.log(`1회차 쿼리 소요시간: ${end1 - start1}ms (Rows: ${res1.rows.length})`);

  // [2회차 호출 (커넥션 재사용)]
  const start2 = Date.now();
  const res2 = await pool.query(
    `SELECT b_no, b_nm, p_nm, b_adr, b_sector, is_sme, listing_status, data_source, brand_name 
     FROM businesses 
     WHERE b_nm LIKE $1 OR p_nm LIKE $1 OR b_adr LIKE $1 OR brand_name LIKE $1 OR b_no = $2`,
    [searchWord, cleanQ || "NOT_A_NUMBER"]
  );
  const end2 = Date.now();
  console.log(`2회차 쿼리 소요시간: ${end2 - start2}ms (Rows: ${res2.rows.length})`);

  await pool.end();
}

main();
