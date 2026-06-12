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

// 타임아웃 가드 fetch
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
    
    // API 한도 초과 체크
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

// 취득/상실 현황 수집
async function getNpsPeriodInfo(bzowrRgstNo, companyNm) {
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
  const periodUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getPdAcctoSttusInfoSearchV2?serviceKey=${DATA_PORTAL_SERVICE_KEY}&dataType=json&seq=${seq}`;

  try {
    const periodResponse = await fetchWithTimeout(periodUrl);
    if (!periodResponse.ok) return null;
    const periodText = await periodResponse.text();
    
    if (periodText.includes("LIMITED NUMBER OF SERVICE REQUESTS EXCEEDED") || periodText.includes("Forbidden")) {
      throw new Error("API_LIMIT_EXCEEDED");
    }

    let newAcqsNmps = 0;
    let lossSbscrbNmps = 0;

    if (periodText) {
      const periodJson = JSON.parse(periodText);
      const periodItem = periodJson?.response?.body?.items?.item;
      const targetPeriod = Array.isArray(periodItem) ? periodItem[0] : periodItem;
      if (targetPeriod) {
        newAcqsNmps = parseInt(targetPeriod.nwAcqzrCnt || "0", 10);
        lossSbscrbNmps = parseInt(targetPeriod.lssJnngpCnt || "0", 10);
        return { newAcqsNmps, lossSbscrbNmps };
      }
    }
    return null;
  } catch (error) {
    if (error.message === "API_LIMIT_EXCEEDED") throw error;
    console.error(`Fetch period failed for seq ${seq}:`, error.message);
    return null;
  }
}

async function main() {
  console.log("MaumData NPS Period Indicators Backfill Task Started...");
  
  // 1. 대상 기업 조회 (NPS 연동은 되었으나 취득/상실자수가 모두 0인 핵심 조회 유입 기업들)
  // 마이그레이션 안전성을 위해 우선순위가 높은 view_count DESC 정렬로 가져옵니다.
  const dbRes = await pool.query(`
    SELECT b_no, b_nm 
    FROM businesses 
    WHERE nps_linked = true AND new_acqs_nmps = 0 AND loss_sbscrb_nmps = 0
    ORDER BY view_count DESC
  `);

  const targets = dbRes.rows;
  console.log(`Found ${targets.length} target businesses that lack NPS acquisition/loss indicators.`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const biz = targets[i];
    const bNo = biz.b_no;
    const bNm = biz.b_nm;

    console.log(`\n[${i+1}/${targets.length}] Processing ${bNm} (${bNo})...`);

    try {
      // API 호출 스로틀링 (공공 API 서버 과부하 및 차단 방지)
      await sleep(200);

      const periodInfo = await getNpsPeriodInfo(bNo, bNm);
      if (periodInfo) {
        // DB 캐시 테이블에 신규 취득/상실 값 기입
        await pool.query(`
          UPDATE businesses 
          SET new_acqs_nmps = $1, 
              loss_sbscrb_nmps = $2,
              nps_last_sync_at = CURRENT_TIMESTAMP
          WHERE b_no = $3
        `, [periodInfo.newAcqsNmps, periodInfo.lossSbscrbNmps, bNo]);

        console.log(`   -> SUCCESS: Acquired +${periodInfo.newAcqsNmps}, Lost -${periodInfo.lossSbscrbNmps}`);
        successCount++;
      } else {
        console.log(`   -> SKIPPED: NPS period data not found or matched.`);
        skipCount++;
      }
    } catch (err) {
      if (err.message === "API_LIMIT_EXCEEDED") {
        console.warn(`\n[CRITICAL] 공공데이터포털 API 호출 일일 한도를 모두 소진하였습니다.`);
        console.warn(`오늘 작업은 여기서 조기 중단합니다. (내일 스크립트를 재실행하면 이어서 백필됩니다.)`);
        break;
      } else {
        console.error(`   -> FAILED to process ${bNm}:`, err.message);
        failCount++;
      }
    }
  }

  console.log("\n==================================================");
  console.log("NPS Backfill Session Summary:");
  console.log(`- Success Updated: ${successCount} companies`);
  console.log(`- Skipped/No data: ${skipCount} companies`);
  console.log(`- Failed: ${failCount} companies`);
  console.log(`- Remaining companies to fill: ${targets.length - successCount - skipCount}`);
  console.log("==================================================");
}

main()
  .catch(err => console.error("Backfill failed:", err))
  .finally(async () => {
    await pool.end();
    process.exit();
  });
