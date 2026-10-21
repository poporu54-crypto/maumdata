import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 S3 호환 클라이언트 인스턴스 팩토리
 */
export function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID || "3b3de142e88f664c31f69df369d37b2d";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";

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
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    console.warn("[R2] R2 키가 설정되지 않아 업로드를 건너뜁니다.");
    return null;
  }

  const key = `contracts/${contractId}.pdf`;
  const client = getR2Client();

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      })
    );
    console.log(`[R2] 계약서 PDF 업로드 성공: ${key}`);
    return key;
  } catch (err) {
    console.error("[R2] PDF 업로드 실패:", err);
    return null;
  }
}

/**
 * 계약서 불변 원본 스냅샷(서명 이미지, 감사 로그, 전체 본문 데이터)을 Cloudflare R2에 영구 보관합니다.
 */
export async function uploadContractSnapshotToR2(
  contractId: string,
  snapshotData: any
): Promise<string | null> {
  const bucketName = process.env.R2_BUCKET_NAME || "maumdata";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  const key = `contracts/${contractId}.json`;
  const client = getR2Client();

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
      })
    );
    console.log(`[R2] 계약서 영구 스냅샷 보관 성공: ${key}`);
    return key;
  } catch (err) {
    console.error("[R2] 스냅샷 보관 실패:", err);
    return null;
  }
}
