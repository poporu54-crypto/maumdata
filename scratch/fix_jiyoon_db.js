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

  // 지윤 레코드 수정
  const updateRes = await client.query(`
    UPDATE businesses 
    SET credit_rating = '-', 
        industry_rank = '-', 
        is_audited = false 
    WHERE b_no = '1378651839'
  `);
  console.log("Update result:", updateRes.rowCount, "row(s) updated.");

  // 업데이트 결과 검증
  const checkRes = await client.query("SELECT b_no, b_nm, b_type, is_sme, is_audited, credit_rating, industry_rank FROM businesses WHERE b_no = '1378651839'");
  console.log("\n--- Verified Jiyoon DB Record ---");
  console.log(checkRes.rows);

  await client.end();
}

main().catch(console.error);
