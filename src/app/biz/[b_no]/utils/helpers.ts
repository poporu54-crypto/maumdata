import React from "react";

// 단어의 마지막 글자 받침 유무에 따라 한글 조사 자동 선택
export function getJosa(word: string, josaType: "은는" | "이가" | "을를" | "과와" | "으로로"): string {
  if (!word) return "";
  const lastChar = word.charAt(word.length - 1);
  const charCode = lastChar.charCodeAt(0);

  let hasBatchim = false;

  if (charCode >= 0xAC00 && charCode <= 0xD7A3) {
    hasBatchim = (charCode - 0xAC00) % 28 > 0;
  } else if (/[0-9]/.test(lastChar)) {
    hasBatchim = /[136780]/.test(lastChar);
  } else if (/[a-zA-Z]/.test(lastChar)) {
    const lower = lastChar.toLowerCase();
    hasBatchim = /[lmnrx]/.test(lower);
  }

  const josaMap = {
    은는: hasBatchim ? "은" : "는",
    이가: hasBatchim ? "이" : "가",
    을를: hasBatchim ? "을" : "를",
    과와: hasBatchim ? "과" : "와",
    으로로: hasBatchim ? "으로" : "로"
  };

  if (josaType === "으로로" && hasBatchim) {
    const isRBatchim = (charCode - 0xAC00) % 28 === 8;
    if (isRBatchim) return "로";
  }

  return josaMap[josaType] || "";
}

// 텍스트 내의 은(는), 이(가), 을(를), 와(과) 등의 패턴을 올바른 조사로 치환
export function formatJosa(text?: string): string {
  if (!text) return "";
  return text
    .replace(/([가-힣a-zA-Z0-9]+)은\(는\)/g, (match, word) => word + getJosa(word, "은는"))
    .replace(/([가-힣a-zA-Z0-9]+)이\(가\)/g, (match, word) => word + getJosa(word, "이가"))
    .replace(/([가-힣a-zA-Z0-9]+)을\(를\)/g, (match, word) => word + getJosa(word, "을를"))
    .replace(/([가-힣a-zA-Z0-9]+)와\(과\)/g, (match, word) => word + getJosa(word, "과와"))
    .replace(/([가-힣a-zA-Z0-9]+)과\(와\)/g, (match, word) => word + getJosa(word, "과와"));
}

export const formatMoney = (val: number) => {
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  if (absVal >= 10000) {
    const jo = absVal / 10000;
    const formatted = jo % 1 === 0 ? jo.toFixed(0) : jo.toFixed(1);
    return `${isNegative ? "-" : ""}${formatted}조`;
  }
  return `${isNegative ? "-" : ""}${absVal.toLocaleString()}억`;
};

export const formatDate = (dateStr: string) => {
  if (!dateStr || dateStr.length !== 8) return dateStr || "-";
  return `${dateStr.slice(0, 4)}년 ${dateStr.slice(4, 6)}월 ${dateStr.slice(6, 8)}일`;
};

export const formatCrno = (crnoStr: string) => {
  if (!crnoStr) return "-";
  const clean = crnoStr.replace(/[^0-9]/g, "");
  if (clean.length === 13) {
    return `${clean.slice(0, 6)}-${clean.slice(6)}`;
  }
  return crnoStr;
};

export const formatSyncTime = (syncAt: any) => {
  if (!syncAt) return "방금 전 (실시간)";
  try {
    const d = new Date(syncAt);
    if (isNaN(d.getTime())) return "방금 전 (실시간)";
    
    // UTC+9(한국 표준시) 강제 적용을 위한 오프셋 연산
    const kstTime = d.getTime() + (9 * 60 * 60 * 1000);
    const kstDate = new Date(kstTime);
    
    // 1970년 등 미동기화 초기값의 경우 처리
    if (kstDate.getUTCFullYear() <= 1970) {
      return "미동기화 (대기 중)";
    }
    
    const year = kstDate.getUTCFullYear();
    const month = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
    const date = String(kstDate.getUTCDate()).padStart(2, "0");
    const hours = String(kstDate.getUTCHours()).padStart(2, "0");
    const minutes = String(kstDate.getUTCMinutes()).padStart(2, "0");
    
    return `${year}.${month}.${date} ${hours}:${minutes}`;
  } catch (e) {
    return "방금 전 (실시간)";
  }
};

export const formatEventDate = (dateStr: string) => {
  if (!dateStr || dateStr.length !== 8) return dateStr || "-";
  return `${dateStr.slice(0, 4)}년 ${dateStr.slice(4, 6)}월`;
};

