const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const DART_API_KEY = "0ee2cc9103b1efb7f69767eee411270a9a1fc4a7";

async function downloadAndInspect(rceptNo) {
  const url = `https://opendart.fss.or.kr/api/document.xml?crtfc_key=${DART_API_KEY}&rcept_no=${rceptNo}`;
  console.log(`\nDownloading document for RceptNo: ${rceptNo}...`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`HTTP error: ${res.statusText}`);
      return;
    }
    const buffer = await res.arrayBuffer();
    
    // Check if DART returned an error JSON instead of a zip file
    const textSample = Buffer.from(buffer.slice(0, 100)).toString('utf8');
    if (textSample.startsWith('{') || textSample.startsWith('[')) {
      console.log("Returned JSON (Probably error):", Buffer.from(buffer).toString('utf8'));
      return;
    }
    
    const zip = new AdmZip(Buffer.from(buffer));
    const zipEntries = zip.getEntries();
    
    console.log("Zip files:", zipEntries.map(e => e.entryName));
    
    // Read the main XML/HTML content
    for (const entry of zipEntries) {
      if (entry.entryName.endsWith('.xml') || entry.entryName.endsWith('.html') || entry.entryName.endsWith('.tx')) {
        const content = entry.getData().toString('utf8');
        console.log(`Inspecting ${entry.entryName} (Length: ${content.length})...`);
        
        // Find text surrounding "자산총계"
        searchKeywords(content);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function searchKeywords(html) {
  // strip HTML tags for simple text search
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  
  const keywords = ['자산총계', '부채총계', '자본총계', '유동자산', '비유동자산', '당기순이익', '매출액', '영업이익', '영업수익', '부채및자본총계', '부채 와 자본 총계', '부채와자본총계'];
  
  keywords.forEach(kw => {
    let index = 0;
    console.log(`\n-- Matches for [${kw}] --`);
    while ((index = text.indexOf(kw, index)) !== -1) {
      const snippet = text.substring(Math.max(0, index - 50), Math.min(text.length, index + 100));
      console.log(`... ${snippet} ...`);
      index += kw.length;
    }
  });
}

async function run() {
  // 2025.12 감사보고서
  await downloadAndInspect('20260414001540');
  // 2024.12 감사보고서
  await downloadAndInspect('20250411002758');
}

run();
