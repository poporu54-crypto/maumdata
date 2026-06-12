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

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT COUNT(*) as count FROM businesses WHERE view_count > 0");
    console.log("Businesses with view_count > 0:", res.rows[0].count);

    const res2 = await pool.query("SELECT COUNT(*) as count FROM businesses WHERE view_count > 0 AND nps_linked = true");
    console.log("Businesses with view_count > 0 AND nps_linked = true:", res2.rows[0].count);

    const res3 = await pool.query("SELECT COUNT(*) as count FROM businesses WHERE nps_linked = true");
    console.log("Total nps_linked = true businesses:", res3.rows[0].count);
    
    // 신규 취득/상실 정보가 0인 nps_linked 기업의 수
    const res4 = await pool.query("SELECT COUNT(*) as count FROM businesses WHERE nps_linked = true AND new_acqs_nmps = 0 AND loss_sbscrb_nmps = 0");
    console.log("NPS linked but acquisition/loss are BOTH 0:", res4.rows[0].count);

    // 조달청 동기화 이력이 null인 기업 수
    const res5 = await pool.query("SELECT COUNT(*) as count FROM businesses WHERE bids_last_sync_at IS NULL");
    console.log("Businesses with bids_last_sync_at IS NULL (never synced bids):", res5.rows[0].count);

    // 조회수가 0보다 크면서 조달청 동기화 이력이 null인 기업 수
    const res6 = await pool.query("SELECT COUNT(*) as count FROM businesses WHERE view_count > 0 AND bids_last_sync_at IS NULL");
    console.log("Businesses with view_count > 0 AND bids_last_sync_at IS NULL:", res6.rows[0].count);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
