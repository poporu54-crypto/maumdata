const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_GXePATLY0EC4@ep-misty-shape-aqrex525-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=verify-full",
  ssl: {
    rejectUnauthorized: false,
  },
});

async function run() {
  try {
    console.log("=== MaumData DB Stats ===");

    // 1. 전체 등록 기업 수
    const totalBizRes = await pool.query("SELECT COUNT(*) FROM businesses");
    const totalBiz = totalBizRes.rows[0].count;
    console.log(`Total businesses: ${totalBiz}`);

    // 2. 기업 구분별 (b_type / is_sme) 분포
    const typeRes = await pool.query(`
      SELECT b_type, COUNT(*) as count 
      FROM businesses 
      GROUP BY b_type 
      ORDER BY count DESC
    `);
    console.log("\n--- Distribution by b_type ---");
    typeRes.rows.forEach(r => console.log(`- ${r.b_type || 'Unknown'}: ${r.count}`));

    // 3. 상장 여부별 분포
    const listingRes = await pool.query(`
      SELECT listing_status, COUNT(*) as count 
      FROM businesses 
      GROUP BY listing_status 
      ORDER BY count DESC
    `);
    console.log("\n--- Distribution by listing_status ---");
    listingRes.rows.forEach(r => console.log(`- ${r.listing_status || 'Unknown'}: ${r.count}`));

    // 4. 국민연금(NPS) 연동 기업 수
    const npsRes = await pool.query("SELECT COUNT(*) FROM businesses WHERE nps_linked = true");
    const npsLinked = npsRes.rows[0].count;
    console.log(`\nNPS Linked businesses: ${npsLinked} (${((npsLinked / totalBiz) * 100).toFixed(2)}%)`);

    // 5. 조회수 상위 Top 5 기업
    const topViewRes = await pool.query(`
      SELECT b_no, b_nm, view_count 
      FROM businesses 
      ORDER BY view_count DESC 
      LIMIT 5
    `);
    console.log("\n--- Top 5 Most Viewed Businesses ---");
    topViewRes.rows.forEach(r => console.log(`- [${r.b_no}] ${r.b_nm}: ${r.view_count} views`));

    // 6. 기업 정보 수정 요청 건수
    const editReqRes = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM business_edit_requests 
      GROUP BY status
    `);
    console.log("\n--- Business Edit Requests ---");
    if (editReqRes.rows.length === 0) {
      console.log("No edit requests.");
    } else {
      editReqRes.rows.forEach(r => console.log(`- ${r.status}: ${r.count}`));
    }

    // 7. 블랙리스트 (무효 사업자) 수
    const invalidRes = await pool.query("SELECT COUNT(*) FROM invalid_businesses");
    console.log(`\nBlacklisted/Invalid businesses: ${invalidRes.rows[0].count}`);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}

run();
