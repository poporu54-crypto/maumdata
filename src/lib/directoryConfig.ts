export type DirectoryHubKind = "ranking" | "region" | "industry";

export interface RankingHubMeta {
  slug: string;
  kind: "ranking";
  title: string;
  shortTitle: string;
  badge: string;
  emoji: string;
  subtitle: string;
  seoDescription: string;
  primaryMetricLabel: string;
}

export interface RegionHubMeta {
  slug: string;
  kind: "region";
  title: string;
  shortTitle: string;
  areaLabel: string;
  emoji: string;
  subtitle: string;
  seoDescription: string;
}

export interface IndustryHubMeta {
  slug: string;
  kind: "industry";
  title: string;
  shortTitle: string;
  emoji: string;
  subtitle: string;
  seoDescription: string;
}

export type AnyHubMeta = RankingHubMeta | RegionHubMeta | IndustryHubMeta;

export const RANKING_HUBS: readonly RankingHubMeta[] = [
  {
    slug: "top-salary",
    kind: "ranking",
    title: "국민연금 추정 평균연봉 상위 기업 Top 80",
    shortTitle: "평균연봉 상위 기업",
    badge: "연봉 리더보드",
    emoji: "💰",
    subtitle:
      "상시 가입자 10인 이상 계속사업자 중 국민연금 당월 고지액(요율 9%) 역산 기준 추정 평균연봉 최상위 기업 목록입니다.",
    seoDescription:
      "국민연금 사업장 고지금액 실데이터를 기반으로 역산한 대한민국 추정 평균연봉 상위 기업 순위와 상시 근로자·입퇴사 현황 리포트입니다.",
    primaryMetricLabel: "추정 평균연봉",
  },
  {
    slug: "hiring-surge",
    kind: "ranking",
    title: "신규 채용 급증 성장기업 Top 80",
    shortTitle: "신규 채용 급증 기업",
    badge: "채용 급성장",
    emoji: "🚀",
    subtitle:
      "국민연금 최신 고지월 기준 신규 취득(입사) 인원이 가장 활발하게 늘어난 채용 주도 기업 리더보드입니다.",
    seoDescription:
      "최근 국민연금 신규 취득자(입사자) 실데이터 기준으로 인재 채용을 가장 적극적으로 확대하고 있는 계속사업자 상위 80개사 순위입니다.",
    primaryMetricLabel: "당월 신규입사",
  },
  {
    slug: "top-employers",
    kind: "ranking",
    title: "대한민국 고용 규모(상시 임직원) 상위 기업 Top 80",
    shortTitle: "임직원 규모 상위",
    badge: "고용 메이저",
    emoji: "🏢",
    subtitle:
      "국민연금공단 사업장 가입자 수 실데이터 기준 국내 일자리를 가장 많이 책임지고 있는 대규모 고용 기업 순위입니다.",
    seoDescription:
      "국민연금 사업장 상시 가입자 수 실데이터로 집계한 대한민국 임직원 규모 상위 80대 기업 현황 및 입퇴사·재무 지표입니다.",
    primaryMetricLabel: "상시 임직원",
  },
  {
    slug: "top-revenue",
    kind: "ranking",
    title: "공식 결산 매출액 상위 기업 Top 80",
    shortTitle: "매출액 상위 기업",
    badge: "매출 리더보드",
    emoji: "📈",
    subtitle:
      "금융감독원 DART 및 금융위원회 공식 결산 재무제표 기준 연매출 규모 최상위 검증 법인 리더보드입니다.",
    seoDescription:
      "DART 전자공시 및 금융위 기업재무 실데이터를 기반으로 집계한 대한민국 결산 매출액 상위 80대 기업 순위와 영업이익·고용 지표입니다.",
    primaryMetricLabel: "최근 결산매출",
  },
  {
    slug: "top-profit",
    kind: "ranking",
    title: "결산 영업이익 상위 알짜 흑자기업 Top 80",
    shortTitle: "영업이익 알짜 기업",
    badge: "수익성 리더",
    emoji: "💎",
    subtitle:
      "외형 매출을 넘어 실제 본업에서 창출한 결산 영업이익과 영업이익률이 검증된 우량 흑자 법인 순위입니다.",
    seoDescription:
      "공식 결산 재무제표 기준 영업이익 규모가 가장 우수한 대한민국 알짜 흑자 기업 상위 80개사의 영업이익률·매출·임직원 분석 리포트입니다.",
    primaryMetricLabel: "최근 영업이익",
  },
  {
    slug: "kospi-leaders",
    kind: "ranking",
    title: "코스피(KOSPI) 유가증권시장 상장기업 리더보드",
    shortTitle: "코스피(KOSPI) 상장사",
    badge: "유가증권시장",
    emoji: "🏛️",
    subtitle:
      "유가증권시장(KOSPI)에 상장된 대표 계속사업자 중 고용 규모와 결산 실적이 검증된 주요 상장법인 디렉토리입니다.",
    seoDescription:
      "대한민국 코스피(KOSPI) 상장기업의 사업자등록 상태, 국민연금 임직원 수, 추정 평균연봉 및 최근 결산 매출·영업이익 통합 디렉토리입니다.",
    primaryMetricLabel: "상시 임직원 · 매출",
  },
  {
    slug: "kosdaq-leaders",
    kind: "ranking",
    title: "코스닥(KOSDAQ) 혁신·기술 상장기업 리더보드",
    shortTitle: "코스닥(KOSDAQ) 상장사",
    badge: "코스닥 상장",
    emoji: "⚡",
    subtitle:
      "코스닥(KOSDAQ) 시장에 상장된 IT·바이오·반도체·소부장 강소 상장법인의 고용·연봉·재무 실데이터 디렉토리입니다.",
    seoDescription:
      "코스닥(KOSDAQ) 상장법인의 실시간 계속사업자 여부, 국민연금 임직원·신규채용 추이, 추정 평균연봉 및 결산 재무 순위 리포트입니다.",
    primaryMetricLabel: "상시 임직원 · 매출",
  },
] as const;

