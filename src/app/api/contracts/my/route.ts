import { NextResponse, NextRequest } from "next/server";
import { getContractsByUserId, getContractsByIds, deleteContractForUser } from "@/lib/db";

export const dynamic = "force-dynamic";

function mapContractRow(c: any) {
  return {
    id: c.id,
    templateId: c.template_id,
    title: c.title,
    status: c.status,
    partyAName: c.party_a_name,
    partyACompany: c.party_a_company,
    partyASignedAt: c.party_a_signed_at,
    partyAUserId: c.party_a_user_id || "",
    partyBName: c.party_b_name,
    partyBCompany: c.party_b_company,
    partyBSignedAt: c.party_b_signed_at,
    partyBUserId: c.party_b_user_id || "",
    signToken: c.sign_token,
    accessPin: c.access_pin || "",
    r2Key: c.r2_key || "",
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "";
    const userEmail = searchParams.get("email") || "";

    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: "보관함 조회를 위해 로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const contracts = await getContractsByUserId(userId, userEmail);
    return NextResponse.json({
      success: true,
      contracts: contracts.map(mapContractRow),
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
    const { action, contractId, contractIds, userId, userEmail } = body;

    // 1. 보관함에서 계약서 삭제 요청
    if (action === "delete" && contractId) {
      await deleteContractForUser(contractId, userId);
      return NextResponse.json({ success: true });
    }

    // 2. 로그인 계정 영구 계약서 + 기기 로컬 계약서 통합 조회
    const mergedMap = new Map<string, any>();

    if (userId || userEmail) {
      const userContracts = await getContractsByUserId(userId || "", userEmail || "");
      for (const c of userContracts) {
        mergedMap.set(c.id, mapContractRow(c));
      }
    }

    if (Array.isArray(contractIds) && contractIds.length > 0) {
      const safeIds = contractIds.slice(0, 50).filter((id) => typeof id === "string");
      const localContracts = await getContractsByIds(safeIds);
      for (const c of localContracts) {
        if (!mergedMap.has(c.id)) {
          mergedMap.set(c.id, mapContractRow(c));
        }
      }
    }

    const sorted = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      contracts: sorted,
    });
  } catch (err: any) {
    console.error("Failed to batch query contracts:", err);
    return NextResponse.json(
      { error: "보관함 조회 실패: " + err.message },
      { status: 500 }
    );
  }
}
