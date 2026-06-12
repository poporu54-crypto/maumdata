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
  console.log("Connected to DB. Adding b_stt and b_stt_cd columns to businesses table...");

  try {
    await client.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS b_stt VARCHAR(50) DEFAULT '계속사업자',
      ADD COLUMN IF NOT EXISTS b_stt_cd VARCHAR(10) DEFAULT '01'
    `);
    console.log("Migration SUCCESS: b_stt and b_stt_cd columns added!");
  } catch (err) {
    console.error("Migration Failed:", err);
  } finally {
    await client.end();
  }
}

main();
