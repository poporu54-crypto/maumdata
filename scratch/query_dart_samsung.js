const fs = require('fs');
const path = require('path');

const DART_API_KEY = "0ee2cc9103b1efb7f69767eee411270a9a1fc4a7";
const corpCode = "00126380"; // 삼성전자 corp_code

async function run() {
  const url = `https://opendart.fss.or.kr/api/company.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log("=== Samsung Electronics DART API Result ===");
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