export const REGION_HUBS: readonly RegionHubMeta[] = [
  {
    slug: "seoul-gangnam",
    kind: "region",
    title: "서울 강남 · 테헤란로 주요 기업 디렉토리",
    shortTitle: "서울 강남 · 테헤란로",
    areaLabel: "서울특별시 강남구",
    emoji: "🏙️",
    subtitle:
      "테헤란로·역삼·삼성·논현 권역에 본사를 둔 IT 플랫폼, 게임, 바이오, 금융·컨설팅 주요 검증 기업 목록입니다.",
    seoDescription:
      "서울 강남구(테헤란로·역삼·삼성) 소재 주요 계속사업자 기업의 임직원 수, 국민연금 추정 평균연봉, 매출액 및 채용 현황 디렉토리입니다.",
  },
  {
    slug: "gyeonggi-pangyo",
    kind: "region",
    title: "판교 테크노밸리 · 분당 주요 기업 디렉토리",
    shortTitle: "판교 · 분당",
    areaLabel: "성남시 분당구 · 수정구",
    emoji: "💻",
    subtitle:
      "대한민국 대표 R&D·IT 클러스터인 판교 제1·2테크노밸리 및 분당 권역 소재 핵심 기술·플랫폼 기업 목록입니다.",
    seoDescription:
      "경기도 성남시 판교 테크노밸리·분당구 소재 IT·게임·반도체·바이오 기업의 상시 임직원, 추정 평균연봉, 결산 매출 순위 리포트입니다.",
  },
  {
    slug: "seoul-yeongdeungpo",
    kind: "region",
    title: "서울 여의도 · 영등포 주요 기업 디렉토리",
    shortTitle: "서울 여의도 · 영등포",
    areaLabel: "서울특별시 영등포구",
    emoji: "🏦",
    subtitle:
      "여의도 금융중심지 및 영등포 업무지구에 위치한 금융·증권·지주사·대기업 계열 검증 법인 디렉토리입니다.",
    seoDescription:
      "서울 영등포구·여의도 소재 금융사, 상장기업 및 주요 법인의 국민연금 임직원 규모, 추정 연봉, 결산 실적 순위입니다.",
  },
  {
    slug: "seoul-junggu-jongno",
    kind: "region",
    title: "서울 광화문 · 종로 · 을지로 대기업 디렉토리",
    shortTitle: "광화문 · 종로 · 중구",
    areaLabel: "서울 종로구 · 중구",
    emoji: "🏛️",
    subtitle:
      "대한민국 전통 도심 업무지구(CBD)인 광화문·종로·을지로·시청 권역에 본사를 둔 대기업·금융·언론·유통 법인 목록입니다.",
    seoDescription:
      "서울 종로구·중구(광화문·을지로) 도심 업무지구 소재 주요 대기업·상장사 임직원 수, 추정 평균연봉 및 매출액 순위 리포트입니다.",
  },
  {
    slug: "seoul-seocho",
    kind: "region",
    title: "서울 서초 · 양재 주요 기업 디렉토리",
    shortTitle: "서울 서초 · 양재",
    areaLabel: "서울특별시 서초구",
    emoji: "🏢",
    subtitle:
      "서초·반포·양재 R&D 혁신지구에 자리 잡은 모빌리티·제약·유통·법무·IT 주요 기업 리더보드입니다.",
    seoDescription:
      "서울 서초구(서초·양재) 소재 검증 계속사업자의 국민연금 가입 임직원, 추정 연봉, 신규 채용 및 결산 재무 현황입니다.",
  },
  {
    slug: "seoul-gasan-guro",
    kind: "region",
    title: "서울 가산 · 구로 디지털단지(G밸리) 기업 디렉토리",
    shortTitle: "가산 · 구로 (G밸리)",
    areaLabel: "서울 금천구 · 구로구",
    emoji: "🖥️",
    subtitle:
      "서울디지털국가산업단지(G밸리)에 밀집한 소프트웨어·클라우드·전자·의료기기 강소기업 및 중견기업 목록입니다.",
    seoDescription:
      "서울 가산디지털단지(금천구)·구로디지털단지(구로구) 소재 알짜 IT·제조 강소기업의 연봉, 임직원 규모, 매출 순위 디렉토리입니다.",
  },
  {
    slug: "seoul-seongdong",
    kind: "region",
    title: "서울 성수 · 성동 스타트업·브랜드 기업 디렉토리",
    shortTitle: "서울 성수 · 성동",
    areaLabel: "서울특별시 성동구",
    emoji: "✨",
    subtitle:
      "성수동을 중심으로 빠르게 성장 중인 패션·뷰티 브랜드, 모빌리티, 테크 스타트업 및 지식산업센터 입주 기업 목록입니다.",
    seoDescription:
      "서울 성동구(성수동) 소재 주요 스타트업·패션·IT 기업의 국민연금 상시 인원, 채용 증감, 추정 연봉 및 매출 분석입니다.",
  },
  {
    slug: "seoul-songpa",
    kind: "region",
    title: "서울 잠실 · 문정 비즈니스밸리(송파) 기업 디렉토리",
    shortTitle: "서울 잠실 · 문정(송파)",
    areaLabel: "서울특별시 송파구",
    emoji: "🗼",
    subtitle:
      "잠실 오피스 권역과 문정 비즈밸리에 위치한 유통·식품·배달플랫폼·보안·바이오 주요 기업 리더보드입니다.",
    seoDescription:
      "서울 송파구(잠실·문정법조단지) 소재 대기업 및 강소법인의 임직원 수, 추정 평균연봉, 결산 실적 순위 리포트입니다.",
  },
  {
    slug: "seoul-magok",
    kind: "region",
    title: "서울 마곡 사이언스파크 · 강서 주요 기업 디렉토리",
    shortTitle: "서울 마곡 · 강서",
    areaLabel: "서울특별시 강서구",
    emoji: "🔬",
    subtitle:
      "마곡 일반산업단지와 김포공항 권역에 입주한 항공·화학·제약·바이오·첨단 R&D 핵심 기업 목록입니다.",
    seoDescription:
      "서울 강서구(마곡 산업단지) 소재 대기업 연구소·제약바이오·항공 기업들의 상시 근로자, 추정 연봉, 재무제표 순위입니다.",
  },
  {
    slug: "seoul-mapo",
    kind: "region",
    title: "서울 상암 DMC · 홍대 · 공덕(마포) 기업 디렉토리",
    shortTitle: "서울 상암 · 마포",
    areaLabel: "서울특별시 마포구",
    emoji: "🎬",
    subtitle:
      "상암 디지털미디어시티(DMC)와 공덕·홍대 권역의 방송·미디어·엔터테인먼트·콘텐츠·핀테크 기업 디렉토리입니다.",
    seoDescription:
      "서울 마포구(상암 DMC·공덕·홍대) 소재 미디어·엔터·IT 기업의 국민연금 고용 인원, 추정 연봉 및 매출 현황입니다.",
  },
  {
    slug: "gyeonggi-suwon-hwaseong",
    kind: "region",
    title: "경기 수원 · 화성 · 동탄 첨단제조·반도체 기업 디렉토리",
    shortTitle: "수원 · 화성 · 동탄",
    areaLabel: "경기 수원시 · 화성시",
    emoji: "⚙️",
    subtitle:
      "삼성디지털시티·동탄테크노밸리·화성 산업벨트를 이끄는 글로벌 반도체·전자·정밀장비 핵심 법인 목록입니다.",
    seoDescription:
      "경기도 수원시·화성시(동탄) 소재 반도체·소부장·전자제조 주요 기업의 임직원 수, 추정 연봉 및 결산 매출 순위입니다.",
  },
  {
    slug: "gyeonggi-yongin-anyang",
    kind: "region",
    title: "경기 용인 · 안양 · 과천 핵심 기술기업 디렉토리",
    shortTitle: "용인 · 안양 · 과천",
    areaLabel: "경기 용인 · 안양 · 과천",
    emoji: "🏗️",
    subtitle:
      "기흥·수지 반도체 클러스터와 평촌 스마트스퀘어·과천 지식정보타운 입주 우량 상장·중견기업 디렉토리입니다.",
    seoDescription:
      "경기도 용인시·안양시·과천시 지식정보타운 소재 주요 기술·제약·IT 법인의 고용 현황, 추정 평균연봉 및 매출 리더보드입니다.",
  },
  {
    slug: "incheon",
    kind: "region",
    title: "인천 송도 바이오 · 부평 · 남동산단 기업 디렉토리",
    shortTitle: "인천 송도 · 남동산단",
    areaLabel: "인천광역시 전역",
    emoji: "✈️",
    subtitle:
      "송도 국제도시 바이오 클러스터와 남동·부평 국가산단의 제조·물류·항공·기계 우량 기업 목록입니다.",
    seoDescription:
      "인천광역시(송도·남동산단·부평·청라) 소재 바이오·제조·물류 주요 계속사업자의 임직원 규모, 추정 연봉, 매출액 순위입니다.",
  },
  {
    slug: "busan",
    kind: "region",
    title: "부산 센텀 · 해운대 · 동남권 주요 기업 디렉토리",
    shortTitle: "부산 센텀 · 해운대",
    areaLabel: "부산광역시 전역",
    emoji: "🌊",
    subtitle:
      "센텀시티·문현금융단지·녹산산단을 아우르는 부산 대표 해운·조선기자재·금융·관광·제조 기업 리더보드입니다.",
    seoDescription:
      "부산광역시 소재 주요 상장사 및 우량 계속사업자의 국민연금 임직원 수, 추정 평균연봉, 신규 채용 및 매출 현황입니다.",
  },
  {
    slug: "daejeon-chungcheong",
    kind: "region",
    title: "대전 대덕연구단지 · 천안 · 청주(충청권) 기업 디렉토리",
    shortTitle: "대전 · 세종 · 충청권",
    areaLabel: "대전 · 세종 · 충남 · 충북",
    emoji: "🧪",
    subtitle:
      "대덕연구개발특구 딥테크 기업부터 천안·아산 디스플레이·반도체, 청주 오송 이차전지·바이오 벨트 핵심 법인 목록입니다.",
    seoDescription:
      "대전·세종·천안·아산·청주 충청권 소재 첨단 연구개발·이차전지·바이오·반도체 기업의 임직원, 연봉, 매출 순위 리포트입니다.",
  },
  {
    slug: "daegu-gyeongbuk",
    kind: "region",
    title: "대구 · 구미 · 포항(대경권) 주력 산업 기업 디렉토리",
    shortTitle: "대구 · 구미 · 포항",
    areaLabel: "대구광역시 · 경상북도",
    emoji: "🔩",
    subtitle:
      "대구 성서산단 자동차부품·기계, 구미 전자·소재, 포항 철강·이차전지 소재 산업을 이끄는 핵심 기업 목록입니다.",
    seoDescription:
      "대구광역시 및 경북(포항·구미·경산) 소재 철강·이차전지·자동차부품 주요 기업의 임직원 수, 추정 연봉 및 결산 실적입니다.",
  },
  {
    slug: "ulsan-changwon",
    kind: "region",
    title: "울산 · 창원 · 경남 중화학·방산·기계 기업 디렉토리",
    shortTitle: "울산 · 창원 · 경남권",
    areaLabel: "울산광역시 · 경상남도",
    emoji: "🚢",
    subtitle:
      "대한민국 제조 수출의 심장부인 울산·창원 국가산단 중심의 조선·방산·자동차·중공업·정밀기계 핵심 기업 목록입니다.",
    seoDescription:
      "울산광역시·창원시 등 경남권 소재 중공업·방산·기계·화학 우량 법인의 국민연금 고용 인원, 추정 연봉 및 매출 순위입니다.",
  },
  {
    slug: "honam-jeju",
    kind: "region",
    title: "광주 · 전주 · 여수 · 제주 주요 기업 디렉토리",
    shortTitle: "광주 · 호남 · 제주권",
    areaLabel: "광주 · 전북 · 전남 · 제주",
    emoji: "🌿",
    subtitle:
      "광주 첨단산단, 여수 국가석유화학산단, 전주·전북 식품·소재, 제주 이전 본사 및 관광·IT 대표 기업 목록입니다.",
    seoDescription:
      "광주·전북(전주)·전남(여수)·제주 권역 소재 주요 상장법인 및 강소 계속사업자의 임직원 수, 추정 평균연봉, 매출 리포트입니다.",
  },
] as const;

