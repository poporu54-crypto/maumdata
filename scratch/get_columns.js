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
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'businesses'");
    console.log("=== Columns of businesses ===");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
