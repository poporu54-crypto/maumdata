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

  const bNo = "1068104036"; // 오리온
  
  // 1. businesses 테이블 조회
  const bizRes = await client.query("SELECT * FROM businesses WHERE b_no = $1", [bNo]);
  console.log("Business details in DB:");
  console.log(JSON.stringify(bizRes.rows[0], null, 2));

  // 2. business_history 테이블 조회
  const histRes = await client.query("SELECT * FROM business_history WHERE b_no = $1 ORDER BY year ASC", [bNo]);
  console.log("\nHistory records in DB:");
  console.log(JSON.stringify(histRes.rows, null, 2));

  await client.end();
}

main().catch(async (err) => {
  console.error("Failed:", err);
  await client.end();
});
