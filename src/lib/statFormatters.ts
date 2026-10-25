const NON_STANDARD_SECTORS = new Set([
  "",
  "-",
  "상장 법인",
  "상장법인",
  "BIZ_NO미존재사업장",
  "미등록 업종",
  "미등록업종",
  "일반기업",
  "중소기업",
  "대기업",
  "중견기업",
]);

/**
 * 비표준 업종 문자열을 사용자 친화적인 정식 라벨로 정제합니다.
 */
export function sanitizeSectorLabel(raw?: string | null): string {
  const cleaned = String(raw || "")
    .replace(/&nbsp;?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || NON_STANDARD_SECTORS.has(cleaned)) {
    return "법인 사업장";
  }
  return cleaned;
}

/**
 * 주소 문자열에서 시·도 + 시·군·구 핵심 권역명을 깔끔하게 추출합니다.
 */
export function extractShortRegion(rawAdr?: string | null): string {
  const cleaned = String(rawAdr || "")
    .replace(/&nbsp;?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned === "-") return "-";
  const parts = cleaned.split(" ").filter(Boolean);
  return parts.slice(0, 2).join(" ");
}

/**
 * YYYYMMDD 문자열을 YYYY.MM.DD 형식으로 변환합니다.
 */
export function formatStartDt(raw?: string | null): string {
  const cleaned = String(raw || "").replace(/[^0-9]/g, "");
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}.${cleaned.slice(4, 6)}.${cleaned.slice(6, 8)}`;
  }
  return "-";
}

/**
 * 사업자등록번호 10자리를 000-00-00000 형식으로 포맷팅합니다.
 */
export function formatBizNo(raw?: string | null): string {
  const clean = String(raw || "").replace(/[^0-9]/g, "");
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5)}`;
  }
  return String(raw || "");
}

/**
 * DB 재무제표 단위(억 원)를 한국어 조·억 단위로 정확하게 변환합니다.
 */
export function formatEokToKorean(eokValue?: number | null): string {
  if (eokValue === null || eokValue === undefined || Number.isNaN(eokValue)) {
    return "-";
  }
  const sign = eokValue < 0 ? "-" : "";
  const abs = Math.abs(eokValue);

  if (abs >= 10000) {
    const jo = Math.floor(abs / 10000);
    const remEok = Math.round(abs % 10000);
    if (remEok === 10000) {
      return `${sign}${(jo + 1).toLocaleString("ko-KR")}조 원`;
    }
    if (remEok === 0) {
      return `${sign}${jo.toLocaleString("ko-KR")}조 원`;
    }
    return `${sign}${jo.toLocaleString("ko-KR")}조 ${remEok.toLocaleString("ko-KR")}억 원`;
  }

  if (abs >= 100) {
    return `${sign}${Math.round(abs).toLocaleString("ko-KR")}억 원`;
  }

  return `${sign}${abs.toFixed(1)}억 원`;
}
