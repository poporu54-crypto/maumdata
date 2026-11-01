import { NextResponse, NextRequest } from "next/server";
import { searchCorpOutline } from "@/lib/corpApi";
import { searchBusinesses } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/sessionAuth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function isRateLimitAllowed(result: unknown): boolean {
  if (typeof result === "boolean") return result;
  if (typeof result === "object" && result !== null) {
    if ("allowed" in result) return Boolean((result as { allowed?: boolean }).allowed);
    if ("ok" in result) return Boolean((result as { ok?: boolean }).ok);
  }
  return true;
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateResult: unknown = checkRateLimit(`extsearch:${ip}`, 60, 60_000);
  if (rateResult instanceof Response) return rateResult;
  if (!isRateLimitAllowed(rateResult)) {
    return NextResponse.json(
      { error: "검색 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요." },
      {
        status: 429,
        headers: CORS_HEADERS,
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get("query") || searchParams.get("q") || "";

  if (searchQuery.trim().length < 2) {
    return NextResponse.json(
      { error: "검색어는 2글자 이상 입력해 주세요." },
      {
        status: 400,
        headers: CORS_HEADERS,
      }
    );
  }

  try {
    let localMatches: any[] = [];
    try {
      const list = await searchBusinesses(searchQuery);
      localMatches = list.map((item: any) => ({
        b_no: item.b_no,
        b_nm: item.b_nm,
        p_nm: item.p_nm,
        b_adr: item.b_adr || "-",
        b_sector: item.b_sector || "-",
        dataSource: "local",
        is_sme: item.is_sme || "소상공인",
        listing_status: item.listing_status || "비상장"
      }));
    } catch (err) {
      console.error("Local DB Search failed for extension:", err);
    }

    let publicMatches: any[] = [];
    if (localMatches.length === 0) {
      try {
        const publicList = await searchCorpOutline(searchQuery);
        publicMatches = publicList.map((item: any) => ({
          b_no: item.bizrNo ? item.bizrNo.replace(/[^0-9]/g, "") : "",
          b_nm: item.corpNm || "-",
          p_nm: item.reprsntNm || "-",
          b_adr: item.corpAddr || "-",
          b_sector: item.indutyNm || "-",
          dataSource: "public",
          is_sme: "중소기업",
          listing_status: "비상장"
        }));
      } catch (err) {
        console.error("Public API Search failed for extension:", err);
      }
    }

    // 병합 및 중복제거
    const mergeMap = new Map<string, any>();
    localMatches.forEach(item => {
      const key = item.b_no.replace(/[^0-9]/g, "");
      if (key && key.length === 10) {
        mergeMap.set(key, item);
      }
    });

    publicMatches.forEach(item => {
      const key = item.b_no.replace(/[^0-9]/g, "");
      if (key && key.length === 10 && !mergeMap.has(key)) {
        mergeMap.set(key, item);
      }
    });

    const results = Array.from(mergeMap.values());

    return NextResponse.json(results, {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      }
    });
  } catch (error: unknown) {
    console.error("Extension Search Error:", error);
    return NextResponse.json(
      { error: "검색 중 오류가 발생했습니다." },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}

// OPTIONS 요청 핸들링 (Preflight 대응)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
