const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = (() => {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/POSTGRES_URL=([^\r\n]+)/) || envContent.match(/DATABASE_URL=([^\r\n]+)/);
    if (match) return match[1].trim();
  }
  return process.env.POSTGRES_URL || process.env.DATABASE_URL;
})();

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  await client.connect();
  console.log("Connected to DB");

  // 오리온 (1068104036) 및 삼화네트웍스 (1168135822) 과거 직원수 리셋
  const targets = ["1068104036", "1168135822"];

  for (const bNo of targets) {
    console.log(`\nProcessing b_no: ${bNo}`);
    
    // history 조회
    const histRes = await client.query("SELECT * FROM business_history WHERE b_no = $1 ORDER BY year ASC", [bNo]);
    
    if (histRes.rows.length > 0) {
      const latestYear = histRes.rows[histRes.rows.length - 1].year;
      
      for (const row of histRes.rows) {
        if (row.year === latestYear) {
          // 최신 연도는 실제 국민연금 가입자 수 유지 (오리온 6명, 삼화네트웍스 20명)
          console.log(`Keep latest year ${row.year} employees: ${row.employees}`);
        } else {
          // 과거 연도는 데이터가 없으므로 0으로 리셋 (가짜 데이터 제거)
          await client.query("UPDATE business_history SET employees = 0 WHERE id = $1", [row.id]);
          console.log(`Reset year ${row.year} employees from ${row.employees} to 0`);
        }
      }
    }
  }

  await client.end();
}

main().catch(async (err) => {
  console.error(err);
  await client.end();
});
