const http = require('http');

http.get('http://localhost:3000/biz/1378651839', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Response status:", res.statusCode);
    
    // 1. DART 공시 표가 안 보이는지 검증 (is_audited가 false여야 함)
    const hasDartTable = data.includes('🏛️ 금융감독원 DART 실시간 공시 내역');
    console.log("Has DART disclosures table (should be false):", hasDartTable);

    // 2. 4번째 신용/평가 카드가 있고 내용이 올바르게 '-' 인지 검증
    const cardTitleIdx = data.indexOf('기업 신용 평가 및 시장 지표');
    if (cardTitleIdx !== -1) {
      console.log("Found credit rating card!");
      const snippet = data.substring(cardTitleIdx, cardTitleIdx + 1200);
      console.log("Jiyoon Credit Card Snippet:");
      console.log(snippet);
    } else {
      console.log("Could not find Credit rating card.");
    }
  });
}).on('error', (err) => {
  console.error("Error fetching local server:", err);
});
