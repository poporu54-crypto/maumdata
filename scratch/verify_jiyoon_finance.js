const http = require('http');

http.get('http://localhost:3000/biz/1378651839', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Response status:", res.statusCode);
    
    // 1. 재무 테이블이 렌더링되는지 검증
    const hasFinanceTable = data.includes('📋 3개년 주요 재무 상태표 & 손익계산서 요약');
    console.log("Has Finance Table (should be true):", hasFinanceTable);

    // 2. 지윤의 실제 재무 수치들이 나오는지 검증 (예: 60억, 56억, 55억)
    const has60B = data.includes('60억');
    const has56B = data.includes('56억');
    const has55B = data.includes('55억');
    console.log("Has 60B revenue (2024):", has60B);
    console.log("Has 56B revenue (2023):", has56B);
    console.log("Has 55B revenue (2022):", has55B);

    // 3. 차트가 렌더링되고 있는지 검증 (renderDualChart 등)
    // (매출액 & 영업이익 추이가 차트 근처에 있는지 검사)
    const hasChartTitle = data.includes('연간 매출액 & 영업이익 추이');
    console.log("Has Revenue/Income Chart (should be true):", hasChartTitle);
  });
}).on('error', (err) => {
  console.error("Error fetching local server:", err);
});
