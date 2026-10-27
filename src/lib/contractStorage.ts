/**
 * 마음데이타 전자계약 보관함: 회원 세션 & 로컬 캐싱 헬퍼
 */

const STORAGE_KEY = "maumdata_recent_contracts_v1";
const USER_STORAGE_KEY = "maumdata_contract_user_v1";

export interface ContractUser {
  id: string;
  email: string;
  name: string;
  company?: string;
  provider: "kakao" | "google" | "quick";
}

export function getLoggedInUser(): ContractUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLoggedInUser(user: ContractUser | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    window.dispatchEvent(new Event("maumdata-auth-change"));
  } catch (e) {
    console.warn("Failed to set user in local storage", e);
  }
}

export function saveContractToLocal(contractId: string): void {
  if (typeof window === "undefined" || !contractId) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((id) => id !== contractId);
    filtered.unshift(contractId);
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
