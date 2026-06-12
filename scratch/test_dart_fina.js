const https = require('https');

const DART_API_KEY = "0ee2cc9103b1efb7f69767eee411270a9a1fc4a7";

function getDartFinance(corpCode, year) {
  return new Promise((resolve) => {
    const url = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=11011`;
    https.get(url, (res) => {
      console.log(`[Status] ${res.statusCode} for ${corpCode}`);
      console.log(`[Headers]`, res.headers);
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
  const companies = {
    "Ediya": "00880128",
    "Twosome": "01331778",
    "Dongsuh": "00115995",
    "Nhause": "01494833",
    "Theborn": "00968607"
  };

  for (const [name, code] of Object.entries(companies)) {
    console.log(`\n=== Fetching ${name} (2024) ===`);
    const data = await getDartFinance(code, '2024');
    console.log("Raw output:", data);
  }
}

main();
