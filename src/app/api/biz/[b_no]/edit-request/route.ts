import { NextRequest, NextResponse } from "next/server";
import { addEditRequest } from "@/lib/db";
import { validateBizrNo } from "@/lib/bizValidation";
import { checkRateLimit, getClientIp, sanitizeHttpUrl } from "@/lib/sessionAuth";

function isRateLimitAllowed(result: unknown): boolean {
  if (typeof result === "boolean") return result;
  if (typeof result === "object" && result !== null) {
    if ("allowed" in result) return Boolean((result as { allowed?: boolean }).allowed);
    if ("ok" in result) return Boolean((result as { ok?: boolean }).ok);
  }
  return true;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ b_no: string }> }
) {
  try {
    const ip = getClientIp(req);
    const rateResult: unknown = checkRateLimit(`editreq:${ip}`, 10, 300_000);
    if (rateResult instanceof Response) return rateResult;
    if (!isRateLimitAllowed(rateResult)) {
      return NextResponse.json(
        { error: "요청 횟수가 너무 많습니다. 잠시 후 다시 시도해 주세요." },
        { status: 429 }
      );
    }

    const resolvedParams = await params;
    const bNo = resolvedParams?.b_no || "";
    const cleanBNo = bNo.replace(/[^0-9]/g, "");

    if (cleanBNo.length !== 10 || !validateBizrNo(cleanBNo)) {
      return NextResponse.json(
        { error: "올바르지 않은 사업자등록번호 형식입니다." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      requesterType,
      requesterEmail,
      proposedBrandName,
      proposedHomepage,
      proposedDescription,
      proposedTimeline,
      proposedBusinessName
    } = body ?? {};

    const cleanType = typeof requesterType === "string" ? requesterType.trim() : "";
    const cleanEmail = typeof requesterEmail === "string" ? requesterEmail.trim() : "";
    const cleanBrand = typeof proposedBrandName === "string" ? proposedBrandName.trim() : "";
    const cleanBizName = typeof proposedBusinessName === "string" ? proposedBusinessName.trim() : "";
    const cleanDesc = typeof proposedDescription === "string" ? proposedDescription.trim() : "";
    const rawHomepage = typeof proposedHomepage === "string" ? proposedHomepage.trim() : "";

    if (!cleanType || !cleanEmail) {
      return NextResponse.json(
        { error: "이메일 및 신청자 구분은 필수 항목입니다." },
        { status: 400 }
      );
    }

    if (
      cleanType.length > 50 ||
      cleanEmail.length > 254 ||
      cleanBrand.length > 200 ||
      cleanBizName.length > 200 ||
      rawHomepage.length > 500 ||
      cleanDesc.length > 2000
    ) {
      return NextResponse.json(
        { error: "입력 항목의 허용 글자 수를 초과했습니다. (기업 소개 최대 2,000자)" },
        { status: 400 }
      );
    }

    let safeHomepage = "";
    if (rawHomepage && rawHomepage !== "-") {
      const candidateUrl = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(rawHomepage)
        ? rawHomepage
        : `https://${rawHomepage}`;
      const sanitized = sanitizeHttpUrl(candidateUrl);
      if (!sanitized) {
        return NextResponse.json(
          { error: "올바른 홈페이지 URL(http/https)을 입력해 주세요." },
          { status: 400 }
        );
      }
      safeHomepage = sanitized;
    }

    let safeTimeline = Array.isArray(proposedTimeline) ? proposedTimeline.slice(0, 50) : undefined;
    if (safeTimeline && JSON.stringify(safeTimeline).length > 10000) {
      return NextResponse.json(
        { error: "연혁 데이터 용량이 허용 범위를 초과했습니다." },
        { status: 400 }
      );
    }

    const id = await addEditRequest({
      b_no: cleanBNo,
      requester_type: cleanType,
      requester_email: cleanEmail,
      proposed_brand_name: cleanBrand,
      proposed_homepage: safeHomepage,
      proposed_description: cleanDesc,
      proposed_timeline: safeTimeline,
      proposed_b_nm: cleanBizName
    });

    return NextResponse.json({ success: true, requestId: id });
  } catch (error: unknown) {
    console.error("Failed to insert edit request:", error);
    return NextResponse.json(
      { error: "수정 제안 등록에 실패했습니다. 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
