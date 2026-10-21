import { NextResponse, NextRequest } from "next/server";
import { getContractsByEmailOrPhone, getContractsByIds } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";

    if (query.trim().length < 2) {
      return NextResponse.json(
        { error: "검색어(이메일 또는 휴대폰번호)를 2글자 이상 입력해 주세요." },
        { status: 400 }
      );
    }

    const contracts = await getContractsByEmailOrPhone(query);
    return NextResponse.json({
      success: true,
      contracts: contracts.map((c) => ({
        id: c.id,
        templateId: c.template_id,
        title: c.title,
        status: c.status,
        partyAName: c.party_a_name,
        partyACompany: c.party_a_company,
        partyASignedAt: c.party_a_signed_at,
        partyBName: c.party_b_name,
        partyBCompany: c.party_b_company,
        partyBSignedAt: c.party_b_signed_at,
        signToken: c.sign_token,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }))
    });
  } catch (err: any) {
    console.error("Failed to query my contracts:", err);
    return NextResponse.json(
      { error: "계약서 목록 조회 중 오류가 발생했습니다: " + err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractIds } = body;

    if (!Array.isArray(contractIds) || contractIds.length === 0) {
      return NextResponse.json({ success: true, contracts: [] });
    }

    // 최대 50개 제한
    const safeIds = contractIds.slice(0, 50).filter((id) => typeof id === "string");
    const contracts = await getContractsByIds(safeIds);

    return NextResponse.json({
      success: true,
      contracts: contracts.map((c) => ({
        id: c.id,
        templateId: c.template_id,
        title: c.title,
        status: c.status,
        partyAName: c.party_a_name,
        partyACompany: c.party_a_company,
        partyASignedAt: c.party_a_signed_at,
        partyBName: c.party_b_name,
        partyBCompany: c.party_b_company,
        partyBSignedAt: c.party_b_signed_at,
        signToken: c.sign_token,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }))
    });
  } catch (err: any) {
    console.error("Failed to batch query contracts:", err);
    return NextResponse.json(
      { error: "최근 계약서 조회 실패: " + err.message },
      { status: 500 }
    );
  }
}
