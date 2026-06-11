const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// .env.local 파일에서 수동으로 DB 커넥션 스트링 추출
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
  console.error("Error: DATABASE_URL or POSTGRES_URL environment variable is missing.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  console.log("Connecting to Neon DB...");
  await client.connect();
  console.log("Connected successfully!");

  console.log("Dropping existing tables to prevent migration conflicts...");
  await client.query(`DROP TABLE IF EXISTS business_history CASCADE;`);
  await client.query(`DROP TABLE IF EXISTS businesses CASCADE;`);
  await client.query(`DROP TABLE IF EXISTS stats_history CASCADE;`);
  await client.query(`DROP TABLE IF EXISTS invalid_businesses CASCADE;`);

  console.log("Creating tables...");
  
  // 1. businesses 테이블 생성
  await client.query(`
    CREATE TABLE businesses (
      b_no VARCHAR(10) PRIMARY KEY,
      b_nm VARCHAR(255) NOT NULL,
      p_nm VARCHAR(255) NOT NULL,
      start_dt VARCHAR(8) NOT NULL,
      b_adr TEXT NOT NULL,
      b_sector VARCHAR(255) NOT NULL,
      b_type VARCHAR(255),
      corp_no VARCHAR(13),
      dart_code VARCHAR(8),
      description TEXT,
      credit_rating VARCHAR(10),
      industry_rank VARCHAR(50),
      is_sme VARCHAR(100),
      listing_status VARCHAR(100),
      homepage VARCHAR(255),
      main_biz TEXT,
      is_audited BOOLEAN DEFAULT FALSE,
      nps_sbscrb_nmps INTEGER DEFAULT 0,
      nps_linked BOOLEAN DEFAULT FALSE,
      corp_enm VARCHAR(255),
      crno VARCHAR(13),
      enp_tlno VARCHAR(50),
      enp_fxno VARCHAR(50),
      enp_pncd VARCHAR(10),
      enp_stac_nm VARCHAR(100),
      enp_main_biz_nm VARCHAR(255),
      data_source VARCHAR(50) DEFAULT 'local'
    );
  `);

  // 2. business_history 테이블 생성
  await client.query(`
    CREATE TABLE business_history (
      id SERIAL PRIMARY KEY,
      b_no VARCHAR(10) REFERENCES businesses(b_no) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      revenue BIGINT DEFAULT 0,
      operating_income BIGINT DEFAULT 0,
      net_income BIGINT DEFAULT 0,
      total_assets BIGINT DEFAULT 0,
      total_liabilities BIGINT DEFAULT 0,
      total_equity BIGINT DEFAULT 0,
      employees INTEGER DEFAULT 0,
      UNIQUE(b_no, year)
    );
  `);

  // 3. stats_history 테이블 생성 (JSONB 형식 적용)
  await client.query(`
    CREATE TABLE stats_history (
      bas_dt VARCHAR(10) PRIMARY KEY,
      stats_data JSONB NOT NULL
    );
  `);

  // 4. invalid_businesses 테이블 생성
  await client.query(`
    CREATE TABLE invalid_businesses (
      b_no VARCHAR(10) PRIMARY KEY
    );
  `);

  console.log("Tables created successfully.");

  // 데이터 마이그레이션 진행
  // 1. businesses.json 이관
  const bizPath = path.join(__dirname, '../src/data/businesses.json');
  if (fs.existsSync(bizPath)) {
    console.log("Migrating businesses.json...");
    const raw = fs.readFileSync(bizPath, 'utf8');
    const businesses = JSON.parse(raw);

    for (const biz of businesses) {
      const cleanBNo = biz.b_no.replace(/[^0-9]/g, "");
      
      await client.query(`
        INSERT INTO businesses (
          b_no, b_nm, p_nm, start_dt, b_adr, b_sector, b_type, corp_no, dart_code,
          description, credit_rating, industry_rank, is_sme, listing_status, homepage, main_biz,
          is_audited, nps_sbscrb_nmps, nps_linked, corp_enm, crno, enp_tlno, enp_fxno, enp_pncd,
          enp_stac_nm, enp_main_biz_nm, data_source
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
        ) ON CONFLICT (b_no) DO NOTHING
      `, [
        cleanBNo, biz.b_nm, biz.p_nm, biz.start_dt, biz.b_adr, biz.b_sector, biz.b_type || "", biz.corp_no || "", biz.dart_code || "",
        biz.description || "", biz.credit_rating || "", biz.industry_rank || "", biz.is_sme || "", biz.listing_status || "",
        biz.homepage || "", biz.main_biz || "", biz.is_audited || false, biz.npsSbscrbNmps || 0, biz.npsLinked || false,
        biz.corpEnm || "", biz.crno || "", biz.enpTlno || "", biz.enpFxno || "", biz.enpPncd || "", biz.enpStacNm || "",
        biz.enpMainBizNm || "", biz.dataSource || "local"
      ]);

      if (biz.history && Array.isArray(biz.history)) {
        for (const h of biz.history) {
          await client.query(`
            INSERT INTO business_history (
              b_no, year, revenue, operating_income, net_income, total_assets, total_liabilities, total_equity, employees
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (b_no, year) DO NOTHING
          `, [
            cleanBNo, h.year, h.revenue || 0, h.operatingIncome || 0, h.netIncome || 0,
            h.totalAssets || 0, h.totalLiabilities || 0, h.totalEquity || 0, h.employees || 0
          ]);
        }
      }
    }
    console.log(`Migrated ${businesses.length} businesses successfully.`);
  }

  // 2. stats_history.json 이관 (JSONB 이관 갱신)
  const statsPath = path.join(__dirname, '../src/data/stats_history.json');
  if (fs.existsSync(statsPath)) {
    console.log("Migrating stats_history.json...");
    const raw = fs.readFileSync(statsPath, 'utf8');
    const stats = JSON.parse(raw);

    for (const s of stats) {
      const { date, ...statsData } = s;
      await client.query(`
        INSERT INTO stats_history (bas_dt, stats_data)
        VALUES ($1, $2)
        ON CONFLICT (bas_dt) DO NOTHING
      `, [date, JSON.stringify(statsData)]);
    }
    console.log(`Migrated ${stats.length} stats snapshots successfully.`);
  }

  // 3. invalid_businesses.json 이관
  const invalidPath = path.join(__dirname, '../src/data/invalid_businesses.json');
  if (fs.existsSync(invalidPath)) {
    console.log("Migrating invalid_businesses.json...");
    const raw = fs.readFileSync(invalidPath, 'utf8');
    const invalids = JSON.parse(raw);

    for (const bNo of invalids) {
      const cleanBNo = bNo.replace(/[^0-9]/g, "");
      if (cleanBNo) {
        await client.query(`
          INSERT INTO invalid_businesses (b_no) VALUES ($1) ON CONFLICT (b_no) DO NOTHING
        `, [cleanBNo]);
      }
    }
    console.log(`Migrated ${invalids.length} invalid businesses successfully.`);
  }

  console.log("Migration finished successfully!");
}

main()
  .catch(err => {
    console.error("Migration failed:", err);
  })
  .finally(async () => {
    await client.end();
  });
