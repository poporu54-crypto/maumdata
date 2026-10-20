import { NextResponse, NextRequest } from "next/server";
import { getContractBySignToken, completePartyBSignature } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;

    if (!token) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 400 });
    }

    const contract = await getContractBySignToken(token);
    if (!contract) {
      return NextResponse.json({ error: "계약서를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
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
        formData: typeof contract.form_data === "string" ? JSON.parse(contract.form_data) : contract.form_data,
        createdAt: contract.created_at
      }
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
    const { signatureImage, signerName } = body;

    if (!token || !signatureImage) {
      return NextResponse.json(
        { error: "서명 데이터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    const completed = await completePartyBSignature(token, signatureImage, clientIp, signerName);
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
      signedAt: completed.party_b_signed_at
    });
  } catch (err: any) {
    console.error("Failed to complete contract:", err);
    return NextResponse.json(
      { error: "서명 처리 중 오류가 발생했습니다: " + err.message },
      { status: 500 }
    );
  }
}
