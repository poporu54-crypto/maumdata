import type { BusinessData } from "@/app/biz/[b_no]/utils/dataLoader";
import type { NtsCompanyStatus } from "@/lib/ntsApi";
import type { TemplateSummary } from "@/lib/formSummaries";

export const SITE_URL = "https://www.maumdata.com";
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export interface BreadcrumbItem {
  name: string;
  path: string;
}

function toAbsoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const normalized = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${normalized === "/" ? "" : normalized}`;
}

function cleanExternalHttpUrl(raw: string | undefined | null): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "-" || trimmed === "없음" || trimmed === "미상") {
    return undefined;
  }
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function isValidIsoDate(raw: string | undefined | null): boolean {
  return Boolean(raw && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim()));
}

function isMeaningfulText(raw: string | undefined | null): raw is string {
  if (!raw || typeof raw !== "string") return false;
  const t = raw.trim();
  if (!t) return false;
  const invalidTokens = new Set([
    "-",
    "미상",
    "정보 없음",
    "(정보 없음)",
    "미등록 업종",
    "상호 정보 없음",
    "상호 미등록 사업자",
    "주소 정보 없음 (공시 비대상)",
  ]);
  return !invalidTokens.has(t);
}

/**
 * 1. 사이트 전역 Knowledge Graph (`Organization` + `WebSite` + `SearchAction`)
 */
export function buildSiteGraphJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: "마음데이타 (MaumData)",
        legalName: "지윤 주식회사",
        alternateName: ["마음데이타", "MaumData", "마음데이터"],
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
        },
        taxID: "137-86-51839",
        email: "poporu54@gmail.com",
        founder: {
          "@type": "Person",
          name: "박상욱",
        },
        areaServed: {
          "@type": "Country",
          name: "KR",
        },
        knowsAbout: [
          "사업자등록번호 실시간 상태 조회",
          "대한민국 법인 재무 및 국민연금 고용 분석",
          "DART 전자공시 · 나라장터 입찰 · 특허 분석",
          "국가 사업체 통계 및 전국 행정동 상권 분석",
          "무료 표준 계약서 · 비즈니스 문서 웹 작성 및 전자서명",
        ],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: "마음데이타 (MaumData)",
        alternateName: ["마음데이타", "MaumData", "마음데이터 기업분석 포털"],
        description:
          "국세청 실시간 사업자 상태 조회, 국민연금 임직원·채용 추이, DART 결산 재무·전자공시, 전국 상권 통계 및 300여 종 무료 표준 서식 웹 에디터를 제공하는 민간 기업 데이터 포털",
        inLanguage: "ko-KR",
        publisher: {
          "@id": ORG_ID,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

/**
 * 2. 표준 BreadcrumbList 생성기
 */
export function buildBreadcrumbNode(items: BreadcrumbItem[], idSuffix?: string) {
  return {
    "@type": "BreadcrumbList",
    ...(idSuffix ? { "@id": `${SITE_URL}${idSuffix}#breadcrumb` } : {}),
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

/**
 * 3. 메인 홈 페이지 (`WebPage` + 실시간 많이 찾는 검증 기업 `ItemList`)
 */
