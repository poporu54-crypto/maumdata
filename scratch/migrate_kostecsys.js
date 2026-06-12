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
    await client.query("BEGIN");

    console.log("1. Update Kostecsys crno");
    await client.query(`
      UPDATE businesses 
      SET crno = '1101117471470'
      WHERE b_no = '1398701725'
    `);
    
    console.log("2. Insert Kostecsys history");
    const histories = [
      { b_no: '1398701725', year: 2023, revenue: 115, operating_income: -13, net_income: -114, total_assets: 378, total_liabilities: 119, total_equity: 259, employees: 59 },
      { b_no: '1398701725', year: 2024, revenue: 142, operating_income: -19, net_income: -18, total_assets: 400, total_liabilities: 174, total_equity: 226, employees: 59 },
      { b_no: '1398701725', year: 2025, revenue: 152, operating_income: 2, net_income: -6, total_assets: 560, total_liabilities: 337, total_equity: 223, employees: 59 }
    ];

    for (const h of histories) {
      await client.query(`
        INSERT INTO business_history (
          b_no, year, revenue, operating_income, net_income, total_assets, total_liabilities, total_equity, employees
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (b_no, year) DO UPDATE SET
          revenue = EXCLUDED.revenue,
          operating_income = EXCLUDED.operating_income,
          net_income = EXCLUDED.net_income,
          total_assets = EXCLUDED.total_assets,
          total_liabilities = EXCLUDED.total_liabilities,
          total_equity = EXCLUDED.total_equity,
          employees = EXCLUDED.employees
      `, [
        h.b_no, h.year, h.revenue, h.operating_income, h.net_income,
        h.total_assets, h.total_liabilities, h.total_equity, h.employees
      ]);
    }

    await client.query("COMMIT");
    console.log("Kostecsys migration completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();
