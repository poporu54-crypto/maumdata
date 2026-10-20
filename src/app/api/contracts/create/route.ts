import { NextResponse, NextRequest } from "next/server";
import { createContract } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      templateId,
      title,
      partyAName,
      partyACompany,
      partyABno,
      partyAPhone,
      partyAEmail,
      partyASignature,
      partyBName,
      partyBCompany,
      partyBBno,
      partyBPhone,
      partyBEmail,
      formData
    } = body;

    // 이메일 정보 formData에 보존
    const enrichedFormData = {
      ...formData,
      partyAEmail: partyAEmail || formData?.email || "",
      partyBEmail: partyBEmail || ""
    };

    if (!templateId || !title || !formData) {
      return NextResponse.json(
        { error: "필수 계약 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // IP 추출
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    // 고유 ID 및 서명 토큰 생성
    const contractId = `cnt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const signToken = `sig_${crypto.randomBytes(16).toString("hex")}`;

    const newContract = await createContract({
      id: contractId,
      templateId,
      title,
      partyAName,
      partyACompany,
      partyABno,
      partyAPhone,
      partyASignature,
      partyAIp: clientIp,
      partyBName,
      partyBCompany,
      partyBBno,
      partyBPhone,
      formData: enrichedFormData,
      signToken
    });

    const host = request.headers.get("host") || "www.maumdata.com";
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const signUrl = `${protocol}://${host}/sign/${signToken}`;

    return NextResponse.json({
      success: true,
      contractId,
      signToken,
      signUrl,
      title: newContract.title,
      status: newContract.status,
      createdAt: newContract.created_at
    });
  } catch (err: any) {
    console.error("Failed to create contract:", err);
    return NextResponse.json(
      { error: "계약서 생성 중 오류가 발생했습니다: " + err.message },
      { status: 500 }
    );
  }
}
