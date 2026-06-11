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

  // 네이버 검색
  const res = await client.query("SELECT b_no, b_nm, corp_enm, crno, b_adr, brand_name FROM businesses WHERE b_nm LIKE '%네이버%' OR brand_name LIKE '%네이버%'");
  console.log("\n--- Businesses matching '네이버' ---");
  console.log(res.rows);

  for (const row of res.rows) {
    const timelineRes = await client.query("SELECT * FROM business_timeline WHERE b_no = $1 ORDER BY event_date DESC", [row.b_no]);
    console.log(`\n--- Timeline for ${row.b_nm} (${row.b_no}) ---`);
    console.log(timelineRes.rows);
  }

  await client.end();
}

main().catch(console.error);