export function buildHomePageJsonLd(params: {
  quickLinks: Array<{ no: string; name: string }>;
  activeBizCount: number;
  totalTrackedEmployees: number;
}) {
  const { quickLinks, activeBizCount, totalTrackedEmployees } = params;

  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: "마음데이타(MaumData) — 대한민국 기업 데이터 조회 · 상권 통계 · 무료 서식 포털",
      description: `국세청 검증 계속사업자 ${activeBizCount.toLocaleString("ko-KR")}개사 및 국민연금 가입 임직원 ${totalTrackedEmployees.toLocaleString("ko-KR")}명 실데이터 기반 사업자 상태 조회, 기업 재무·고용 분석, 상권 통계, 300+종 무료 문서 서식 웹 작성 서비스`,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORG_ID },
      inLanguage: "ko-KR",
    },
  ];

  if (quickLinks.length > 0) {
    graph.push({
      "@type": "ItemList",
      "@id": `${SITE_URL}/#popular-companies`,
      name: "실시간 많이 찾는 주요 기업 정보",
      numberOfItems: quickLinks.length,
      itemListElement: quickLinks.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: `${SITE_URL}/biz/${item.no}`,
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

/**
 * 4. 기업 상세 페이지 (`/biz/[b_no]`) — 실제 검증된 데이터만 매핑하는 정밀 기업 엔티티 그래프
 */
export function buildBusinessDetailJsonLd(params: {
  cleanBNo: string;
  formattedBNo: string;
  business: BusinessData | null | undefined;
  apiStatus: NtsCompanyStatus | null | undefined;
  isInvalid: boolean;
  latestEmployees: number;
  formattedFoundingDt?: string;
  dartCode?: string | null;
}) {
  const {
    cleanBNo,
    formattedBNo,
    business,
    apiStatus,
    isInvalid,
    latestEmployees,
    formattedFoundingDt,
    dartCode,
  } = params;

  if (isInvalid || !business || !isMeaningfulText(business.b_nm)) {
    return null;
  }

  const pagePath = `/biz/${cleanBNo}`;
  const pageUrl = `${SITE_URL}${pagePath}`;
  const companyId = `${pageUrl}#company`;

  const rawCrno = (business.crno || business.corp_no || "").replace(/[^0-9]/g, "");
  const formattedCrno =
    rawCrno.length === 13 ? `${rawCrno.slice(0, 6)}-${rawCrno.slice(6)}` : undefined;

  const isCorporation = Boolean(
    formattedCrno ||
      /주식회사|\(주\)|㈜|유한회사|유한책임회사|합자회사|합명회사|사단법인|재단법인|학교법인|의료법인|농업회사법인|어업회사법인/.test(
        business.b_nm
      ) ||
      (business.listing_status && business.listing_status !== "비상장" && business.listing_status !== "-")
  );

  // 별칭(브랜드명 / 영문 법인명) 정제
  const aliasSet = new Set<string>();
  if (isMeaningfulText(business.corpEnm)) {
    aliasSet.add(business.corpEnm.trim());
  }
  if (isMeaningfulText(business.brand_name)) {
    for (const token of business.brand_name.split(",")) {
      const t = token.trim();
      if (t && t !== business.b_nm) aliasSet.add(t);
    }
  }
  const alternateNames = Array.from(aliasSet);

  // 다중 고유 식별자 (사업자등록번호 / 법인등록번호 / DART 고유번호 / 통신판매업번호)
  const identifiers: Array<Record<string, string>> = [
    {
      "@type": "PropertyValue",
      propertyID: "KR-BRN",
      name: "사업자등록번호",
      value: formattedBNo,
    },
  ];
  if (formattedCrno) {
    identifiers.push({
      "@type": "PropertyValue",
      propertyID: "KR-CRN",
      name: "법인등록번호",
      value: formattedCrno,
    });
  }
  if (dartCode && /^\d{8}$/.test(dartCode)) {
    identifiers.push({
      "@type": "PropertyValue",
      propertyID: "KR-DART",
      name: "금융감독원 DART 고유번호",
      value: dartCode,
    });
  }
  if (isMeaningfulText(business.mailOrderNo)) {
    identifiers.push({
      "@type": "PropertyValue",
      propertyID: "KR-MAIL-ORDER",
      name: "통신판매업신고번호",
      value: business.mailOrderNo.trim(),
    });
  }

  // 화면에 실제 노출되는 정량·상태 속성
  const ntsStatus = apiStatus?.b_stt || business.bStt || "계속사업자";
  const taxType = apiStatus?.tax_type || business.taxType || "";
  const additionalProperties: Array<Record<string, unknown>> = [
    {
      "@type": "PropertyValue",
      name: "국세청 납세자 상태",
      value: ntsStatus,
    },
  ];
  if (isMeaningfulText(taxType)) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "과세유형",
      value: taxType,
    });
  }
  if (isMeaningfulText(business.b_sector)) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "주요 업종",
      value: business.b_sector.trim(),
    });
  }
  if (isMeaningfulText(business.is_sme)) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "기업 규모",
      value: business.is_sme.trim(),
    });
  }
  if (isMeaningfulText(business.listing_status)) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "상장 구분",
      value: business.listing_status.trim(),
    });
  }

  // 추정치가 아닌 실제 수집 결산 재무가 있을 때만 매출액 포함
  const latestFin =
    business.dataSource !== "estimated" &&
    Array.isArray(business.history) &&
    business.history.length > 0
      ? business.history[business.history.length - 1]
      : null;

  if (latestFin && typeof latestFin.revenue === "number" && latestFin.revenue > 0) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: `${latestFin.year}년 매출액`,
      value: latestFin.revenue,
      unitText: "억원 (KRW 100M)",
    });
  }

  const rawPhone = business.enpTlno || business.telNo;
  const cleanPhone = isMeaningfulText(rawPhone) ? rawPhone.trim() : undefined;
  const cleanHomepage = cleanExternalHttpUrl(business.homepage);
  const rawZip = business.zipCd || business.enpPncd;
  const cleanZip = isMeaningfulText(rawZip) ? rawZip.trim() : undefined;

  const companyNode: Record<string, unknown> = {
    "@type": isCorporation ? "Corporation" : "Organization",
    "@id": companyId,
    name: business.b_nm,
    legalName: business.b_nm,
    ...(alternateNames.length > 0 ? { alternateName: alternateNames } : {}),
    url: pageUrl,
    taxID: formattedBNo,
    identifier: identifiers,
    ...(formattedFoundingDt ? { foundingDate: formattedFoundingDt } : {}),
    ...(isMeaningfulText(business.p_nm)
      ? {
          employee: {
            "@type": "Person",
            name: business.p_nm.trim(),
            jobTitle: "대표자",
          },
        }
      : {}),
    ...(isMeaningfulText(business.b_adr)
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: business.b_adr.trim(),
            addressRegion: business.b_adr.trim().split(/\s+/)[0],
            ...(cleanZip ? { postalCode: cleanZip } : {}),
            addressCountry: "KR",
          },
        }
      : {}),
    ...(cleanPhone ? { telephone: cleanPhone } : {}),
    ...(cleanHomepage ? { sameAs: [cleanHomepage] } : {}),
    ...(latestEmployees > 0
      ? {
          numberOfEmployees: {
            "@type": "QuantitativeValue",
            value: latestEmployees,
          },
        }
      : {}),
    ...(isMeaningfulText(business.description)
      ? { description: business.description.trim() }
      : {
          description: `${business.b_nm}(사업자등록번호 ${formattedBNo})의 국세청 실시간 납세상태(${ntsStatus}), 업종, 소재지, 재무 및 국민연금 고용 분석 정보`,
        }),
    additionalProperty: additionalProperties,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      companyNode,
      {
        "@type": "ProfilePage",
        "@id": pageUrl,
        url: pageUrl,
        name: `${business.b_nm} (${formattedBNo}) 기업정보 및 실시간 사업자 상태`,
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
        mainEntity: { "@id": companyId },
        inLanguage: "ko-KR",
      },
      buildBreadcrumbNode(
        [
          { name: "홈", path: "/" },
          { name: "기업 · 사업자 통합검색", path: "/search" },
          { name: `${business.b_nm} (${formattedBNo})`, path: pagePath },
        ],
        pagePath
      ),
    ],
  };
}

