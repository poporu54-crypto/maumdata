const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// dotenv 없이 .env.local 읽기
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
console.log("ConnectionString loaded:", !!connectionString);

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'businesses'");
    console.log("=== businesses Columns ===");
    console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    
    const countRes = await pool.query("SELECT COUNT(*) as count FROM businesses");
    console.log("Total Businesses count:", countRes.rows[0].count);

    const noNameCount = await pool.query("SELECT COUNT(*) as count FROM businesses WHERE b_nm = '상호 정보 없음'");
    console.log("No name count:", noNameCount.rows[0].count);

    // created_at 컬럼 유무 확인을 위해 컬럼 리스트 조회
    const hasCreatedAt = res.rows.some(r => r.column_name === 'created_at');
    console.log("Has created_at column:", hasCreatedAt);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
