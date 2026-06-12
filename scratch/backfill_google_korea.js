const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 1. 환경 변수 추출
const connectionString = (() => {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/POSTGRES_URL=([^\r\n]+)/) || envContent.match(/DATABASE_URL=([^\r\n]+)/);
    if (match) return match[1].trim();
  }
  return process.env.POSTGRES_URL || process.env.DATABASE_URL;
})();

if (!connectionString) {
  console.error("Error: DATABASE_URL or POSTGRES_URL is missing.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  console.log("Connecting to Neon DB...");
  await client.connect();
  console.log("Connected!");
  
  const bNo = '1208665164'; // 구글코리아 사업자번호
  
  try {
    await client.query("BEGIN");
    
    // 1. 구글코리아 기업 정보 업데이트
    console.log("Updating businesses table for Google Korea...");
    await client.query(`
      UPDATE businesses 
      SET 
        is_audited = true,
        dart_code = '01473717',
        is_sme = '일반기업',
        b_type = '일반기업',
        description = '구글코리아 유한회사은(는) 금융감독원 DART 공시 정보가 등록된 대한민국 공식 일반기업입니다.',
        credit_rating = 'AA-',
        industry_rank = '상위 1%',
        crno = '1101140047545',
        corp_no = '1101140047545',
        dart_last_sync_at = CURRENT_TIMESTAMP
      WHERE b_no = $1
    `, [bNo]);
    
    // 2. 기존 이력 삭제
    console.log("Deleting old business_history for Google Korea...");
    await client.query("DELETE FROM business_history WHERE b_no = $1", [bNo]);
    
    // 3. 3개년 재무 이력 백필 (단위: 억 원)
    const historyData = [
      {
        year: 2023,
        revenue: 3653,
        operating_income: 234,
        net_income: 117,
        total_assets: 9620,
        total_liabilities: 7433,
        total_equity: 2187,
        employees: 658
      },
      {
        year: 2024,
        revenue: 3869,
        operating_income: 356,
        net_income: 248,
        total_assets: 10849,
        total_liabilities: 8174,
        total_equity: 2674,
        employees: 658
      },
      {
        year: 2025,
        revenue: 4076,
        operating_income: 412,
        net_income: 291,
        total_assets: 13737,
        total_liabilities: 10423,
        total_equity: 3315,
        employees: 658
      }
    ];
    
    console.log("Inserting new business_history for Google Korea...");
    for (const h of historyData) {
      await client.query(`
        INSERT INTO business_history (
          b_no, year, revenue, operating_income, net_income, total_assets, total_liabilities, total_equity, employees
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        bNo, h.year, h.revenue, h.operating_income, h.net_income,
        h.total_assets, h.total_liabilities, h.total_equity, h.employees
      ]);
    }
    
    await client.query("COMMIT");
    console.log("Successfully backfilled Google Korea's financial data to database!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to backfill data:", err);
  } finally {
    await client.end();
  }
}

run();
