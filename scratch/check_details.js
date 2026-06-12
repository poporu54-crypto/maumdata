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
    const bNo = '1028105450'; // 삼양식품 사업자번호
    console.log(`=== Inspecting data for business ${bNo} ===`);
    
    // 1. businesses
    const biz = await client.query("SELECT b_no, b_nm, dart_code FROM businesses WHERE b_no = $1", [bNo]);
    console.log("Business Row:", biz.rows[0]);
    
    // 2. business_bids
    const bids = await client.query("SELECT COUNT(*) as count FROM business_bids WHERE b_no = $1", [bNo]);
    console.log("Bids Count:", bids.rows[0].count);
    
    // 3. business_patents
    const patents = await client.query("SELECT COUNT(*) as count FROM business_patents WHERE b_no = $1", [bNo]);
    console.log("Patents Count:", patents.rows[0].count);
    
    // 4. business_disclosures
    const disclosures = await client.query("SELECT COUNT(*) as count FROM business_disclosures WHERE b_no = $1", [bNo]);
    console.log("Disclosures Count:", disclosures.rows[0].count);
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
