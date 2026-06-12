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
  try {
    // 1. 특정 사업자 1221166249 의 brand_name 을 올바른 값인 '패스트몰, 패스트몰' 로 갱신
    const updateRes1 = await pool.query(`
      UPDATE businesses 
      SET brand_name = '패스트몰, 패스트몰'
      WHERE b_no = '1221166249'
    `);
    console.log("Updated 1221166249 brand_name:", updateRes1.rowCount);

    // 2. DB 내에 brand_name 컬럼에 '상호 미등록 사업자'가 포함된 행들을 '상호 정보 없음, 상호 정보 없음' 또는 적절하게 마이그레이션
    const updateRes2 = await pool.query(`
      UPDATE businesses
      SET brand_name = '상호 정보 없음, 상호 정보 없음'
      WHERE brand_name LIKE '%상호 미등록 사업자%' OR brand_name = '상호 미등록 사업자'
    `);
    console.log("Migrated legacy brand_names:", updateRes2.rowCount);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
