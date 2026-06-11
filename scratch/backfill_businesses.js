const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 1. 환경 변수 추출
const connectionString = (() => {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/POSTGRES_URL=([^\r\n]+)/) || envContent.match(/DATABASE_URL=([^\r\n]+)/);
    if (match) return match[1].trim();
  }
  return process.env.POSTGRES_URL || process.env.DATABASE_URL;
})();

const DATA_PORTAL_SERVICE_KEY = (() => {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATA_PORTAL_SERVICE_KEY=([^\r\n]+)/);
    if (match) return match[1].trim();
  }
  return process.env.DATA_PORTAL_SERVICE_KEY || "f36b1b2ca7c1dc5648a1b0d8eb1fff41a6b22f58a653cd7f8895c33cb72c931b";
})();

if (!connectionString) {
  console.error("Error: DATABASE_URL or POSTGRES_URL is missing.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// 타임아웃 가드가 내장된 Fetch 함수
async function fetchWithTimeout(url, options = {}) {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => {
    controller.abort();
  }, timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// 외부 API 호출 헬퍼 정의
async function getCorpBasicOutline(bNo) {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  const url = `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2?serviceKey=${DATA_PORTAL_SERVICE_KEY}&pageNo=1&numOfRows=1&resultType=json&bizrNo=${cleanBNo}`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const text = await res.text();
    if (text.includes("Forbidden") || !text.includes("NORMAL SERVICE")) return null;
    const json = JSON.parse(text);
    const items = json?.response?.body?.items?.item;
    if (items && items.length > 0) return items[0];
  } catch (e) {
    console.error(`getCorpBasicOutline timeout or error for ${bNo}`);
  }
  return null;
}

async function getFtcMailOrderInfo(bNo) {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  const url = `https://apis.data.go.kr/1130000/MllBsDtl_3Service/getMllBsInfoDetail_3?serviceKey=${DATA_PORTAL_SERVICE_KEY}&pageNo=1&numOfRows=1&resultType=json&brno=${cleanBNo}`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const text = await res.text();
    if (text.includes("Forbidden") || !text.includes("NORMAL SERVICE")) return null;
    const json = JSON.parse(text);
    const items = json?.response?.body?.items?.item;
    if (items && items.length > 0) {
      const item = items[0];
      return {
        brno: item.brno || cleanBNo,
        cmpNm: item.bzmnNm || "",
        rprsNm: item.rprsvNm || "",
        repAddr: item.lctnAddr || item.lctnRnAddr || "",
        rcptDt: item.dclrDate || "",
        opStateNm: item.operSttusCdNm || item.bzmnRgsSttusSeNm || "정상영업",
        telNo: item.telno && item.telno !== "N/A" ? item.telno : "",
        zipCd: item.lctnRnOzip && item.lctnRnOzip !== "N/A" ? item.lctnRnOzip : "",
        wbsitAddr: item.domnCn && item.domnCn !== "N/A" ? item.domnCn : "",
        mailOrderNo: item.prmmiMnno && item.prmmiMnno !== "N/A" ? item.prmmiMnno : "",
        declareOrg: item.dclrInstNm && item.dclrInstNm !== "N/A" ? item.dclrInstNm : "",
        goodsType: item.trtmntPrdlstNm && item.trtmntPrdlstNm !== "N/A" ? item.trtmntPrdlstNm : "",
        sellType: item.ntslMthdNm && item.ntslMthdNm !== "N/A" ? item.ntslMthdNm : "",
        closeDate: item.clsbizDate && item.clsbizDate !== "N/A" ? item.clsbizDate : "",
        repEmail: item.rprsvEmladr && item.rprsvEmladr !== "N/A" ? item.rprsvEmladr : "",
      };
    }
  } catch (e) {
    console.error(`getFtcMailOrderInfo timeout or error for ${bNo}`);
  }
  return null;
}

async function getNpsEmployees(bNo, companyNm) {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  const cleanCompanyNm = companyNm
    .replace(/\(.*?\)/g, "")
    .replace(/주식회사/g, "")
    .replace(/\(주\)/g, "")
    .trim();

  if (cleanBNo.length !== 10 || !cleanCompanyNm) return null;

  const encodedName = encodeURIComponent(cleanCompanyNm);
  const searchUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2?serviceKey=${DATA_PORTAL_SERVICE_KEY}&pageNo=1&numOfRows=50&dataType=json&wkplNm=${encodedName}`;

  try {
    const response = await fetchWithTimeout(searchUrl);
    if (!response.ok) return null;
    const text = await response.text();
    if (text.includes("Forbidden") || !text.includes("NORMAL SERVICE")) return null;

    const json = JSON.parse(text);
    const items = json?.response?.body?.items?.item;
    if (!items) return null;

    const list = Array.isArray(items) ? items : [items];
    const targetBNo6 = cleanBNo.substring(0, 6);
    const targetBNo5 = cleanBNo.substring(0, 5);

    let matched = list.find((item) => {
      const normTarget = cleanCompanyNm.replace(/\s+/g, "").toLowerCase();
      const normApiName = (item.wkplNm || "")
        .replace(/\(.*?\)/g, "")
        .replace(/주식회사/g, "")
        .replace(/\(주\)/g, "")
        .replace(/（주）/g, "")
        .replace(/\s+/g, "")
        .toLowerCase();
      return normApiName === normTarget;
    });

    if (!matched) {
      matched = list.find((item) => {
        const apiBNo = (item.bzowrRgstNo || "").replace(/[^0-9]/g, "");
        return apiBNo.length >= 6 && apiBNo.startsWith(targetBNo6);
      });
    }

    if (!matched) {
      matched = list.find((item) => {
        const apiBNo = (item.bzowrRgstNo || "").replace(/[^0-9]/g, "");
        return apiBNo.length >= 5 && apiBNo.startsWith(targetBNo5);
      });
    }

    if (!matched || !matched.seq) return null;

    const detailUrl = `http://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getDetailInfoSearchV2?serviceKey=${DATA_PORTAL_SERVICE_KEY}&dataType=json&seq=${matched.seq}`;
    const detailResponse = await fetchWithTimeout(detailUrl);
    if (!detailResponse.ok) return null;

    const detailText = await detailResponse.text();
    const detailJson = JSON.parse(detailText);
    const detailItem = detailJson?.response?.body?.items?.item;
    const targetDetail = Array.isArray(detailItem) ? detailItem[0] : detailItem;

    if (targetDetail) {
      return parseInt(targetDetail.jnngpCnt || targetDetail.npsSbscrbNmps || "0");
    }
  } catch (err) {
    console.error(`NPS fetch timeout or error for ${companyNm}`);
  }
  return null;
}

