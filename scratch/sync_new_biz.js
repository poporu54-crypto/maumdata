const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 1. .env.local 로드
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim().replace(/\r/g, '');
        const value = parts.slice(1).join('=').trim().replace(/\r/g, '');
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env.local", e);
}

const DATABASE_URL = process.env.DATABASE_URL;
const DATA_PORTAL_SERVICE_KEY = process.env.DATA_PORTAL_SERVICE_KEY || "";
const KIPRIS_ACCESS_KEY = process.env.KIPRIS_ACCESS_KEY || "";
const DART_API_KEY = "0ee2cc9103b1efb7f69767eee411270a9a1fc4a7"; // DART Open API Key

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const bNoInput = process.argv[2];
if (!bNoInput) {
  console.error("Please provide a business registration number. Example: node scratch/sync_new_biz.js 1228100813");
  process.exit(1);
}

const cleanBNo = bNoInput.replace(/[^0-9]/g, "");

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 주요 대기업 DART 고유번호 맵 (수동 매핑 보강)
const DART_CODE_MAP = {
  "1228100813": "00127592", // 동서식품
  "1078616302": "00880128", // 이디야 (비상장/공시)
  "4048601054": "01331778", // 투썸플레이스
  "1058751367": "01494833", // 엠지씨글로벌 (메가커피)
  "8448100466": "01185012", // 매일유업
};

function sanitizeCorpName(name) {
  return name
    .replace(/\(.*?\)/g, "")
    .replace(/주식회사/g, "")
    .replace(/\(주\)/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

// XML 파서 (특허용)
function parsePatentXml(xml) {
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  const list = [];
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const getTagValue = (tag) => {
      const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`);
      const m = regex.exec(block);
      return m ? m[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim() : "";
    };

    const applicationNumber = getTagValue("applicationNumber") || getTagValue("appNo") || "";
    const applicationDateRaw = getTagValue("applicationDate") || getTagValue("appDate") || "";
    const inventionTitle = getTagValue("inventionTitle") || getTagValue("title") || "지식재산권";
    const registerNumber = getTagValue("registerNumber") || getTagValue("regNo") || "";
    const registerDateRaw = getTagValue("registerDate") || getTagValue("regDate") || "";
    const applicantName = getTagValue("applicantName") || getTagValue("applicant") || "";
    let patentStatus = getTagValue("patentStatus") || getTagValue("status");
    if (!patentStatus) {
      patentStatus = registerNumber ? "등록" : "공개";
    }

    const formatDate = (dateStr) => {
      if (!dateStr || dateStr.length !== 8) return dateStr || "-";
      return `${dateStr.slice(0, 4)}년 ${dateStr.slice(4, 6)}월 ${dateStr.slice(6, 8)}일`;
    };

    list.push({
      applicationNumber,
      applicationDate: formatDate(applicationDateRaw),
      inventionTitle,
      registerNumber: registerNumber || undefined,
      registerDate: registerDateRaw ? formatDate(registerDateRaw) : undefined,
      applicantName,
      patentStatus,
      detailUrl: `https://doi.org/10.8080/${applicationNumber.replace(/[^0-9]/g, "")}`,
    });
  }
  return list;
}

const https = require('https');