export const INDUSTRY_HUBS: readonly IndustryHubMeta[] = [
  {
    slug: "software-it",
    kind: "industry",
    title: "소프트웨어 · IT 플랫폼 · 클라우드 기업 랭킹",
    shortTitle: "소프트웨어 · IT · 플랫폼",
    emoji: "💻",
    subtitle:
      "응용·시스템 소프트웨어 개발, IT 시스템 통합(SI), 클라우드·데이터베이스 및 온라인 플랫폼 분야 검증 기업 리더보드입니다.",
    seoDescription:
      "대한민국 소프트웨어 개발·IT 서비스·온라인 플랫폼 기업의 국민연금 추정 평균연봉, 상시 개발·임직원 수, 매출 순위 리포트입니다.",
  },
  {
    slug: "semiconductor-electronics",
    kind: "industry",
    title: "반도체 · 디스플레이 · 전자부품 기업 랭킹",
    shortTitle: "반도체 · 전자부품",
    emoji: "🔬",
    subtitle:
      "메모리·시스템 반도체 소자, 반도체 장비·소재(소부장), 인쇄회로기판(PCB) 및 전자부품·컴퓨터 제조 핵심 법인 목록입니다.",
    seoDescription:
      "국내 반도체 제조·소부장·전자부품 기업들의 상시 임직원 규모, 추정 평균연봉, 신규 채용 및 최근 결산 매출·영업이익 순위입니다.",
  },
  {
    slug: "bio-pharma-medical",
    kind: "industry",
    title: "제약 · 바이오 · 의료기기 기업 랭킹",
    shortTitle: "제약 · 바이오 · 의료기기",
    emoji: "🧬",
    subtitle:
      "완제·원료 의약품, 바이오 신약 연구개발, 체외진단·임플란트·미용 의료기기 제조 및 의학 연구 법인 리더보드입니다.",
    seoDescription:
      "대한민국 제약·바이오·의료기기 상장사 및 우량 기업의 국민연금 가입 인원, 추정 평균연봉, 결산 실적 순위 리포트입니다.",
  },
  {
    slug: "automotive-mobility",
    kind: "industry",
    title: "자동차 · 모빌리티 · 전장부품 기업 랭킹",
    shortTitle: "자동차 · 모빌리티 부품",
    emoji: "🚗",
    subtitle:
      "완성차·특장차 및 차체·동력전달·전장 부품, 선박·철도·항공 운송장비 제조 분야 주요 검증 기업 목록입니다.",
    seoDescription:
      "국내 자동차·모빌리티 부품 및 운송장비 제조 기업의 임직원 수, 국민연금 추정 연봉, 최근 결산 매출·영업이익 리더보드입니다.",
  },
  {
    slug: "machinery-robotics",
    kind: "industry",
    title: "정밀기계 · 산업용 로봇 · 전기·에너지 기업 랭킹",
    shortTitle: "기계 · 로봇 · 전기·에너지",
    emoji: "🤖",
    subtitle:
      "산업용 로봇, 반도체·디스플레이 특수목적 기계, 중전기기·배전반, 이차전지 장비 및 전력·에너지 인프라 핵심 기업 순위입니다.",
    seoDescription:
      "대한민국 산업용 로봇·특수목적 기계·전기장비 및 전력·에너지 기업의 임직원 규모, 추정 연봉, 매출액 순위입니다.",
  },
  {
    slug: "ecommerce-distribution",
    kind: "industry",
    title: "이커머스 · 종합유통 · 무역 도소매 기업 랭킹",
    shortTitle: "이커머스 · 유통 · 도소매",
    emoji: "🛒",
    subtitle:
      "전자상거래(통신판매), 백화점·리테일, 산업재·기계·의약·생활용품 종합 도소매 및 수출입 무역 법인 리더보드입니다.",
    seoDescription:
      "국내 이커머스·통신판매·종합유통 도소매 주요 기업의 국민연금 상시 인원, 추정 평균연봉, 결산 매출 및 영업이익 순위입니다.",
  },
  {
    slug: "chemical-materials",
    kind: "industry",
    title: "석유화학 · 첨단소재 · 철강 · 금속 기업 랭킹",
    shortTitle: "화학 · 신소재 · 철강",
    emoji: "⚗️",
    subtitle:
      "기초유기화학, 합성수지·이차전지 양극/음극 소재, 고무·플라스틱, 1차 철강 및 비철금속 가공 핵심 기업 목록입니다.",
    seoDescription:
      "대한민국 화학·첨단 신소재·철강·금속 제조 법인의 국민연금 임직원 규모, 추정 평균연봉 및 결산 매출·영업이익 리포트입니다.",
  },
  {
    slug: "telecom-media-content",
    kind: "industry",
    title: "통신장비 · 미디어 · 엔터테인먼트 · 콘텐츠 기업 랭킹",
    shortTitle: "통신 · 미디어 · 콘텐츠",
    emoji: "📡",
    subtitle:
      "유무선 통신·방송 장비, 영상·오디오·방송 제작 배급, 게임·출판·광고 대행 등 K-콘텐츠 및 ICT 기업 리더보드입니다.",
    seoDescription:
      "국내 통신·방송장비, 미디어·영상 제작, 엔터테인먼트 기업의 상시 근로자, 추정 연봉, 채용 추이 및 매출 순위입니다.",
  },
  {
    slug: "cosmetics-fashion-consumer",
    kind: "industry",
    title: "화장품(K-뷰티) · 패션 · 식품 소비재 기업 랭킹",
    shortTitle: "화장품 · 패션 · 식품",
    emoji: "💄",
    subtitle:
      "글로벌 수출을 견인하는 K-뷰티 화장품 제조·브랜드, 패션·의류·섬유, 식음료·건강기능식품 주요 기업 목록입니다.",
    seoDescription:
      "대한민국 화장품(K-뷰티)·패션의류·식음료 소비재 기업의 국민연금 임직원 수, 추정 평균연봉, 신규 채용 및 매출액 순위입니다.",
  },
  {
    slug: "construction-engineering",
    kind: "industry",
    title: "종합건설 · 플랜트 · 토목 · 엔지니어링 기업 랭킹",
    shortTitle: "종합건설 · 엔지니어링",
    emoji: "🏗️",
    subtitle:
      "건축·토목·플랜트 종합건설사, 전문직별 공사업 및 건축·토목 기술 엔지니어링 서비스 주요 법인 리더보드입니다.",
    seoDescription:
      "국내 종합건설사·전문건설·엔지니어링 기술서비스 법인의 상시 임직원 규모, 추정 평균연봉, 결산 매출 및 영업이익 순위입니다.",
  },
  {
    slug: "finance-consulting-rd",
    kind: "industry",
    title: "금융 · 투자 · 경영컨설팅 · 전문 R&D 기업 랭킹",
    shortTitle: "금융 · 컨설팅 · R&D",
    emoji: "📊",
    subtitle:
      "은행·증권·자산운용·벤처캐피탈 등 금융지원 서비스업과 경영컨설팅·자연과학/공학 연구개발 전문 법인 목록입니다.",
    seoDescription:
      "대한민국 금융·투자·경영컨설팅·전문 연구개발(R&D) 법인의 국민연금 추정 평균연봉, 임직원 수 및 결산 재무 순위입니다.",
  },
  {
    slug: "real-estate-hospitality",
    kind: "industry",
    title: "부동산 개발 · 호텔 · 레저 · 비즈니스지원 기업 랭킹",
    shortTitle: "부동산 · 호텔 · 비즈니스",
    emoji: "🏨",
    subtitle:
      "부동산 개발·자산관리, 호텔·리조트·레저 운영 및 기업 사업지원·보안·인력 서비스 분야 주요 계속사업자 목록입니다.",
    seoDescription:
      "국내 부동산 개발·관리, 호텔·관광숙박·레저, 사업지원 서비스 주요 법인의 임직원 규모, 추정 연봉 및 매출 현황입니다.",
  },
] as const;

