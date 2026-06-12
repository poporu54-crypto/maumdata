const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let pgUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('POSTGRES_URL=')) {
    pgUrl = line.split('POSTGRES_URL=')[1].trim();
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
    const biz = await client.query("SELECT b_no, b_nm, b_sector, crno FROM businesses WHERE b_no = '1398701725'");
    const hist = await client.query("SELECT * FROM business_history WHERE b_no = '1398701725' ORDER BY year");
    console.log("=== Master ===");
    console.log(biz.rows);
    console.log("=== History ===");
    console.log(hist.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
