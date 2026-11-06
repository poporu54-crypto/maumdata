import { NextResponse, NextRequest } from "next/server";
import { getUnifiedBusinessData } from "@/app/biz/[b_no]/utils/dataLoader";
import { validateBizrNo } from "@/lib/bizValidation";
import { buildExtensionCorsHeaders, guardApiRequest } from "@/lib/apiBotGuard";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ b_no: string }> }
) {
  const corsHeaders = buildExtensionCorsHeaders(request);
  const blocked = guardApiRequest(request, {
    bucket: "ext_biz_detail",
    maxRequests: 30,
    windowMs: 60_000,
    mode: "extension",
    corsHeaders,
    rateLimitMessage: "기업 상세 조회 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
  });
  if (blocked) return blocked;

  const resolvedParams = await params;
  const bNo = (resolvedParams?.b_no || "").replace(/[^0-9]/g, "");

  if (bNo.length !== 10 || !validateBizrNo(bNo)) {
    return NextResponse.json(
      { error: "올바른 10자리 사업자등록번호가 아닙니다." },
      {
        status: 400,
        headers: corsHeaders,
      }
    );
  }

  try {
    const { apiStatus, business, isInvalid } = await getUnifiedBusinessData(bNo, { skipViewRecord: true });

    if (isInvalid || !business) {
      return NextResponse.json(
        { error: "조회되지 않는 사업자번호입니다." },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    // getUnifiedBusinessData에서 이미 로드된 로컬 DB 입찰/특허 데이터를 재사용 (매 조회 시 외부 API 재호출 방지)
    const bids = Array.isArray(business.bids) ? business.bids : [];
    const patents = Array.isArray(business.patents) ? business.patents : [];

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
        bidNtceNo: b.bidNtceNo || b.bid_ntce_no || "",
        bidNtceNm: b.bidNtceNm || b.bid_ntce_nm || "",
        presmptPrce: b.presmptPrce ?? b.presmpt_prce ?? 0,
        cntrctCnclMthdNm: b.cntrctCnclMthdNm || b.cntrct_cncl_mthd_nm || "제한경쟁",
        detailUrl: b.detailUrl || b.detail_url || ""
      })),
      patents_count: patents.length,
      recent_patents: patents.slice(0, 3).map((p: any) => ({
        applicationNumber: p.applicationNumber || p.application_number || "",
        inventionTitle: p.inventionTitle || p.invention_title || "",
        applicationDate: p.applicationDate || p.application_date || "",
        patentStatus: p.patentStatus || p.patent_status || "",
        detailUrl: p.detailUrl || p.detail_url || ""
      }))
    };

    return NextResponse.json(summaryData, {
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      }
    });
  } catch (error: unknown) {
    console.error("Extension Detail Query Error:", error);
    return NextResponse.json(
      { error: "기업 상세 조회 중 내부 오류가 발생했습니다." },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// OPTIONS 요청 핸들링 (Preflight 대응)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: buildExtensionCorsHeaders(request),
  });
}
