const https = require('https');
const fs = require('fs');
const path = require('path');

// load env
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let DATA_PORTAL_SERVICE_KEY = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATA_PORTAL_SERVICE_KEY=')) {
    DATA_PORTAL_SERVICE_KEY = line.split('DATA_PORTAL_SERVICE_KEY=')[1].trim();
    DATA_PORTAL_SERVICE_KEY = DATA_PORTAL_SERVICE_KEY.replace(/^['"]|['"]$/g, '');
    break;
  }
}

function getCorpFinance(crno) {
  return new Promise((resolve) => {
    const url = `https://apis.data.go.kr/1160100/service/GetFinaStatInfoService_V2/getSummFinaStat_V2?serviceKey=${encodeURIComponent(DATA_PORTAL_SERVICE_KEY)}&pageNo=1&numOfRows=50&resultType=json&crno=${crno}`;
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          resolve({ error: e.message, body });
        }
      });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function main() {
  const ediya = await getCorpFinance('1101112487753');
  const twosome = await getCorpFinance('1101116648062');
  const dongsuh = await getCorpFinance('1201110000464');
  
  console.log("=== Ediya Finance Raw ===");
  console.log(JSON.stringify(ediya, null, 2));
  console.log("\n=== Twosome Finance Raw ===");
  console.log(JSON.stringify(twosome, null, 2));
  console.log("\n=== Dongsuh Finance Raw ===");
  console.log(JSON.stringify(dongsuh, null, 2));
}

main();
