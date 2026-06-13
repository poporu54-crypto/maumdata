const KIPRIS_ACCESS_KEY = "EyFMzVLEy1Ec8PzYgRZyzuthhGSFeImiNYG5DvVahKo=";

async function testKipris() {
  const queryStr = "AP=[코스텍시스]";
  const encodedName = encodeURIComponent(queryStr);
  const url = `http://plus.kipris.or.kr/kipo-api/kipi/patUtiModInfoSearchSevice/getWordSearch?word=${encodedName}&ServiceKey=${KIPRIS_ACCESS_KEY}&numOfRows=5&pageNo=1`;
  
  console.log("Request URL:", url);
  try {
    const response = await fetch(url);
    const text = await response.text();
    console.log("=== Response Status ===");
    console.log(response.status);
    console.log("=== Response Headers ===");
    console.log(response.headers);
    console.log("=== Response Body ===");
    console.log(text.slice(0, 1000));
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}

testKipris();
