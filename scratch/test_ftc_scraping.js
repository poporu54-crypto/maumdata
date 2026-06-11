process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const wrkr_no = "7295000974";
const url = `http://www.ftc.go.kr/bizCommPop.do?wrkr_no=${wrkr_no}`;

fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  }
})
  .then(res => res.text())
  .then(html => {
    console.log("=== HTML CONTENT ===");
    console.log(html);
    console.log("====================");
  })
  .catch(err => console.error("Error:", err));
