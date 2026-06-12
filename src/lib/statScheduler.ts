import { fetchPortalStatsFromAPI, PortalStats } from "./statApi";
import { getStatsHistory, upsertStatsHistory } from "./db";

export interface HistoryEntry extends PortalStats {
  date: string; // YYYY-MM-DD (KST)
}

// 오늘 날짜 문자열 반환 (KST 기준 YYYY-MM-DD)
export function getKSTDateString(dateObj: Date = new Date()): string {
  const kstDate = new Date(dateObj.getTime() + (9 * 60 * 60 * 1000));
  return kstDate.toISOString().split("T")[0];
}

// 한국 시간(KST) 다음 자정(24:00)까지 남은 밀리초 계산
function getMsUntilKSTMidnight(): number {
  const now = new Date();
  
  // KST 24:00은 UTC 15:00:00에 해당함
  const midnightKSTInUTC = new Date(now);
  midnightKSTInUTC.setUTCHours(15, 0, 0, 0); // 오늘 KST 24:00
  
  if (now.getTime() >= midnightKSTInUTC.getTime()) {
    midnightKSTInUTC.setUTCDate(midnightKSTInUTC.getUTCDate() + 1);
  }
  
  return midnightKSTInUTC.getTime() - now.getTime();
}

/**
 * 오늘 날짜의 스냅샷 데이터가 유실되었거나 최초 생성 시점이라면 즉시 스냅샷을 남깁니다.
 */
export async function recordSnapshotIfMissing(): Promise<void> {
  try {
    const todayStr = getKSTDateString();
    
    const history = await getStatsHistory();
    
    // 오늘 날짜 스냅샷이 이미 기록되어 있으면 스킵
    const exists = history.some(entry => entry.date === todayStr);
    if (exists) {
      return;
    }
    
    // 오늘의 실시간 공공 통계 데이터 조회 (API 직접 호출)
    const stats = await fetchPortalStatsFromAPI();
    
    const newEntry: HistoryEntry = {
      date: todayStr,
      ...stats
    };
    
    await upsertStatsHistory(newEntry);
    console.log(`[Scheduler] Successfully recorded daily stats snapshot in Neon DB for ${todayStr}`);
  } catch (error) {
    console.error("[Scheduler] Failed to record snapshot in Neon DB:", error);
  }
}

/**
 * 매일 자정 24:00 KST에 백그라운드에서 주기적으로 통계 스냅샷을 캡처하는 스케줄러를 작동시킵니다.
 */
let schedulerStarted = false;
export function startSnapshotScheduler(): void {
  if (typeof window !== "undefined") return; // 서버 측에서만 실행
  if (schedulerStarted) return;
  schedulerStarted = true;
  
  const setupNextTrigger = () => {
    const msToMidnight = getMsUntilKSTMidnight();
    const minutesToMidnight = Math.round(msToMidnight / 1000 / 60);
    console.log(`[Scheduler] Daily snapshot scheduled. Next execution in ${minutesToMidnight} minutes (at KST 24:00).`);
    
    setTimeout(async () => {
      console.log(`[Scheduler] KST Midnight (24:00) reached. Capturing snapshot...`);
      await recordSnapshotIfMissing();
      // 다음 날 자정 스케줄로 연쇄 등록
      setupNextTrigger();
    }, msToMidnight);
  };
  
  setupNextTrigger();
}

/**
 * 최근 N일간의 누적 히스토리 데이터를 비동기 조회하여 반환합니다.
 */
export async function getHistoryStats(daysLimit: number = 7): Promise<HistoryEntry[]> {
  try {
    const history = await getStatsHistory();
    
    // 날짜 오름차순 정렬 후 최근 N일 반환
    const sorted = history.sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-daysLimit);
  } catch (error) {
    console.error("[Scheduler] Failed to read history stats from Neon DB:", error);
    return [];
  }
}
