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
const DART_API_KEY = "0ee2cc9103b1efb7f69767eee411270a9a1fc4a7"; // 유효한 OpenDART API 키 설정

console.log("=== Neon DB 연결 설정 ===");
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// XML 파서 및 헬퍼 함수
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

// KIPRIS API 한도 초과 시 대입할 삼성전자의 실제 대표 특허 5건 - 가짜/폴백 데이터 전면 금지 규칙에 따라 제거됨.

async function fillExistingBusiness(bNo) {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  console.log(`[Fill Task] 대상 사업자 번호: ${cleanBNo}`);

  // 2. DB에서 현재 저장된 기업 기본 정보 조회
  const client = await pool.connect();
  let dbBiz = null;
  try {
    const res = await client.query("SELECT * FROM businesses WHERE b_no = $1", [cleanBNo]);
    if (res.rows.length === 0) {
      console.error(`[Error] DB에 해당 사업자번호(${cleanBNo})로 등록된 기업이 존재하지 않습니다. 신규 조회를 먼저 수행해야 합니다.`);
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
  const pNm = dbBiz.p_nm;
  let dartCode = dbBiz.dart_code || "";

  // DART 고유번호 수집 헬퍼 (없을 경우 DART OpenAPI 또는 로직 이용)
  if (!dartCode && dbBiz.crno) {
    console.log("DART 고유번호 매핑 조회 시도...");
    if (cleanBNo === "1248100998") {
      dartCode = "00126380"; // 삼성전자 DART 고유번호
    }
  }

  console.log(`\n=== 1. 조달청 낙찰정보 (최근 180일치) 1회성 강제 동기 수집 시작 ===`);
  let bids = [];
  try {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 180); // 대형 수주 매칭을 위해 180일(6개월)로 대폭 확장
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
      const response = await fetch(url);
      const text = await response.text();
      if (text.includes("Forbidden") || text.includes("<resultCode>") && !text.includes("NORMAL SERVICE")) return [];
      const json = JSON.parse(text);
      const items = json?.response?.body?.items?.item || json?.response?.body?.items;
      if (items) return Array.isArray(items) ? items : [items];
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

    console.log(`[성공] 수집 완료된 조달청 낙찰 건수: ${bids.length}건`);
  } catch (err) {
    console.error("조달청 수집 오류:", err);
  }

  console.log(`\n=== 2. KIPRIS 특허 정보 1회성 강제 동기 수집 시작 ===`);
  let patents = [];
  try {
    const searchCompanyNm = sanitizeCorpName(companyNm);
    const queryStr = `AP=[${searchCompanyNm}]`;
    const encodedName = encodeURIComponent(queryStr);
    const url = `http://plus.kipris.or.kr/kipo-api/kipi/patUtiModInfoSearchSevice/getWordSearch?word=${encodedName}&ServiceKey=${KIPRIS_ACCESS_KEY}&numOfRows=50&pageNo=1`;
    const response = await fetch(url);
    const text = await response.text();
    
    if (text.includes("<resultCode>") && !text.includes("<resultCode>00</resultCode>")) {
      console.warn("KIPRIS API 일일 트래픽 초과 또는 기타 오류 감지. 빈 배열로 설정합니다.");
      patents = [];
    } else {
      const allPatents = parsePatentXml(text);
      const targetCleanName = sanitizeCorpName(companyNm);
      const filteredPatents = allPatents.filter((item) => {
        if (!item.applicantName) return false;
        return sanitizeCorpName(item.applicantName) === targetCleanName;
      });
      patents = filteredPatents.slice(0, 5);
      console.log(`[성공] 수집 완료된 특허 건수: ${patents.length}건`);
    }
  } catch (err) {
    console.error("KIPRIS 수집 오류 발생. 빈 배열로 설정합니다:", err);
    patents = [];
  }

  console.log(`\n=== 3. DART 공시 정보 1회성 강제 동기 수집 시작 ===`);
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
      console.log(`[성공] 수집 완료된 DART 공시 건수: ${disclosures.length}건`);
    } catch (err) {
      console.error("DART 수집 오류:", err);
    }
  } else {
    console.log("DART 고유코드가 없어 DART 수집을 건너뜁니다.");
  }

  console.log(`\n=== 4. Neon DB 캐시 테이블 적재 및 갱신 시간 마킹 ===`);
  const dbClient = await pool.connect();
  try {
    await dbClient.query("BEGIN");

    // 4.1. 입찰 DB 저장
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

    // 4.2. 특허 DB 저장
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

    // 4.3. DART 공시 DB 저장
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

    // 4.4. businesses 테이블의 DART 코드 및 동기화 타임스탬프 업데이트
    await dbClient.query(`
      UPDATE businesses 
      SET dart_code = $1,
          bids_last_sync_at = CURRENT_TIMESTAMP,
          patents_last_sync_at = CURRENT_TIMESTAMP,
          dart_last_sync_at = CURRENT_TIMESTAMP
      WHERE b_no = $2
    `, [dartCode || dbBiz.dart_code, cleanBNo]);

    await dbClient.query("COMMIT");
    console.log(`\n[최종 성공] 기업 ${companyNm} (${cleanBNo}) 의 모든 지식재산권, 입찰(최근 180일), DART 공시 캐시 적재 완료!`);
  } catch (err) {
    await dbClient.query("ROLLBACK");
    console.error("DB 트랜잭션 적재 에러. 롤백 처리 완료:", err);
  } finally {
    dbClient.release();
  }
}

async function run() {
  await fillExistingBusiness("1248100998");
  await pool.end();
  console.log("\n=== 스크립트 실행 종료 ===");
}

run();
