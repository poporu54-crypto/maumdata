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
  console.log("Migrating database records: '상호 미등록 사업자' -> '상호 정보 없음'");
  try {
    // businesses 테이블 변경
    const res1 = await pool.query(`
      UPDATE businesses 
      SET 
        b_nm = '상호 정보 없음',
        brand_name = REPLACE(brand_name, '상호 미등록 사업자', '상호 정보 없음'),
        description = REPLACE(description, '상호 미등록 사업자', '상호 정보 없음')
      WHERE b_nm = '상호 미등록 사업자'
      RETURNING b_no
    `);
    console.log(`Updated ${res1.rowCount} records in businesses table.`);

    // business_edit_requests 테이블 변경
    const res2 = await pool.query(`
      UPDATE business_edit_requests
      SET proposed_b_nm = '상호 정보 없음'
      WHERE proposed_b_nm = '상호 미등록 사업자'
    `);
    console.log(`Updated ${res2.rowCount} records in business_edit_requests table.`);

  } catch (err) {
    console.error("Database migration failed:", err);
  } finally {
    await pool.end();
  }
}

main();
