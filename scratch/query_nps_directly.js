const fs = require('fs');
const path = require('path');

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

const SERVICE_KEY = process.env.DATA_PORTAL_SERVICE_KEY;
if (!SERVICE_KEY) {
  console.error("DATA_PORTAL_SERVICE_KEY is not set.");
  process.exit(1);
}

async function run() {
  const encodedName = encodeURIComponent("삼성전자");
  const searchUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=10&dataType=json&wkplNm=${encodedName}`;

  try {
    const response = await fetch(searchUrl);
    const json = await response.json();
    console.log("=== Bass Info Search ===");
    const items = json?.response?.body?.items?.item;
    const list = Array.isArray(items) ? items : [items];
    
    // 삼성전자(124-81-00998)이므로 앞 6자리는 124810
    const matched = list.filter(item => (item.bzowrRgstNo || "").replace(/[^0-9]/g, "").startsWith("124810"));
    console.log(JSON.stringify(matched, null, 2));

    if (matched.length > 0) {
      const seq = matched[0].seq;
      const detailUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getDetailInfoSearchV2?serviceKey=${SERVICE_KEY}&dataType=json&seq=${seq}`;
      const detailRes = await fetch(detailUrl);
      const detailJson = await detailRes.json();
      console.log("=== Detail Info ===");
      console.log(JSON.stringify(detailJson?.response?.body?.items?.item, null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}

run();