// 1. 국세청 실시간 조회 (https.request 활용)
function getNtsStatus(bNo) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ b_no: [bNo] });
    const options = {
      hostname: 'api.odcloud.kr',
      path: `/api/nts-businessman/v1/status?serviceKey=${DATA_PORTAL_SERVICE_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log("NTS Raw Body:", body);
        try {
          const json = JSON.parse(body);
          resolve(json.data?.[0] || null);
        } catch (e) {
          console.error("NTS JSON parse error:", e);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.error("NTS https request error:", e);
      resolve(null);
    });

    req.write(data);
    req.end();
  });
}

// 2. 금융위 기업기본정보 조회 (https.get 활용)
function getCorpBasic(bNo) {
  return new Promise((resolve) => {
    const url = `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2?serviceKey=${DATA_PORTAL_SERVICE_KEY}&pageNo=1&numOfRows=1&resultType=json&bzno=${bNo}`;
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log("CorpBasic Raw Body:", body);
        try {
          const json = JSON.parse(body);
          const item = json?.response?.body?.items?.item?.[0];
          if (!item) {
            resolve(null);
            return;
          }
          resolve({
            crno: item.crno || "",
            corpNm: item.corpNm || "",
            enpRprFnm: item.enpRprFnm || "",
            enpBsadr: item.enpBsadr || "",
            enpEstbDt: item.enpEstbDt || "",
            enpIndyNm: item.sicNm || item.enpIndyNm || "",
            enpEntprScaleNm: item.smenpYn === "Y" ? "중소기업" : "일반기업",
            enpHpaddr: item.enpHmpgUrl || "",
            enpTlno: item.enpTlno || "",
            enpFxno: item.enpFxno || "",
            enpPncd: item.enpOzpno || ""
          });
        } catch (e) {
          console.error("CorpBasic parse error:", e);
          resolve(null);
        }
      });
    }).on('error', (e) => {
      console.error("CorpBasic request error:", e);
      resolve(null);
    });
  });
}

// 3. 금융위 재무제표조회 (https.get 활용)
function getCorpFinance(crno) {
  return new Promise((resolve) => {
    const url = `https://apis.data.go.kr/1160100/service/GetFinaStatInfoService_V2/getSummFinaStat_V2?serviceKey=${DATA_PORTAL_SERVICE_KEY}&pageNo=1&numOfRows=50&resultType=json&crno=${crno}`;
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const items = json?.response?.body?.items?.item;
          if (!items || !Array.isArray(items)) {
            resolve([]);
            return;
          }

          const history = [];
          const yearMap = new Map();
          items.forEach(item => {
            const year = parseInt(item.bizYear || item.bsnsYear);
            if (!year) return;
            const code = item.fnclDcd || "";
            const existing = yearMap.get(year);
            if (existing && existing.fnclDcd === "110" && code !== "110") return;
            yearMap.set(year, item);
          });

          const to100M = (valStr) => Math.round(parseFloat(valStr || "0") / 100000000);

          yearMap.forEach((item, year) => {
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
          resolve(history.slice(-3));
        } catch (e) {
          console.error("CorpFinance parse error:", e);
          resolve([]);
        }
      });
    }).on('error', (e) => {
      console.error("CorpFinance request error:", e);
      resolve([]);
    });
  });
}

