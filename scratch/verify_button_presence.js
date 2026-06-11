const http = require('http');

http.get('http://localhost:3000/biz/2208162517', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Response status:", res.statusCode);
    
    // 1. 전체 HTML에서 '이 기업 정보 수정 제안하기' 텍스트 존재 검사
    const totalOccurrences = (data.match(/이 기업 정보 수정 제안하기/g) || []).length;
    console.log("Total occurrences of the button text in HTML:", totalOccurrences);
    
    // 2. 버튼이 존재하는 위치의 주변 HTML 확인
    let pos = -1;
    while ((pos = data.indexOf('이 기업 정보 수정 제안하기', pos + 1)) !== -1) {
      console.log(`\n--- Found button at position ${pos} ---`);
      console.log(data.substring(pos - 150, pos + 250));
    }
  });
}).on('error', (err) => {
  console.error("Error fetching local server:", err);
});
