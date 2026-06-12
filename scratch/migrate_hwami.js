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

    console.log("1. Update Hwami crno");
    await client.query(`
      UPDATE businesses 
      SET crno = '1201110628521'
      WHERE b_no = '1218619950'
    `);
    
    console.log("2. Insert Hwami history");
    const histories = [
      { b_no: '1218619950', year: 2023, revenue: 705, operating_income: 68, net_income: 53, total_assets: 850, total_liabilities: 770, total_equity: 80, employees: 118 },
      { b_no: '1218619950', year: 2024, revenue: 780, operating_income: 60, net_income: 48, total_assets: 860, total_liabilities: 780, total_equity: 80, employees: 118 },
      { b_no: '1218619950', year: 2025, revenue: 211, operating_income: 5, net_income: -16, total_assets: 881, total_liabilities: 799, total_equity: 82, employees: 118 }
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
    console.log("Hwami migration completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();
