const fs = require('fs');
const path = require('path');

const SERVICE_KEY = (() => {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATA_PORTAL_SERVICE_KEY=([^\r\n]+)/);
    if (match) return match[1].trim();
  }
  return process.env.DATA_PORTAL_SERVICE_KEY || "";
})();

async function main() {
  const bizrNo = "2208110227";
  
  // 1. 기본 정보 조회
  const basicUrl = `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=1&resultType=json&bzno=${bizrNo}`;
  console.log("Fetching Basic Info:", basicUrl);
  const basicRes = await fetch(basicUrl);
  const basicText = await basicRes.text();
  console.log("Basic Info Response length:", basicText.length);

  // Parse crno if exists
  let crno = "";
  try {
    const json = JSON.parse(basicText);
    const item = json.response.body.items.item[0];
    crno = item.crno;
    console.log("Found CRNO:", crno);
    console.log("Corp Name:", item.corpNm);
  } catch (e) {
    console.error("Failed to parse basic info JSON", e);
  }

  if (crno) {
    // 2. 재무 정보 조회
    const financeUrl = `https://apis.data.go.kr/1160100/service/GetFinaStatInfoService_V2/getSummFinaStat_V2?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=50&resultType=json&crno=${crno}`;
    console.log("Fetching Finance Info:", financeUrl);
    const finRes = await fetch(financeUrl);
    const finText = await finRes.text();
    console.log("Finance Info Response length:", finText.length);
    try {
      const json = JSON.parse(finText);
      const items = json?.response?.body?.items?.item || [];
      console.log(`Finance records count: ${items.length}`);
      if (items.length > 0) {
        console.log("First finance record:", JSON.stringify(items[0], null, 2));
      }
    } catch (e) {
      console.error("Failed to parse finance info JSON", e);
    }
  }
}

main().catch(console.error);