/**
 * 5. 무료 서식 센터 메인 카탈로그 (`/form`)
 */
export function buildFormCatalogJsonLd(summaries: TemplateSummary[]) {
  const featured = summaries.filter((s) => s.popular).slice(0, 24);
  const listSource = featured.length > 0 ? featured : summaries.slice(0, 24);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/form#collection`,
        url: `${SITE_URL}/form`,
        name: "마음데이타 스마트 무료 서식 센터",
        description: `근로계약서, 사직서, 견적서, 발주서, 차용증, 위임장 등 총 ${summaries.length}종의 표준 비즈니스·법률·행정 서식을 회원가입 없이 웹에서 작성하고 A4 PDF·HWP·DOC 저장 및 비대면 전자서명까지 지원하는 무료 문서 포털`,
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
        inLanguage: "ko-KR",
        isAccessibleForFree: true,
        mainEntity: {
          "@type": "ItemList",
          name: "인기 무료 표준 문서 서식 목록",
          numberOfItems: summaries.length,
          itemListElement: listSource.map((tpl, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            name: `${tpl.title} 무료 양식`,
            url: `${SITE_URL}/form/${tpl.id}`,
          })),
        },
      },
      buildBreadcrumbNode(
        [
          { name: "홈", path: "/" },
          { name: "무료 서식 센터", path: "/form" },
        ],
        "/form"
      ),
    ],
  };
}

