export interface FeaturedRivalryItem {
  pairSlug: string;
  bNoA: string;
  nameA: string;
  bNoB: string;
  nameB: string;
  categoryBadge: string;
  tagline: string;
}

/**
 * 모두 실DB에 검증 데이터가 수록된 대한민국 대표 라이벌 빅매치 10선
 */
export const FEATURED_RIVALRIES: readonly FeaturedRivalryItem[] = [
  {
    pairSlug: "1318627632-vs-1338123603",
    bNoA: "1318627632",
    nameA: "삼성바이오로직스",
    bNoB: "1338123603",
    nameB: "(주)셀트리온",
    categoryBadge: "🧬 K-바이오 대결",
    tagline: "국내 제약·바이오 투톱의 상시 임직원 · 추정 연봉 · 영업이익률 정면 비교",
  },
  {
    pairSlug: "1108128774-vs-1048153190",
    bNoA: "1108128774",
    nameA: "삼성에스디에스(주)",
    bNoB: "1048153190",
    nameB: "현대오토에버",
    categoryBadge: "💻 대기업 IT·SI 대결",
    tagline: "삼성 vs 현대차 그룹 핵심 IT·클라우드 계열사의 개발 인력·연봉·실적 비교",
  },
  {
    pairSlug: "1108114794-vs-1048117480",
    bNoA: "1108114794",
    nameA: "(주)대한항공",
    bNoB: "1048117480",
    nameB: "아시아나항공(주)",
    categoryBadge: "✈️ 국적 항공사 대결",
    tagline: "대형 국적 항공 양사의 임직원 규모 · 입퇴사율 · 결산 매출 및 부채비율 비교",
  },
  {
    pairSlug: "1248131282-vs-1248100979",
    bNoA: "1248131282",
    nameA: "삼성SDI",
    bNoB: "1248100979",
    nameB: "삼성전기",
    categoryBadge: "🔋 전자·배터리 대결",
    tagline: "이차전지 vs 첨단 전자부품 — 삼성 핵심 전자 계열사 간 연봉·고용·수익성 비교",
  },
  {
    pairSlug: "2208745316-vs-1058764746",
    bNoA: "2208745316",
    nameA: "(주)크래프톤",
    bNoB: "1058764746",
    nameB: "넷마블주식회사",
    categoryBadge: "🎮 대표 게임사 대결",
    tagline: "대한민국 메이저 게임사의 추정 평균연봉 · 영업이익률 · 인력 흐름 1:1 비교",
  },
  {
    pairSlug: "1048157667-vs-6208100900",
    bNoA: "1048157667",
    nameA: "한화오션",
    bNoB: "6208100900",
    nameB: "에이치디현대미포",
    categoryBadge: "🚢 K-조선·해양 대결",
    tagline: "글로벌 수주 호황을 이끄는 양대 조선사의 상시 인력·신규채용·매출 성장세 비교",
  },
  {
    pairSlug: "1108142397-vs-5138117175",
    bNoA: "1108142397",
    nameA: "한국항공우주",
    bNoB: "5138117175",
    nameB: "한화시스템",
    categoryBadge: "🛰️ K-방산·항공 대결",
    tagline: "KAI vs 한화시스템 — 대한민국 우주항공·방산 전자 대표 기업의 스펙 맞대결",
  },
  {
    pairSlug: "1248100998-vs-1268103725",
    bNoA: "1248100998",
    nameA: "삼성전자(주)",
    bNoB: "1268103725",
    nameB: "SK하이닉스",
    categoryBadge: "🔬 반도체 투톱 빅매치",
    tagline: "글로벌 메모리 반도체 양대 거인의 최근 3개년 결산 매출액·영업이익·이익률 비교",
  },
  {
    pairSlug: "2208162517-vs-1208147521",
    bNoA: "2208162517",
    nameA: "NAVER",
    bNoB: "1208147521",
    nameB: "카카오",
    categoryBadge: "🌐 빅테크 플랫폼 대결",
    tagline: "네카라쿠배 상징인 네이버 vs 카카오의 최근 3개년 매출·영업이익·재무건전성 비교",
  },
  {
    pairSlug: "1198102316-vs-1018116406",
    bNoA: "1198102316",
    nameA: "기아주식회사",
    bNoB: "1018116406",
    nameB: "현대모비스(주)",
    categoryBadge: "🚗 모빌리티 대결",
    tagline: "완성차 기아 vs 핵심 전장·모듈 현대모비스의 연봉·임직원·결산 실적 비교",
  },
] as const;

export function parseComparePairSlug(rawPair: string): { bNoA: string; bNoB: string } | null {
  if (!rawPair) return null;
  const decoded = decodeURIComponent(rawPair).trim();
  const match = decoded.match(/^(\d{10})-vs-(\d{10})$/i);
  if (!match) return null;
  if (match[1] === match[2]) return null;
  return { bNoA: match[1], bNoB: match[2] };
}
