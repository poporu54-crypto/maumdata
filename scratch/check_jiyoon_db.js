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
  console.log("Connected!");

  console.log("\n--- query businesses table ---");
  const bizRes = await client.query("SELECT * FROM businesses WHERE b_no = '1378651839'");
  console.log(JSON.stringify(bizRes.rows, null, 2));

  console.log("\n--- query business_history table ---");
  const histRes = await client.query("SELECT * FROM business_history WHERE b_no = '1378651839' ORDER BY year ASC");
  console.log(JSON.stringify(histRes.rows, null, 2));

  await client.end();
}

main().catch(async (e) => {
  console.error(e);
  await client.end();
});
