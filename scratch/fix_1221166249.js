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
  const bNo = '1221166249';
  console.log(`Fixing DB cache data for business number: ${bNo}`);
  
  try {
    const res = await pool.query(`
      UPDATE businesses 
      SET 
        b_stt = '폐업자',
        b_stt_cd = '03',
        tax_type = '폐업자 (부가가치세 일반과세자)',
        close_date = '20150301',
        description = '국세청 실시간 폐업 상태가 검증된 개인 사업자등록번호(1221166249)입니다. (폐업일자: 2015-03-01)',
        nts_last_sync_at = CURRENT_TIMESTAMP
      WHERE b_no = $1
      RETURNING *
    `, [bNo]);

    console.log("=== Updated Record ===");
    console.log(res.rows[0]);
  } catch (err) {
    console.error("Update failed:", err);
  } finally {
    await pool.end();
  }
}

main();