/**
 * 6. 무료 서식 태그별 모음 페이지 (`/form/tag/[tag]`)
 */
export function buildFormTagJsonLd(decodedTag: string, matched: TemplateSummary[]) {
  if (matched.length === 0) return null;
  const pagePath = `/form/tag/${encodeURIComponent(decodedTag)}`;
  const topItems = matched.slice(0, 24);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}${pagePath}#collection`,
        url: `${SITE_URL}${pagePath}`,
        name: `무료 ${decodedTag} 표준 서식 · 양식 모음`,
        description: `${decodedTag} 관련 표준 문서 양식 ${matched.length}종을 회원가입 없이 웹에서 바로 작성하고 A4 PDF·한글·워드로 즉시 저장하세요.`,
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
        inLanguage: "ko-KR",
        isAccessibleForFree: true,
        mainEntity: {
          "@type": "ItemList",
          name: `${decodedTag} 관련 무료 서식 목록`,
          numberOfItems: matched.length,
          itemListElement: topItems.map((tpl, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            name: `${tpl.title} 양식`,
            url: `${SITE_URL}/form/${tpl.id}`,
          })),
        },
      },
      buildBreadcrumbNode(
        [
          { name: "홈", path: "/" },
          { name: "무료 서식 센터", path: "/form" },
          { name: `${decodedTag} 서식 모음`, path: pagePath },
        ],
        pagePath
      ),
    ],
  };
}

/**
 * 7. 무료 서식 상세 에디터 (`/form/[templateId]`) — `DigitalDocument` + 무료 `WebApplication` + `BreadcrumbList`
 */
export function buildFormDetailJsonLd(params: {
  templateId: string;
  title: string;
  desc?: string;
  category: string;
  tags?: string[];
}) {
  const { templateId, title, desc, category, tags = [] } = params;
  const pagePath = `/form/${templateId}`;
  const pageUrl = `${SITE_URL}${pagePath}`;
  const description =
    desc ||
    `${title} 표준 양식을 회원가입 없이 웹에서 실시간 작성하고 A4 규격 PDF 인쇄, HWP·DOC 다운로드, 비대면 전자서명까지 무료로 이용할 수 있는 온라인 문서 작성 도구입니다.`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "DigitalDocument",
        "@id": `${pageUrl}#document`,
        name: `${title} 표준 양식`,
        description,
        url: pageUrl,
        inLanguage: "ko-KR",
        isAccessibleForFree: true,
        genre: category,
        ...(tags.length > 0 ? { keywords: tags.join(", ") } : {}),
        encodingFormat: [
          "application/pdf",
          "application/msword",
          "application/x-hwp",
        ],
        publisher: { "@id": ORG_ID },
      },
      {
        "@type": "WebApplication",
        "@id": `${pageUrl}#webapp`,
        name: `무료 ${title} 웹 자동작성 에디터`,
        description,
        url: pageUrl,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, Windows, macOS, iOS, Android",
        inLanguage: "ko-KR",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "KRW",
        },
        featureList: [
          "회원가입·설치 없이 웹 브라우저 즉시 작성",
          "A4 규격 맞춤 PDF 저장 및 인쇄",
          "한글(HWP 호환) · 워드(DOC) 문서 다운로드",
          "자필 전자서명 · 법인/개인 자동 인감도장 날인",
          "카카오톡 · 링크 기반 비대면 전자계약 서명 요청",
        ],
        publisher: { "@id": ORG_ID },
      },
      buildBreadcrumbNode(
        [
          { name: "홈", path: "/" },
          { name: "무료 서식 센터", path: "/form" },
          { name: `${category} 서식`, path: `/form/tag/${encodeURIComponent(category)}` },
          { name: `${title} 양식`, path: pagePath },
        ],
        pagePath
      ),
    ],
  };
}

