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
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
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
  console.error("Please provide a business registration number. Example: node scratch/sync_biz_all.js 1208801280");
  process.exit(1);
}

const cleanBNo = bNoInput.replace(/[^0-9]/g, "");

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 주요 기업 DART 고유번호 하드코딩 맵
const DART_CODE_MAP = {
  "1248100998": "00126380", // 삼성전자
  "1208801280": "00955938", // 비바리퍼블리카 (토스)
};

// XML 파서 헬퍼 함수 (특허용)
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

function sanitizeCorpName(name) {
  return name
    .replace(/\(.*?\)/g, "")
    .replace(/주식회사/g, "")
    .replace(/\(주\)/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

async function searchNpsBplcList(queryName, targetBNo6, limit = 100) {
  const encodedName = encodeURIComponent(queryName);
  const searchUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2?serviceKey=${DATA_PORTAL_SERVICE_KEY}&pageNo=1&numOfRows=${limit}&dataType=json&wkplNm=${encodedName}`;

  try {
    const response = await fetch(searchUrl, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) return null;
    const text = await response.text();
    if (text.includes("Forbidden") || (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE"))) {
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

  // 3단계: 2단계 실패 시, 주식회사를 앞뒤로 붙여 검색 (예: "대상" -> "대상주식회사", "주식회사대상")
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
      fetch(detailUrl, {
        method: "GET",
        headers: { "Accept": "application/json" }
      }),
      fetch(periodUrl, {
        method: "GET",
        headers: { "Accept": "application/json" }
      }).catch(() => null)
    ]);

    if (!detailResponse.ok) return null;
    const detailText = await detailResponse.text();
    let detailJson = JSON.parse(detailText);

    const detailItem = detailJson?.response?.body?.items?.item;
    const targetDetail = Array.isArray(detailItem) ? detailItem[0] : detailItem;

    if (targetDetail) {
      const pepCnt = parseInt(targetDetail.jnngpCnt || targetDetail.npsSbscrbNmps || "0");
      
      let newAcqsNmps = 0;
      let lossSbscrbNmps = 0;

      if (periodResponse && periodResponse.ok) {
        try {
          const periodText = await periodResponse.text();
          if (periodText) {
            const periodJson = JSON.parse(periodText);
            const periodItem = periodJson?.response?.body?.items?.item;
            const targetPeriod = Array.isArray(periodItem) ? periodItem[0] : periodItem;
            if (targetPeriod) {
              newAcqsNmps = parseInt(targetPeriod.nwAcqzrCnt || "0", 10);
              lossSbscrbNmps = parseInt(targetPeriod.lssJnngpCnt || "0", 10);
            }
          }
        } catch (pe) {
          console.error("Failed to parse period info:", pe);
        }
      }

      return {
        wkplNm: targetDetail.wkplNm || matchedBplc.wkplNm || "",
        bzowrRgstNo: cleanBNo,
        npsSbscrbNmps: pepCnt,
        newAcqsNmps,
        lossSbscrbNmps,
      };
    }
    return null;
  } catch (error) {
    console.error("NPS Detail Error:", error);
    return null;
  }
}

async function run() {
  console.log(`=== [Sync Task] 대상 사업자 번호: ${cleanBNo} ===`);

  // 1. DB에서 현재 저장된 기업 기본 정보 조회
  const client = await pool.connect();
  let dbBiz = null;
  try {
    const res = await client.query("SELECT * FROM businesses WHERE b_no = $1", [cleanBNo]);
    if (res.rows.length === 0) {
      console.error(`[Error] DB에 해당 사업자번호(${cleanBNo})로 등록된 기업이 존재하지 않습니다.`);
      return;
    }
    dbBiz = res.rows[0];
    console.log(`[Success] DB에서 기업을 찾았습니다: ${dbBiz.b_nm} / 대표자: ${dbBiz.p_nm}`);
  } catch (e) {
    console.error("DB 조회 오류:", e);
    return;
  } finally {
    client.release();
  }

  const companyNm = dbBiz.b_nm;
  let dartCode = dbBiz.dart_code || DART_CODE_MAP[cleanBNo] || "";

  console.log(`\n=== 1. 국민연금(NPS) 정보 동기화 시작 ===`);
  let npsInfo = null;
  try {
    npsInfo = await getNpsBplcInfo(cleanBNo, companyNm);
    if (npsInfo) {
      console.log(`[NPS 수집 성공] 가입자수: ${npsInfo.npsSbscrbNmps}명, 취득자수: +${npsInfo.newAcqsNmps}명, 상실자수: -${npsInfo.lossSbscrbNmps}명`);
    } else {
      console.log("[NPS 수집 실패] 국민연금 가입 정보를 찾지 못했습니다.");
    }
  } catch (err) {
    console.error("NPS 수집 오류:", err);
  }

  console.log(`\n=== 2. 조달청 낙찰정보 (최근 180일치) 동기화 시작 ===`);
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
        if (text.includes("Forbidden") || text.includes("token") || text.includes("LIMIT") || (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE"))) {
          console.warn(`[조달청 API 경고] 오류 텍스트 감지: ${text.slice(0, 50)}`);
          return [];
        }
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
    const targetNmClean = companyNm.replace(/\(.*?\)/g, "").replace(/주식회사/g, "").replace(/\(주\)/g, "").replace(/\s+/g, "").toLowerCase();
    
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

  console.log(`\n=== 3. KIPRIS 특허 정보 동기화 시작 ===`);
  let patents = [];
  try {
    const searchCompanyNm = sanitizeCorpName(companyNm);
    const queryStr = `AP=[${searchCompanyNm}]`;
    const encodedName = encodeURIComponent(queryStr);
    const url = `http://plus.kipris.or.kr/kipo-api/kipi/patUtiModInfoSearchSevice/getWordSearch?word=${encodedName}&ServiceKey=${KIPRIS_ACCESS_KEY}&numOfRows=50&pageNo=1`;
    const response = await fetch(url);
    const text = await response.text();
    
    if (text.includes("<resultCode>") && !text.includes("<resultCode>00</resultCode>")) {
      console.warn("KIPRIS API 일일 트래픽 초과 또는 기타 오류 감지. 빈 배열로 설정합니다. (가짜 데이터 전면 금지 규칙 적용)");
      patents = [];
    } else {
      const allPatents = parsePatentXml(text);
      const targetCleanName = sanitizeCorpName(companyNm);
      const filteredPatents = allPatents.filter((item) => {
        if (!item.applicantName) return false;
        return sanitizeCorpName(item.applicantName) === targetCleanName;
      });
      patents = filteredPatents.slice(0, 5);
      console.log(`[KIPRIS 수집 성공] 특허 건수: ${patents.length}건`);
    }
  } catch (err) {
    console.error("KIPRIS 수집 오류 발생. 빈 배열로 처리합니다:", err);
    patents = [];
  }

  console.log(`\n=== 4. DART 공시 정보 동기화 시작 ===`);
  let disclosures = [];
  if (dartCode) {
    try {
      const today = new Date();
      const past = new Date();
      past.setFullYear(today.getFullYear() - 2); // 최근 2년
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
        const formattedDt = rceptDtStr.length === 8 
          ? `${rceptDtStr.slice(0, 4)}-${rceptDtStr.slice(4, 6)}-${rceptDtStr.slice(6, 8)}`
          : rceptDtStr;
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
        const formattedDt = rceptDtStr.length === 8 
          ? `${rceptDtStr.slice(0, 4)}-${rceptDtStr.slice(4, 6)}-${rceptDtStr.slice(6, 8)}`
          : rceptDtStr;
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
  } else {
    console.log("DART 고유코드가 없어 DART 수집을 건너뜁니다.");
  }

  console.log(`\n=== 5. Neon DB 캐시 테이블 적재 및 갱신 시간 마킹 ===`);
  const dbClient = await pool.connect();
  try {
    await dbClient.query("BEGIN");

    // 5.1. 입찰 DB 저장
    await dbClient.query("DELETE FROM business_bids WHERE b_no = $1", [cleanBNo]);
    for (const b of bids) {
      await dbClient.query(`
        INSERT INTO business_bids (
          b_no, bid_ntce_no, bid_ntce_ord, bid_ntce_nm, dminstt_nm,
          opng_dt, bid_ntce_dt, cntrct_cncl_mthd_nm, presmpt_prce, detail_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (bid_ntce_no, bid_ntce_ord) DO UPDATE SET
          b_no = EXCLUDED.b_no,
          bid_ntce_nm = EXCLUDED.bid_ntce_nm,
          dminstt_nm = EXCLUDED.dminstt_nm,
          opng_dt = EXCLUDED.opng_dt,
          bid_ntce_dt = EXCLUDED.bid_ntce_dt,
          cntrct_cncl_mthd_nm = EXCLUDED.cntrct_cncl_mthd_nm,
          presmpt_prce = EXCLUDED.presmpt_prce,
          detail_url = EXCLUDED.detail_url
      `, [
        cleanBNo, b.bidNtceNo, b.bidNtceOrd, b.bidNtceNm, b.dminsttNm,
        b.opngDt, b.bidNtceDt, b.cntrctCnclMthdNm, b.presmptPrce, b.detailUrl
      ]);
    }

    // 5.2. 특허 DB 저장
    await dbClient.query("DELETE FROM business_patents WHERE b_no = $1", [cleanBNo]);
    for (const p of patents) {
      await dbClient.query(`
        INSERT INTO business_patents (
          b_no, application_number, application_date, invention_title,
          register_number, register_date, applicant_name, patent_status, detail_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (application_number) DO UPDATE SET
          b_no = EXCLUDED.b_no,
          application_date = EXCLUDED.application_date,
          invention_title = EXCLUDED.invention_title,
          register_number = EXCLUDED.register_number,
          register_date = EXCLUDED.register_date,
          applicant_name = EXCLUDED.applicant_name,
          patent_status = EXCLUDED.patent_status,
          detail_url = EXCLUDED.detail_url
      `, [
        cleanBNo, p.applicationNumber, p.applicationDate, p.inventionTitle,
        p.registerNumber || null, p.registerDate || null, p.applicantName, p.patentStatus, p.detailUrl
      ]);
    }

    // 5.3. DART 공시 DB 저장
    await dbClient.query("DELETE FROM business_disclosures WHERE b_no = $1", [cleanBNo]);
    for (const d of disclosures) {
      await dbClient.query(`
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

    // 5.4. businesses 테이블의 국민연금 지표 및 DART 코드, 동기화 타임스탬프 업데이트
    if (npsInfo && npsInfo.npsSbscrbNmps > 0) {
      await dbClient.query(`
        UPDATE businesses 
        SET dart_code = $1,
            nps_sbscrb_nmps = $2,
            new_acqs_nmps = $3,
            loss_sbscrb_nmps = $4,
            nps_linked = true,
            bids_last_sync_at = CURRENT_TIMESTAMP,
            patents_last_sync_at = CURRENT_TIMESTAMP,
            dart_last_sync_at = CURRENT_TIMESTAMP,
            nps_last_sync_at = CURRENT_TIMESTAMP
        WHERE b_no = $5
      `, [
        dartCode || dbBiz.dart_code, 
        npsInfo.npsSbscrbNmps, 
        npsInfo.newAcqsNmps || 0, 
        npsInfo.lossSbscrbNmps || 0, 
        cleanBNo
      ]);

      // 5.5. business_history 테이블에서 가장 최신 연도의 employees 업데이트
      const histResult = await dbClient.query(
        "SELECT year FROM business_history WHERE b_no = $1 ORDER BY year DESC LIMIT 1",
        [cleanBNo]
      );
      if (histResult.rows.length > 0) {
        const latestYear = histResult.rows[0].year;
        await dbClient.query(
          "UPDATE business_history SET employees = $1 WHERE b_no = $2 AND year = $3",
          [npsInfo.npsSbscrbNmps, cleanBNo, latestYear]
        );
        console.log(`[History] 최신 연도(${latestYear})의 employees 값을 ${npsInfo.npsSbscrbNmps}명으로 업데이트 완료`);
      }
    } else {
      // 국민연금이 없어도 타임스탬프 등은 마킹
      await dbClient.query(`
        UPDATE businesses 
        SET dart_code = $1,
            bids_last_sync_at = CURRENT_TIMESTAMP,
            patents_last_sync_at = CURRENT_TIMESTAMP,
            dart_last_sync_at = CURRENT_TIMESTAMP
        WHERE b_no = $2
      `, [dartCode || dbBiz.dart_code, cleanBNo]);
    }

    await dbClient.query("COMMIT");
    console.log(`\n[최종 성공] 기업 ${companyNm} (${cleanBNo}) 의 모든 DB 캐시 적재 및 연동 완료!`);
  } catch (err) {
    await dbClient.query("ROLLBACK");
    console.error("DB 적재 에러. 롤백 완료:", err);
  } finally {
    dbClient.release();
  }
}

run().then(() => pool.end());
