import { NextResponse, NextRequest } from "next/server";
import { getContractsByUserId, getContractsByIds, deleteContractForUser } from "@/lib/db";
import { getAuthenticatedContractUser, SessionUserPayload } from "@/lib/sessionAuth";
import { guardApiRequest } from "@/lib/apiBotGuard";

export const dynamic = "force-dynamic";

function mapContractRow(c: any, authUser: SessionUserPayload | null) {
  const isVerifiedSender =
    !!authUser &&
    ((c.party_a_user_id && c.party_a_user_id === authUser.id) ||
      (c.party_a_email && String(c.party_a_email).toLowerCase() === authUser.email.toLowerCase()));

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
    // 열람 비밀번호(PIN)는 발송자(갑) 본인 세션으로 인증된 경우에만 표시
    accessPin: isVerifiedSender ? c.access_pin || "" : "",
    r2Key: c.r2_key || "",
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const blocked = guardApiRequest(request, {
    bucket: "contract_my_get",
    maxRequests: 40,
    windowMs: 60_000,
    mode: "same-origin",
  });
  if (blocked) return blocked;

  try {
    const authUser = getAuthenticatedContractUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "보관함 조회를 위해 본인 인증 로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const contracts = await getContractsByUserId(authUser.id, authUser.email);
    return NextResponse.json({
      success: true,
      contracts: contracts.map((c) => mapContractRow(c, authUser)),
    });
  } catch (err) {
    console.error("Failed to query my contracts:", err);
    return NextResponse.json(
      { error: "계약서 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const blocked = guardApiRequest(request, {
    bucket: "contract_my_post",
    maxRequests: 40,
    windowMs: 60_000,
    mode: "same-origin",
  });
  if (blocked) return blocked;

  try {
    const body = await request.json().catch(() => ({}));
    const { action, contractId, contractIds } = body || {};
    const authUser = getAuthenticatedContractUser(request);

    // 1. 클라우드 보관함에서 계약서 숨김/삭제 요청 (반드시 서버 인증 세션 필수)
    if (action === "delete") {
      if (!contractId || typeof contractId !== "string") {
        return NextResponse.json({ error: "삭제할 계약 ID가 없습니다." }, { status: 400 });
      }
      if (!authUser) {
        return NextResponse.json(
          { error: "클라우드 보관함 삭제는 로그인 상태에서만 가능합니다." },
          { status: 401 }
        );
      }
      await deleteContractForUser(contractId, authUser.id, authUser.email);
      return NextResponse.json({ success: true });
    }

    // 2. 서버 검증된 로그인 계정 계약서 + 현재 기기 로컬 계약서 ID 통합 조회
    const mergedMap = new Map<string, any>();

    if (authUser) {
      const userContracts = await getContractsByUserId(authUser.id, authUser.email);
      for (const c of userContracts) {
        mergedMap.set(c.id, mapContractRow(c, authUser));
      }
    }

    if (Array.isArray(contractIds) && contractIds.length > 0) {
      const safeIds = contractIds
        .slice(0, 50)
        .filter((id): id is string => typeof id === "string" && /^cnt_\d+_[0-9a-f]+$/i.test(id));
      if (safeIds.length > 0) {
        const localContracts = await getContractsByIds(safeIds);
        for (const c of localContracts) {
          if (!mergedMap.has(c.id)) {
            mergedMap.set(c.id, mapContractRow(c, authUser));
          }
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
  } catch (err) {
    console.error("Failed to batch query contracts:", err);
    return NextResponse.json(
      { error: "보관함 조회 중 일시적인 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
