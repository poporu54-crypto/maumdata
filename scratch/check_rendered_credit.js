const http = require('http');

http.get('http://localhost:3000/biz/2208162517', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Response status:", res.statusCode);
    const hasCreditCard = data.includes('기업 신용 평가 및 시장 지표');
    console.log("Has credit rating card:", hasCreditCard);
    
    // 네이버 신용 등급 등 표시되는지 확인
    const ratingIdx = data.indexOf('기업 신용 평가 및 시장 지표');
    if (ratingIdx !== -1) {
      console.log("Credit rating card details snippet:");
      console.log(data.substring(ratingIdx, ratingIdx + 1500));
    }
  });
}).on('error', (err) => {
  console.error("Error fetching local server:", err);
});