/**
 * 8. 공공·실데이터 통계 리포트 공통 `Dataset` + `BreadcrumbList` 생성기
 */
export function buildStatsDatasetJsonLd(params: {
  path: string;
  name: string;
  description: string;
  keywords: string[];
  spatialName?: string;
  dateModified?: string | null;
  basedOnSources: Array<{ name: string; url: string }>;
  variables: Array<{ name: string; value?: string | number; unitText?: string }>;
  breadcrumbs: BreadcrumbItem[];
}) {
  const {
    path,
    name,
    description,
    keywords,
    spatialName = "대한민국 (Republic of Korea)",
    dateModified,
    basedOnSources,
    variables,
    breadcrumbs,
  } = params;

  const pageUrl = toAbsoluteUrl(path);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Dataset",
        "@id": `${pageUrl}#dataset`,
        name,
        description,
        url: pageUrl,
        inLanguage: "ko-KR",
        isAccessibleForFree: true,
        license: `${SITE_URL}/terms`,
        keywords,
        creator: { "@id": ORG_ID },
        publisher: { "@id": ORG_ID },
        spatialCoverage: {
          "@type": "Place",
          name: spatialName,
        },
        ...(isValidIsoDate(dateModified) ? { dateModified: dateModified!.trim() } : {}),
        isBasedOn: basedOnSources.map((src) => ({
          "@type": "CreativeWork",
          name: src.name,
          url: src.url,
        })),
        variableMeasured: variables.map((v) => ({
          "@type": "PropertyValue",
          name: v.name,
          ...(v.value !== undefined ? { value: v.value } : {}),
          ...(v.unitText ? { unitText: v.unitText } : {}),
        })),
      },
      buildBreadcrumbNode(breadcrumbs, path),
    ],
  };
}

/**
 * 9. 전국 상권 분석 메인 허브 (`/stats/market-area`)
 */
export function buildMarketAreaHubJsonLd(
  featuredDongs: Array<{ cd: string; name: string; gu: string }>
) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/stats/market-area#collection`,
        url: `${SITE_URL}/stats/market-area`,
        name: "전국 행정동 상권 분석 메인 허브",
        description:
          "소상공인시장진흥공단 상가(상권) 공공데이터를 기반으로 전국 7대 권역 주요 행정동의 업종별 점포 분포, 상권 밀집도, 지도 위치를 분석하는 빅데이터 디렉토리입니다.",
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
        inLanguage: "ko-KR",
        isAccessibleForFree: true,
        mainEntity: {
          "@type": "ItemList",
          name: "대한민국 주요 핵심 분석 상권 목록",
          numberOfItems: featuredDongs.length,
          itemListElement: featuredDongs.map((dong, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            name: `${dong.gu} ${dong.name} 상권 분석 리포트`,
            url: `${SITE_URL}/stats/market-area/${dong.cd}`,
          })),
        },
      },
      buildBreadcrumbNode(
        [
          { name: "홈", path: "/" },
          { name: "전국 상권 분석 허브", path: "/stats/market-area" },
        ],
        "/stats/market-area"
      ),
    ],
  };
}
