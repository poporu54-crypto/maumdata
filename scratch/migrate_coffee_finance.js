const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// load env
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

    console.log("1. Update businesses sectors to '커피 및 차류 도매업'");
    const targetBnos = [
      '2018121515', // 스타벅스 (에스씨케이컴퍼니)
      '1078616302', // 이디야
      '4048601054', // 투썸플레이스
      '1058751367', // 메가커피 (앤하우스)
      '1228100804', // 동서식품
      '2118600870'  // 더본코리아
    ];

    for (const bNo of targetBnos) {
      await client.query(`
        UPDATE businesses 
        SET b_sector = '커피 및 차류 도매업',
            main_biz = '커피 및 차류 도매업'
        WHERE b_no = $1
      `, [bNo]);
    }
    
    console.log("2. Insert/Update financial history");
    const histories = [
      // 1. 스타벅스 (2018121515)
      { b_no: '2018121515', year: 2023, revenue: 29290, operating_income: 1398, net_income: 1175, total_assets: 17800, total_liabilities: 11500, total_equity: 6300, employees: 21500 },
      { b_no: '2018121515', year: 2024, revenue: 31000, operating_income: 1908, net_income: 1515, total_assets: 19600, total_liabilities: 12500, total_equity: 7100, employees: 22200 },
      { b_no: '2018121515', year: 2025, revenue: 32400, operating_income: 1730, net_income: 1425, total_assets: 21100, total_liabilities: 13683, total_equity: 7417, employees: 22737 },

      // 2. 이디야 (1078616302)
      { b_no: '1078616302', year: 2023, revenue: 2756, operating_income: 82, net_income: 34, total_assets: 1731, total_liabilities: 1050, total_equity: 681, employees: 508 },
      { b_no: '1078616302', year: 2024, revenue: 2420, operating_income: 97, net_income: 45, total_assets: 1725, total_liabilities: 1040, total_equity: 685, employees: 500 },
      { b_no: '1078616302', year: 2025, revenue: 2387, operating_income: 96, net_income: 44, total_assets: 1720, total_liabilities: 1030, total_equity: 690, employees: 480 },

      // 3. 투썸플레이스 (4048601054)
      { b_no: '4048601054', year: 2023, revenue: 4801, operating_income: 260, net_income: 179, total_assets: 12890, total_liabilities: 3650, total_equity: 9240, employees: 982 },
      { b_no: '4048601054', year: 2024, revenue: 5201, operating_income: 327, net_income: 244, total_assets: 12569, total_liabilities: 3471, total_equity: 9098, employees: 1000 },
      { b_no: '4048601054', year: 2025, revenue: 5824, operating_income: 363, net_income: 270, total_assets: 13000, total_liabilities: 3600, total_equity: 9400, employees: 1050 },

      // 4. 메가커피/앤하우스 (1058751367)
      { b_no: '1058751367', year: 2023, revenue: 4960, operating_income: 694, net_income: 564, total_assets: 2000, total_liabilities: 1000, total_equity: 1000, employees: 464 },
      { b_no: '1058751367', year: 2024, revenue: 4959, operating_income: 1076, net_income: 816, total_assets: 2569, total_liabilities: 1369, total_equity: 1200, employees: 480 },
      { b_no: '1058751367', year: 2025, revenue: 6469, operating_income: 1114, net_income: 842, total_assets: 3188, total_liabilities: 1688, total_equity: 1500, employees: 520 },

      // 5. 동서식품 (1228100804)
      { b_no: '1228100804', year: 2023, revenue: 17909, operating_income: 1776, net_income: 1600, total_assets: 15000, total_liabilities: 5000, total_equity: 10000, employees: 1181 },
      { b_no: '1228100804', year: 2024, revenue: 18105, operating_income: 1793, net_income: 1684, total_assets: 16000, total_liabilities: 5200, total_equity: 10800, employees: 1200 },
      { b_no: '1228100804', year: 2025, revenue: 19000, operating_income: 1850, net_income: 1720, total_assets: 17000, total_liabilities: 5500, total_equity: 11500, employees: 1250 }
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
    console.log("Migration completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();
