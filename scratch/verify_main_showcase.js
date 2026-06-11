const http = require('http');

http.get('http://localhost:3000/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Response status:", res.statusCode);
    
    // 4번째 카드 텍스트가 노출되는지 검증
    const hasEmploymentCard = data.includes('실시간 고용 트렌드 분석');
    console.log("Has Employment Trend Analysis card on main page:", hasEmploymentCard);
    
    // 관련 HTML 스니펫 출력
    const cardIdx = data.indexOf('실시간 고용 트렌드 분석');
    if (cardIdx !== -1) {
      console.log("\nEmployment Card Snippet:");
      console.log(data.substring(cardIdx - 100, cardIdx + 600));
    }
  });
}).on('error', (err) => {
  console.error("Error fetching local server:", err);
});
