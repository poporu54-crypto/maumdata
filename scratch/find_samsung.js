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

  // '삼성전자' 검색
  const bizRes = await client.query("SELECT * FROM businesses WHERE b_nm LIKE '%삼성전자%' LIMIT 5");
  console.log("Samsung Electronics matches in DB:");
  console.log(JSON.stringify(bizRes.rows, null, 2));

  await client.end();
}

main().catch(async (err) => {
  console.error(err);
  await client.end();
});
