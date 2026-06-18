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
    console.log("=== 천일식품 오매핑 데이터 수정 시작 ===");
    
    // 1318542918 (통신판매업 천일식품)의 dart_code를 NULL로 업데이트
    const updateRes = await pool.query(
      "UPDATE businesses SET dart_code = NULL WHERE b_no = '1318542918'"
    );
    console.log(`업데이트 완료: ${updateRes.rowCount}행 변경됨`);

    // 검증 조회
    const checkRes = await pool.query(
      "SELECT b_no, b_nm, p_nm, b_adr, dart_code FROM businesses WHERE b_no IN ('1398125797', '1318542918')"
    );
    console.log("\n=== 수정 후 데이터 검증 ===");
    checkRes.rows.forEach(row => {
      console.log(`사업자번호: ${row.b_no} | 상호명: ${row.b_nm} | DART코드: ${row.dart_code}`);
    });

  } catch (err) {
    console.error("오류 발생:", err);
  } finally {
    await pool.end();
  }
}

run();
