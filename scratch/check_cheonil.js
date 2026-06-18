const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 1. .env.local 로드
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env.local", e);
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log("=== DB에서 '천일식품' 검색 ===");
    const res = await pool.query("SELECT b_no, b_nm, p_nm, b_adr, b_sector, corp_no, dart_code, data_source FROM businesses WHERE b_nm LIKE '%천일식품%'");
    console.log(`검색된 기업 수: ${res.rows.length}개`);
    res.rows.forEach((row, i) => {
      console.log(`\n[기업 ${i + 1}]`);
      console.log(`상호명: ${row.b_nm}`);
      console.log(`사업자번호: ${row.b_no}`);
      console.log(`대표자: ${row.p_nm}`);
      console.log(`주소: ${row.b_adr}`);
      console.log(`업종: ${row.b_sector}`);
      console.log(`법인번호: ${row.corp_no}`);
      console.log(`DART코드: ${row.dart_code}`);
      console.log(`데이터소스: ${row.data_source}`);
    });
  } catch (err) {
    console.error("오류 발생:", err);
  } finally {
    await pool.end();
  }
}

run();
