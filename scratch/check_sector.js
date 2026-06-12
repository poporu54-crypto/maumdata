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
    console.log("Creating index on b_sector...");
    await client.query("CREATE INDEX IF NOT EXISTS idx_businesses_b_sector ON businesses (b_sector)");
    console.log("Index created successfully!");

    const res = await client.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('businesses', 'business_history')");
    console.log("=== Database Indices ===");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
