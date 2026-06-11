const http = require('http');

http.get('http://localhost:3000/biz/2208162517', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Response status:", res.statusCode);
    // 주요 연혁 및 기업 히스토리 부분이 있는지 확인
    const startIdx = data.indexOf('주요 연혁 및 기업 히스토리');
    if (startIdx === -1) {
      console.log("Could not find '주요 연혁 및 기업 히스토리' in response.");
      // 전체 본문 일부 출력
      console.log(data.substring(0, 1000));
      return;
    }
    console.log("Found '주요 연혁 및 기업 히스토리'!");
    // 그 주변의 HTML 추출 (약 4000글자)
    console.log(data.substring(startIdx, startIdx + 4000));
  });
}).on('error', (err) => {
  console.error("Error fetching local server:", err);
});