async function getCorpFinance(crno) {
  const cleanCrno = crno.replace(/[^0-9]/g, "");
  if (cleanCrno.length !== 13) return [];

  const url = `https://apis.data.go.kr/1160100/service/GetFinaStatInfoService_V2/getSummFinaStat_V2?serviceKey=${DATA_PORTAL_SERVICE_KEY}&pageNo=1&numOfRows=50&resultType=json&crno=${cleanCrno}`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return [];
    const text = await response.text();
    if (!text.includes("NORMAL SERVICE")) return [];

    const json = JSON.parse(text);
    const items = json?.response?.body?.items?.item;
    if (!items || !Array.isArray(items)) return [];

    const yearMap = new Map();
    items.forEach((item) => {
      const year = parseInt(item.bizYear || item.bsnsYear);
      if (!year) return;

      const code = item.fnclDcd || "";
      const existing = yearMap.get(year);
      if (existing && existing.fnclDcd === "110" && code !== "110") return;

      yearMap.set(year, item);
    });

    const history = [];
    yearMap.forEach((item, year) => {
      const to100M = (valStr) => {
        const val = parseFloat(valStr || "0");
        return Math.round(val / 100000000);
      };

      history.push({
        year,
        revenue: to100M(item.enpSaleAmt),
        operatingIncome: to100M(item.enpBzopPft),
        netIncome: to100M(item.enpCrtmNpf),
        totalAssets: to100M(item.enpTastAmt),
        totalLiabilities: to100M(item.enpTdbtAmt),
        totalEquity: to100M(item.enpTcptAmt),
        employees: 0
      });
    });

    history.sort((a, b) => a.year - b.year);
    return history.slice(-3);
  } catch (err) {
    console.error(`CorpFinance fetch timeout or error for ${crno}`);
    return [];
  }
}

