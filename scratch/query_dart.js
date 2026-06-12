const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let dartKey = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DART_API_KEY=')) {
    dartKey = line.split('DART_API_KEY=')[1].trim();
    dartKey = dartKey.replace(/^['"]|['"]$/g, '');
    break;
  }
}

async function run() {
  const corpCode = '00301477'; // 면사랑 DART 고유번호
  // 최근 2년간의 공시 리스트 조회 (감사보고서 등)
  const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${dartKey}&corp_code=${corpCode}&bgn_de=20250101&end_de=20260612&page_no=1&page_count=30`;
  
  console.log("Fetching DART url:", url);
  try {
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text);
    if (json.list) {
      console.log("DART Disclosures:");
      json.list.forEach(item => {
        console.log(`Report: ${item.report_nm}, Date: ${item.rcept_dt}, Flr: ${item.flr_nm}`);
      });
    } else {
      console.log("No disclosures found in DART. Response:", json);
    }
  } catch (err) {
    console.error(err);
  }
}

run();
