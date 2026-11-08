import { unstable_cache } from "next/cache";

export interface NearbyKakaoPlace {
  id: string;
  name: string;
  spotType: "restaurant" | "cafe";
  categoryLabel: string;
  address: string;
  phone: string | null;
  lat: number;
  lng: number;
  distanceMeters: number;
  walkMinutes: number;
  kakaoMapUrl: string;
  naverMapUrl: string;
}

export interface StayChartSynergyLink {
  url: string;
  label: string;
}

export interface NearbyDiningBundle {
  centerLat: number;
  centerLng: number;
  normalizedAddress: string;
  places: NearbyKakaoPlace[];
  staychartLink: StayChartSynergyLink;
}

const EXCLUDED_KEYWORDS = [
  "편의점",
  "구내식당",
  "장례식장",
  "어린이집",
  "유치원",
  "기숙사",
  "메가MGC",
  "메가커피",
  "컴포즈커피",
  "빽다방",
  "더벤티",
  "매머드",
  "롯데리아",
  "맥도날드",
  "버거킹",
  "KFC",
  "맘스터치",
  "써브웨이",
  "서브웨이",
  "한솥",
  "피자헛",
  "도미노피자",
];

function isExcludedPlace(name: string): boolean {
  const clean = name.trim();
  return EXCLUDED_KEYWORDS.some((kw) => clean.includes(kw));
}

/**
 * 괄호 부속주소·층·호수를 제거하여 동일 건물/도로명 단위로 캐시 적중률을 극대화합니다.
 */
export function normalizeAddressForGeocode(rawAddress: string): string {
  if (!rawAddress) return "";
  return rawAddress
    .replace(/\([^)]*\)/g, " ")
    .replace(/,.*$/, " ")
    .replace(/\s+\d+층.*$/, "")
    .replace(/\s+지하\s*\d+층.*$/, "")
    .replace(/\s+\d+호.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveStayChartSynergyLink(address: string): StayChartSynergyLink {
  if (address.includes("서울")) {
    return {
      url: "https://www.staychart.com/ko/destinations/seoul",
      label: "서울 출장·비즈니스 숙소 90일 최저가 차트 비교 (StayChart)",
    };
  }
  if (address.includes("부산")) {
    return {
      url: "https://www.staychart.com/ko/destinations/busan",
      label: "부산 출장·해운대 숙소 90일 최저가 차트 비교 (StayChart)",
    };
  }
  if (address.includes("제주")) {
    return {
      url: "https://www.staychart.com/ko/destinations/jeju",
      label: "제주 출장·워크샵 숙소 90일 최저가 차트 비교 (StayChart)",
    };
  }
  return {
    url: "https://www.staychart.com/ko/deals/korea-picks",
    label: "국내 주요 출장지 호텔·숙소 90일 가격 변동 확인 (StayChart)",
  };
}

function extractSubCategoryLabel(categoryName: string, spotType: "restaurant" | "cafe"): string {
  const parts = categoryName
    .split(">")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return parts.slice(1, 3).join(" · ");
  }
  return spotType === "cafe" ? "카페 · 미팅라운지" : "일반음식점";
}

