const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const DART_API_KEY = "0ee2cc9103b1efb7f69767eee411270a9a1fc4a7";

async function run() {
  const url = `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${DART_API_KEY}`;
  console.log("Downloading DART corp codes ZIP...");
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch DART corp codes: ${res.statusText}`);
    }
    const buffer = await res.arrayBuffer();
    const zip = new AdmZip(Buffer.from(buffer));
    const zipEntries = zip.getEntries();
    
    console.log("Zip entries found:", zipEntries.map(e => e.entryName));
    
    const corpCodeEntry = zipEntries.find(e => e.entryName === 'CORPCODE.xml');
    if (!corpCodeEntry) {
      console.error("CORPCODE.xml not found in zip");
      return;
    }
    
    const xmlContent = corpCodeEntry.getData().toString('utf8');
    console.log("XML loaded, searching for '구글'...");
    
    // Simple regex parser for XML to avoid heavy XML parser dependency
    const listRegex = /<list>([\s\S]*?)<\/list>/g;
    let match;
    const googleCorps = [];
    
    while ((match = listRegex.exec(xmlContent)) !== null) {
      const block = match[1];
      const corpCode = block.match(/<corp_code>(.*?)<\/corp_code>/)?.[1] || "";
      const corpName = block.match(/<corp_name>(.*?)<\/corp_name>/)?.[1] || "";
      const stockCode = block.match(/<stock_code>(.*?)<\/stock_code>/)?.[1] || "";
      const modifyDate = block.match(/<modify_date>(.*?)<\/modify_date>/)?.[1] || "";
      
      if (corpName.includes("구글") || corpName.toLowerCase().includes("google")) {
        googleCorps.push({ corpCode, corpName, stockCode, modifyDate });
      }
    }
    
    console.log("Matches found:", googleCorps);
  } catch (err) {
    console.error(err);
  }
}

run();
