const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const SERVICE_KEY = "f36b1b2ca7c1dc5648a1b0d8eb1fff41a6b22f58a653cd7f8895c33cb72c931b";

const connectionString = (() => {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/POSTGRES_URL=([^\r\n]+)/) || envContent.match(/DATABASE_URL=([^\r\n]+)/);
    if (match) return match[1].trim();
  }
  return process.env.POSTGRES_URL || process.env.DATABASE_URL;
})();

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 15, // 동시 커넥션 개수를 15개로 늘림
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Throttling 딜레이 함수
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchListedCompaniesByMarket(marketCode, marketName, startPage = 1) {
  let pageNo = startPage;
  const numOfRows = 200;
  let totalImported = 0;
  let retryCount = 0;
  const maxRetries = 3;

  console.log(`\n==================================================`);
  console.log(`Starting import for ${marketName} (Code: ${marketCode}) from Page ${startPage}`);
  console.log(`==================================================`);

  while (true) {
    const url = `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2?serviceKey=${SERVICE_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&resultType=json&corpRegMrktDcd=${marketCode}`;
    console.log(`[Fetch] Page ${pageNo}... URL: ${url.substring(0, 120)}...`);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`[Error] HTTP error on page ${pageNo}: ${res.status}`);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying page ${pageNo} (${retryCount}/${maxRetries}) in 5 seconds...`);
          await delay(5000);
          continue;
        }
        break;
      }

      const json = await res.json();
      const items = json?.response?.body?.items?.item;

      if (!items || !Array.isArray(items) || items.length === 0) {
        console.log(`[Finish] No more items found on page ${pageNo}.`);
        break;
      }

      console.log(`[Data] Found ${items.length} items on page ${pageNo}. Processing DB upsert (parallel)...`);

      let pageImported = 0;
      const chunkSize = 10; // 10개씩 묶어서 병렬로 쿼리 실행
      
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (item) => {
          const cleanBNo = (item.bzno || "").replace(/[^0-9]/g, "");
          const cleanCrno = (item.crno || "").replace(/[^0-9]/g, "");

          // 1. 사업자번호가 10자리가 아니거나 법인번호가 13자리가 아니면 적재 제외
          if (cleanBNo.length !== 10 || cleanCrno.length !== 13) {
            return;
          }

          const corpNm = item.corpNm || "";
          const enpRprFnm = item.enpRprFnm || "";
          const enpEstbDt = item.enpEstbDt || "";
          const enpBsadr = item.enpBsadr || "";
          const sicNm = item.sicNm || "상장 법인";
          const smenpYn = item.smenpYn || "";
          const enpHmpgUrl = item.enpHmpgUrl || item.enpHpaddr || "";
          const enpMainBizNm = item.enpMainBizNm || sicNm || "상장 법인";
          const fssCorpUnqNo = item.fssCorpUnqNo || "";

          const isSme = smenpYn === 'Y' ? '중소기업' : (marketName === '코스피' ? '대기업' : '중견기업');
          const listingStatus = marketName === '코스피' ? '코스피 상장' : '코스닥 상장';

          // 2. DB Upsert 쿼리 (pool.query 사용 및 자체 쿼리 재시도 적용)
          let querySuccess = false;
          let queryRetry = 0;
          while (!querySuccess && queryRetry < maxRetries) {
            try {
              await pool.query(`
                INSERT INTO businesses (
                  b_no, b_nm, p_nm, start_dt, b_adr, b_sector, b_type, corp_no, dart_code,
                  description, credit_rating, industry_rank, is_sme, listing_status, homepage, main_biz,
                  is_audited, data_source, nts_last_sync_at, nps_last_sync_at
                ) VALUES (
                  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
                ) ON CONFLICT (b_no) DO UPDATE SET
                  b_nm = EXCLUDED.b_nm,
                  p_nm = EXCLUDED.p_nm,
                  start_dt = EXCLUDED.start_dt,
                  b_adr = EXCLUDED.b_adr,
                  b_sector = EXCLUDED.b_sector,
                  b_type = EXCLUDED.b_type,
                  corp_no = EXCLUDED.corp_no,
                  dart_code = EXCLUDED.dart_code,
                  is_sme = EXCLUDED.is_sme,
                  listing_status = EXCLUDED.listing_status,
                  homepage = EXCLUDED.homepage,
                  main_biz = EXCLUDED.main_biz,
                  is_audited = EXCLUDED.is_audited,
                  data_source = EXCLUDED.data_source
              `, [
                cleanBNo, corpNm, enpRprFnm, enpEstbDt, enpBsadr, sicNm, listingStatus, cleanCrno, fssCorpUnqNo,
                `${corpNm}은(는) 대한민국 주식시장에 상장된 공식 ${listingStatus} 법인입니다.`,
                "-", "-", isSme, listingStatus, enpHmpgUrl || "-", enpMainBizNm,
                true, "public", "1970-01-01", "1970-01-01"
              ]);
              querySuccess = true;
              pageImported++;
            } catch (qErr) {
              queryRetry++;
              console.error(`[Query Error] Failed to upsert ${corpNm} (Retry ${queryRetry}/${maxRetries}):`, qErr);
              if (queryRetry >= maxRetries) {
                throw qErr;
              }
              await delay(2000);
            }
          }
        }));
      }

      totalImported += pageImported;
      console.log(`[Success] Page ${pageNo} completed. ${pageImported} companies processed. Cumulative: ${totalImported}`);

      pageNo++;
      retryCount = 0; // 성공 시 재시도 초기화
      await delay(300);

    } catch (err) {
      console.error(`[Error] Failed to process page ${pageNo}:`, err);
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying page ${pageNo} (${retryCount}/${maxRetries}) in 5 seconds due to error...`);
        await delay(5000);
      } else {
        console.error(`[Fatal] Max retries reached for page ${pageNo}. Aborting market import.`);
        break;
      }
    }
  }

  console.log(`\n[Finished] Total ${totalImported} listed companies imported for ${marketName}.`);
  return totalImported;
}

async function main() {
  console.log("Connecting to Neon DB...");
  await pool.query('SELECT NOW()');
  console.log("Connected!");

  const args = process.argv.slice(2);
  let startPage = 1;
  let targetMarket = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--start' && args[i + 1]) {
      startPage = parseInt(args[i + 1], 10) || 1;
    }
    if (args[i] === '--market' && args[i + 1]) {
      targetMarket = args[i + 1].toUpperCase();
    }
  }

  let kospiCount = 0;
  let kosdaqCount = 0;

  if (targetMarket) {
    if (targetMarket === 'P') {
      kospiCount = await fetchListedCompaniesByMarket('P', '코스피', startPage);
    } else if (targetMarket === 'A') {
      kosdaqCount = await fetchListedCompaniesByMarket('A', '코스닥', startPage);
    } else {
      console.error(`Invalid market code: ${targetMarket}. Use 'P' for KOSPI or 'A' for KOSDAQ.`);
    }
  } else {
    // 인자가 없으면 처음부터 다 진행
    kospiCount = await fetchListedCompaniesByMarket('P', '코스피', 1);
    kosdaqCount = await fetchListedCompaniesByMarket('A', '코스닥', 1);
  }

  console.log(`\n==================================================`);
  console.log(`All listed companies migration completed successfully!`);
  if (!targetMarket || targetMarket === 'P') console.log(`- KOSPI: ${kospiCount} companies`);
  if (!targetMarket || targetMarket === 'A') console.log(`- KOSDAQ: ${kosdaqCount} companies`);
  console.log(`==================================================`);

  await pool.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await pool.end();
});
