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

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    console.log("=== Querying Top 30 Sectors by Count ===");
    const res = await client.query(`
      SELECT b_sector, COUNT(*) as count 
      FROM businesses 
      WHERE b_nm != '상호 정보 없음'
      GROUP BY b_sector 
      ORDER BY count DESC 
      LIMIT 30
    `);
    console.log(JSON.stringify(res.rows, null, 2));

    console.log("\n=== Checking sectors containing '반도체' or '전자' ===");
    const res2 = await client.query(`
      SELECT b_sector, COUNT(*) as count 
      FROM businesses 
      WHERE b_sector LIKE '%반도체%' OR b_sector LIKE '%전자%'
      GROUP BY b_sector 
      ORDER BY count DESC
    `);
    console.log(JSON.stringify(res2.rows, null, 2));
  } catch (err) {
    console.error("Query error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
