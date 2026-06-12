const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_GXePATLY0EC4@ep-misty-shape-aqrex525-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=verify-full",
  ssl: {
    rejectUnauthorized: false,
  },
});

async function run() {
  try {
    // 1. 삼성전자 nps_last_sync_at 리셋
    const res1 = await pool.query(
      "UPDATE businesses SET nps_last_sync_at = NULL WHERE b_no = '1248100998'"
    );
    console.log("Samsung Electronics sync date reset: affected rows =", res1.rowCount);

    // 2. 다른 미연동 대기업/상장사들도 nps_last_sync_at을 NULL로 초기화하여 재동기화 대기 상태로 만듬
    const res2 = await pool.query(`
      UPDATE businesses 
      SET nps_last_sync_at = NULL 
      WHERE nps_linked = false 
        AND (b_type LIKE '%대기업%' OR b_type LIKE '%중견기업%' OR listing_status LIKE '%상장%')
    `);
    console.log("Other unlinked major/listed companies reset: affected rows =", res2.rowCount);

  } catch (err) {
    console.error("Database reset error:", err);
  } finally {
    await pool.end();
    process.exit();
  }
}

run();
