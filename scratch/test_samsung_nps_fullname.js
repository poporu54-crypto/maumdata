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

const API_URL = "http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2";

async function testQuery(companyName, rowsCount) {
  const bNo = "1248100998";
  const encodedName = encodeURIComponent(companyName);
  const searchUrl = `${API_URL}?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=${rowsCount}&dataType=json&wkplNm=${encodedName}`;

  console.log(`\n--- Querying [${companyName}] with numOfRows [${rowsCount}] ---`);
  const res = await fetch(searchUrl);
  const text = await res.text();

  try {
    const json = JSON.parse(text);
    const items = json?.response?.body?.items?.item || [];
    console.log(`Found ${items.length} items`);
    
    const targetBNo6 = bNo.substring(0, 6);
    const matchedItems = items.filter(item => {
      const apiBNo = (item.bzowrRgstNo || "").replace(/[^0-9]/g, "");
      return apiBNo.startsWith(targetBNo6);
    });

    console.log(`Matched with ${targetBNo6} count: ${matchedItems.length}`);
    matchedItems.forEach(item => {
      console.log(`-> MATCHED! Name: ${item.wkplNm}, RegNo: ${item.bzowrRgstNo}, seq: ${item.seq}`);
    });
  } catch (e) {
    console.error("Parse error:", e);
  }
}

async function main() {
  // 1. 기존 방식 ("삼성전자", 50개)
  await testQuery("삼성전자", 50);

  // 2. numOfRows 확장 방식 ("삼성전자", 250개)
  await testQuery("삼성전자", 250);

  // 3. 정식명칭 검색 방식 ("삼성전자주식회사", 100개)
  await testQuery("삼성전자주식회사", 100);

  // 4. 정식명칭 검색 방식 ("삼성전자(주)", 100개)
  await testQuery("삼성전자(주)", 100);
}

main().catch(console.error);
