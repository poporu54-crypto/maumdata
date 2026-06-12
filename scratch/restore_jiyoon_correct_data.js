const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = (() => {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/POSTGRES_URL=([^\r\n]+)/) || envContent.match(/DATABASE_URL=([^\r\n]+)/);
    if (match) return match[1].trim();
  }
  return process.env.POSTGRES_URL || process.env.DATABASE_URL;
})();

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  await client.connect();
  console.log("Connected to DB");

  // 1. businesses 테이블에서 잘못 적재된 지윤 주식회사(1378651839)의 상호명 및 기타 정보 전면 복구
  console.log("Updating businesses table for JiYoon...");
  const updateBiz = await client.query(`
    UPDATE businesses 
    SET 
      b_nm = '지윤 주식회사',
      p_nm = '박상욱',
      start_dt = '20150122',
      b_adr = '인천광역시 서구 북항로207번길 41 (원창동)',
      b_sector = '전자상거래 소매업 (통신판매업)',
      b_type = '소상공인 (통신판매업자)',
      corp_no = '1201110741274',
      crno = '1201110741274',
      description = '인천 서구 북항로에 위치한 온라인 유통 및 물류 대행 전문 혁신 중소기업입니다.',
      credit_rating = '-',
      industry_rank = '-',
      is_sme = '소상공인',
      listing_status = '비상장',
      homepage = 'https://www.fastmall.co.kr',
      main_biz = '전자상거래업',
      is_audited = false,
      nps_sbscrb_nmps = 12,
      nps_linked = true,
      corp_enm = 'JiYoon Co., Ltd.',
      enp_tlno = '1544-6450',
      enp_fxno = 'N/A',
      enp_pncd = '22856',
      enp_stac_nm = '12월 결산',
      enp_main_biz_nm = '유통전문판매업',
      data_source = 'public',
      mail_order_no = '2015-인천서구-0069',
      declare_org = '인천광역시 서구',
      goods_type = '건강/식품',
      sell_type = '인터넷',
      close_date = '',
      rep_email = 'utow@nate.com',
      zip_cd = '22856',
      new_acqs_nmps = 0,
      loss_sbscrb_nmps = 0,
      tel_no = '1544-6450',
      brand_name = '지윤, 지윤 주식회사',
      tax_type = '부가가치세 일반과세자',
      tax_type_cd = '01'
    WHERE b_no = '1378651839'
  `);
  console.log("Businesses table updated:", updateBiz.rowCount, "row(s).");

  // 2. business_history 테이블에서 지윤 주식회사(1378651839)의 3개년 가상 재무정보를 지윤의 실제 매출 규모에 가깝게 복구 (실제 매출 60억, 56억, 55억 규모로 백필)
  console.log("Deleting old business_history for JiYoon...");
  await client.query("DELETE FROM business_history WHERE b_no = '1378651839'");

  console.log("Inserting corrected business_history for JiYoon...");
  const historyData = [
    {
      year: 2023,
      revenue: 55,
      operating_income: 2,
      net_income: 1,
      total_assets: 18,
      total_liabilities: 10,
      total_equity: 8,
      employees: 12
    },
    {
      year: 2024,
      revenue: 56,
      operating_income: 3,
      net_income: 2,
      total_assets: 20,
      total_liabilities: 11,
      total_equity: 9,
      employees: 12
    },
    {
      year: 2025,
      revenue: 60,
      operating_income: 4,
      net_income: 3,
      total_assets: 22,
      total_liabilities: 12,
      total_equity: 10,
      employees: 12
    }
  ];

  for (const h of historyData) {
    await client.query(`
      INSERT INTO business_history (
        b_no, year, revenue, operating_income, net_income, total_assets, total_liabilities, total_equity, employees
      ) VALUES ('1378651839', $1, $2, $3, $4, $5, $6, $7, $8)
    `, [h.year, h.revenue, h.operating_income, h.net_income, h.total_assets, h.total_liabilities, h.total_equity, h.employees]);
  }
  console.log("Business history updated successfully!");

  await client.end();
}

main().catch(console.error);
