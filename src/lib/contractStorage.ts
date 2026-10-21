/**
 * 로컬스토리지 기반 무가입 계약서 캐싱 헬퍼
 * 사용자가 로그인하지 않아도 본인 기기에서 최근 작성/서명한 계약서 목록을 즉시 조회할 수 있도록 지원합니다.
 */

const STORAGE_KEY = "maumdata_recent_contracts_v1";

export function saveContractToLocal(contractId: string): void {
  if (typeof window === "undefined" || !contractId) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    // 중복 제거 및 맨 앞에 추가 (최신순)
    const filtered = list.filter((id) => id !== contractId);
    filtered.unshift(contractId);
    // 최대 50개 유지
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 50)));
  } catch (e) {
    console.warn("Failed to save contract to local storage", e);
  }
}

export function getLocalContractIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function removeContractFromLocal(contractId: string): void {
  if (typeof window === "undefined" || !contractId) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const list: string[] = JSON.parse(raw);
    const filtered = list.filter((id) => id !== contractId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}