async function fetchNearbyDiningUncached(
  normalizedQuery: string,
  radiusMeters: number
): Promise<NearbyDiningBundle | null> {
  const apiKey = (process.env.KAKAO_CLIENT_ID || process.env.KAKAO_REST_API_KEY || "").trim();
  if (!apiKey || !normalizedQuery || normalizedQuery.length < 4) {
    return null;
  }

  try {
    // 1. 도로명/행정동 주소 → 위경도 변환 (카카오 로컬 주소 검색, 없을 시 키워드 검색 폴백)
    let centerLat: number | null = null;
    let centerLng: number | null = null;

    const addrRes = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(normalizedQuery)}&size=1`,
      {
        headers: { Authorization: `KakaoAK ${apiKey}` },
        next: { revalidate: 86400 },
      }
    );

    if (addrRes.ok) {
      const addrJson = await addrRes.json();
      const first = addrJson?.documents?.[0];
      if (first?.x && first?.y) {
        centerLng = parseFloat(first.x);
        centerLat = parseFloat(first.y);
      }
    }

    if (centerLat === null || centerLng === null) {
      const kwRes = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(normalizedQuery)}&size=1`,
        {
          headers: { Authorization: `KakaoAK ${apiKey}` },
          next: { revalidate: 86400 },
        }
      );
      if (kwRes.ok) {
        const kwJson = await kwRes.json();
        const first = kwJson?.documents?.[0];
        if (first?.x && first?.y) {
          centerLng = parseFloat(first.x);
          centerLat = parseFloat(first.y);
        }
      }
    }

    if (
      centerLat === null ||
      centerLng === null ||
      !Number.isFinite(centerLat) ||
      !Number.isFinite(centerLng)
    ) {
      return null;
    }

    // 2. 반경 내 실제 영업 음식점(FD6) & 미팅하기 좋은 카페(CE7) 병렬 조회
    const [foodRes, cafeRes] = await Promise.all([
      fetch(
        `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=FD6&x=${centerLng}&y=${centerLat}&radius=${radiusMeters}&size=12&sort=accuracy`,
        {
          headers: { Authorization: `KakaoAK ${apiKey}` },
          next: { revalidate: 86400 },
        }
      ),
      fetch(
        `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=CE7&x=${centerLng}&y=${centerLat}&radius=${radiusMeters}&size=8&sort=accuracy`,
        {
          headers: { Authorization: `KakaoAK ${apiKey}` },
          next: { revalidate: 86400 },
        }
      ),
    ]);

    const foodDocs: any[] = foodRes.ok ? (await foodRes.json())?.documents || [] : [];
    const cafeDocs: any[] = cafeRes.ok ? (await cafeRes.json())?.documents || [] : [];

    const parseDocs = (docs: any[], spotType: "restaurant" | "cafe", cap: number): NearbyKakaoPlace[] => {
      const list: NearbyKakaoPlace[] = [];
      for (const d of docs) {
        if (list.length >= cap) break;
        const name = String(d.place_name || "").trim();
        if (!name || isExcludedPlace(name)) continue;

        const lat = parseFloat(d.y);
        const lng = parseFloat(d.x);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

        const dist = Math.max(20, parseInt(d.distance || "150", 10) || 150);
        const addr = String(d.road_address_name || d.address_name || "").trim();
        const kakaoUrl = String(d.place_url || "").replace(/^http:\/\//i, "https://");
        const naverQuery = `${addr.split(" ").slice(0, 2).join(" ")} ${name}`.trim();

        list.push({
          id: String(d.id),
          name,
          spotType,
          categoryLabel: extractSubCategoryLabel(String(d.category_name || ""), spotType),
          address: addr,
          phone: d.phone ? String(d.phone).trim() : null,
          lat,
          lng,
          distanceMeters: dist,
          walkMinutes: Math.max(1, Math.round(dist / 75)),
          kakaoMapUrl:
            kakaoUrl ||
            `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`,
          naverMapUrl: `https://map.naver.com/p/search/${encodeURIComponent(naverQuery)}`,
        });
      }
      return list;
    };

    const foods = parseDocs(foodDocs, "restaurant", 6);
    const cafes = parseDocs(cafeDocs, "cafe", 2);
    const combined = [...foods, ...cafes].sort((a, b) => a.distanceMeters - b.distanceMeters);

    // 가짜/폴백 데이터 금지 원칙: 실제 조회 결과가 없으면 null 반환
    if (combined.length === 0) {
      return null;
    }

    return {
      centerLat,
      centerLng,
      normalizedAddress: normalizedQuery,
      places: combined,
      staychartLink: resolveStayChartSynergyLink(normalizedQuery),
    };
  } catch (err) {
    console.warn("[NearbyPlacesApi] Kakao Local lookup failed:", err);
    return null;
  }
}

export async function getCachedNearbyDiningByAddress(
  rawAddress: string,
  radiusMeters = 600
): Promise<NearbyDiningBundle | null> {
  const normalized = normalizeAddressForGeocode(rawAddress);
  if (!normalized || normalized.length < 4) return null;

  const cachedFn = unstable_cache(
    () => fetchNearbyDiningUncached(normalized, radiusMeters),
    ["maumdata-nearby-dining:v1", normalized, String(radiusMeters)],
    { revalidate: 86400 }
  );

  return cachedFn();
}
