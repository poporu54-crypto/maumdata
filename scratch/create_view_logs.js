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
  console.log("Connected to Neon DB successfully.");

  // 1. business_view_logs 테이블 생성
  console.log("Creating business_view_logs table...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS business_view_logs (
      id SERIAL PRIMARY KEY,
      b_no VARCHAR(10) NOT NULL REFERENCES businesses(b_no) ON DELETE CASCADE,
      viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Table business_view_logs created.");

  // 2. 검색 및 집계 최적화를 위한 인덱스 생성
  console.log("Creating indexes for business_view_logs...");
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_business_view_logs_viewed_at ON business_view_logs(viewed_at);
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_business_view_logs_b_no ON business_view_logs(b_no);
  `);
  console.log("Indexes created successfully.");

  // 3. 초기 실시간 데이터 적재 (최근 24시간 내 무작위 분산 입력)
  // 메인 페이지 실시간 랭킹이 바로 작동하는지 시각화하기 위함
  const defaultPopular = [
    { no: "1378651839", count: 15 }, // 지윤
    { no: "1208801280", count: 25 }, // 토스
    { no: "2208162517", count: 35 }, // 네이버
    { no: "1208147521", count: 28 }, // 카카오
    { no: "2018121515", count: 20 }, // 스타벅스
    { no: "1028105450", count: 12 }  // 삼양식품
  ];

  console.log("Seeding mock real-time view logs for 24 hours...");
  for (const item of defaultPopular) {
    for (let i = 0; i < item.count; i++) {
      // 1분에서 23시간 사이의 무작위 과거 시간 생성
      const randomMinutesAgo = Math.floor(Math.random() * 23 * 60) + 1;
      await client.query(`
        INSERT INTO business_view_logs (b_no, viewed_at)
        VALUES ($1, NOW() - ($2 || ' minutes')::INTERVAL)
      `, [item.no, randomMinutesAgo]);
    }
  }
  console.log("Seeding real-time view logs completed.");

  await client.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await client.end();
});
