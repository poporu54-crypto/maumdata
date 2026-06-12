const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_GXePATLY0EC4@ep-misty-shape-aqrex525-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=verify-full",
  ssl: {
    rejectUnauthorized: false,
  },
});

async function run() {
  try {
    // 삼성전자(1248100998)의 등급, 순위, 기업 구분을 대기업 기준에 맞추어 강제 업데이트
    const res = await pool.query(`
      UPDATE businesses 
      SET credit_rating = 'AA+', 
          industry_rank = '상위 1%',
          b_type = '대기업',
          is_sme = '대기업'
      WHERE b_no = '1248100998'
    `);
    console.log("Samsung Electronics ratings updated: affected rows =", res.rowCount);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

run();
