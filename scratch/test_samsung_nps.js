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

async function main() {
  const bNo = "1248100998";
  const companyNm = "삼성전자(주)";

  const cleanCompanyNm = companyNm
    .replace(/\(.*?\)/g, "")
    .replace(/주식회사/g, "")
    .replace(/ּȸ/g, "")
    .replace(/\(주\)/g, "")
    .trim();

  const encodedName = encodeURIComponent(cleanCompanyNm);
  const searchUrl = `${API_URL}?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=50&dataType=json&wkplNm=${encodedName}`;

  console.log("Fetching NPS list via url:", searchUrl);
  const res = await fetch(searchUrl);
  const text = await res.text();
  console.log("NPS Response length:", text.length);

  try {
    const json = JSON.parse(text);
    const items = json?.response?.body?.items?.item || [];
    console.log(`Found ${items.length} items for company name: ${cleanCompanyNm}`);
    
    // Matched items details
    const targetBNo6 = bNo.substring(0, 6);
    console.log(`Targeting startsWith bzowrRgstNo: ${targetBNo6}`);
    
    items.forEach((item, index) => {
      const apiBNo = (item.bzowrRgstNo || "").replace(/[^0-9]/g, "");
      const isMatch = apiBNo.startsWith(targetBNo6);
      console.log(`[${index}] Name: ${item.wkplNm}, RegNo: ${item.bzowrRgstNo} (Cleaned: ${apiBNo}), matched: ${isMatch}, seq: ${item.seq}`);
    });
  } catch (e) {
    console.error("Parse error:", e);
    console.log("Raw Response:", text);
  }
}

main().catch(console.error);