export function getHubMeta(kind: string, slug: string): AnyHubMeta | null {
  if (kind === "ranking") {
    return RANKING_HUBS.find((h) => h.slug === slug) || null;
  }
  if (kind === "region") {
    return REGION_HUBS.find((h) => h.slug === slug) || null;
  }
  if (kind === "industry") {
    return INDUSTRY_HUBS.find((h) => h.slug === slug) || null;
  }
  return null;
}

export function getRegionHubBySlug(slug: string | null | undefined): RegionHubMeta | null {
  if (!slug) return null;
  return REGION_HUBS.find((h) => h.slug === slug) || null;
}

export function getIndustryHubBySlug(slug: string | null | undefined): IndustryHubMeta | null {
  if (!slug) return null;
  return INDUSTRY_HUBS.find((h) => h.slug === slug) || null;
}

/**
 * 사업장 주소 문자열에서 정규화된 권역 허브 슬러그(`region_hub_slug`)를 결정론적으로 추출합니다.
 * DB `INSERT`/`UPDATE` 시점에 영구 저장하여 런타임 정규식 풀스캔을 원천 차단합니다.
 */
export function resolveRegionHubSlug(rawAddress: string | null | undefined): string | null {
  if (!rawAddress) return null;
  const adr = rawAddress.trim();
  if (!adr || adr === "-" || adr.includes("정보 없음")) return null;

  if (adr.includes("서울")) {
    if (adr.includes("강남구")) return "seoul-gangnam";
    if (adr.includes("서초구")) return "seoul-seocho";
    if (adr.includes("영등포구")) return "seoul-yeongdeungpo";
    if (adr.includes("종로구") || adr.includes("중구")) return "seoul-junggu-jongno";
    if (adr.includes("금천구") || adr.includes("구로구")) return "seoul-gasan-guro";
    if (adr.includes("성동구")) return "seoul-seongdong";
    if (adr.includes("송파구")) return "seoul-songpa";
    if (adr.includes("강서구")) return "seoul-magok";
    if (adr.includes("마포구")) return "seoul-mapo";
  }

  if (adr.includes("성남시") && (adr.includes("분당구") || adr.includes("수정구") || adr.includes("판교"))) {
    return "gyeonggi-pangyo";
  }
  if (adr.includes("수원시") || adr.includes("화성시")) {
    return "gyeonggi-suwon-hwaseong";
  }
  if (adr.includes("용인시") || adr.includes("안양시") || adr.includes("과천시")) {
    return "gyeonggi-yongin-anyang";
  }
  if (adr.includes("인천")) {
    return "incheon";
  }
  if (adr.includes("부산")) {
    return "busan";
  }
  if (
    adr.includes("대전") ||
    adr.includes("세종") ||
    adr.includes("충청") ||
    adr.includes("충남") ||
    adr.includes("충북") ||
    adr.includes("천안시") ||
    adr.includes("아산시") ||
    adr.includes("청주시")
  ) {
    return "daejeon-chungcheong";
  }
  if (adr.includes("대구") || adr.includes("경상북도") || adr.includes("경북") || adr.includes("포항시") || adr.includes("구미시")) {
    return "daegu-gyeongbuk";
  }
  if (adr.includes("울산") || adr.includes("경상남도") || adr.includes("경남") || adr.includes("창원시") || adr.includes("김해시")) {
    return "ulsan-changwon";
  }
  if (
    adr.includes("광주광역시") ||
    adr.startsWith("광주 ") ||
    adr.includes("전라") ||
    adr.includes("전북") ||
    adr.includes("전남") ||
    adr.includes("전주시") ||
    adr.includes("여수시") ||
    adr.includes("제주")
  ) {
    return "honam-jeju";
  }

  return null;
}

