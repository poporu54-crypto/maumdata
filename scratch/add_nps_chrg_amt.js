const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let pgUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    pgUrl = line.split('DATABASE_URL=')[1].trim();
    pgUrl = pgUrl.replace(/^['"]|['"]$/g, '');
    break;
  }
}

async function run() {
  const client = new Client({
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  try {
    console.log("Adding nps_chrg_amt column to businesses table...");
    await client.query("ALTER TABLE businesses ADD COLUMN IF NOT EXISTS nps_chrg_amt bigint");
    console.log("Column nps_chrg_amt added successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();
