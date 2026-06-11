const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = (() => {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/POSTGRES_URL=([^\r\n]+)/) || envContent.match(/DATABASE_URL=([^\r\n]+)/);
    if (match) return match[1].trim();
  }
  return process.env.POSTGRES_URL || process.env.DATABASE_URL;
})();

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  await client.connect();
  console.log("Connected to DB");

  // 1. businesses 테이블 정보 12명으로 업데이트 및 nps_linked = true로 정정
  const updateBiz = await client.query(`
    UPDATE businesses 
    SET nps_linked = true, 
        nps_sbscrb_nmps = 12, 
        nps_last_sync_at = CURRENT_TIMESTAMP 
    WHERE b_no = '1378651839'
  `);
  console.log("Businesses table updated:", updateBiz.rowCount, "row(s).");

  // 2. business_history 테이블 2024년 종업원 수도 12명으로 업데이트
  const updateHist = await client.query(`
    UPDATE business_history 
    SET employees = 12 
    WHERE b_no = '1378651839' AND year = 2024
  `);
  console.log("Business history table updated:", updateHist.rowCount, "row(s).");

  // 3. 결과 검증
  const checkBiz = await client.query("SELECT b_no, b_nm, nps_linked, nps_sbscrb_nmps, nps_last_sync_at FROM businesses WHERE b_no = '1378651839'");
  console.log("\n--- Verified Businesses Record ---");
  console.log(checkBiz.rows);

  const checkHist = await client.query("SELECT * FROM business_history WHERE b_no = '1378651839' ORDER BY year ASC");
  console.log("\n--- Verified Business History Records ---");
  console.log(checkHist.rows);

  await client.end();
}

main().catch(console.error);