function matchSectorKeywordToIndustry(text: string): string | null {
  if (!text) return null;
  if (/소프트웨어|프로그래밍|시스템 통합|정보 서비스|데이터베이스|포털|인터넷|클라우드|호스팅|게임/.test(text)) {
    return "software-it";
  }
  if (/반도체|전자부품|인쇄회로|디스플레이|액정|다이오드|컴퓨터|주변장치|전자집적회로/.test(text)) {
    return "semiconductor-electronics";
  }
  if (/의약품|제약|바이오|의료용|의료기기|진단|백신|생물학적|병원|의원|임플란트|안경렌즈/.test(text)) {
    return "bio-pharma-medical";
  }
  if (/자동차|트레일러|차체|모빌리티|선박|항공기|철도장비|운송장비/.test(text)) {
    return "automotive-mobility";
  }
  if (/로봇|기계|금형|전동기|발전기|배전반|전기장비|일차전지|축전지|이차전지|냉동장비|측정.*분석 기구|송전|배전|발전업|전력|가스 제조|열공급/.test(text)) {
    return "machinery-robotics";
  }
  if (/건설업|공사업|토목|건축|엔지니어링|감리/.test(text)) {
    return "construction-engineering";
  }
  if (/화장품|세제|광택제|의복|패션|섬유|가죽|신발|식료품|식품|음료|육류|수산물|농산물|제과|제빵/.test(text)) {
    return "cosmetics-fashion-consumer";
  }
  if (/화학|합성수지|플라스틱|고무|접착제|철강|금속|비금속|유리|세라믹|정유|석유/.test(text)) {
    return "chemical-materials";
  }
  if (/통신.*장비|전기통신|방송|영상|오디오|출판|영화|음악|엔터테인먼트|광고/.test(text)) {
    return "telecom-media-content";
  }
  if (/전자상거래|통신판매|도매|소매|백화점|면세점|무역|유통/.test(text)) {
    return "ecommerce-distribution";
  }
  if (/금융|투자|증권|은행|보험|신탁|컨설팅|연구개발|회계|세무|법무/.test(text)) {
    return "finance-consulting-rd";
  }
  if (/부동산|임대업|호텔|숙박|리조트|스포츠|레저|사업지원|인력공급|여행|보안|경비/.test(text)) {
    return "real-estate-hospitality";
  }
  return null;
}

