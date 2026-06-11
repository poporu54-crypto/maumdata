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

// src/app/biz/[b_no]/page.tsx 에 들어간 핵심 동기화/조회 로직을 에뮬레이트하여 테스트
async function testSync() {
  await client.connect();
  console.log("Connected to DB");

  const bNo = "2208110227";

  // 1. 현재 DB 상태 확인
  const bizResBefore = await client.query("SELECT * FROM businesses WHERE b_no = $1", [bNo]);
  const localBiz = bizResBefore.rows[0];
  const histResBefore = await client.query("SELECT * FROM business_history WHERE b_no = $1", [bNo]);
  
  console.log("--- BEFORE SYNC ---");
  console.log(`crno in DB: ${localBiz.crno}`);
  console.log(`history count in DB: ${histResBefore.rows.length}`);

  // 2. 캐시 불완전성 판단 조건 대입
  const isListedOrAudited = 
    localBiz?.listing_status?.includes("상장") || 
    localBiz?.b_type?.includes("상장") || 
    localBiz?.b_type?.includes("대기업") || 
    localBiz?.b_type?.includes("중견기업") || 
    localBiz?.is_audited === true;

  const isCacheIncomplete = localBiz && (
    !localBiz.crno || 
    localBiz.crno === "-" ||
    (isListedOrAudited && histResBefore.rows.length === 0)
  );

  console.log(`\nIs cache incomplete? => ${isCacheIncomplete}`);

  if (isCacheIncomplete) {
    console.log("\n[Incomplete Cache Detected] Fetching from gov APIs...");
    const SERVICE_KEY = "f36b1b2ca7c1dc5648a1b0d8eb1fff41a6b22f58a653cd7f8895c33cb72c931b";
    
    // 2.1. 금융위 기본정보 조회
    const basicUrl = `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=1&resultType=json&bzno=${bNo}`;
    const basicRes = await fetch(basicUrl);
    const basicJson = await basicRes.json();
    const basicInfo = basicJson?.response?.body?.items?.item?.[0];

    if (basicInfo) {
      console.log(`Successfully fetched gov basic outline: ${basicInfo.corpNm}, crno: ${basicInfo.crno}`);
      
      // 2.2. 금융위 재무정보 조회
      const financeUrl = `https://apis.data.go.kr/1160100/service/GetFinaStatInfoService_V2/getSummFinaStat_V2?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=50&resultType=json&crno=${basicInfo.crno}`;
      const finRes = await fetch(financeUrl);
      const finJson = await finRes.json();
      const finItems = finJson?.response?.body?.items?.item || [];
      console.log(`Fetched ${finItems.length} raw finance records from gov API.`);

      // 2.3. DART 코드 매핑
      const dartCode = localBiz.dart_code || "";
      const scale = basicInfo.smenpYn === "Y" ? "중소기업" : "일반기업";

      // 3개년 데이터 가공 및 정렬
      const yearMap = new Map();
      finItems.forEach((item) => {
        const year = parseInt(item.bizYear || item.bsnsYear);
        if (!year) return;
        const code = item.fnclDcd || "";
        const existing = yearMap.get(year);
        if (existing && existing.fnclDcd === "110" && code !== "110") return;
        yearMap.set(year, item);
      });

      const history = [];
      yearMap.forEach((item, year) => {
        const to100M = (valStr) => Math.round(parseFloat(valStr || "0") / 100000000);
        history.push({
          year,
          revenue: to100M(item.enpSaleAmt),
          operatingIncome: to100M(item.enpBzopPft),
          netIncome: to100M(item.enpCrtmNpf),
          totalAssets: to100M(item.enpTastAmt),
          totalLiabilities: to100M(item.enpTdbtAmt),
          totalEquity: to100M(item.enpTcptAmt),
          employees: 0
        });
      });
      history.sort((a, b) => a.year - b.year);
      const slicedHistory = history.slice(-3);

      // 2.4. DB 캐시 업데이트
      console.log("\nUpdating businesses table and business_history table...");
      
      // businesses 테이블 업데이트
      await client.query(`
        UPDATE businesses SET 
          crno = $1, 
          corp_no = $1,
          start_dt = $2,
          b_adr = $3,
          b_sector = $4,
          main_biz = $5,
          homepage = $6,
          is_audited = $7,
          nts_last_sync_at = CURRENT_TIMESTAMP,
          nps_last_sync_at = CURRENT_TIMESTAMP
        WHERE b_no = $8
      `, [
        basicInfo.crno, basicInfo.enpEstbDt, basicInfo.enpBsadr, basicInfo.sicNm || "상장 법인",
        basicInfo.enpMainBizNm || basicInfo.sicNm || "상장 법인", basicInfo.enpHmpgUrl || "-",
        true, bNo
      ]);

      // business_history 테이블 업데이트
      await client.query("DELETE FROM business_history WHERE b_no = $1", [bNo]);
      for (const h of slicedHistory) {
        await client.query(`
          INSERT INTO business_history (
            b_no, year, revenue, operating_income, net_income, total_assets, total_liabilities, total_equity, employees
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          bNo, h.year, h.revenue, h.operatingIncome, h.netIncome,
          h.totalAssets, h.totalLiabilities, h.totalEquity, h.employees
        ]);
      }
      console.log("DB Cache successfully updated for Taekyung Chemical.");
    }
  }

  // 3. 동기화 후 DB 상태 확인
  const bizResAfter = await client.query("SELECT * FROM businesses WHERE b_no = $1", [bNo]);
  const localBizAfter = bizResAfter.rows[0];
  const histResAfter = await client.query("SELECT * FROM business_history WHERE b_no = $1", [bNo]);
  
  console.log("\n--- AFTER SYNC ---");
  console.log(`crno in DB: ${localBizAfter.crno}`);
  console.log(`history count in DB: ${histResAfter.rows.length}`);
  if (histResAfter.rows.length > 0) {
    console.log("Finance records details:");
    console.log(JSON.stringify(histResAfter.rows, null, 2));
  }

  await client.end();
}

testSync().catch(async (err) => {
  console.error(err);
  await client.end();
});