// 4. 국민연금 검색 및 상세 조회
async function searchNpsBplcList(queryName, targetBNo6, limit = 100) {
  const encodedName = encodeURIComponent(queryName);
  const searchUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2?serviceKey=${DATA_PORTAL_SERVICE_KEY}&pageNo=1&numOfRows=${limit}&dataType=json&wkplNm=${encodedName}`;
  try {
    const response = await fetch(searchUrl);
    if (!response.ok) return null;
    const text = await response.text();
    if (text.includes("Forbidden") || (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE"))) return null;
    let json = JSON.parse(text);
    const items = json?.response?.body?.items?.item;
    if (!items) return null;
    const list = Array.isArray(items) ? items : [items];
    const matchedList = list.filter(item => {
      const apiBNo = (item.bzowrRgstNo || "").replace(/[^0-9]/g, "");
      return apiBNo.startsWith(targetBNo6);
    });
    if (matchedList.length === 0) return null;
    const noiseKeywords = ["일용", "현장", "공사", "납품", "용역", "/", "-"];
    const pureMatches = matchedList.filter(item => {
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
    console.error("NPS Search Error:", err);
    return null;
  }
}

async function getNpsBplcInfo(bzowrRgstNo, companyNm) {
  const cleanBNo = bzowrRgstNo.replace(/[^0-9]/g, "");
  if (cleanBNo.length !== 10 || !companyNm) return null;
  const targetBNo6 = cleanBNo.substring(0, 6);

  let matchedBplc = await searchNpsBplcList(companyNm, targetBNo6, 100);
  
  if (!matchedBplc) {
    const cleanCompanyNm = companyNm
      .replace(/\(.*?\)/g, "")
      .replace(/주식회사/g, "")
      .replace(/\(주\)/g, "")
      .trim();
    if (cleanCompanyNm && cleanCompanyNm !== companyNm) {
      matchedBplc = await searchNpsBplcList(cleanCompanyNm, targetBNo6, 100);
    }
  }

  // 3단계 폴백: 주식회사를 앞뒤로 붙여 검색
  if (!matchedBplc) {
    const cleanCompanyNm = companyNm
      .replace(/\(.*?\)/g, "")
      .replace(/주식회사/g, "")
      .replace(/\(주\)/g, "")
      .trim();
    if (cleanCompanyNm) {
      matchedBplc = await searchNpsBplcList(`${cleanCompanyNm}주식회사`, targetBNo6, 100);
      if (!matchedBplc) {
        matchedBplc = await searchNpsBplcList(`주식회사${cleanCompanyNm}`, targetBNo6, 100);
      }
    }
  }

  if (!matchedBplc || !matchedBplc.seq) return null;

  const seq = matchedBplc.seq;
  const detailUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getDetailInfoSearchV2?serviceKey=${DATA_PORTAL_SERVICE_KEY}&dataType=json&seq=${seq}`;
  const periodUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getPdAcctoSttusInfoSearchV2?serviceKey=${DATA_PORTAL_SERVICE_KEY}&dataType=json&seq=${seq}`;

  try {
    const [detailResponse, periodResponse] = await Promise.all([
      fetch(detailUrl),
      fetch(periodUrl).catch(() => null)
    ]);
    if (!detailResponse.ok) return null;
    const detailText = await detailResponse.text();
    const detailJson = JSON.parse(detailText);
    const detailItem = detailJson?.response?.body?.items?.item;
    const targetDetail = Array.isArray(detailItem) ? detailItem[0] : detailItem;

    if (targetDetail) {
      const pepCnt = parseInt(targetDetail.jnngpCnt || targetDetail.npsSbscrbNmps || "0");
      const npsChrgAmt = parseInt(targetDetail.crrmmNtcAmt || "0", 10);
      const npsSector = targetDetail.vldtVlKrnNm || "";
      let newAcqsNmps = 0;
      let lossSbscrbNmps = 0;

      if (periodResponse && periodResponse.ok) {
        try {
          const periodText = await periodResponse.text();
          const periodJson = JSON.parse(periodText);
          const periodItem = periodJson?.response?.body?.items?.item;
          const targetPeriod = Array.isArray(periodItem) ? periodItem[0] : periodItem;
          if (targetPeriod) {
            newAcqsNmps = parseInt(targetPeriod.nwAcqzrCnt || "0", 10);
            lossSbscrbNmps = parseInt(targetPeriod.lssJnngpCnt || "0", 10);
          }
        } catch (pe) {
          console.error("Period parse error", pe);
        }
      }

      return {
        wkplNm: targetDetail.wkplNm || matchedBplc.wkplNm || "",
        bzowrRgstNo: cleanBNo,
        npsSbscrbNmps: pepCnt,
        newAcqsNmps,
        lossSbscrbNmps,
        npsChrgAmt,
        npsSector
      };
    }
    return null;
  } catch (error) {
    console.error("NPS Detail Error:", error);
    return null;
  }
}

// 브랜드 핵심이름 정규화 추출
function extractCoreBrand(name) {
  if (!name) return "";
  return name
    .replace(/\(.*?\)/g, "")
    .replace(/주식회사/g, "")
    .replace(/\(주\)/g, "")
    .replace(/（주）/g, "")
    .replace(/\(유\)/g, "")
    .replace(/유한회사/g, "")
    .replace(/\(사\)/g, "")
    .replace(/사단법인/g, "")
    .trim();
}

async function run() {
  console.log(`=== [Sync New Business] 대상 사업자 번호: ${cleanBNo} ===`);

  // 1. 국세청 및 금융위 API로부터 기초정보 조회
  const ntsData = await getNtsStatus(cleanBNo);
  if (!ntsData || ntsData.tax_type === "국세청에 등록되지 않은 사업자등록번호입니다") {
    console.error("국세청 등록정보가 없거나 유효하지 않은 사업자 번호입니다.");
    process.exit(1);
  }
  console.log(`[NTS] 납세상태: ${ntsData.b_stt} / 유형: ${ntsData.tax_type}`);

  const corpBasic = await getCorpBasic(cleanBNo);
  if (!corpBasic) {
    console.error("금융위 기업정보 조회 실패. 법인 정보를 가져올 수 없습니다.");
    process.exit(1);
  }
  console.log(`[CorpBasic] 법인명: ${corpBasic.corpNm} / 대표자: ${corpBasic.enpRprFnm} / 업종명: ${corpBasic.enpIndyNm}`);

  const finance = await getCorpFinance(corpBasic.crno);
  console.log(`[CorpFinance] 재무제표 3개년 적재 준비 완료 (${finance.length}개년 수집)`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 2. businesses 테이블에 기본 레코드 upsert
    const brandName = `${extractCoreBrand(corpBasic.corpNm)}, ${corpBasic.corpNm}`;
    const desc = `${corpBasic.corpNm}은(는) 금융위원회 공시 정보가 등록된 대한민국 공식 일반기업입니다.`;
    
    let dartCode = DART_CODE_MAP[cleanBNo] || "";

    await client.query(`
      INSERT INTO businesses (
        b_no, b_nm, p_nm, start_dt, b_adr, b_sector, b_type, corp_no, dart_code,
        description, credit_rating, industry_rank, is_sme, listing_status, homepage, main_biz,
        is_audited, data_source, tax_type, tax_type_cd, b_stt, b_stt_cd, brand_name,
        nts_last_sync_at, nps_last_sync_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (b_no) DO UPDATE SET
        b_nm = EXCLUDED.b_nm,
        p_nm = EXCLUDED.p_nm,
        start_dt = EXCLUDED.start_dt,
        b_adr = EXCLUDED.b_adr,
        b_sector = EXCLUDED.b_sector,
        b_type = EXCLUDED.b_type,
        corp_no = EXCLUDED.corp_no,
        dart_code = EXCLUDED.dart_code,
        description = EXCLUDED.description,
        is_sme = EXCLUDED.is_sme,
        listing_status = EXCLUDED.listing_status,
        homepage = EXCLUDED.homepage,
        main_biz = EXCLUDED.main_biz,
        brand_name = EXCLUDED.brand_name,
        tax_type = EXCLUDED.tax_type,
        tax_type_cd = EXCLUDED.tax_type_cd,
        b_stt = EXCLUDED.b_stt,
        b_stt_cd = EXCLUDED.b_stt_cd
    `, [
      cleanBNo, corpBasic.corpNm, corpBasic.enpRprFnm, corpBasic.enpEstbDt, corpBasic.enpBsadr,
      corpBasic.enpIndyNm || "기타 서비스업", corpBasic.enpEntprScaleNm, corpBasic.crno, dartCode,
      desc, "-", "-", corpBasic.enpEntprScaleNm, "비상장", corpBasic.enpHpaddr || "-",
      corpBasic.enpIndyNm || "기타 서비스업", !!dartCode, "local", ntsData.tax_type, ntsData.tax_type_cd,
      ntsData.b_stt, ntsData.b_stt_cd, brandName
    ]);

    // 설립 타임라인 자동 삽입
    if (corpBasic.enpEstbDt) {
      await client.query(`
        INSERT INTO business_timeline (b_no, event_date, event_title, event_description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (b_no, event_date, event_title) DO NOTHING
      `, [cleanBNo, corpBasic.enpEstbDt, "법인 설립", `${corpBasic.corpNm} 설립 및 개업`]);
    }

    // 재무 히스토리 적재
    for (const h of finance) {
      await client.query(`
        INSERT INTO business_history (
          b_no, year, revenue, operating_income, net_income, total_assets, total_liabilities, total_equity, employees
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (b_no, year) DO UPDATE SET
          revenue = EXCLUDED.revenue,
          operating_income = EXCLUDED.operating_income,
          net_income = EXCLUDED.net_income,
          total_assets = EXCLUDED.total_assets,
          total_liabilities = EXCLUDED.total_liabilities,
          total_equity = EXCLUDED.total_equity
      `, [
        cleanBNo, h.year, h.revenue, h.operatingIncome, h.netIncome,
        h.totalAssets, h.totalLiabilities, h.totalEquity, 0
      ]);
    }

    await client.query("COMMIT");
    console.log("[Success] 마스터 레코드 및 재무 정보 DB 1차 인서트 완료!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[Rollback] 1차 인서트 실패:", err);
    client.release();
    process.exit(1);
  }

  // 3. 국민연금(NPS) 정보 수집 및 보정 시작
  console.log(`\n=== 3. 국민연금(NPS) 정보 동기화 시작 ===`);
  let npsInfo = null;
  try {
    npsInfo = await getNpsBplcInfo(cleanBNo, corpBasic.corpNm);
    if (npsInfo) {
      console.log(`[NPS 수집 성공] 가입자수: ${npsInfo.npsSbscrbNmps}명, 취득자수: +${npsInfo.newAcqsNmps}명, 상실자수: -${npsInfo.lossSbscrbNmps}명, 업종명: ${npsInfo.npsSector}`);
    } else {
      console.log("[NPS 수집 실패] 국민연금 가입 정보를 찾지 못했습니다.");
    }
  } catch (err) {
    console.error("NPS 수집 오류:", err);
  }

  // 4. 조달청 입찰 수집
  console.log(`\n=== 4. 조달청 낙찰정보 (최근 180일치) 동기화 시작 ===`);
  let bids = [];
  try {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 180);
    const formatDateString = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}${m}${day}0000`;
    };
    const bgnDt = formatDateString(past);
    const endDt = formatDateString(today);

    const fetchCategory = async (operation) => {
      const url = `https://apis.data.go.kr/1230000/as/ScsbidInfoService/${operation}?serviceKey=${DATA_PORTAL_SERVICE_KEY}&numOfRows=100&pageNo=1&inqryDiv=1&inqryBgnDt=${bgnDt}&inqryEndDt=${endDt}&type=json`;
      try {
        const response = await fetch(url);
        const text = await response.text();
        if (text.includes("Forbidden") || text.includes("token") || text.includes("LIMIT") || (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE"))) return [];
        const json = JSON.parse(text);
        const items = json?.response?.body?.items?.item || json?.response?.body?.items;
        if (items) return Array.isArray(items) ? items : [items];
      } catch (e) {
        console.warn(`[조달청 API 오류] ${operation} 수집/파싱 오류:`, e.message);
      }
      return [];
    };

    const [listServc, listThng, listConstc] = await Promise.all([
      fetchCategory("getScsbidListSttusServc"),
      fetchCategory("getScsbidListSttusThng"),
      fetchCategory("getScsbidListSttusCnstwk")
    ]);

    const combinedList = [...listServc, ...listThng, ...listConstc];
    const targetNmClean = corpBasic.corpNm.replace(/\(.*?\)/g, "").replace(/주식회사/g, "").replace(/\(주\)/g, "").replace(/\s+/g, "").toLowerCase();
    const filteredList = combinedList.filter((item) => {
      const itemBNo = (item.scsbidBprcoNo || "").replace(/[^0-9]/g, "");
      const itemNm = (item.scsbidBprcoNm || "").replace(/\s+/g, "").toLowerCase();
      return (cleanBNo && itemBNo === cleanBNo) || (targetNmClean && itemNm.includes(targetNmClean));
    });

    bids = filteredList.map((item) => {
      const dateStr = item.bidNtceDate || item.opengDate || "";
      const timeStr = item.bidNtceBgn || item.opengTm || "";
      return {
        bidNtceNo: item.bidNtceNo || "",
        bidNtceOrd: item.bidNtceOrd || "00",
        bidNtceNm: item.bidNtceNm || "",
        dminsttNm: item.dmndInsttNm || item.ntceInsttNm || "",
        opngDt: item.opengDate || "",
        bidNtceDt: dateStr && timeStr ? `${dateStr} ${timeStr}` : (dateStr || "-"),
        cntrctCnclMthdNm: item.cntrctCnclsMthdNm || "제한경쟁",
        presmptPrce: parseFloat(item.scsbidAmt || "0"),
        detailUrl: `https://www.g2b.go.kr:8081/ep/invitation/publishBidInvitationDetail.do?bidno=${item.bidNtceNo}&bidseq=${item.bidNtceOrd}`
      };
    });
    console.log(`[조달청 수집 성공] 낙찰 건수: ${bids.length}건`);
  } catch (err) {
    console.error("조달청 수집 오류:", err);
  }

  // 5. 특허 수집
  console.log(`\n=== 5. KIPRIS 특허 정보 동기화 시작 ===`);
  let patents = [];
  try {
    const searchCompanyNm = sanitizeCorpName(corpBasic.corpNm);
    const queryStr = `AP=[${searchCompanyNm}]`;
    const encodedName = encodeURIComponent(queryStr);
    const url = `http://plus.kipris.or.kr/kipo-api/kipi/patUtiModInfoSearchSevice/getWordSearch?word=${encodedName}&ServiceKey=${KIPRIS_ACCESS_KEY}&numOfRows=50&pageNo=1`;
    const response = await fetch(url);
    const text = await response.text();
    if (text.includes("<resultCode>") && !text.includes("<resultCode>00</resultCode>")) {
      console.warn("KIPRIS API 트래픽 한도 초과 또는 오류. 빈 배열 설정");
    } else {
      const allPatents = parsePatentXml(text);
      const targetCleanName = sanitizeCorpName(corpBasic.corpNm);
      const filteredPatents = allPatents.filter(item => {
        if (!item.applicantName) return false;
        return sanitizeCorpName(item.applicantName) === targetCleanName;
      });
      patents = filteredPatents.slice(0, 5);
      console.log(`[KIPRIS 수집 성공] 특허 건수: ${patents.length}건`);
    }
  } catch (err) {
    console.error("KIPRIS 수집 오류:", err);
  }

  // 6. DART 공시 수집
  console.log(`\n=== 6. DART 공시 정보 동기화 시작 ===`);
  let disclosures = [];
  let dartCode = DART_CODE_MAP[cleanBNo] || "";
  if (dartCode) {
    try {
      const today = new Date();
      const past = new Date();
      past.setFullYear(today.getFullYear() - 3); // 3년치
      const bgnDe = past.toISOString().slice(0, 10).replace(/-/g, "");
      const endDe = today.toISOString().slice(0, 10).replace(/-/g, "");

      const fetchDart = async (url) => {
        const response = await fetch(url);
        const json = await response.json();
        return json.list || [];
      };

      const normalUrl = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${DART_API_KEY}&corp_code=${dartCode}&bgn_de=${bgnDe}&end_de=${endDe}&page_no=1&page_count=20`;
      const keyUrl = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${DART_API_KEY}&corp_code=${dartCode}&bgn_de=${bgnDe}&end_de=${endDe}&pblntf_ty=A&page_no=1&page_count=10`;

      const [normalList, keyList] = await Promise.all([
        fetchDart(normalUrl),
        fetchDart(keyUrl)
      ]);

      const formattedNorm = normalList.map(item => {
        const rceptDtStr = item.rcept_dt || "";
        const formattedDt = rceptDtStr.length === 8 ? `${rceptDtStr.slice(0, 4)}-${rceptDtStr.slice(4, 6)}-${rceptDtStr.slice(6, 8)}` : rceptDtStr;
        return {
          rceptNo: item.rcept_no,
          corpCode: item.corp_code,
          reportNm: item.report_nm,
          flrNm: item.flr_nm,
          rceptDt: formattedDt,
          rm: item.rm,
          detailUrl: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcept_no}`,
          isKeyDisclosure: false
        };
      });

      const formattedKey = keyList.map(item => {
        const rceptDtStr = item.rcept_dt || "";
        const formattedDt = rceptDtStr.length === 8 ? `${rceptDtStr.slice(0, 4)}-${rceptDtStr.slice(4, 6)}-${rceptDtStr.slice(6, 8)}` : rceptDtStr;
        return {
          rceptNo: item.rcept_no,
          corpCode: item.corp_code,
          reportNm: item.report_nm,
          flrNm: item.flr_nm,
          rceptDt: formattedDt,
          rm: item.rm,
          detailUrl: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcept_no}`,
          isKeyDisclosure: true
        };
      });

      const combined = [...formattedNorm, ...formattedKey];
      const seen = new Set();
      disclosures = combined.filter(d => {
        if (seen.has(d.rceptNo)) return false;
        seen.add(d.rceptNo);
        return true;
      });
      console.log(`[DART 수집 성공] 공시 건수: ${disclosures.length}건`);
    } catch (err) {
      console.error("DART 수집 오류:", err);
    }
  }

  // 7. 최종 DB 적재
  console.log(`\n=== 7. Neon DB 최종 적재 시작 ===`);
  try {
    // 7.1. 입찰 DB 저장
    await client.query("DELETE FROM business_bids WHERE b_no = $1", [cleanBNo]);
    for (const b of bids) {
      await client.query(`
        INSERT INTO business_bids (
          b_no, bid_ntce_no, bid_ntce_ord, bid_ntce_nm, dminstt_nm,
          opng_dt, bid_ntce_dt, cntrct_cncl_mthd_nm, presmpt_prce, detail_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (bid_ntce_no, bid_ntce_ord) DO NOTHING
      `, [
        cleanBNo, b.bidNtceNo, b.bidNtceOrd, b.bidNtceNm, b.dminsttNm,
        b.opngDt, b.bidNtceDt, b.cntrctCnclMthdNm, b.presmptPrce, b.detailUrl
      ]);
    }

    // 7.2. 특허 DB 저장
    await client.query("DELETE FROM business_patents WHERE b_no = $1", [cleanBNo]);
    for (const p of patents) {
      await client.query(`
        INSERT INTO business_patents (
          b_no, application_number, application_date, invention_title,
          register_number, register_date, applicant_name, patent_status, detail_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (application_number) DO NOTHING
      `, [
        cleanBNo, p.applicationNumber, p.applicationDate, p.inventionTitle,
        p.registerNumber || null, p.registerDate || null, p.applicantName, p.patentStatus, p.detailUrl
      ]);
    }

    // 7.3. 공시 DB 저장
    await client.query("DELETE FROM business_disclosures WHERE b_no = $1", [cleanBNo]);
    for (const d of disclosures) {
      await client.query(`
        INSERT INTO business_disclosures (
          b_no, rcept_no, corp_code, report_nm, flr_nm, rcept_dt, rm, detail_url, is_key_disclosure
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (rcept_no) DO UPDATE SET
          b_no = EXCLUDED.b_no,
          corp_code = EXCLUDED.corp_code,
          report_nm = EXCLUDED.report_nm,
          flr_nm = EXCLUDED.flr_nm,
          rcept_dt = EXCLUDED.rcept_dt,
          rm = EXCLUDED.rm,
          detail_url = EXCLUDED.detail_url,
          is_key_disclosure = EXCLUDED.is_key_disclosure
      `, [
        cleanBNo, d.rceptNo, d.corpCode || null, d.reportNm, d.flrNm,
        d.rceptDt, d.rm || null, d.detailUrl, d.isKeyDisclosure
      ]);
    }

    // 7.4. businesses 마스터 테이블 최종 보정
    let finalSector = corpBasic.enpIndyNm || "기타 서비스업";
    let finalMainBiz = corpBasic.enpIndyNm || "기타 서비스업";
    let npsSbscrbNmps = 0;
    let newAcqsNmps = 0;
    let lossSbscrbNmps = 0;
    let npsLinked = false;
    let npsChrgAmt = 0;

    const uselessSectors = ["상장 법인", "상장법인", "대기업", "중소기업", "일반기업", "중견기업", "기타 서비스업", "기타서비스업", "미등록 업종", "미등록업종", "-", ""];

    if (npsInfo && npsInfo.npsSbscrbNmps > 0) {
      npsSbscrbNmps = npsInfo.npsSbscrbNmps;
      newAcqsNmps = npsInfo.newAcqsNmps || 0;
      lossSbscrbNmps = npsInfo.lossSbscrbNmps || 0;
      npsLinked = true;
      npsChrgAmt = npsInfo.npsChrgAmt || 0;

      if (npsInfo.npsSector && (!finalSector || uselessSectors.includes(finalSector))) {
        finalSector = npsInfo.npsSector;
        finalMainBiz = npsInfo.npsSector;
      }
    }

    await client.query(`
      UPDATE businesses 
      SET b_sector = $1,
          main_biz = $2,
          nps_sbscrb_nmps = $3,
          new_acqs_nmps = $4,
          loss_sbscrb_nmps = $5,
          nps_linked = $6,
          nps_chrg_amt = $7,
          bids_last_sync_at = CURRENT_TIMESTAMP,
          patents_last_sync_at = CURRENT_TIMESTAMP,
          dart_last_sync_at = CURRENT_TIMESTAMP,
          nps_last_sync_at = CURRENT_TIMESTAMP
      WHERE b_no = $8
    `, [
      finalSector, finalMainBiz, npsSbscrbNmps, newAcqsNmps, lossSbscrbNmps, npsLinked, npsChrgAmt, cleanBNo
    ]);

    // 최신 연도 종업원 수 보정
    if (npsSbscrbNmps > 0) {
      const histResult = await client.query(
        "SELECT year FROM business_history WHERE b_no = $1 ORDER BY year DESC LIMIT 1",
        [cleanBNo]
      );
      if (histResult.rows.length > 0) {
        const latestYear = histResult.rows[0].year;
        await client.query(
          "UPDATE business_history SET employees = $1 WHERE b_no = $2 AND year = $3",
          [npsSbscrbNmps, cleanBNo, latestYear]
        );
      }
    }

    console.log(`\n[최종 성공] 신규 기업 ${corpBasic.corpNm} (${cleanBNo}) 의 모든 수집 및 DB 적재 연동 성공!`);
  } catch (err) {
    console.error("최종 DB 적재 실패:", err);
  } finally {
    client.release();
  }
}

run().then(() => pool.end());
