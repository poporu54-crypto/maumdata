const fs = require('fs');
const path = require('path');

// .env.local 파일에서 환경변수 로드
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length === 2) {
        process.env[parts[0].trim()] = parts[1].trim();
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env.local", e);
}

const SERVICE_KEY = process.env.DATA_PORTAL_SERVICE_KEY || "";
const API_URL_BASE = "https://apis.data.go.kr/1230000/as/ScsbidInfoService";

async function testPPS() {
  console.log("=== 조달청 나라장터 낙찰정보 API 테스트 ===");
  console.log("Service Key:", SERVICE_KEY);

  const today = new Date();
  const past = new Date();
  past.setDate(today.getDate() - 30); // 테스트 목적으로 범위를 30일로 늘림

  const formatDateString = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}0000`;
  };

  const bgnDt = formatDateString(past);
  const endDt = formatDateString(today);

  console.log(`조회 기간: ${bgnDt} ~ ${endDt}`);

  const operations = [
    "getScsbidListSttusServc", 
    "getScsbidListSttusThng", 
    "getScsbidListSttusCnstwk"
  ];

  for (const op of operations) {
    const url = `${API_URL_BASE}/${op}?serviceKey=${SERVICE_KEY}&numOfRows=10&pageNo=1&inqryDiv=1&inqryBgnDt=${bgnDt}&inqryEndDt=${endDt}&type=json`;
    console.log(`\n호출 API [${op}]: ${url.slice(0, 150)}...`);

    try {
      const response = await fetch(url);
      console.log(`HTTP Status: ${response.status}`);
      const text = await response.text();
      
      if (text.includes("Forbidden") || text.includes("SERVICE_KEY_IS_NOT_REGISTERED_ERROR") || text.includes("LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR")) {
        console.warn(`[에러 감지] API 권한 에러 또는 차단 상태입니다.`);
        console.log("응답 내용:", text.slice(0, 300));
      } else {
        try {
          const json = JSON.parse(text);
          const totalCount = json?.response?.body?.totalCount;
          console.log(`[성공] 데이터 수집 성공! 총 개수 (totalCount): ${totalCount}`);
          const items = json?.response?.body?.items?.item || [];
          const itemArr = Array.isArray(items) ? items : [items];
          console.log(`반환된 샘플 데이터 개수: ${itemArr.length}`);
          if (itemArr.length > 0 && itemArr[0]) {
            console.log("첫번째 샘플 낙찰업체 사업자번호:", itemArr[0].scsbidBprcoNo);
            console.log("첫번째 샘플 낙찰업체명:", itemArr[0].scsbidBprcoNm);
            console.log("첫번째 샘플 낙찰금액:", itemArr[0].scsbidAmt);
          }
        } catch (parseErr) {
          console.log("JSON 파싱 에러. 응답 원본 일부:", text.slice(0, 300));
        }
      }
    } catch (fetchErr) {
      console.error("호출 실패:", fetchErr.message);
    }
  }
}

testPPS();
