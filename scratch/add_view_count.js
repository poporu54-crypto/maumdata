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

  // businesses 테이블에 view_count 컬럼 추가
  console.log("Adding view_count column to businesses...");
  await client.query(`
    ALTER TABLE businesses 
    ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;
  `);
  console.log("Column view_count added successfully.");

  // 기존 퀵링크 6개 기업에 대해 조회수 초기 가중치 부여 (완전 0으로 보이지 않고 기존 인기 기업이 유지되도록)
  const defaultPopular = [
    { no: "1378651839", views: 50 }, // 지윤
    { no: "1208801280", views: 80 }, // 토스
    { no: "2208162517", views: 120 }, // 네이버
    { no: "1208147521", views: 95 }, // 카카오
    { no: "2018121515", views: 70 }, // 스타벅스
    { no: "1028105450", views: 40 }  // 삼양식품
  ];

  console.log("Initializing view_count for default popular businesses...");
  for (const item of defaultPopular) {
    await client.query(`
      UPDATE businesses 
      SET view_count = $1 
      WHERE b_no = $2
    `, [item.views, item.no]);
  }
  console.log("View count initialization completed.");

  await client.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await client.end();
});
