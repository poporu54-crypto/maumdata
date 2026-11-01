import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 S3 호환 클라이언트 인스턴스 팩토리
 */
export function getR2Client(): S3Client | null {
  const accountId = (process.env.R2_ACCOUNT_ID || "").trim();
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * 계약서 PDF를 Cloudflare R2의 contracts/ 폴더에 안전하게 영구 저장합니다.
 */
export async function uploadContractPdfToR2(
  contractId: string,
  pdfBuffer: Buffer
): Promise<string | null> {
  const bucketName = process.env.R2_BUCKET_NAME || "maumdata";
  const client = getR2Client();

  if (!client) {
    return null;
  }

  const key = `contracts/${contractId}.pdf`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      })
    );
    return key;
  } catch (err) {
    console.error("[R2] PDF 업로드 실패:", err);
    return null;
  }
}

/**
 * 계약서 불변 원본 스냅샷(서명 이미지, 감사 로그, 전체 본문 데이터)을 Cloudflare R2에 영구 보관합니다.
 * 체결 완료본(COMPLETED)은 별도 불변 키에 조건부 쓰기(IfNoneMatch: "*")로 덮어쓰기를 원천 차단합니다.
 */
export async function uploadContractSnapshotToR2(
  contractId: string,
  snapshotData: any
): Promise<string | null> {
  const bucketName = process.env.R2_BUCKET_NAME || "maumdata";
  const client = getR2Client();

  if (!client) {
    return null;
  }

  const isCompleted = snapshotData?.status === "COMPLETED";
  const key = isCompleted
    ? `contracts/${contractId}/completed.json`
    : `contracts/${contractId}/created.json`;

  try {
    const bodyStr = JSON.stringify(
      {
        ...snapshotData,
        archivedAt: new Date().toISOString(),
        platform: "MaumData E-Contract Vault",
      },
      null,
      2
    );

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: Buffer.from(bodyStr, "utf-8"),
        ContentType: "application/json; charset=utf-8",
        ...(isCompleted ? { IfNoneMatch: "*" } : {}),
      })
    );
    return key;
  } catch (err) {
    console.error("[R2] 스냅샷 보관 실패:", err);
    return null;
  }
}
