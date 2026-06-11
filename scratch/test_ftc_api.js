const SERVICE_KEY = process.env.DATA_PORTAL_SERVICE_KEY || "";
const brno = "1221166249";
const url = `https://apis.data.go.kr/1130000/MllBsDtl_3Service/getMllBsInfoDetail_3?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=1&resultType=json&brno=${brno}`;

fetch(url)
  .then(res => res.text())
  .then(text => {
    console.log("Raw Response:", text);
    try {
      const json = JSON.parse(text);
      console.log("Parsed JSON:", JSON.stringify(json, null, 2));
    } catch(e) {
      console.log("Not a JSON response");
    }
  })
  .catch(err => console.error("Error:", err));