/**
 * 업종명(`b_sector`) 최우선 + 인허가 금융사 상호 보정 + 보조 주요사업(`main_biz`) 순으로
 * 12대 산업군 허브 슬러그(`industry_hub_slug`)를 결정론적으로 추출합니다.
 */
export function resolveIndustryHubSlug(
  rawSector: string | null | undefined,
  rawMainBiz?: string | null,
  rawCompanyName?: string | null
): string | null {
  const name = (rawCompanyName || "").trim();
  if (/증권|자산운용|투자신탁|생명보험|손해보험|화재해상|저축은행|은행|캐피탈/.test(name)) {
    return "finance-consulting-rd";
  }

  const sec = (rawSector || "").trim();
  const isGenericSector =
    !sec ||
    sec === "기타 제조업/금융업" ||
    sec === "상장 법인" ||
    sec === "BIZ_NO미존재사업장" ||
    sec === "해당없음" ||
    sec === "-" ||
    sec === "미상";

  if (!isGenericSector) {
    const byPrimarySector = matchSectorKeywordToIndustry(sec);
    if (byPrimarySector) return byPrimarySector;
  }

  const mb = (rawMainBiz || "").trim();
  if (mb && mb !== sec && !mb.startsWith("전자상거래 (")) {
    return matchSectorKeywordToIndustry(mb);
  }

  return null;
}

