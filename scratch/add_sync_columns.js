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

  console.log("Adding nts_last_sync_at and nps_last_sync_at columns to businesses table...");
  
  // 국세청 동기화 일자 컬럼 추가 (기본값은 1970-01-01로 두어 최초 1회는 바로 동기화되게 유도)
  await client.query(`
    ALTER TABLE businesses 
    ADD COLUMN IF NOT EXISTS nts_last_sync_at TIMESTAMP DEFAULT '1970-01-01 00:00:00';
  `);

  // 국민연금 동기화 일자 컬럼 추가
  await client.query(`
    ALTER TABLE businesses 
    ADD COLUMN IF NOT EXISTS nps_last_sync_at TIMESTAMP DEFAULT '1970-01-01 00:00:00';
  `);

  console.log("Columns added successfully!");
  await client.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  try {
    await client.end();
  } catch (e) {}
});
