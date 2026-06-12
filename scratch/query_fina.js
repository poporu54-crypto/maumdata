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
  const crno = '1101140047545';
  const url = `https://apis.data.go.kr/1160100/service/GetFinaStatInfoService_V2/getSummFinaStat_V2?serviceKey=${serviceKey}&pageNo=1&numOfRows=50&resultType=json&crno=${crno}`;
  
  console.log("Fetching url:", url);
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log("Raw Response length:", text.length);
    try {
      const json = JSON.parse(text);
      const items = json?.response?.body?.items?.item;
      if (items) {
        const list = Array.isArray(items) ? items : [items];
        console.log("Years available:");
        list.forEach(item => {
          console.log(`Year: ${item.bizYear || item.bsnsYear}, code: ${item.fnclDcd}, saleAmt: ${item.enpSaleAmt}`);
        });
      } else {
        console.log("No items found. Response:", text);
      }
    } catch (e) {
      console.log("Failed to parse JSON. Raw:", text.substring(0, 1000));
    }
  } catch (err) {
    console.error(err);
  }
}

run();
