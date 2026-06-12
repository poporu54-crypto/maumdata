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
  const url = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${serviceKey}`;
  console.log("Calling NTS URL:", url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        b_no: ['1221166249']
      })
    });
    const json = await res.json();
    console.log("NTS API Response:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