export function resolveMarketBoard(rawListingStatus: string | null | undefined): "KOSPI" | "KOSDAQ" | null {
  if (!rawListingStatus) return null;
  const s = rawListingStatus.trim();
  if (s.startsWith("코스피") || s === "유가" || s.includes("유가증권")) return "KOSPI";
  if (s.startsWith("코스닥") || s === "코스닥") return "KOSDAQ";
  return null;
}

export interface EstimatedSalaryInfo {
  yearlyManwon: number;
  isCapped: boolean;
  isMinified: boolean;
  label: string;
  shortLabel: string;
}

/**
 * 기업 상세페이지(`SalarySection`)와 100% 동일한 국민연금 9% 요율 역산 평균연봉 계산식
 */
export function estimateAnnualSalaryManwon(
  npsChrgAmt: number | null | undefined,
  employees: number | null | undefined
): EstimatedSalaryInfo | null {
  const emps = Number(employees || 0);
  const chrg = Number(npsChrgAmt || 0);
  if (emps < 3 || chrg <= 0) return null;

  let avgMonthly = chrg / emps / 0.09;
  let isCapped = false;
  let isMinified = false;

  if (avgMonthly >= 6_170_000) {
    isCapped = true;
    avgMonthly = 6_170_000;
  } else if (avgMonthly <= 370_000) {
    isMinified = true;
    avgMonthly = 370_000;
  }

  const yearlyManwon = Math.round((avgMonthly * 12) / 10_000);
  const label = isCapped
    ? "7,400만원 이상 (상한)"
    : isMinified
      ? "2,400만원 미만"
      : `${yearlyManwon.toLocaleString("ko-KR")}만원`;

  const shortLabel = isCapped
    ? "7,400만원+"
    : isMinified
      ? "2,400만원-"
      : `${yearlyManwon.toLocaleString("ko-KR")}만원`;

  return { yearlyManwon, isCapped, isMinified, label, shortLabel };
}
