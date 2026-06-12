const DART_API_KEY = "0ee2cc9103b1efb7f69767eee411270a9a1fc4a7";

async function getDartFinance(corpCode, year) {
  const url = `https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=11011&fs_div=OFS`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "application/json"
      }
    });
    if (!response.ok) return { error: `HTTP ${response.status}` };
    const json = await response.json();
    return json;
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  const code = "01022939"; // 화미 DART 고유번호
  console.log("=== Fetching Hwami via fnlttSinglAcntAll (2024) ===");
  const data = await getDartFinance(code, "2024");
  console.log("Status:", data.status);
  console.log("Message:", data.message);
  if (data.status === "000" && data.list) {
    console.log("List length:", data.list.length);
    console.log(data.list.slice(0, 5).map(item => ({
      sj_nm: item.sj_nm,
      account_nm: item.account_nm,
      amount: item.thstrm_amount
    })));
  } else {
    console.log("Raw Response:", JSON.stringify(data, null, 2));
  }
}

main();
