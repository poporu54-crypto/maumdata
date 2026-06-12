const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let serviceKey = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATA_PORTAL_SERVICE_KEY=')) {
    serviceKey = line.split('DATA_PORTAL_SERVICE_KEY=')[1].trim();
    serviceKey = serviceKey.replace(/^['"]|['"]$/g, '');
    break;
  }
}

async function run() {
  const crno = '1101110173180'; // 천일식품 법인등록번호
  
  // 1. 법인등록번호 기반으로 금융위 API 조회
  const url = `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2?serviceKey=${serviceKey}&pageNo=1&numOfRows=1&resultType=json&crno=${crno}`;
  console.log("Fetching by crno:", url);
  try {
    const res = await fetch(url);
    const json = await res.json();
    const items = json?.response?.body?.items?.item;
    if (items && items.length > 0) {
      console.log("CorpBasic Outline Result:", items[0]);
    } else {
      console.log("No items found. Response:", json);
    }
  } catch (err) {
    console.error("error:", err);
  }
}

run();