// DB 갱신 헬퍼
async function dbUpsertBusiness(biz) {
  const clean = biz.b_no.replace(/[^0-9]/g, "");
  
  await client.query(`
    INSERT INTO businesses (
      b_no, b_nm, p_nm, start_dt, b_adr, b_sector, b_type, corp_no, dart_code,
      description, credit_rating, industry_rank, is_sme, listing_status, homepage, main_biz,
      is_audited, nps_sbscrb_nmps, nps_linked, corp_enm, crno, enp_tlno, enp_fxno, enp_pncd,
      enp_stac_nm, enp_main_biz_nm, data_source,
      mail_order_no, declare_org, goods_type, sell_type, close_date, rep_email, zip_cd,
      new_acqs_nmps, loss_sbscrb_nmps, tel_no
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27,
      $28, $29, $30, $31, $32, $33, $34, $35, $36, $37
    ) ON CONFLICT (b_no) DO UPDATE SET
      b_nm = EXCLUDED.b_nm,
      p_nm = EXCLUDED.p_nm,
      start_dt = EXCLUDED.start_dt,
      b_adr = EXCLUDED.b_adr,
      b_sector = EXCLUDED.b_sector,
      b_type = EXCLUDED.b_type,
      corp_no = EXCLUDED.corp_no,
      dart_code = EXCLUDED.dart_code,
      description = EXCLUDED.description,
      credit_rating = EXCLUDED.credit_rating,
      industry_rank = EXCLUDED.industry_rank,
      is_sme = EXCLUDED.is_sme,
      listing_status = EXCLUDED.listing_status,
      homepage = EXCLUDED.homepage,
      main_biz = EXCLUDED.main_biz,
      is_audited = EXCLUDED.is_audited,
      nps_sbscrb_nmps = EXCLUDED.nps_sbscrb_nmps,
      nps_linked = EXCLUDED.nps_linked,
      corp_enm = EXCLUDED.corp_enm,
      crno = EXCLUDED.crno,
      enp_tlno = EXCLUDED.enp_tlno,
      enp_fxno = EXCLUDED.enp_fxno,
      enp_pncd = EXCLUDED.enp_pncd,
      enp_stac_nm = EXCLUDED.enp_stac_nm,
      enp_main_biz_nm = EXCLUDED.enp_main_biz_nm,
      data_source = EXCLUDED.data_source,
      mail_order_no = EXCLUDED.mail_order_no,
      declare_org = EXCLUDED.declare_org,
      goods_type = EXCLUDED.goods_type,
      sell_type = EXCLUDED.sell_type,
      close_date = EXCLUDED.close_date,
      rep_email = EXCLUDED.rep_email,
      zip_cd = EXCLUDED.zip_cd,
      new_acqs_nmps = EXCLUDED.new_acqs_nmps,
      loss_sbscrb_nmps = EXCLUDED.loss_sbscrb_nmps,
      tel_no = EXCLUDED.tel_no
  `, [
    clean, biz.b_nm, biz.p_nm, biz.start_dt, biz.b_adr, biz.b_sector, biz.b_type, biz.corp_no || "", biz.dart_code || "",
    biz.description || "", biz.credit_rating || "", biz.industry_rank || "", biz.is_sme || "", biz.listing_status || "",
    biz.homepage || "", biz.main_biz || "", biz.is_audited || false, biz.npsSbscrbNmps || 0, biz.npsLinked || false,
    biz.corpEnm || "", biz.crno || "", biz.enpTlno || "", biz.enpFxno || "", biz.enpPncd || "", biz.enpStacNm || "",
    biz.enpMainBizNm || "", biz.dataSource || "local",
    biz.mailOrderNo || "", biz.declareOrg || "", biz.goodsType || "", biz.sellType || "", biz.closeDate || "", biz.repEmail || "", biz.zipCd || "",
    biz.newAcqsNmps || 0, biz.lossSbscrbNmps || 0, biz.telNo || ""
  ]);

  if (biz.history && Array.isArray(biz.history)) {
    await client.query("DELETE FROM business_history WHERE b_no = $1", [clean]);
    for (const h of biz.history) {
      await client.query(`
        INSERT INTO business_history (
          b_no, year, revenue, operating_income, net_income, total_assets, total_liabilities, total_equity, employees
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        clean, h.year, h.revenue || 0, h.operatingIncome || 0, h.netIncome || 0,
        h.totalAssets || 0, h.totalLiabilities || 0, h.totalEquity || 0, h.employees || 0
      ]);
    }
  }
}

async function main() {
  console.log("Connecting to Neon DB...");
  await client.connect();
  console.log("Connected!");

  // DB에 존재하는 정상 등록 기업 목록 추출 (상호 미등록 제외)
  const res = await client.query(`
    SELECT b_no, b_nm, is_audited, corp_no, dart_code, description, credit_rating, industry_rank, is_sme, listing_status, homepage, main_biz, data_source
    FROM businesses 
    WHERE b_nm != '상호 미등록 사업자'
  `);
  
  const businesses = res.rows;
  console.log(`Found ${businesses.length} registered businesses to backfill.`);

  for (let dbBiz of businesses) {
    const cleanBNo = dbBiz.b_no;
    console.log(`\n==================================================`);
    console.log(`Processing backfill for: ${dbBiz.b_nm} (${cleanBNo})`);

    // 기존 1:N 이력 조회
    const histRes = await client.query(`
      SELECT year, revenue, operating_income as "operatingIncome", net_income as "netIncome", 
             total_assets as "totalAssets", total_liabilities as "totalLiabilities", 
             total_equity as "totalEquity", employees 
      FROM business_history 
      WHERE b_no = $1 
      ORDER BY year ASC
    `, [cleanBNo]);
    
    let history = histRes.rows.map(r => ({
      year: r.year,
      revenue: parseInt(r.revenue || "0"),
      operatingIncome: parseInt(r.operatingIncome || "0"),
      netIncome: parseInt(r.netIncome || "0"),
      totalAssets: parseInt(r.totalAssets || "0"),
      totalLiabilities: parseInt(r.totalLiabilities || "0"),
      totalEquity: parseInt(r.totalEquity || "0"),
      employees: parseInt(r.employees || "0")
    }));

    // 1. 금융위 기본정보 & 공정위 통신판매정보 수집
    const basicInfoPromise = getCorpBasicOutline(cleanBNo);
    const ftcInfoPromise = getFtcMailOrderInfo(cleanBNo);
    
    const [basicInfo, ftcInfo] = await Promise.all([basicInfoPromise, ftcInfoPromise]);
    
    let business = null;

    if (basicInfo) {
      console.log(`-> Found FSC CorpOutline info for ${dbBiz.b_nm}`);
      const scale = basicInfo.enpEntprScaleNm || "일반기업";
      const crno = basicInfo.crno;
      
      const financeDetailPromise = getCorpFinance(crno);
      const npsEmpPromise = getNpsEmployees(cleanBNo, basicInfo.corpNm);
      
      const [financeDetail, npsEmp] = await Promise.all([financeDetailPromise, npsEmpPromise]);

      let npsLinked = false;
      let npsSbscrbNmps = 0;
      if (npsEmp) {
        console.log(`-> NPS Employees found: ${npsEmp}`);
        npsLinked = true;
        npsSbscrbNmps = npsEmp;
      }

      if (financeDetail && financeDetail.length > 0) {
        history = financeDetail.map((fd) => {
          const baseEmployees = Math.max(5, Math.round(fd.revenue * 0.15));
          const employees = scale.includes("대기업") 
            ? baseEmployees * 4 
            : (scale.includes("중견기업") ? baseEmployees * 2.5 : baseEmployees);

          let emp = Math.round(employees);
          if (npsEmp && fd.year === 2025) {
            emp = npsEmp;
          }
          return {
            ...fd,
            employees: emp
          };
        });
      } else {
        // 기존 history 활용
        if (npsEmp) {
          history = history.map(h => {
            if (h.year === 2025) {
              return { ...h, employees: npsEmp };
            }
            return h;
          });
        }
      }

      business = {
        b_no: cleanBNo,
        b_nm: basicInfo.corpNm || dbBiz.b_nm,
        p_nm: basicInfo.enpRprFnm || dbBiz.p_nm || "",
        start_dt: basicInfo.enpEstbDt || dbBiz.start_dt || "",
        b_adr: basicInfo.enpBsadr || dbBiz.b_adr || "",
        b_sector: basicInfo.enpIndyNm || dbBiz.b_sector || "기타 서비스업",
        b_type: scale,
        corp_no: crno || dbBiz.corp_no,
        dart_code: dbBiz.dart_code || "",
        description: dbBiz.description || `${basicInfo.corpNm}은(는) 금융위원회 공시 정보가 등록된 대한민국 공식 ${scale}입니다.`,
        credit_rating: dbBiz.credit_rating || "BBB-",
        industry_rank: dbBiz.industry_rank || "상위 25%",
        dataSource: "public",
        is_sme: scale,
        listing_status: dbBiz.listing_status || (scale.includes("대기업") ? "코스피 상장" : "비상장"),
        homepage: dbBiz.homepage && dbBiz.homepage !== "-" ? dbBiz.homepage : (basicInfo.enpHpaddr || "-"),
        main_biz: basicInfo.enpMainBizNm || basicInfo.enpIndyNm || dbBiz.main_biz || "기타 서비스업",
        is_audited: true,
        
        corpEnm: basicInfo.corpEnm || "",
        crno: crno || "",
        basDt: basicInfo.basDt || "",
        enpPbncYn: basicInfo.enpPbncYn || "",
        enpDivNm: basicInfo.enpDivNm || "",
        enpTlno: basicInfo.enpTlno || "",
        enpFxno: basicInfo.enpFxno || "",
        enpPncd: basicInfo.enpPncd || "",
        enpStacNm: basicInfo.enpStacNm || "",
        enpMainBizNm: basicInfo.enpMainBizNm || "",
        enpKosdaqYn: basicInfo.enpKosdaqYn || "",
        enpKoseYn: basicInfo.enpKoseYn || "",
        enpKonexYn: basicInfo.enpKonexYn || "",
        
        npsLinked,
        npsSbscrbNmps,
        newAcqsNmps: 0,
        lossSbscrbNmps: 0,
        telNo: basicInfo.enpTlno || "",
        
        history
      };

      // 공정위 데이터도 병합
      if (ftcInfo) {
        console.log(`-> Also merged FTC MailOrder info for ${dbBiz.b_nm}`);
        business.mailOrderNo = ftcInfo.mailOrderNo;
        business.declareOrg = ftcInfo.declareOrg;
        business.goodsType = ftcInfo.goodsType;
        business.sellType = ftcInfo.sellType;
        business.closeDate = ftcInfo.closeDate;
        business.repEmail = ftcInfo.repEmail;
        business.zipCd = ftcInfo.zipCd;
        business.telNo = ftcInfo.telNo || business.telNo;
      }
    } else if (ftcInfo) {
      console.log(`-> Found FTC MailOrder info for ${dbBiz.b_nm} (No FSC)`);
      const npsEmp = await getNpsEmployees(cleanBNo, ftcInfo.cmpNm);
      let npsLinked = false;
      let npsSbscrbNmps = 0;
      if (npsEmp) {
        console.log(`-> NPS Employees found: ${npsEmp}`);
        npsLinked = true;
        npsSbscrbNmps = npsEmp;
      }

      business = {
        b_no: cleanBNo,
        b_nm: ftcInfo.cmpNm || dbBiz.b_nm,
        p_nm: ftcInfo.rprsNm || dbBiz.p_nm || "",
        start_dt: ftcInfo.rcptDt || dbBiz.start_dt || "",
        b_adr: ftcInfo.repAddr || dbBiz.b_adr || "주소 정보 없음 (공시 비대상)",
        b_sector: "전자상거래 소매업 (통신판매업)",
        b_type: "소상공인 (통신판매업자)",
        description: dbBiz.description || `공정거래위원회에 정식 등록된 통신판매사업자(${ftcInfo.cmpNm})입니다.`,
        credit_rating: dbBiz.credit_rating || "-",
        industry_rank: dbBiz.industry_rank || "-",
        dataSource: "public",
        is_sme: "소상공인",
        listing_status: dbBiz.listing_status || "비상장",
        homepage: ftcInfo.wbsitAddr && ftcInfo.wbsitAddr !== "-" ? ftcInfo.wbsitAddr : (dbBiz.homepage || "-"),
        main_biz: "전자상거래업",
        is_audited: false,
        
        enpTlno: ftcInfo.telNo,
        enpPncd: ftcInfo.zipCd,
        mailOrderNo: ftcInfo.mailOrderNo,
        declareOrg: ftcInfo.declareOrg,
        goodsType: ftcInfo.goodsType,
        sellType: ftcInfo.sellType,
        closeDate: ftcInfo.closeDate,
        repEmail: ftcInfo.repEmail,
        telNo: ftcInfo.telNo,
        zipCd: ftcInfo.zipCd,
        
        npsLinked,
        npsSbscrbNmps,
        newAcqsNmps: 0,
        lossSbscrbNmps: 0,
        
        history: history.map(h => {
          if (h.year === 2025 && npsEmp) {
            return { ...h, employees: npsEmp };
          }
          return h;
        })
      };
    } else {
      console.log(`-> No FSC or FTC info found for ${dbBiz.b_nm}. Running NPS only.`);
      const npsEmp = await getNpsEmployees(cleanBNo, dbBiz.b_nm);
      let npsLinked = false;
      let npsSbscrbNmps = 0;
      if (npsEmp) {
        console.log(`-> NPS Employees found: ${npsEmp}`);
        npsLinked = true;
        npsSbscrbNmps = npsEmp;
      }
      
      business = {
        b_no: dbBiz.b_no,
        b_nm: dbBiz.b_nm,
        p_nm: dbBiz.p_nm,
        start_dt: dbBiz.start_dt,
        b_adr: dbBiz.b_adr,
        b_sector: dbBiz.b_sector,
        b_type: dbBiz.b_type,
        corp_no: dbBiz.corp_no,
        dart_code: dbBiz.dart_code,
        description: dbBiz.description,
        credit_rating: dbBiz.credit_rating,
        industry_rank: dbBiz.industry_rank,
        is_sme: dbBiz.is_sme,
        listing_status: dbBiz.listing_status,
        homepage: dbBiz.homepage,
        main_biz: dbBiz.main_biz,
        is_audited: dbBiz.is_audited,
        dataSource: dbBiz.data_source,
        npsLinked,
        npsSbscrbNmps,
        newAcqsNmps: 0,
        lossSbscrbNmps: 0,
        history: history.map(h => {
          if (h.year === 2025 && npsEmp) {
            return { ...h, employees: npsEmp };
          }
          return h;
        })
      };
    }

    if (business) {
      console.log(`-> Saving updated data to DB...`);
      await dbUpsertBusiness(business);
      console.log(`-> Successfully updated ${dbBiz.b_nm}!`);
    }
  }

  console.log("\n==================================================");
  console.log("Backfill finished successfully!");
}

main()
  .catch(err => {
    console.error("Backfill failed:", err);
  })
  .finally(async () => {
    await client.end();
  });
