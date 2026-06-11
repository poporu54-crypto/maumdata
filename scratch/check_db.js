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

  const bnos = ["1208801280", "1378651839"];
  for (const b_no of bnos) {
    const res = await client.query("SELECT b_no, b_nm, corp_enm, crno, b_adr, b_sector, data_source FROM businesses WHERE b_no = $1", [b_no]);
    console.log(`\n--- DB record for ${b_no} ---`);
    console.log(res.rows);
  }
  await client.end();
}

main().catch(console.error);
