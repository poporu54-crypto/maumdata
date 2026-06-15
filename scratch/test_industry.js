const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
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
    const sector = "반도체 및 전자부품 제조업";
    console.log(`=== Test Industry: ${sector} ===`);

    const countRes = await client.query("SELECT COUNT(*) as count FROM businesses WHERE b_sector = $1", [sector]);
    console.log(`업종 등록 기업 수: ${countRes.rows[0].count}개사`);

    const leadersResult = await client.query(`
      WITH latest_history AS (
        SELECT DISTINCT ON (b_no) b_no, revenue, year
        FROM business_history
        ORDER BY b_no, year DESC
      )
      SELECT b.b_no, b.b_nm, COALESCE(h.revenue, 0) as revenue
      FROM businesses b
      JOIN latest_history h ON b.b_no = h.b_no
      WHERE b.b_sector = $1 AND b.b_nm != '상호 정보 없음' AND b.b_stt_cd = '01'
      ORDER BY revenue DESC
      LIMIT 10
    `, [sector]);
    console.log("=== 매출액 상위 10개사 ===");
    console.log(leadersResult.rows);

  } catch (err) {
    console.error("Query error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
