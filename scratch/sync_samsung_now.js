const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_GXePATLY0EC4@ep-misty-shape-aqrex525-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=verify-full",
  ssl: {
    rejectUnauthorized: false,
  },
});

const SERVICE_KEY = "f36b1b2ca7c1dc5648a1b0d8eb1fff41a6b22f58a653cd7f8895c33cb72c931b";
const API_URL = "http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2";

async function searchNpsBplcList(queryName, targetBNo6, limit = 100) {
  const encodedName = encodeURIComponent(queryName);
  const searchUrl = `${API_URL}?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=${limit}&dataType=json&wkplNm=${encodedName}`;

  try {
    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) return null;
    const text = await response.text();
    if (text.includes("Forbidden") || (text.includes("<resultCode>") && !text.includes("NORMAL SERVICE"))) {
      return null;
    }

    let json = JSON.parse(text);
    const items = json?.response?.body?.items?.item;
    if (!items) return null;

    const list = Array.isArray(items) ? items : [items];
    const matchedList = list.filter((item) => {
      const apiBNo = (item.bzowrRgstNo || "").replace(/[^0-9]/g, "");
      return apiBNo.startsWith(targetBNo6);
    });

    if (matchedList.length === 0) return null;

    const noiseKeywords = ["일용", "현장", "공사", "납품", "용역", "/", "-"];
    const pureMatches = matchedList.filter((item) => {
      const name = item.wkplNm || "";
      return !noiseKeywords.some(kw => name.includes(kw));
    });

    if (pureMatches.length > 0) {
      pureMatches.sort((a, b) => (a.wkplNm || "").length - (b.wkplNm || "").length);
      return pureMatches[0];
    }

    matchedList.sort((a, b) => (a.wkplNm || "").length - (b.wkplNm || "").length);
    return matchedList[0];
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function getNpsBplcInfo(bzowrRgstNo, companyNm) {
  const cleanBNo = bzowrRgstNo.replace(/[^0-9]/g, "");
  if (cleanBNo.length !== 10 || !companyNm) return null;

  const targetBNo6 = cleanBNo.substring(0, 6);
  let matchedBplc = await searchNpsBplcList(companyNm, targetBNo6, 100);

  if (!matchedBplc) {
    const cleanCompanyNm = companyNm
      .replace(/\(.*?\)/g, "")
      .replace(/주식회사/g, "")
      .replace(/\(주\)/g, "")
      .trim();
    if (cleanCompanyNm && cleanCompanyNm !== companyNm) {
      matchedBplc = await searchNpsBplcList(cleanCompanyNm, targetBNo6, 100);
    }
  }

  if (!matchedBplc || !matchedBplc.seq) return null;
 
  const seq = matchedBplc.seq;
  const detailUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getDetailInfoSearchV2?serviceKey=${SERVICE_KEY}&dataType=json&seq=${seq}`;
  const periodUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getPdAcctoSttusInfoSearchV2?serviceKey=${SERVICE_KEY}&dataType=json&seq=${seq}`;
 
  try {
    const [detailResponse, periodResponse] = await Promise.all([
      fetch(detailUrl, {
        method: "GET",
        headers: { "Accept": "application/json" },
      }),
      fetch(periodUrl, {
        method: "GET",
        headers: { "Accept": "application/json" },
      }).catch(() => null)
    ]);
 
    if (!detailResponse.ok) return null;
    const detailText = await detailResponse.text();
    let detailJson = JSON.parse(detailText);
 
    const detailItem = detailJson?.response?.body?.items?.item;
    const targetDetail = Array.isArray(detailItem) ? detailItem[0] : detailItem;
 
    if (targetDetail) {
      const pepCnt = parseInt(targetDetail.jnngpCnt || targetDetail.npsSbscrbNmps || "0");
      
      let newAcqsNmps = 0;
      let lossSbscrbNmps = 0;

      if (periodResponse && periodResponse.ok) {
        try {
          const periodText = await periodResponse.text();
          if (periodText) {
            const periodJson = JSON.parse(periodText);
            const periodItem = periodJson?.response?.body?.items?.item;
            const targetPeriod = Array.isArray(periodItem) ? periodItem[0] : periodItem;
            if (targetPeriod) {
              newAcqsNmps = parseInt(targetPeriod.nwAcqzrCnt || "0", 10);
              lossSbscrbNmps = parseInt(targetPeriod.lssJnngpCnt || "0", 10);
            }
          }
        } catch (pe) {
          console.error("Failed to parse period info:", pe);
        }
      }

      return {
        wkplNm: targetDetail.wkplNm || matchedBplc.wkplNm || "",
        bzowrRgstNo: cleanBNo,
        npsSbscrbNmps: pepCnt,
        newAcqsNmps,
        lossSbscrbNmps,
      };
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}
 
async function sync() {
  const bNo = "1248100998";
  const bNm = "삼성전자(주)";
  console.log(`Syncing NPS for ${bNm} (${bNo})...`);
  
  try {
    const npsInfo = await getNpsBplcInfo(bNo, bNm);
    if (npsInfo && npsInfo.npsSbscrbNmps > 0) {
      // businesses 테이블 업데이트
      await pool.query(
        `UPDATE businesses 
         SET nps_sbscrb_nmps = $1, 
             new_acqs_nmps = $2, 
             loss_sbscrb_nmps = $3, 
             nps_linked = true,
             nps_last_sync_at = CURRENT_TIMESTAMP 
         WHERE b_no = $4`,
        [npsInfo.npsSbscrbNmps, npsInfo.newAcqsNmps || 0, npsInfo.lossSbscrbNmps || 0, bNo]
      );
      
      // business_history 테이블에서 가장 최신 연도의 employees 업데이트
      const histResult = await pool.query(
        "SELECT year FROM business_history WHERE b_no = $1 ORDER BY year DESC LIMIT 1",
        [bNo]
      );
      if (histResult.rows.length > 0) {
        const latestYear = histResult.rows[0].year;
        await pool.query(
          "UPDATE business_history SET employees = $1 WHERE b_no = $2 AND year = $3",
          [npsInfo.npsSbscrbNmps, bNo, latestYear]
        );
        console.log(`Updated history employees to ${npsInfo.npsSbscrbNmps} for year ${latestYear}`);
      }
      
      console.log(`Successfully synced Samsung Electronics NPS: ${npsInfo.npsSbscrbNmps} employees, +${npsInfo.newAcqsNmps} acquired, -${npsInfo.lossSbscrbNmps} lost`);
    } else {
      console.log("Failed to fetch NPS info for Samsung");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
    process.exit();
  }
}
 
sync();
