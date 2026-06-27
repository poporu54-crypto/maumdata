import { NextResponse, NextRequest } from "next/server";
import { getUnifiedBusinessData } from "@/app/biz/[b_no]/utils/dataLoader";
import { getRecentBidsByCompany } from "@/lib/procurementApi";
import { getPatentsByCompany } from "@/lib/patentApi";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ b_no: string }> }
) {
  const resolvedParams = await params;
  const bNo = resolvedParams.b_no.replace(/[^0-9]/g, "");

  if (bNo.length !== 10) {
    return NextResponse.json(
      { error: "올바른 10자리 사업자등록번호가 아닙니다." },
      { 
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      }
    );
  }

  try {
    const { apiStatus, business, isInvalid } = await getUnifiedBusinessData(bNo);

    if (isInvalid || !business) {
      return NextResponse.json(
        { error: "조회되지 않는 사업자번호입니다." },
        { 
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          }
        }
      );
    }

    // 비동기 병렬 요청으로 특허 및 조달청 입찰공고 데이터를 수집합니다.
    let bids: any[] = [];
    let patents: any[] = [];

    try {
      const results = await Promise.allSettled([
        getRecentBidsByCompany(business.b_nm, bNo),
        getPatentsByCompany(business.b_nm, business.p_nm || "")
      ]);

      if (results[0].status === "fulfilled") {
        bids = results[0].value;
      }
      if (results[1].status === "fulfilled") {
        patents = results[1].value;
      }
    } catch (err) {
      console.error("Failed to query sub-sections (bids/patents) for extension:", err);
    }

    const latestFinance = business.history && business.history.length > 0
      ? business.history[business.history.length - 1]
      : null;

    const formattedBNo = bNo.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3");

    // 확장 프로그램에 적합한 데이터 구조 조립
    const summaryData = {
      b_no: bNo,
      b_no_formatted: formattedBNo,
      b_nm: business.b_nm,
      p_nm: business.p_nm,
      start_dt: business.start_dt,
      b_adr: business.b_adr,
      b_sector: business.b_sector,
      is_sme: business.is_sme || "소상공인",
      listing_status: business.listing_status || "비상장",
      description: business.description || "등록된 소개 정보가 없습니다.",
      tax_status: {
        b_stt: apiStatus?.b_stt || business.bStt || "계속사업자",
        tax_type: apiStatus?.tax_type || business.taxType || "부가가치세 일반과세자",
        close_date: apiStatus?.end_dt || business.closeDate || ""
      },
      latest_employees: latestFinance?.employees || business.npsSbscrbNmps || 0,
      latest_revenue: latestFinance?.revenue || 0, // 억 원 단위
      latest_operating_income: latestFinance?.operatingIncome || 0, // 억 원 단위
      history: business.history || [],
      employment_history: business.employmentHistory || [],
      nps_acqs_nmps: business.newAcqsNmps || 0,
      nps_loss_nmps: business.lossSbscrbNmps || 0,
      nps_chrg_amt: business.npsChrgAmt || 0,
      bids_count: bids.length,
      recent_bids: bids.slice(0, 3).map((b: any) => ({
        bidNtceNo: b.bidNtceNo,
        bidNtceNm: b.bidNtceNm,
        presmptPrce: b.presmptPrce || 0,
        cntrctCnclMthdNm: b.cntrctCnclMthdNm || "제한경쟁",
        detailUrl: b.detailUrl
      })),
      patents_count: patents.length,
      recent_patents: patents.slice(0, 3).map((p: any) => ({
        applicationNumber: p.applicationNumber,
        inventionTitle: p.inventionTitle,
        applicationDate: p.applicationDate,
        patentStatus: p.patentStatus,
        detailUrl: p.detailUrl
      }))
    };

    return NextResponse.json(summaryData, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  } catch (error: any) {
    console.error("Extension Detail Query Error:", error);
    return NextResponse.json(
      { error: "기업 상세 조회 중 내부 오류가 발생했습니다." },
      { 
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      }
    );
  }
}

// OPTIONS 요청 핸들링 (Preflight 대응)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
}
