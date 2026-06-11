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
  console.log("Connecting to Neon DB...");
  await client.connect();
  console.log("Connected!");

  // 보존할 진짜 기업 사업자번호들 (토스, 스타벅스, 네이버, 카카오, 삼양식품)
  const realBNos = ["1208801280", "2018121515", "2208162517", "1208147521", "1028105450"];
  
  console.log("Cleaning fake or auto-generated timeline entries...");
  const result = await client.query(
    "DELETE FROM business_timeline WHERE b_no NOT IN ($1, $2, $3, $4, $5)",
    realBNos
  );
  
  console.log(`Successfully deleted ${result.rowCount} fake timeline rows from database.`);
  await client.end();
}

main().catch(async (err) => {
  console.error("Failed to clean timeline table:", err);
  try {
    await client.end();
  } catch (e) {}
});
