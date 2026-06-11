const { Client } = require('pg');
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

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Throttling 딜레이 함수
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchListedCompaniesByMarket(marketCode, marketName) {
  let pageNo = 1;
  const numOfRows = 200;
  let totalImported = 0;

  console.log(`\n==================================================`);
  console.log(`Starting import for ${marketName} (Code: ${marketCode})`);
  console.log(`==================================================`);

  while (true) {
    const url = `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2?serviceKey=${SERVICE_KEY}&pageNo=${pageNo}&numOfRows=${numOfRows}&resultType=json&corpRegMrktDcd=${marketCode}`;
    console.log(`[Fetch] Page ${pageNo}... URL: ${url.substring(0, 120)}...`);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`[Error] HTTP error on page ${pageNo}: ${res.status}`);
        break;
      }

      const json = await res.json();
      const items = json?.response?.body?.items?.item;

      if (!items || !Array.isArray(items) || items.length === 0) {
        console.log(`[Finish] No more items found on page ${pageNo}.`);
        break;
      }

      console.log(`[Data] Found ${items.length} items on page ${pageNo}. Processing DB upsert...`);

      let pageImported = 0;
      for (const item of items) {
        const cleanBNo = (item.bzno || "").replace(/[^0-9]/g, "");
        const cleanCrno = (item.crno || "").replace(/[^0-9]/g, "");

        // 1. 사업자번호가 10자리가 아니거나 법인번호가 13자리가 아니면 적재 제외
        if (cleanBNo.length !== 10 || cleanCrno.length !== 13) {
          continue;
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

        // 2. DB Upsert 쿼리
        await client.query(`
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

        pageImported++;
      }

      totalImported += pageImported;
      console.log(`[Success] Page ${pageNo} completed. ${pageImported} companies imported. Cumulative: ${totalImported}`);

      pageNo++;
      // 공공 API 및 DB 부하를 막기 위한 딜레이
      await delay(300);

    } catch (err) {
      console.error(`[Error] Failed to process page ${pageNo}:`, err);
      break;
    }
  }

  console.log(`\n[Finished] Total ${totalImported} listed companies imported for ${marketName}.`);
  return totalImported;
}

async function main() {
  console.log("Connecting to Neon DB...");
  await client.connect();
  console.log("Connected!");

  // 1. 코스피 상장사 이관 (시장코드: P)
  const kospiCount = await fetchListedCompaniesByMarket('P', '코스피');

  // 2. 코스닥 상장사 이관 (시장코드: A)
  const kosdaqCount = await fetchListedCompaniesByMarket('A', '코스닥');

  console.log(`\n==================================================`);
  console.log(`All listed companies migration completed successfully!`);
  console.log(`- KOSPI: ${kospiCount} companies`);
  console.log(`- KOSDAQ: ${kosdaqCount} companies`);
  console.log(`- Total: ${kospiCount + kosdaqCount} listed companies`);
  console.log(`==================================================`);

  await client.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await client.end();
});
