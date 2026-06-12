const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 1. .env.local 로드
try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
        if (key && !key.startsWith('#')) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env.local", e);
}

const DATABASE_URL = process.env.DATABASE_URL;
const DATA_PORTAL_SERVICE_KEY = process.env.DATA_PORTAL_SERVICE_KEY || "";

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Sleep 헬퍼
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithTimeout(url, options = {}) {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// 사업장 검색
async function searchNpsBplcList(queryName, targetBNo6, limit = 50) {
  const encodedName = encodeURIComponent(queryName);
  const searchUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2?serviceKey=${DATA_PORTAL_SERVICE_KEY}&pageNo=1&numOfRows=${limit}&dataType=json&wkplNm=${encodedName}`;

  try {
    const response = await fetchWithTimeout(searchUrl);
    if (!response.ok) return null;
    const text = await response.text();
    
    if (text.includes("LIMITED NUMBER OF SERVICE REQUESTS EXCEEDED") || text.includes("Forbidden")) {
      throw new Error("API_LIMIT_EXCEEDED");
    }
    if (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE")) {
      return null;
    }

    let json = JSON.parse(text);
    const items = json?.response?.body?.items?.item;
    if (!items) return null;

    const list = Array.isArray(items) ? items : [items];
    const matchedList = list.filter((item) => {
      const apiBNo = (item.bzowrRgstNo || "").replace(/[^0-9]/g, "");
      return apiBNo.startsWith(targetBNo6);
    });

    if (matchedList.length === 0) return null;

    const noiseKeywords = ["일용", "현장", "공사", "납품", "용역", "/", "-"];
    const pureMatches = matchedList.filter((item) => {
      const name = item.wkplNm || "";
      return !noiseKeywords.some(kw => name.includes(kw));
    });

    if (pureMatches.length > 0) {
      pureMatches.sort((a, b) => (a.wkplNm || "").length - (b.wkplNm || "").length);
      return pureMatches[0];
    }

    matchedList.sort((a, b) => (a.wkplNm || "").length - (b.wkplNm || "").length);
    return matchedList[0];
  } catch (err) {
    if (err.message === "API_LIMIT_EXCEEDED") throw err;
    console.error(`Search failed for ${queryName}:`, err.message);
    return null;
  }
}

// 국민연금 업종 정보 수집
async function getNpsSector(bzowrRgstNo, companyNm) {
  const cleanBNo = bzowrRgstNo.replace(/[^0-9]/g, "");
  if (cleanBNo.length !== 10 || !companyNm) return null;

  const targetBNo6 = cleanBNo.substring(0, 6);
  let matchedBplc = await searchNpsBplcList(companyNm, targetBNo6, 50);

  if (!matchedBplc) {
    const cleanCompanyNm = companyNm
      .replace(/\(.*?\)/g, "")
      .replace(/주식회사/g, "")
      .replace(/\(주\)/g, "")
      .trim();
    if (cleanCompanyNm && cleanCompanyNm !== companyNm) {
      matchedBplc = await searchNpsBplcList(cleanCompanyNm, targetBNo6, 50);
    }
  }

  if (!matchedBplc || !matchedBplc.seq) return null;

  const seq = matchedBplc.seq;
  const detailUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getDetailInfoSearchV2?serviceKey=${DATA_PORTAL_SERVICE_KEY}&dataType=json&seq=${seq}`;

  try {
    const detailResponse = await fetchWithTimeout(detailUrl);
    if (!detailResponse.ok) return null;
    const detailText = await detailResponse.text();
    
    if (detailText.includes("LIMITED NUMBER OF SERVICE REQUESTS EXCEEDED") || detailText.includes("Forbidden")) {
      throw new Error("API_LIMIT_EXCEEDED");
    }

    let npsSector = "";
    if (detailText) {
      const detailJson = JSON.parse(detailText);
      const detailItem = detailJson?.response?.body?.items?.item;
      const targetDetail = Array.isArray(detailItem) ? detailItem[0] : detailItem;
      if (targetDetail) {
        npsSector = targetDetail.vldtVlKrnNm || "";
        return npsSector;
      }
    }
    return null;
  } catch (error) {
    if (error.message === "API_LIMIT_EXCEEDED") throw error;
    console.error(`Fetch detail failed for seq ${seq}:`, error.message);
    return null;
  }
}

async function main() {
  console.log("MaumData NPS Sector Backfill Task Started...");
  
  // 1. 대상 기업 조회 (b_sector가 '기타 서비스업' 또는 '상장 법인'인 기업들)
  // 특별히 현대차, 기아, 한국전력, 인맥에프엔씨, 삼양식품, 삼성전기는 조회 우선순위 최상위로 오도록 배치
  const dbRes = await pool.query(`
    SELECT b_no, b_nm, b_sector
    FROM businesses 
    WHERE b_sector IN ('기타 서비스업', '상장 법인')
    ORDER BY 
      CASE 
        WHEN b_no IN ('1018109147', '1198102316', '1208200052', '3878102559', '1028105450', '1248100979') THEN 0 
        ELSE 1 
      END ASC,
      view_count DESC
    LIMIT 200
  `);

  const targets = dbRes.rows;
  console.log(`Found ${targets.length} target businesses that have '기타 서비스업' or '상장 법인' sector.`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const biz = targets[i];
    const bNo = biz.b_no;
    const bNm = biz.b_nm;

    console.log(`\n[${i+1}/${targets.length}] Processing ${bNm} (${bNo})...`);

    try {
      await sleep(200); // 스로틀링

      const sector = await getNpsSector(bNo, bNm);
      if (sector) {
        // DB 캐시 테이블에 업종 정보 갱신
        await pool.query(`
          UPDATE businesses 
          SET b_sector = $1,
              nps_last_sync_at = CURRENT_TIMESTAMP
          WHERE b_no = $2
        `, [sector, bNo]);

        console.log(`   -> SUCCESS: Updated sector to '${sector}'`);
        successCount++;
      } else {
        console.log(`   -> SKIPPED: NPS sector data not found.`);
        skipCount++;
      }
    } catch (err) {
      if (err.message === "API_LIMIT_EXCEEDED") {
        console.warn(`\n[CRITICAL] 공공데이터포털 API 호출 일일 한도를 모두 소진하였습니다.`);
        break;
      } else {
        console.error(`   -> FAILED to process ${bNm}:`, err.message);
        failCount++;
      }
    }
  }

  console.log("\n==================================================");
  console.log("Sector Backfill Session Summary:");
  console.log(`- Success Updated: ${successCount} companies`);
  console.log(`- Skipped: ${skipCount} companies`);
  console.log(`- Failed: ${failCount} companies`);
  console.log("==================================================");
}

main()
  .catch(err => console.error("Backfill failed:", err))
  .finally(async () => {
    await pool.end();
    process.exit();
  });
