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

const { getNpsBplcInfo } = require('../src/lib/npsApi');

async function run() {
  try {
    const res = await getNpsBplcInfo('1248100998', '삼성전자(주)');
    console.log("=== Samsung Electronics NPS API Result ===");
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("NPS API error:", err);
  }
}

run();
