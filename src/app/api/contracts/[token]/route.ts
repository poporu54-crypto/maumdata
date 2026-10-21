import { NextResponse, NextRequest } from "next/server";
import { getContractBySignToken, completePartyBSignature, bindUserToContract } from "@/lib/db";
import { uploadContractSnapshotToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;
    const { searchParams } = new URL(request.url);
    const inputPin = searchParams.get("pin") || "";
    const bypassOwnerId = searchParams.get("userId") || "";

    if (!token) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 400 });
    }

    const contract = await getContractBySignToken(token);
    if (!contract) {
      return NextResponse.json({ error: "계약서를 찾을 수 없습니다." }, { status: 404 });
    }

    const storedPin = (contract.access_pin || "").trim();
    const isPartyAOrB =
      bypassOwnerId &&
      (contract.party_a_user_id === bypassOwnerId || contract.party_b_user_id === bypassOwnerId);

    // 계약 진행 중(WAITING_PARTY_B)에 임시 비밀번호가 설정되어 있고, 아직 인증되지 않은 경우
    if (
      contract.status !== "COMPLETED" &&
      storedPin.length > 0 &&
      !isPartyAOrB &&
      inputPin.trim() !== storedPin
    ) {
      return NextResponse.json({
        success: true,
        requiresPin: true,
        pinError: inputPin.trim().length > 0 ? "임시 비밀번호가 일치하지 않습니다." : undefined,
        contract: {
          id: contract.id,
          title: contract.title,
          status: contract.status,
          partyAName: contract.party_a_name,
          partyACompany: contract.party_a_company,
          partyBName: contract.party_b_name,
          partyBCompany: contract.party_b_company,
          createdAt: contract.created_at,
        },
      });
    }

    return NextResponse.json({
      success: true,
      requiresPin: false,
      contract: {
        id: contract.id,
        templateId: contract.template_id,
        title: contract.title,
        status: contract.status,
        partyAName: contract.party_a_name,
        partyACompany: contract.party_a_company,
        partyABno: contract.party_a_bno,
        partyAPhone: contract.party_a_phone,
        partyASignature: contract.party_a_signature,
        partyASignedAt: contract.party_a_signed_at,
        partyBName: contract.party_b_name,
        partyBCompany: contract.party_b_company,
        partyBBno: contract.party_b_bno,
        partyBPhone: contract.party_b_phone,
        partyBSignature: contract.party_b_signature,
        partyBSignedAt: contract.party_b_signed_at,
        r2Key: contract.r2_key || "",
        formData:
          typeof contract.form_data === "string"
            ? JSON.parse(contract.form_data)
            : contract.form_data,
        createdAt: contract.created_at,
      },
    });
  } catch (err: any) {
    console.error("Failed to get contract:", err);
    return NextResponse.json({ error: "계약서 조회 실패: " + err.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;
    const body = await request.json();
    const { signatureImage, signerName, partyBUserId, action } = body;

    // 보관함 영구 등록 전용 액션 (을이 로그인 후 내 보관함에 묶기)
    if (action === "bind_user" && partyBUserId) {
      await bindUserToContract(token, partyBUserId, "B");
      return NextResponse.json({ success: true });
    }

    if (!token || !signatureImage) {
      return NextResponse.json(
        { error: "서명 데이터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    const existing = await getContractBySignToken(token);
    if (!existing) {
      return NextResponse.json({ error: "계약서를 찾을 수 없습니다." }, { status: 404 });
    }

    // Cloudflare R2에 체결 완료 최종본 스냅샷 영구 보관
    const r2Key = await uploadContractSnapshotToR2(existing.id, {
      id: existing.id,
      templateId: existing.template_id,
      title: existing.title,
      status: "COMPLETED",
      partyAName: existing.party_a_name,
      partyACompany: existing.party_a_company,
      partyABno: existing.party_a_bno,
      partyAPhone: existing.party_a_phone,
      partyASignature: existing.party_a_signature,
      partyASignedAt: existing.party_a_signed_at,
      partyAIp: existing.party_a_ip,
      partyBName: signerName || existing.party_b_name,
      partyBCompany: existing.party_b_company,
      partyBBno: existing.party_b_bno,
      partyBPhone: existing.party_b_phone,
      partyBSignature: signatureImage,
      partyBSignedAt: new Date().toISOString(),
      partyBIp: clientIp,
      formData:
        typeof existing.form_data === "string"
          ? JSON.parse(existing.form_data)
          : existing.form_data,
      completedAt: new Date().toISOString(),
    });

    const completed = await completePartyBSignature(
      token,
      signatureImage,
      clientIp,
      signerName,
      partyBUserId || "",
      r2Key || existing.r2_key || ""
    );

    if (!completed) {
      return NextResponse.json(
        { error: "해당 계약을 체결할 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contractId: completed.id,
      status: completed.status,
      signedAt: completed.party_b_signed_at,
      r2Key: completed.r2_key || "",
    });
  } catch (err: any) {
    console.error("Failed to complete contract:", err);
    return NextResponse.json(
      { error: "서명 처리 중 오류가 발생했습니다: " + err.message },
      { status: 500 }
    );
  }
}
