const http = require('http');

http.get('http://localhost:3000/biz/2208162517', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Response status:", res.statusCode);
    
    // 1. 상단 description 하단 영역 근처에서 버튼이 빠졌는지 검토
    // (상단 text 근처를 확인)
    const descIdx = data.indexOf('대한민국 최대의 인터넷 검색 포털 NAVER');
    if (descIdx !== -1) {
      const upperSnippet = data.substring(descIdx, descIdx + 1000);
      const hasUpperButton = upperSnippet.includes('이 기업 정보 수정 제안하기');
      console.log("Has Edit Request Button near upper description:", hasUpperButton);
    } else {
      console.log("Could not find description snippet.");
    }
    
    // 2. 최하단 연혁 카드 내부에서 버튼이 들어갔는지 검토
    const timelineIdx = data.indexOf('주요 연혁 및 기업 히스토리');
    if (timelineIdx !== -1) {
      const lowerSnippet = data.substring(timelineIdx, timelineIdx + 6000);
      const hasLowerButton = lowerSnippet.includes('이 기업 정보 수정 제안하기');
      console.log("Has Edit Request Button inside timeline card:", hasLowerButton);
      
      // 하단 스니펫 출력
      const buttonPos = lowerSnippet.indexOf('이 기업 정보 수정 제안하기');
      if (buttonPos !== -1) {
        console.log("Found lower button! Surrounding HTML:");
        console.log(lowerSnippet.substring(buttonPos - 200, buttonPos + 400));
      }
    } else {
      console.log("Could not find timeline section.");
    }
  });
}).on('error', (err) => {
  console.error("Error fetching local server:", err);
});
