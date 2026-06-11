const http = require('http');

http.get('http://localhost:3000/biz/1378651839', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Response status:", res.statusCode);
    
    // 1. 종업원 수 (국민연금) 영역에 12명이 표시되는지 검증
    const has12Employees = data.includes('12명');
    console.log("Has 12 employees count in HTML:", has12Employees);

    // 2. npsLinked에 따른 국민연금 연동 마크가 표시되는지 검증
    const hasNpsLinkedMark = data.includes('국민연금 연동');
    console.log("Has NPS linked badge in HTML:", hasNpsLinkedMark);
    
    // 관련 스니펫 출력
    const empIdx = data.indexOf('종업원 수 (국민연금)');
    if (empIdx !== -1) {
      console.log("\nEmployee Section HTML Snippet:");
      console.log(data.substring(empIdx - 100, empIdx + 500));
    }
  });
}).on('error', (err) => {
  console.error("Error fetching local server:", err);
});
