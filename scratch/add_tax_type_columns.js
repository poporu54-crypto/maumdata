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
    console.log("Adding tax_type and tax_type_cd columns to businesses table...");
    
    // 1. Column 추가
    await pool.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS tax_type VARCHAR DEFAULT '부가가치세 일반과세자',
      ADD COLUMN IF NOT EXISTS tax_type_cd VARCHAR DEFAULT '01'
    `);
    console.log("Successfully added columns or verified they exist!");

    // 2. 새싹마켓(7295000974) 의 과세유형을 간이과세자로 수동 업데이트 (동기화 즉시 해결용)
    const res = await pool.query(`
      UPDATE businesses 
      SET tax_type = '부가가치세 간이과세자(세금계산서 발급사업자)',
          tax_type_cd = '07'
      WHERE b_no = '7295000974'
    `);
    console.log(`Updated 새싹마켓 tax_type: ${res.rowCount} row(s)`);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
