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

const bNo = process.argv[2];
if (!bNo) {
  console.error("Please provide a business registration number. Example: node scratch/inspect_biz.js 1208801280");
  process.exit(1);
}

async function run() {
  const client = new Client({
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  try {
    const cleanBNo = bNo.replace(/[^0-9]/g, "");
    
    const bizRes = await client.query("SELECT b_no, b_nm, p_nm, nps_sbscrb_nmps, new_acqs_nmps, loss_sbscrb_nmps, nps_linked, bids_last_sync_at, patents_last_sync_at, dart_last_sync_at FROM businesses WHERE b_no = $1", [cleanBNo]);
    console.log("=== Businesses ===");
    if (bizRes.rows.length === 0) {
      console.log("No business found in businesses table with b_no:", cleanBNo);
    } else {
      console.log(bizRes.rows[0]);
    }

    const bidsCount = await client.query("SELECT COUNT(*) FROM business_bids WHERE b_no = $1", [cleanBNo]);
    console.log("=== Bids Count ===");
    console.log(bidsCount.rows[0]);

    const patentsCount = await client.query("SELECT COUNT(*) FROM business_patents WHERE b_no = $1", [cleanBNo]);
    console.log("=== Patents Count ===");
    console.log(patentsCount.rows[0]);

    const disclosuresCount = await client.query("SELECT COUNT(*) FROM business_disclosures WHERE b_no = $1", [cleanBNo]);
    console.log("=== Disclosures Count ===");
    console.log(disclosuresCount.rows[0]);

    const historyRes = await client.query("SELECT * FROM business_history WHERE b_no = $1 ORDER BY year DESC LIMIT 3", [cleanBNo]);
    console.log("=== History ===");
    console.log(historyRes.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
