const { Pool } = require('pg');
const { loadEnvConfig } = require('@next/env');

// Next.js 환경변수 로드
loadEnvConfig(process.cwd());

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 대규모 20여 종의 실무/행정/법률/공공 서식 원본 메타데이터 및 텍스트셋
const largeDocumentDataset = [
  // 1. 법률/소송/민사
  {
    id: "gov_prosecution",
    category: "법률",
    title: "고소장",
    description: "타인의 형사 범죄 행위에 대하여 수사기관에 처벌을 요구하는 공식 고소 양식입니다.",
    tags: ["고소장", "소송", "법원", "경찰서", "민사/형사"],
    fields: [
      { key: "name", label: "고소인 성명", type: "text", placeholder: "홍길동" },
      { key: "accused", label: "피고소인 성명", type: "text", placeholder: "김철수" },
      { key: "title", label: "고소 취지 제목", type: "text", placeholder: "사기 혐의 고소의 건" },
      { key: "content", label: "고소 사실 및 피해 내용", type: "textarea", placeholder: "피해 일시, 장소, 경위를 상세히 기재하세요." },
      { key: "company", label: "제출 관할 수사기관", type: "text", placeholder: "서울마포경찰서장 귀하" }
    ],
    initialValues: {
      title: "고 소 장",
      dept: "경찰서 형사과",
      name: "홍길동",
      date: "2026년 06월 15일",
      company: "서울마포경찰서장 귀하",
      content: "[고소인 정보]\n성명: 홍길동 (주민등록번호: 900101-1234567)\n주소: 서울시 마포구 마포대로 14\n연락처: 010-1234-5678\n\n[피고소인 정보]\n성명: 김철수 (연락처: 010-9876-5432)\n주소: 서울시 영등포구 여의도동 12\n\n[고소 취지]\n고소인은 피고소인을 사기 혐의로 고소하오니 철저히 수사하여 엄벌에 처해주시기 바랍니다.\n\n[고소 사실]\n피고소인은 2026년 3월 1일 사업 자금이 급하다며 일주일 뒤 변제할 것을 약속하고 금전 5,000,000원을 빌려갔으나, 현재까지 고의로 연락을 피하며 채무를 변제하지 않고 있습니다."
    }
  },
  {
    id: "gov_delegation",
    category: "법률",
    title: "위임장",
    description: "은행 업무, 관공서 신청 등 본인의 권한을 대리인에게 위임하기 위한 공식 증빙 문서입니다.",
    tags: ["위임장", "대리인", "권리위임", "민사", "일반행정"],
    fields: [
      { key: "name", label: "위임인 성명", type: "text", placeholder: "홍길동" },
      { key: "delegatee", label: "대리인(수임인) 성명", type: "text", placeholder: "이영희" },
      { key: "matters", label: "위임할 구체적 사항", type: "textarea", placeholder: "위임하는 업무 범위를 기재하세요." },
      { key: "company", label: "제출처", type: "text", placeholder: "마포동 주민센터 귀하" }
    ],
    initialValues: {
      title: "위 임 장",
      dept: "일반 대리",
      name: "홍길동",
      date: "2026년 06월 15일",
      company: "마포동 주민센터 귀하",
      content: "[위임인(본인) 인적사항]\n성명: 홍길동 (주민등록번호: 900101-1234567)\n주소: 서울시 마포구 마포대로 14\n\n[수임인(대리인) 인적사항]\n성명: 이영희 (주민등록번호: 950505-2234567)\n주소: 경기도 성남시 분당구 정자동 95\n위임인과의 관계: 자매\n\n[위임 사항]\n본인은 대리인 이영희에게 위임인의 주민등록표 등·초본 및 인감증명서 발급 신청 및 수령에 관한 일체의 권한을 위임합니다."
    }
  },
  {
    id: "gov_agreement",
    category: "법률",
    title: "합의서",
    description: "사고나 분쟁에 대하여 당사자 간 합의하고 민형사상 책임을 묻지 않기로 약정하는 양식입니다.",
    tags: ["합의서", "분쟁해결", "민사합의", "법률각서", "교통사고"],
    fields: [
      { key: "name", label: "갑 (피해자/채권자)", type: "text", placeholder: "홍길동" },
      { key: "partyB", label: "을 (가해자/채무자)", type: "text", placeholder: "김철수" },
      { key: "incident", label: "사건 개요 및 합의 내용", type: "textarea", placeholder: "사건내용과 합의금 집행 규격을 기재하세요." },
      { key: "company", label: "합의 관할 관청(선택)", type: "text", placeholder: "입력 안 함(당사자 서명용)" }
    ],
    initialValues: {
      title: "합 의 서",
      dept: "합의 조서",
      name: "홍길동 (갑)",
      date: "2026년 06월 15일",
      company: "본 합의서는 당사자 보관용입니다.",
      content: "[당사자 정보]\n갑 (피해자): 홍길동 (주민등록번호: 900101-1234567)\n을 (가해자): 김철수 (주민등록번호: 850101-1234567)\n\n[사건의 개요]\n2026년 6월 1일 서울 마포구 공덕오거리 부근에서 을의 차선 변경 부주의로 인한 갑의 차량 추돌 사고.\n\n[합의 내용]\n1. 을은 갑에게 차량 수리비 및 치료비 명목으로 일시금 1,500,000원을 즉시 지급한다.\n2. 갑은 위 합의금을 수령함과 동시에 본 사고와 관련된 민·형사상의 모든 이의 및 청구를 포기하며, 수사기관에 처벌불원서를 제출한다."
    }
  },
  {
    id: "gov_statement",
    category: "법률",
    title: "진술서",
    description: "사건이나 사고 발생 당시의 목격 내용 또는 사실 관계를 수사기관이나 법원에 진술하기 위한 서식입니다.",
    tags: ["진술서", "경위서", "법원제출", "목격자진술", "사고조사"],
    fields: [
      { key: "name", label: "진술인 성명", type: "text", placeholder: "홍길동" },
      { key: "title", label: "진술서 제목", type: "text", placeholder: "교통사고 목격 진술서" },
      { key: "content", label: "진술 상세 내용", type: "textarea", placeholder: "시간 순서대로 구체적 사실 관계를 적어주세요." },
      { key: "company", label: "제출처", type: "text", placeholder: "서울서부지방법원 귀하" }
    ],
    initialValues: {
      title: "진 술 서",
      dept: "형사/민사 제출용",
      name: "홍길동",
      date: "2026년 06월 15일",
      company: "서울서부지방법원 귀하",
      content: "[진술인 정보]\n성명: 홍길동 (생년월일: 1990년 1월 1일)\n주소: 서울시 마포구 마포대로 14\n연락처: 010-1234-5678\n\n[진술 요지]\n본 진술인은 2026년 6월 1일 14:00경 마포구 공덕오거리 횡단보도 앞에서 대기하던 중 발생한 차량 추돌 사고에 대하여 목격한 사실을 가감 없이 진술합니다.\n\n[진술 내용]\n당시 2차선에서 서행하던 피해 차량(아반떼)의 후미를 1차선에서 급차선 변경하던 가해 차량(소나타)이 신호 대기 중에 추돌하는 장면을 정면에서 목격하였습니다."
    }
  },
  {
    id: "gov_petition",
    category: "법률",
    title: "탄원서",
    description: "사법기관에 피고인의 사정을 호소하여 선처를 구하거나 강력한 처벌을 탄원하는 법률 서식입니다.",
    tags: ["탄원서", "선처탄원", "법원", "검찰청", "호소문"],
    fields: [
      { key: "name", label: "탄원인 성명", type: "text", placeholder: "홍길동" },
      { key: "defendant", label: "피탄원인 (피고인) 성명", type: "text", placeholder: "김철수" },
      { key: "title", label: "탄원 취지", type: "text", placeholder: "피고인 선처 탄원의 건" },
      { key: "content", label: "탄원 내용 및 사유", type: "textarea", placeholder: "탄원하게 된 배경과 사정을 구체적으로 작성하세요." },
      { key: "company", label: "수신 법원/검찰", type: "text", placeholder: "서울서부지방법원 제1형사부 귀중" }
    ],
    initialValues: {
      title: "탄 원 서",
      dept: "법원 탄원서",
      name: "홍길동",
      date: "2026년 06월 15일",
      company: "서울서부지방법원 제1형사부 귀중",
      content: "[탄원인]\n성명: 홍길동 (주소: 서울시 마포구 마포대로 14)\n\n[피탄원인]\n성명: 김철수\n\n[탄원 취지]\n존경하는 재판장님, 피탄원인 김철수가 본인의 잘못을 깊이 뉘우치고 있으며, 평소 성실하고 주변의 신망이 두터웠던 인물임을 고려하시어 부디 관대한 처분을 내려주시기를 탄원합니다.\n\n[탄원 이유]\n피탄원인은 일평생 남을 돕는 봉사활동에 솔선수범해왔으며 이번 사건은 순간의 오판으로 발생한 우발적 사고였습니다. 유족들과도 원만히 합의를 하였습니다."
    }
  },
  {
    id: "gov_notice",
    category: "법률",
    title: "내용증명서",
    description: "의사표시의 발송 일자와 도달 사실, 그리고 구체적인 통지 내용을 공적으로 증명하는 우체국 접수 양식입니다.",
    tags: ["내용증명", "채무독촉", "계약해지", "우체국", "의사표시"],
    fields: [
      { key: "name", label: "발신인 성명", type: "text", placeholder: "홍길동" },
      { key: "receiver", label: "수신인 성명", type: "text", placeholder: "김철수" },
      { key: "title", label: "통지 제목", type: "text", placeholder: "임대차 계약 만료에 따른 보증금 반환 독촉의 건" },
      { key: "content", label: "통지 상세 내용", type: "textarea", placeholder: "요구 사항과 이행 기한, 미이행 시 법적 대응 경고 등을 명확히 작성하세요." },
      { key: "company", label: "공증/배송구분", type: "text", placeholder: "우체국 내용증명 발송용" }
    ],
    initialValues: {
      title: "내 용 증 명 서",
      dept: "의사 통지문",
      name: "홍길동",
      date: "2026년 06월 15일",
      company: "수신인 김철수 귀하",
      content: "[발신인] 홍길동 (서울시 마포구 마포대로 14)\n[수신인] 김철수 (서울시 영등포구 여의도동 12)\n\n[제목] 임대차 계약 만료에 따른 임대차보증금 반환 독촉의 건\n\n[통지 내용]\n1. 발신인과 수신인은 2024년 6월 15일 체결한 임대차 계약이 2026년 6월 14일부로 기한 만료되었습니다.\n2. 발신인은 수차례 만료에 따른 보증금 반환을 요청하였으나 수신인은 이를 미루고 있습니다.\n3. 본 서면 수취 후 7일 이내에 보증금 일억 원(100,000,000원)을 반환하지 않을 시 민사상 보증금반환청구소송 등 법적 절차에 즉각 착수할 것임을 엄중히 통지합니다."
    }
  },
  {
    id: "gov_loan",
    category: "법률",
    title: "금전소비대차계약서",
    description: "채권자와 채무자 간 금전을 대여하고 이자, 변제 기한, 위약 조건 등을 조항으로 명문화하는 정식 계약 서식입니다.",
    tags: ["차용증", "금전계약", "차용증정식", "금전차용", "계약서"],
    fields: [
      { key: "name", label: "채권자 (대여인)", type: "text", placeholder: "홍길동" },
      { key: "borrower", label: "채무자 (차용인)", type: "text", placeholder: "김철수" },
      { key: "amount", label: "대여 금액 (차용 원금)", type: "text", placeholder: "10,000,000원" },
      { key: "content", label: "이자율 및 변제 약정 조항", type: "textarea", placeholder: "연 이자율, 변제기일, 지연배상금률 등을 조항별로 작성하세요." },
      { key: "company", label: "합의 관할 법원", type: "text", placeholder: "서울서부지방법원" }
    ],
    initialValues: {
      title: "금 전 소 비 대 차 계 약 서",
      dept: "채권 계약",
      name: "홍길동 (대여인)",
      date: "2026년 06월 15일",
      company: "당사자 기명날인 후 보관",
      content: "대여인 홍길동(이하 '갑')과 차용인 김철수(이하 '을')는 다음과 같이 금전소비대차 계약을 체결한다.\n\n제1조 [대여금액]\n갑은 을에게 일천만 원(10,000,000원)을 대여하고, 을은 이를 확실히 차용하였다.\n\n제2조 [이자 및 변제기일]\n1. 이자는 연 5%로 정하며 매월 말일에 지급한다.\n2. 원금은 2027년 6월 15일까지 갑의 지정 계좌로 상환한다.\n\n제3조 [기한의 이익 상실]\n을이 이자 지급을 2회 이상 지체하거나 파산 등의 사유 발생 시, 을은 기한의 이익을 상실하고 원리금 전액을 즉시 변제해야 한다."
    }
  },

  // 2. 부동산 / 거래 계약
  {
    id: "gov_rent",
    category: "계약",
    title: "부동산 임대차 계약서",
    description: "임대인과 임차인 간에 주택이나 상가 건물의 임대 계약 조건 및 보증금 반환 규칙을 보장하는 표준 계약 서식입니다.",
    tags: ["부동산계약서", "임대차계약", "월세계약", "전세계약", "부동산"],
    fields: [
      { key: "name", label: "임대인 성명", type: "text", placeholder: "홍길동" },
      { key: "tenant", label: "임차인 성명", type: "text", placeholder: "김철수" },
      { key: "deposit", label: "보증금 및 월세 금액", type: "text", placeholder: "보증금 10,000,000원 / 월세 500,000원" },
      { key: "content", label: "부동산 소재지 및 계약 조항", type: "textarea", placeholder: "건물 주소, 구조, 인도일자, 원상복구 조항 등을 입력하세요." },
      { key: "company", label: "관할 중개사무소(선택)", type: "text", placeholder: "직거래 계약용" }
    ],
    initialValues: {
      title: "부 동 산 임 대 차 계 약 서",
      dept: "주택/사무실 표준",
      name: "홍길동 (임대인)",
      date: "2026년 06월 15일",
      company: "임대인/임차인 서명날인용",
      content: "[부동산의 표시]\n소재지: 서울시 마포구 도화동 50 마음빌딩 302호\n\n[계약 내용]\n제1조 [보증금 및 차임]\n임차인은 임대인에게 임대보증금 및 월세를 다음과 같이 지불하기로 약정한다.\n- 보증금: 일천만 원(10,000,000원) / 계약 시 전액 계좌 송금\n- 월세: 금 오십만 원(500,000원) / 매월 25일 선불 지급\n\n제2조 [임대 기한]\n임대차 기간은 2026년 7월 1일부터 2028년 6월 30일까지로 한다.\n\n제3조 [원상복구]\n계약 만료 시 임차인은 임대 부동산을 원래의 상태로 복구하여 임대인에게 반환한다."
    }
  },
  {
    id: "gov_partnership",
    category: "계약",
    title: "공동 사업 동업 계약서",
    description: "2인 이상이 출자하여 공동으로 사업을 경영하고 수익을 배분하는 비율 및 권리무무를 확정하는 계약서입니다.",
    tags: ["동업계약서", "동업", "공동사업", "투자유치", "계약서"],
    fields: [
      { key: "name", label: "동업자 갑 성명", type: "text", placeholder: "홍길동" },
      { key: "partnerB", label: "동업자 을 성명", type: "text", placeholder: "김철수" },
      { key: "share", label: "출자 비율 및 지분율", type: "text", placeholder: "갑 50% / 을 50%" },
      { key: "content", label: "동업 운영 및 손익 분배 조항", type: "textarea", placeholder: "수익 배분 방식, 중도 탈퇴 조건, 해산 규정을 조항별로 기재하세요." },
      { key: "company", label: "공동 날인 확인", type: "text", placeholder: "동업 계약 확인" }
    ],
    initialValues: {
      title: "동 업 계 약 서",
      dept: "공동 사업 약정",
      name: "홍길동 (갑)",
      date: "2026년 06월 15일",
      company: "갑/을 기명날인 후 각 1부 보관",
      content: "공동사업자 홍길동(이하 '갑')과 김철수(이하 '을')는 공동으로 '마음상사'를 경영하기로 약정하고 다음과 같이 동업 계약을 체결한다.\n\n제1조 [출자 의무]\n1. 갑은 현금 20,000,000원을 출자한다.\n2. 을은 현금 20,000,000원 및 매장 운영 노동력을 출자한다.\n\n제2조 [손익의 분배]\n경영에 따른 손실 및 이익은 출자 비율에 의거하여 갑 50%, 을 50% 비율로 매달 정산하여 분배한다.\n\n제3조 [계약의 해지]\n동업 관계를 종결하고자 할 때는 최소 3개월 전에 서면으로 통지하며, 잔여 재산은 청산일 기준 지분율대로 정산 분배한다."
    }
  },

  // 3. 인사 / 노무 / 회사 일반
  {
    id: "gov_employment_cert_req",
    category: "노무",
    title: "재직증명서",
    description: "은행 제출, 비자 발급 등 사유로 회사에 재직증명서의 신속한 발급을 청구하는 신청서 양식입니다.",
    tags: ["재직증명서", "인사행정", "증명서신청", "총무팀", "회사서식"],
    fields: [
      { key: "name", label: "신청 사원 성명", type: "text", placeholder: "홍길동" },
      { key: "dept", label: "소속 부서", type: "text", placeholder: "경영지원팀" },
      { key: "purpose", label: "발급 용도 및 사유", type: "text", placeholder: "시중 은행 대출 증빙 제출용" },
      { key: "content", label: "인적사항 및 재직 기간 정보", type: "textarea", placeholder: "사번, 직급, 입사일자 정보를 기입해 주세요." },
      { key: "company", label: "수신 부서/대표", type: "text", placeholder: "인사총무부장 귀하" }
    ],
    initialValues: {
      title: "재 직 증 명 발 급 신 청 서",
      dept: "인사총무팀",
      name: "홍길동 대리",
      date: "2026년 06월 15일",
      company: "인사총무부장 귀하",
      content: "[신청 사원 정보]\n소속: 경영지원팀\n직급: 대리\n사번: MD202301\n성명: 홍길동 (주민등록번호: 900101-1234567)\n입사일자: 2023년 01월 01일\n\n[발급 신청 사항]\n신청 수량: 1부\n제출 기관: 국민은행 도화동 지점\n발급 사유: 개인 전세 자금 대출 심사 서류 제출용\n\n상기와 같은 사유로 재직증명서 발급을 정중히 신청합니다."
    }
  },
  {
    id: "gov_career_cert_req",
    category: "노무",
    title: "경력증명서",
    description: "퇴직자가 타사 재취업이나 경력 입증 목적으로 퇴직한 회사에 경력사항 증빙 발급을 신청하는 서식입니다.",
    tags: ["경력증명서", "퇴직자", "경력증빙", "인사행정", "총무팀"],
    fields: [
      { key: "name", label: "퇴직 사원 성명", type: "text", placeholder: "홍길동" },
      { key: "dept", label: "퇴직 시 소속 부서", type: "text", placeholder: "영업기획팀" },
      { key: "purpose", label: "제출처 및 용도", type: "text", placeholder: "이직 회사 경력 산정 서류 제출용" },
      { key: "content", label: "재직 당시 직무 및 근무 기간 정보", type: "textarea", placeholder: "입사일, 퇴사일, 최종 직급, 주요 담당 업무를 적어주세요." },
      { key: "company", label: "인사부서 수신", type: "text", placeholder: "인사총무팀장 귀하" }
    ],
    initialValues: {
      title: "경 력 증 명 발 급 신 청 서",
      dept: "인사총무부",
      name: "홍길동 전 과장",
      date: "2026년 06월 15일",
      company: "인사총무팀장 귀하",
      content: "[퇴직자 인적사항]\n성명: 홍길동 (생년월일: 1985년 10월 10일)\n재직 기간: 2018년 03월 01일 ~ 2026년 05월 31일\n퇴직 시 최종직급: 과장\n\n[최종 담당 직무]\n영업기획팀 소속 국내 파트너 비즈니스 개발 및 대리점 영업 기획 관리 담당\n\n[신청 내역]\n용도: 타사 재취업 증빙 제출용 (제출처: 마음물산)\n발급 수량: 2부"
    }
  },
  {
    id: "gov_handover",
    category: "행정",
    title: "업무 인수인계서",
    description: "부서 이동, 퇴사 등으로 인해 업무 공백이 발생하지 않도록 후임자에게 업무 진행 상황을 인계하는 명서입니다.",
    tags: ["인수인계서", "업무인계", "퇴사절차", "부서이동", "총무"],
    fields: [
      { key: "name", label: "인계자 성명", type: "text", placeholder: "홍길동" },
      { key: "delegatee", label: "인수자 성명", type: "text", placeholder: "이영희" },
      { key: "title", label: "업무 인수인계 제목", type: "text", placeholder: "총무 및 구매 거래처 정기 정산 인수인계의 건" },
      { key: "content", label: "상세 인계 사항 및 파일 목록", type: "textarea", placeholder: "주요 진행 안건, 정기 마감 일정, 거래처 연락망 정보를 정리하세요." },
      { key: "company", label: "결재 부서장", type: "text", placeholder: "경영지원본부장 귀하" }
    ],
    initialValues: {
      title: "업 무 인 수 인 계 서",
      dept: "경영지원팀",
      name: "홍길동 대리",
      date: "2026년 06월 15일",
      company: "경영지원본부장 귀하",
      content: "[인수·인계자]\n인계자: 홍길동 대리 / 인수자: 이영희 사원\n\n[주요 인계 업무 목록]\n1. 월간 사무용 비품 및 정기 렌탈 품목 청구서 정산 (매월 25일 마감)\n   - 주거래처: 마음오피스 (연락처: 02-1234-5678, 마감 메일 발송 필요)\n2. 사내 공용 회의실 대관 시스템 예약 승인 및 캘린더 관리\n3. 전사 소모성 물품 입고 및 재고 파악 (매주 금요일 16시)\n\n[보관 문서 및 폴더 링크]\n- NAS 공유폴더 내 '총무지원/거래처정보_2026' 시트 참고 요망."
    }
  },
  {
    id: "gov_receipt",
    category: "재무",
    title: "영수증",
    description: "공식 간이영수증이나 세금계산서 발행이 곤란한 현금 수수 거래에 서명하는 일반 보증서식입니다.",
    tags: ["영수증", "현금영수증", "지출증빙", "간이영수증", "금전수취"],
    fields: [
      { key: "name", label: "지불인 (수취인 기준 갑)", type: "text", placeholder: "홍길동" },
      { key: "receiver", label: "금전 수령자 (을)", type: "text", placeholder: "김철수" },
      { key: "amount", label: "영수 금액", type: "text", placeholder: "500,000원" },
      { key: "content", label: "거래 항목 및 사유", type: "textarea", placeholder: "영수 대상이 되는 물품 대금이나 서비스 대가 명세를 적어주세요." },
      { key: "company", label: "지불 수단 확인", type: "text", placeholder: "현금 직접 영수 및 즉시 송금 확인" }
    ],
    initialValues: {
      title: "영 수 증 (Receipt)",
      dept: "금전 수령 확인",
      name: "홍길동 귀하",
      date: "2026년 06월 15일",
      company: "수령자 김철수 (서명/날인)",
      content: "[금전 수취 사항]\n영수 금액: 일금 오십만 원整 (500,000원)\n\n[거래 내용]\n사무실 내 기존 파손 책상 2대 매각 및 폐기 처리에 따르는 철거 인부 수당 및 운송비용을 정당하게 수취하였음을 증명합니다.\n\n상기 금액을 정히 영수하고 이에 영수증을 발행합니다."
    }
  },
  {
    id: "gov_privacy_agree",
    category: "노무",
    title: "개인정보 수집 및 이용 동의서",
    description: "채용 지원, 입사 처리, 마케팅 동의 등 관련하여 정보주체에게 개인정보 동의를 구하는 법적 필수 양식입니다.",
    tags: ["개인정보동의서", "동의서", "인사총무", "채용서식", "회사양식"],
    fields: [
      { key: "name", label: "동의자 성명", type: "text", placeholder: "홍길동" },
      { key: "purpose", label: "수집 목적 범위", type: "text", placeholder: "채용 심사 및 사원 등록" },
      { key: "content", label: "수집 항목 및 보존 기간 조항", type: "textarea", placeholder: "수집하는 개인정보 필수/선택 항목과 파기 기한을 조항별로 기재하세요." },
      { key: "company", label: "수신 기관명", type: "text", placeholder: "마음데이터 주식회사 대표이사 귀하" }
    ],
    initialValues: {
      title: "개인정보 수집 · 이용 및 제공 동의서",
      dept: "인사행정팀",
      name: "홍길동 (서명)",
      date: "2026년 06월 15일",
      company: "마음데이터 주식회사 대표이사 귀하",
      content: "본인은 마음데이터 주식회사의 입사 지원 및 채용 심사 과정에서 필요한 개인정보의 수집 및 활용에 관하여 다음과 같이 동의합니다.\n\n1. [수집·이용 목적]: 채용 전형 진행, 학력/경력 검증, 입사 후 근로 계약 체결 및 사원 등록\n2. [수집 항목]: 성명, 생년월일, 연락처, 이메일, 주소, 학력, 경력 사항\n3. [보유 및 이용 기간]: 채용 전형 종료 시까지 (채용 확정자는 퇴직 시까지 보유)\n\n※ 정보주체는 본 동의를 거부할 권리가 있으나, 거부 시 채용 심사 진행이 곤란할 수 있습니다."
    }
  },
  {
    id: "gov_security_pledge",
    category: "노무",
    title: "보안 서약서",
    description: "사내 영업 비밀, 기밀 정보, 기술 유출을 방지하고 유출 시 법적 책임을 약정하는 기업 필수 서약 서식입니다.",
    tags: ["보안서약서", "영업비밀", "기밀유지", "입사자료", "서약서"],
    fields: [
      { key: "name", label: "서약자 성명", type: "text", placeholder: "홍길동" },
      { key: "dept", label: "소속 부서/직급", type: "text", placeholder: "경영기획실 / 대리" },
      { key: "content", label: "기밀 유지 의무 및 제재 조항", type: "textarea", placeholder: "보안 대상이 되는 자산 범위 및 유출 시 손해배상 규정을 명시하세요." },
      { key: "company", label: "수신 회사명", type: "text", placeholder: "마음데이터 주식회사 귀중" }
    ],
    initialValues: {
      title: "보 안 서 약 서",
      dept: "인사/정보보안",
      name: "홍길동 (서명)",
      date: "2026년 06월 15일",
      company: "마음데이터 주식회사 귀중",
      content: "[서약자 정보]\n소속: 경영기획실\n직급: 대리\n성명: 홍길동 (주민등록번호: 900101-1234567)\n\n[서약 내용]\n본인은 마음데이터 주식회사에 입사함에 있어서 다음 사항을 준수할 것을 엄숙히 서약합니다.\n1. 재직 기간 중은 물론 퇴직 후에도 회사의 영업 비밀, 개발 소스코드, 고객 정보, 미발표 경영 계획 등 기밀 정보를 제3자에게 누설하거나 부당 활용하지 않는다.\n2. 이를 위반하여 회사에 유무형의 손해를 입힌 경우, 부정경쟁방지법 및 관련 민형사상 법령에 따른 민형사상의 손해배상 책임을 질 것을 엄중히 동의합니다."
    }
  },
  {
    id: "gov_loss_report",
    category: "행정",
    title: "물품 분실 신고서",
    description: "사내 공용 자산이나 물품을 분실하였을 때, 분실 일시와 사유를 기재해 대체품 신청 및 징계 판단 근거로 쓰는 총무 서식입니다.",
    tags: ["분실신고서", "자산관리", "총무행정", "물품관리", "분실경위"],
    fields: [
      { key: "name", label: "신고 사원 성명", type: "text", placeholder: "홍길동" },
      { key: "itemName", label: "분실 물품명 및 일련번호", type: "text", placeholder: "사무용 법인 카드 (번호: ****-****)" },
      { key: "content", label: "분실 경위 및 대처 사항", type: "textarea", placeholder: "분실 시간, 장소, 정황과 분실 후 취한 분실 방지 차단 신고 조치를 기재하세요." },
      { key: "company", label: "자산관리 담당부서 수신", type: "text", placeholder: "경영지원실 총무담당자 귀하" }
    ],
    initialValues: {
      title: "물 품 분 실 신 고 서",
      dept: "경영지원팀",
      name: "홍길동 대리",
      date: "2026년 06월 15일",
      company: "경영지원실 총무담당자 귀하",
      content: "[분실 물품 정보]\n자산 종류: 법인카드 / 자산명: 신한법인카드 (카드번호: 9411-****-****-****)\n\n[분실 경위]\n2026년 6월 14일 20:00경 외부 바이어 미팅 및 식사 집행 후 복귀 도중 공덕역 부근에서 지갑과 함께 카드를 분실함.\n\n[대처 사항]\n분실 즉시 6월 14일 20:15경 신한카드 고객센터를 통해 분실 접수 및 결제 승인 일시 정지 조치를 취함 (접수번호: SH938472). 현재까지 카드 분실에 따른 오사용 부정 결제 금액은 없는 것으로 확인됨."
    }
  },
  
  // 4. 근로복지공단 근로복지넷 서식 7종
  {
    id: "generic_comwel_welfare_loan",
    category: "행정",
    title: "생활안정자금 융자신청서",
    description: "근로복지공단 근로복지넷에서 주관하는 의료비, 혼례비, 자녀학자금 등 생활안정자금 대부 신청용 표준 서식입니다.",
    tags: ["근로복지공단", "생활안정자금", "융자신청서", "복지", "대부"],
    fields: [
      { key: "employerName", label: "소속 사업장명", type: "text", placeholder: "예: 마음데이터 주식회사" },
      { key: "employerBizNo", label: "사업자등록번호", type: "text", placeholder: "예: 120-81-00000" },
      { key: "employeeName", label: "신청 근로자 성명", type: "text", placeholder: "예: 홍길동" },
      { key: "employeeRegNo", label: "근로자 주민등록번호", type: "text", placeholder: "예: 900101-1234567" },
      { key: "employeeAddr", label: "근로자 주소", type: "text", placeholder: "예: 서울시 마포구 마포대로 14" },
      { key: "employeePhone", label: "근로자 연락처", type: "text", placeholder: "예: 010-1234-5678" },
      { key: "loanType", label: "융자 종류 선택", type: "select", options: ["의료비", "혼례비", "장례비", "부모요양비", "자녀학자금", "임금감소생계비", "소액생계비"] },
      { key: "loanAmt", label: "융자 희망금액 (원)", type: "text", placeholder: "예: 5,000,000" },
      { key: "content", label: "구체적 신청 사유", type: "textarea", placeholder: "의료비 지급 사유 등 구체적인 신청 사정을 작성하세요." },
      { key: "company", label: "수신 기관", type: "text", placeholder: "근로복지공단 이사장 귀하" }
    ],
    initialValues: {
      title: "생활안정자금 융자신청서",
      dept: "근로복지 대부",
      name: "홍길동",
      date: "2026년 06월 15일",
      company: "근로복지공단 이사장 귀하",
      content: "[신청인 (융자대상자) 정보]\n성명: 홍길동 (주민등록번호: 900101-1234567)\n소속 사업장명: 마음데이터 주식회사\n사업자등록번호: 120-81-00000\n주소: 서울시 마포구 마포대로 14\n연락처: 010-1234-5678\n\n[융자 신청 내역]\n융자 종류: 의료비 (의료비, 혼례비, 장례비, 부모요양비 등)\n융자 희망 금액: 금 5,000,000원 (오백만 원)\n\n[신청 사유]\n본인 질병 치료 및 수술비 마련을 위해 근로자 생활안정자금 융자 규정에 의거하여 위와 같이 융자를 신청합니다."
    }
  },
  {
    id: "generic_comwel_welfare_pledge",
    category: "행정",
    title: "생활안정자금 대부 서약서",
    description: "근로복지공단의 생활안정자금 융자 지원 결정을 받은 후 대부 규정 준수를 약정하는 서약서 양식입니다.",
    tags: ["근로복지공단", "서약서", "생활안정자금", "복지", "대부"],
    fields: [
      { key: "name", label: "서약인 성명", type: "text", placeholder: "홍길동" },
      { key: "regNo", label: "서약인 주민등록번호", type: "text", placeholder: "예: 900101-1234567" },
      { key: "address", label: "서약인 주소", type: "text", placeholder: "예: 서울시 마포구 마포대로 14" },
      { key: "content", label: "서약 규정 조항", type: "textarea", placeholder: "대부 조건 성실 이행 및 위반 시 환수 동의 조항을 입력하세요." },
      { key: "company", label: "수신 기관", type: "text", placeholder: "근로복지공단 이사장 귀하" }
    ],
    initialValues: {
      title: "서 약 서 (생활안정자금)",
      dept: "대부 계약",
      name: "홍길동",
      date: "2026년 06월 15일",
      company: "근로복지공단 이사장 귀하",
      content: "[서약인 인적사항]\n성명: 홍길동 (주민등록번호: 900101-1234567)\n주소: 서울시 마포구 마포대로 14\n\n[서약 내용]\n본인은 근로자 생활안정자금 융자지원 결정을 받음에 있어 관련 대부 규정과 신용보증 약정을 성실히 이행할 것을 서약합니다.\n1. 대부 자금을 약정한 융자 목적(의료비, 혼례비 등) 외의 용도로 유용하지 않겠습니다.\n2. 허위 또는 부정한 방법으로 대부받았음이 확인될 경우, 대부 결정을 취소하고 즉시 전액을 상환하겠습니다.\n3. 공단의 신용보증 규정 및 수탁 은행의 채무 상환 의무를 성실히 이행하겠습니다."
    }
  },
  {
    id: "generic_comwel_loan_term_change",
    category: "행정",
    title: "체불근로자 생계비 거치기간 변경신청서",
    description: "체불근로자 생계비 대부 융자금의 상환 거치기간 연장 및 상환 조건 변경을 공단에 신청하는 서식입니다.",
    tags: ["근로복지공단", "체불근로자", "생계비융자", "기간변경", "대부"],
    fields: [
      { key: "name", label: "신청인 성명", type: "text", placeholder: "홍길동" },
      { key: "regNo", label: "주민등록번호", type: "text", placeholder: "예: 900101-1234567" },
      { key: "phone", label: "연락처", type: "text", placeholder: "예: 010-1234-5678" },
      { key: "address", label: "주소", type: "text", placeholder: "예: 서울시 마포구 마포대로 14" },
      { key: "loanAmt", label: "융자 원금 (원)", type: "text", placeholder: "예: 7,500,000" },
      { key: "prevTerm", label: "당초 거치기간", type: "text", placeholder: "예: 1년 거치 3년 분할상환" },
      { key: "newTerm", label: "변경 거치기간", type: "text", placeholder: "예: 2년 거치 3년 분할상환 (1년 연장)" },
      { key: "reason", label: "변경 신청 사유", type: "textarea", placeholder: "거치기간 연장이 필요한 생계 곤란 사유를 기재하세요." },
      { key: "company", label: "수신 처", type: "text", placeholder: "근로복지공단 이사장 귀하" }
    ],
    initialValues: {
      title: "거치기간 변경 신청서 (체불근로자)",
      dept: "대부 조건 변경",
      name: "홍길동",
      date: "2026년 06월 15일",
      company: "근로복지공단 이사장 귀하",
      content: "[신청인 정보]\n성명: 홍길동 (주민등록번호: 900101-1234567)\n주소: 서울시 마포구 마포대로 14\n연락처: 010-1234-5678\n\n[대부 변경 내역]\n융자 금액: 금 7,500,000원\n당초 거치기간: 1년 거치 3년 분할상환\n변경 거치기간: 2년 거치 3년 분할상환 (1년 연장)\n\n[거치기간 변경 신청 사유]\n임금 체불 상태가 지속되고 구직 활동이 지연되어 생계 곤란으로 인해 당초 대부금의 거치기간을 1년 연장 신청합니다."
    }
  },
  {
    id: "generic_comwel_loan_pledge",
    category: "행정",
    title: "체불근로자 생계비 융자 서약서",
    description: "체불근로자 생계비 융자 수혜 후 체불금 소급 수령 시의 즉시 상환 약정 등 의무 사항을 담은 서약서입니다.",
    tags: ["근로복지공단", "서약서", "체불근로자", "생계비융자", "대부"],
    fields: [
      { key: "name", label: "서약자 성명", type: "text", placeholder: "홍길동" },
      { key: "regNo", label: "주민등록번호", type: "text", placeholder: "예: 900101-1234567" },
      { key: "address", label: "주소", type: "text", placeholder: "예: 서울시 마포구 마포대로 14" },
      { key: "content", label: "서약 의무 조항", type: "textarea", placeholder: "체불 임금 수령 시 우선 상환 조항 및 신용보증 약정을 수록하세요." },
      { key: "company", label: "수신 처", type: "text", placeholder: "근로복지공단 이사장 귀하" }
    ],
    initialValues: {
      title: "서 약 서 (체불근로자 생계비)",
      dept: "대부 서약서",
      name: "홍길동",
      date: "2026년 06월 15일",
      company: "근로복지공단 이사장 귀하",
      content: "[서약인 인적사항]\n성명: 홍길동 (주민등록번호: 900101-1234567)\n주소: 서울시 마포구 마포대로 14\n\n[서약 내용]\n본인은 체불근로자 생계비 융자 융자금을 대부받음에 있어 다음 사항을 준수할 것을 서약합니다.\n1. 체불 임금의 소급 수령이나 법정 배당금 수령 시 대부 원리금을 즉시 우선 상환하겠습니다.\n2. 본 융자금과 관련하여 대부 조건 및 상환 약정을 성실히 이행하며 귀 공단의 신용보증 규정을 준수합니다."
    }
  },
  {
    id: "generic_comwel_work_confirm",
    category: "노무",
    title: "노무제공사실확인서",
    description: "근로복지공단 융자 신청 시 프리랜서나 특수고용형태 근로자의 재직 및 노무제공 여부를 사업주가 공식 증빙하는 서식입니다.",
    tags: ["근로복지공단", "노무제공사실확인서", "프리랜서", "특수고용직", "노무증빙"],
    fields: [
      { key: "name", label: "노무제공자 성명", type: "text", placeholder: "홍길동" },
      { key: "regNo", label: "주민등록번호", type: "text", placeholder: "예: 900101-1234567" },
      { key: "address", label: "근로자 주소", type: "text", placeholder: "예: 서울시 마포구 마포대로 14" },
      { key: "bizName", label: "사업장 상호", type: "text", placeholder: "예: 마음데이터 주식회사" },
      { key: "bizCEO", label: "대표자 성명", type: "text", placeholder: "예: 김철수" },
      { key: "bizNo", label: "사업자등록번호", type: "text", placeholder: "예: 120-81-00000" },
      { key: "workPeriod", label: "노무 제공 기간", type: "text", placeholder: "예: 2026.01.01 ~ 2026.06.15" },
      { key: "workTask", label: "노무 제공 내용 (용역내용)", type: "text", placeholder: "예: 데이터 가공 및 가벨링 검수" },
      { key: "company", label: "수신 기관", type: "text", placeholder: "근로복지공단 이사장 귀하" }
    ],
    initialValues: {
      title: "노 무 제 공 사 실 확 인 서",
      dept: "프리랜서 노무증빙",
      name: "홍길동",
      date: "2026년 06월 15일",
      company: "근로복지공단 이사장 귀하",
      content: "[노무제공자 (근로자) 인적사항]\n성명: 홍길동 (주민등록번호: 900101-1234567)\n주소: 서울시 마포구 마포대로 14\n연락처: 010-1234-5678\n\n[노무제공 사업장 정보]\n상호: 마음데이터 주식회사 (대표자: 김철수)\n사업자등록번호: 120-81-00000\n소재지: 서울시 마포구 마포대로 14\n\n[노무 제공 내역]\n제공 기간: 2026년 01월 01일 ~ 2026년 06월 15일\n제공 내용: 플랫폼 데이터 라벨링 및 품질 검수 프리랜서 용역 업무\n\n상기인이 당사에서 위와 같이 노무를 제공한 사실이 틀림없음을 확인합니다."
    }
  },
  {
    id: "generic_comwel_income_reduction",
    category: "노무",
    title: "소득감소사실확인서",
    description: "근로복지공단 소액생계비 융자 신청을 위해 근로자 소득이 실제로 감소했음을 증빙 및 소명하는 확인서입니다.",
    tags: ["근로복지공단", "소득감소", "사실확인서", "소액생계비", "노무증빙"],
    fields: [
      { key: "name", label: "근로자 성명", type: "text", placeholder: "홍길동" },
      { key: "regNo", label: "주민등록번호", type: "text", placeholder: "예: 900101-1234567" },
      { key: "bizName", label: "소속 사업장 상호", type: "text", placeholder: "예: 마음데이터 주식회사" },
      { key: "prevIncome", label: "소득감소 전 월소득 (원)", type: "text", placeholder: "예: 3,000,000" },
      { key: "postIncome", label: "소득감소 후 월소득 (원)", type: "text", placeholder: "예: 1,800,000" },
      { key: "reason", label: "소득 감소 구체적 사유", type: "textarea", placeholder: "경영상 감축 근로, 수당 소멸 등의 정황을 기재하세요." },
      { key: "company", label: "수신 처", type: "text", placeholder: "근로복지공단 이사장 귀하" }
    ],
    initialValues: {
      title: "소 득 감 소 사 실 확 인 서",
      dept: "소득감소 소명서",
      name: "홍길동",
      date: "2026년 06월 15일",
      company: "근로복지공단 이사장 귀하",
      content: "[근로자 인적사항]\n성명: 홍길동 (주민등록번호: 900101-1234567)\n주소: 서울시 마포구 마포대로 14\n\n[소속 사업장 정보]\n상호: 마음데이터 주식회사 (대표자: 김철수)\n\n[소득 감소 내역]\n소득 감소 전 월 평균 소득: 3,000,000원\n소득 감소 후 월 평균 소득: 1,800,000원\n\n[소득 감소 사유]\n사업장의 경영 악화로 인한 단축 근무 및 연장근로 수당 소멸로 인해 월 소득이 감소하였음을 확인합니다."
    }
  },
  {
    id: "generic_comwel_unpaid_leave",
    category: "노무",
    title: "무급휴직자확인서",
    description: "직업훈련 생계비대부 신청을 위해 근로자가 현재 무급휴직 상태임을 회사 측에서 증명해 주는 표준 서식입니다.",
    tags: ["근로복지공단", "무급휴직", "직업훈련", "생계비대부", "노무증빙"],
    fields: [
      { key: "name", label: "휴직 사원 성명", type: "text", placeholder: "홍길동" },
      { key: "regNo", label: "주민등록번호", type: "text", placeholder: "예: 900101-1234567" },
      { key: "bizName", label: "사업장 상호", type: "text", placeholder: "예: 마음데이터 주식회사" },
      { key: "bizCEO", label: "대표자 성명", type: "text", placeholder: "예: 김철수" },
      { key: "bizNo", label: "사업자등록번호", type: "text", placeholder: "예: 120-81-00000" },
      { key: "leavePeriod", label: "무급휴직 기간", type: "text", placeholder: "예: 2026.06.01 ~ 2026.08.31" },
      { key: "leaveReason", label: "무급휴직 시행 사유", type: "textarea", placeholder: "회사의 휴업 조치 배경 등을 상세히 작성해 주세요." },
      { key: "company", label: "수신 처", type: "text", placeholder: "근로복지공단 이사장 귀하" }
    ],
    initialValues: {
      title: "무 급 휴 직 자 확 인 서",
      dept: "무급휴직 증빙",
      name: "홍길동",
      date: "2026년 06월 15일",
      company: "근로복지공단 이사장 귀하",
      content: "[휴직 근로자 인적사항]\n성명: 홍길동 (주민등록번호: 900101-1234567)\n주소: 서울시 마포구 마포대로 14\n\n[사업장 정보]\n상호: 마음데이터 주식회사 (대표자: 김철수)\n사업자등록번호: 120-81-00000\n\n[무급휴직 내역]\n무급휴직 기간: 2026년 06월 01일 ~ 2026년 08월 31일 (3개월간)\n무급휴직 사유: 경영상 부득이한 휴업 조치에 따른 무급휴직 동의 체결\n\n상기 근로자가 회사의 무급휴직 조치에 따라 휴직 중임을 확인합니다."
    }
  },
  {
    id: "contract",
    category: "노무",
    title: "표준 근로계약서",
    description: "근로기준법 제17조에 의거하여 고용노동부에서 고시한 표준 양식입니다. 근로계약기간, 근무장소, 업무내용, 소정근로시간, 근무일 및 휴일, 임금조건, 연차유급휴가, 4대 사회보험 가입여부 등 고용노동부 표준 11대 법정 필수항목이 모두 수록되어 실제 법적 효력을 지닙니다.",
    tags: ["근로계약서", "계약", "노무", "표준계약서", "회사", "법정", "인사"],
    fields: [
      { key: "employerName", label: "사업주 상호 (회사명)", type: "text", placeholder: "예: 마음데이터 주식회사" },
      { key: "employerCEO", label: "대표자 성명", type: "text", placeholder: "예: 김철수" },
      { key: "employerAddr", label: "사업장 주소", type: "text", placeholder: "예: 서울시 마포구 마포대로 14" },
      { key: "employeeName", label: "근로자 성명", type: "text", placeholder: "예: 홍길동" },
      { key: "employeeRegNo", label: "근로자 주민등록번호", type: "text", placeholder: "예: 900101-1234567" },
      { key: "employeeAddr", label: "근로자 주소", type: "text", placeholder: "예: 서울시 영등포구 여의도동 1" },
      { key: "employeePhone", label: "근로자 연락처", type: "text", placeholder: "예: 010-1234-5678" },
      { key: "contractStart", label: "근로계약 시작일 (근로개시일)", type: "text", placeholder: "예: 2026년 07월 01일" },
      { key: "contractEnd", label: "근로계약 종료일 (정규직은 '기한의 정함이 없음')", type: "text", placeholder: "예: 기한의 정함이 없음 (또는 2027년 06월 30일)" },
      { key: "workPlace", label: "근무 장소 (소재지)", type: "text", placeholder: "예: 본사 개발본부 사무실 (서울시 마포구 마포대로 14)" },
      { key: "workTask", label: "담당 업무 내용", type: "text", placeholder: "예: 웹 프론트엔드 개발 및 UI 설계" },
      { key: "workTimeStart", label: "근로 시작 시간", type: "text", placeholder: "예: 09:00" },
      { key: "workTimeEnd", label: "근로 종료 시간", type: "text", placeholder: "예: 18:00" },
      { key: "breakTimeStart", label: "휴게 시작 시간", type: "text", placeholder: "예: 12:00" },
      { key: "breakTimeEnd", label: "휴게 종료 시간", type: "text", placeholder: "예: 13:00" },
      { key: "workingDays", label: "근무 요일 (주당 근무일수)", type: "text", placeholder: "예: 월요일부터 금요일까지 (주 5일)" },
      { key: "holiday", label: "주휴일 요일", type: "text", placeholder: "예: 매주 일요일" },
      { key: "salaryType", label: "임금 형태", type: "select", options: ["월급", "시급", "일급"] },
      { key: "salaryAmt", label: "임금 액수 (원)", type: "text", placeholder: "예: 3,500,000" },
      { key: "bonusAmt", label: "상여금 조건 (없으면 '없음')", type: "text", placeholder: "예: 없음 (또는 연간 2,400,000원)" },
      { key: "otherPayAmt", label: "기타 수당 조건 (없으면 '없음')", type: "text", placeholder: "예: 없음 (또는 직책수당 100,000원)" },
      { key: "payDay", label: "임금 지급일 (일자)", type: "text", placeholder: "예: 매월 25일 (휴일인 경우 전일 지급)" },
      { key: "payMethod", label: "임금 지급 방법", type: "select", options: ["근로자 명의 예금계좌에 입금", "근로자에게 직접 지급"] },
      { key: "socialInsurance", label: "4대 사회보험 가입 여부", type: "text", placeholder: "예: 국민연금, 건강보험, 고용보험, 산재보험 가입" },
      { key: "date", label: "계약 체결 일자", type: "text", placeholder: "예: 2026년 06월 15일" }
    ],
    initialValues: {
      employerName: "마음데이터 주식회사",
      employerCEO: "김철수",
      employerAddr: "서울특별시 마포구 마포대로 14",
      employeeName: "홍길동",
      employeeRegNo: "900101-1234567",
      employeeAddr: "서울특별시 영등포구 여의도동 1",
      employeePhone: "010-1234-5678",
      contractStart: "2026년 07월 01일",
      contractEnd: "기한의 정함이 없음",
      workPlace: "본사 개발본부 사무실",
      workTask: "웹 프론트엔드 개발 및 UI 설계",
      workTimeStart: "09:00",
      workTimeEnd: "18:00",
      breakTimeStart: "12:00",
      breakTimeEnd: "13:00",
      workingDays: "월요일부터 금요일까지 (주 5일)",
      holiday: "매주 일요일",
      salaryType: "월급",
      salaryAmt: "3,500,000",
      bonusAmt: "없음",
      otherPayAmt: "없음",
      payDay: "매월 25일 (휴일인 경우 전일 지급)",
      payMethod: "근로자 명의 예금계좌에 입금",
      socialInsurance: "국민연금, 건강보험, 고용보험, 산재보험 가입",
      date: "",
      useApproval: false
    }
  },
  {
    id: "contract_minor",
    category: "노무",
    title: "연소근로자 표준근로계약서 (친권자 동의서 포함)",
    description: "만 18세 미만인 연소근로자를 고용할 때 체결하는 표준근로계약서로, 근로기준법령에 따른 근로조건 명시와 함께 친권자 또는 후견인의 동의서가 원스톱으로 포함되어 있는 서식입니다.",
    tags: ["근로계약서", "연소근로자", "친권자동의서", "동의서", "노무", "청소년", "계약"],
    fields: [
      { key: "employerName", label: "사업주 상호 (회사명)", type: "text", placeholder: "예: 마음데이터 주식회사" },
      { key: "employerCEO", label: "대표자 성명", type: "text", placeholder: "예: 김철수" },
      { key: "employerAddr", label: "사업장 주소", type: "text", placeholder: "예: 서울시 마포구 마포대로 14" },
      { key: "employeeName", label: "연소근로자 성명", type: "text", placeholder: "예: 이몽룡" },
      { key: "employeeRegNo", label: "근로자 주민등록번호", type: "text", placeholder: "예: 100505-3234567" },
      { key: "employeeAddr", label: "근로자 주소", type: "text", placeholder: "예: 서울시 마포구 망원동 12" },
      { key: "employeePhone", label: "근로자 연락처", type: "text", placeholder: "예: 010-5555-6666" },
      { key: "contractStart", label: "근로계약 시작일", type: "text", placeholder: "예: 2026년 07월 01일" },
      { key: "contractEnd", label: "근로계약 종료일", type: "text", placeholder: "예: 2026년 08월 31일" },
      { key: "workPlace", label: "근무 장소", type: "text", placeholder: "예: 마음데이터 카페 망원점" },
      { key: "workTask", label: "담당 업무 내용", type: "text", placeholder: "예: 매장 정리 및 음료 제조 보조" },
      { key: "workTimeStart", label: "근로 시작 시간", type: "text", placeholder: "예: 13:00" },
      { key: "workTimeEnd", label: "근로 종료 시간", type: "text", placeholder: "예: 18:00" },
      { key: "breakTimeStart", label: "휴게 시작 시간", type: "text", placeholder: "예: 15:00" },
      { key: "breakTimeEnd", label: "휴게 종료 시간", type: "text", placeholder: "예: 15:30" },
      { key: "workingDays", label: "근무 요일 (주당 근무일수)", type: "text", placeholder: "예: 월요일부터 금요일까지 (주 5일)" },
      { key: "holiday", label: "주휴일 요일", type: "text", placeholder: "예: 매주 일요일" },
      { key: "salaryType", label: "임금 형태", type: "select", options: ["시급", "월급"] },
      { key: "salaryAmt", label: "임금 액수 (원)", type: "text", placeholder: "예: 10,300" },
      { key: "bonusAmt", label: "상여금 조건", type: "text", placeholder: "예: 없음" },
      { key: "otherPayAmt", label: "기타 수당 조건", type: "text", placeholder: "예: 없음" },
      { key: "payDay", label: "임금 지급일", type: "text", placeholder: "예: 매월 10일" },
      { key: "payMethod", label: "임금 지급 방법", type: "select", options: ["근로자 명의 예금계좌에 입금", "근로자에게 직접 지급"] },
      { key: "socialInsurance", label: "4대 사회보험 가입 여부", type: "text", placeholder: "예: 고용보험, 산재보험 가입" },
      { key: "parentName", label: "친권자(후견인) 성명", type: "text", placeholder: "예: 성춘향 (모)" },
      { key: "parentBirth", label: "친권자 생년월일", type: "text", placeholder: "예: 1980년 03월 05일" },
      { key: "parentRelation", label: "근로자와의 관계", type: "text", placeholder: "예: 모 (어머니)" },
      { key: "parentPhone", label: "친권자 연락처", type: "text", placeholder: "예: 010-8888-9999" },
      { key: "parentAddr", label: "친권자 주소", type: "text", placeholder: "예: 서울시 마포구 망원동 12" },
      { key: "date", label: "계약 및 동의 일자", type: "text", placeholder: "예: 2026년 06월 15일" }
    ],
    initialValues: {
      employerName: "마음데이터 주식회사",
      employerCEO: "김철수",
      employerAddr: "서울특별시 마포구 마포대로 14",
      employeeName: "이몽룡",
      employeeRegNo: "100505-3234567",
      employeeAddr: "서울특별시 마포구 망원동 12",
      employeePhone: "010-5555-6666",
      contractStart: "2026년 07월 01일",
      contractEnd: "2026년 08월 31일",
      workPlace: "마음데이터 카페 망원점",
      workTask: "매장 정리 및 음료 제조 보조",
      workTimeStart: "13:00",
      workTimeEnd: "18:00",
      breakTimeStart: "15:00",
      breakTimeEnd: "15:30",
      workingDays: "월요일부터 금요일까지 (주 5일)",
      holiday: "매주 일요일",
      salaryType: "시급",
      salaryAmt: "10,300",
      bonusAmt: "없음",
      otherPayAmt: "없음",
      payDay: "매월 10일",
      payMethod: "근로자 명의 예금계좌에 입금",
      socialInsurance: "고용보험, 산재보험 가입",
      parentName: "성춘향",
      parentBirth: "1980년 03월 05일",
      parentRelation: "모 (어머니)",
      parentPhone: "010-8888-9999",
      parentAddr: "서울특별시 마포구 망원동 12",
      date: "",
      useApproval: false
    }
  },
  {
    id: "contract_construction",
    category: "노무",
    title: "건설일용근로자 표준근로계약서",
    description: "건설 현장에서 일용직 근로자를 채용할 때 작성하는 표준 계약 서식으로, 현장 주소, 공사명, 직종 분류와 일급/시급 형태의 임금 구성 항목(기본급, 주휴수당 등)을 구체적으로 기재할 수 있습니다.",
    tags: ["근로계약서", "건설일용직", "일용근로자", "현장계약", "노무", "건설", "계약"],
    fields: [
      { key: "employerName", label: "사업주 상호 (회사명)", type: "text", placeholder: "예: 마음건설 주식회사" },
      { key: "employerCEO", label: "대표자 성명", type: "text", placeholder: "예: 김철수" },
      { key: "employerAddr", label: "사업장 주소", type: "text", placeholder: "예: 서울시 마포구 마포대로 14" },
      { key: "employeeName", label: "일용근로자 성명", type: "text", placeholder: "예: 장길산" },
      { key: "employeeRegNo", label: "근로자 주민등록번호", type: "text", placeholder: "예: 800101-1234567" },
      { key: "employeeAddr", label: "근로자 주소", type: "text", placeholder: "예: 경기도 김포시 김포대로 10" },
      { key: "employeePhone", label: "근로자 연락처", type: "text", placeholder: "예: 010-7777-8888" },
      { key: "contractStart", label: "근로 개시일 (계약시작)", type: "text", placeholder: "예: 2026년 07월 01일" },
      { key: "contractEnd", label: "공사 종료일 (또는 일 단위)", type: "text", placeholder: "예: 공사 종료일까지 (또는 2026년 09월 30일)" },
      { key: "workPlace", label: "근무 장소 (공사 현장명)", type: "text", placeholder: "예: 마포 마음데이터 빌딩 신축 현장" },
      { key: "workTask", label: "담당 업무 (직종)", type: "text", placeholder: "예: 형틀목공" },
      { key: "workTimeStart", label: "근로 시작 시간", type: "text", placeholder: "예: 07:00" },
      { key: "workTimeEnd", label: "근로 종료 시간", type: "text", placeholder: "예: 17:00" },
      { key: "breakTimeStart", label: "휴게 시작 시간", type: "text", placeholder: "예: 12:00" },
      { key: "breakTimeEnd", label: "휴게 종료 시간", type: "text", placeholder: "예: 13:00" },
      { key: "salaryType", label: "임금 형태", type: "select", options: ["일급", "시급"] },
      { key: "salaryAmt", label: "임금 총액 (원)", type: "text", placeholder: "예: 180,000" },
      { key: "salaryBaseAmt", label: "기본급 (원)", type: "text", placeholder: "예: 150,000" },
      { key: "salaryAllowance", label: "주휴수당 등 제수당 (원)", type: "text", placeholder: "예: 30,000" },
      { key: "payDay", label: "임금 지급기일", type: "text", placeholder: "예: 매주 금요일 (또는 매월 말일)" },
      { key: "payMethod", label: "임금 지급 방법", type: "select", options: ["근로자 명의 예금계좌에 입금", "근로자에게 직접 지급"] },
      { key: "socialInsurance", label: "사회보험 적용 여부", type: "text", placeholder: "예: 고용보험, 산재보험 가입" },
      { key: "date", label: "계약 체결 일자", type: "text", placeholder: "예: 2026년 06월 15일" }
    ],
    initialValues: {
      employerName: "마음건설 주식회사",
      employerCEO: "김철수",
      employerAddr: "서울특별시 마포구 마포대로 14",
      employeeName: "장길산",
      employeeRegNo: "800101-1234567",
      employeeAddr: "경기도 김포시 김포대로 10",
      employeePhone: "010-7777-8888",
      contractStart: "2026년 07월 01일",
      contractEnd: "마포 마음데이터 빌딩 신축 공사 종료일까지",
      workPlace: "마포 마음데이터 빌딩 신축 현장",
      workTask: "형틀목공",
      workTimeStart: "07:00",
      workTimeEnd: "17:00",
      breakTimeStart: "12:00",
      breakTimeEnd: "13:00",
      salaryType: "일급",
      salaryAmt: "180,000",
      salaryBaseAmt: "150,000",
      salaryAllowance: "30,000",
      payDay: "매주 금요일 정산 지급",
      payMethod: "근로자 명의 예금계좌에 입금",
      socialInsurance: "고용보험, 산재보험 가입",
      date: "",
      useApproval: false
    }
  },
  {
    id: "contract_short_time",
    category: "노무",
    title: "단시간근로자 표준근로계약서",
    description: "파트타임(알바 등) 단시간 근로자를 채용할 때 작성하는 표준 계약 서식으로, 요일별 시업/종업/휴게시간을 정밀하게 나누어 근로기준법 준수 상태를 기록하는 서식입니다.",
    tags: ["근로계약서", "단시간근로자", "파트타임", "아르바이트", "노무", "요일별시간표", "계약"],
    fields: [
      { key: "employerName", label: "사업주 상호 (회사명)", type: "text", placeholder: "예: 마음데이터 푸드" },
      { key: "employerCEO", label: "대표자 성명", type: "text", placeholder: "예: 김철수" },
      { key: "employerAddr", label: "사업장 주소", type: "text", placeholder: "예: 서울시 마포구 마포대로 14" },
      { key: "employeeName", label: "근로자 성명", type: "text", placeholder: "예: 성춘향" },
      { key: "employeeRegNo", label: "근로자 주민등록번호", type: "text", placeholder: "예: 950202-2234567" },
      { key: "employeeAddr", label: "근로자 주소", type: "text", placeholder: "예: 서울시 마포구 공덕동 10" },
      { key: "employeePhone", label: "근로자 연락처", type: "text", placeholder: "예: 010-9999-8888" },
      { key: "contractStart", label: "근로계약 시작일", type: "text", placeholder: "예: 2026년 07월 01일" },
      { key: "contractEnd", label: "근로계약 종료일", type: "text", placeholder: "예: 기한의 정함이 없음" },
      { key: "workPlace", label: "근무 장소", type: "text", placeholder: "예: 마음데이터 푸드 공덕점" },
      { key: "workTask", label: "담당 업무 내용", type: "text", placeholder: "예: 카운터 응대 및 매장 청결 관리" },
      { key: "monTime", label: "월요일 근로시간 (공란 시 휴무)", type: "text", placeholder: "예: 09:00 ~ 15:00 (휴게 12:00 ~ 12:30)" },
      { key: "tueTime", label: "화요일 근로시간 (공란 시 휴무)", type: "text", placeholder: "예: 09:00 ~ 15:00 (휴게 12:00 ~ 12:30)" },
      { key: "wedTime", label: "수요일 근로시간 (공란 시 휴무)", type: "text", placeholder: "예: 09:00 ~ 15:00 (휴게 12:00 ~ 12:30)" },
      { key: "thuTime", label: "목요일 근로시간 (공란 시 휴무)", type: "text", placeholder: "예: 09:00 ~ 15:00 (휴게 12:00 ~ 12:30)" },
      { key: "friTime", label: "금요일 근로시간 (공란 시 휴무)", type: "text", placeholder: "예: 09:00 ~ 15:00 (휴게 12:00 ~ 12:30)" },
      { key: "satTime", label: "토요일 근로시간 (공란 시 휴무)", type: "text", placeholder: "예: 휴무" },
      { key: "sunTime", label: "일요일 근로시간 (공란 시 휴무)", type: "text", placeholder: "예: 휴무" },
      { key: "workingDays", label: "근무 요일 (주당 근무일수)", type: "text", placeholder: "예: 월요일부터 금요일까지 (주 5일)" },
      { key: "holiday", label: "주휴일 요일", type: "text", placeholder: "예: 매주 토요일" },
      { key: "salaryType", label: "임금 형태", type: "select", options: ["시급", "일급", "월급"] },
      { key: "salaryAmt", label: "임금 액수 (원)", type: "text", placeholder: "예: 10,500" },
      { key: "bonusAmt", label: "상여금 조건", type: "text", placeholder: "예: 없음" },
      { key: "otherPayAmt", label: "기타 수당 조건", type: "text", placeholder: "예: 없음" },
      { key: "payDay", label: "임금 지급일", type: "text", placeholder: "예: 매월 25일" },
      { key: "payMethod", label: "임금 지급 방법", type: "select", options: ["근로자 명의 예금계좌에 입금", "근로자에게 직접 지급"] },
      { key: "socialInsurance", label: "4대 사회보험 가입 여부", type: "text", placeholder: "예: 고용보험, 산재보험 가입" },
      { key: "date", label: "계약 체결 일자", type: "text", placeholder: "예: 2026년 06월 15일" }
    ],
    initialValues: {
      employerName: "마음데이터 푸드",
      employerCEO: "김철수",
      employerAddr: "서울특별시 마포구 마포대로 14",
      employeeName: "성춘향",
      employeeRegNo: "950202-2234567",
      employeeAddr: "서울특별시 마포구 공덕동 10",
      employeePhone: "010-9999-8888",
      contractStart: "2026년 07월 01일",
      contractEnd: "기한의 정함이 없음",
      workPlace: "마음데이터 푸드 공덕점",
      workTask: "카운터 응대 및 매장 청결 관리",
      monTime: "09:00 ~ 15:00 (휴게 12:00 ~ 12:30)",
      tueTime: "09:00 ~ 15:00 (휴게 12:00 ~ 12:30)",
      wedTime: "09:00 ~ 15:00 (휴게 12:00 ~ 12:30)",
      thuTime: "09:00 ~ 15:00 (휴게 12:00 ~ 12:30)",
      friTime: "09:00 ~ 15:00 (휴게 12:00 ~ 12:30)",
      satTime: "휴무",
      sunTime: "휴무",
      workingDays: "주 5일 (월, 화, 수, 목, 금)",
      holiday: "매주 일요일",
      salaryType: "시급",
      salaryAmt: "10,500",
      bonusAmt: "없음",
      otherPayAmt: "없음",
      payDay: "매월 25일",
      payMethod: "근로자 명의 예금계좌에 입금",
      socialInsurance: "고용보험, 산재보험 가입",
      date: "",
      useApproval: false
    }
  },
  {
    id: "contract_foreigner",
    category: "노무",
    title: "외국인근로자 표준근로계약서 (Standard Labor Contract)",
    description: "외국인근로자를 고용할 때 체결하는 영한 대역 표준근로계약서(Standard Labor Contract)로, 기본 근로조건과 숙소 제공 방식, 숙식비 부담 한도를 명확히 적시하는 전용 서식입니다.",
    tags: ["근로계약서", "외국인근로자", "Standard Labor Contract", "영한대역", "노무", "숙식제공", "계약"],
    fields: [
      { key: "employerName", label: "사업주 상호 (Company Name)", type: "text", placeholder: "예: 마음데이터 텍스타일" },
      { key: "employerCEO", label: "대표자 성명 (CEO Name)", type: "text", placeholder: "예: 김철수" },
      { key: "employerAddr", label: "사업장 주소 (Company Address)", type: "text", placeholder: "예: 경기도 양주시 평화로 20" },
      { key: "employerRegNo", label: "사업자등록번호 (Business Registration No.)", type: "text", placeholder: "예: 120-81-00000" },
      { key: "employeeName", label: "근로자 성명 (Employee Name)", type: "text", placeholder: "예: John Doe" },
      { key: "employeeBirth", label: "근로자 생년월일 (Date of Birth)", type: "text", placeholder: "예: 1995년 08월 12일" },
      { key: "employeePassport", label: "여권번호 (Passport No.)", type: "text", placeholder: "예: JR1234567" },
      { key: "employeeNationality", label: "국적 (Nationality)", type: "text", placeholder: "예: 미국 (USA)" },
      { key: "contractStart", label: "근로계약 시작일 (Start Date)", type: "text", placeholder: "예: 2026년 07월 01일" },
      { key: "contractEnd", label: "근로계약 종료일 (End Date)", type: "text", placeholder: "예: 2027년 06월 30일" },
      { key: "workPlace", label: "근무 장소 (Place of Work)", type: "text", placeholder: "예: 양주 제1공장 생산라인" },
      { key: "workTask", label: "담당 업무 (Description of Job)", type: "text", placeholder: "예: 섬유 재단 및 패키징 조립" },
      { key: "workTimeStart", label: "근로 시작 시간 (Start Time)", type: "text", placeholder: "예: 08:30" },
      { key: "workTimeEnd", label: "근로 종료 시간 (End Time)", type: "text", placeholder: "예: 17:30" },
      { key: "breakTimeStart", label: "휴게 시작 시간 (Break Start)", type: "text", placeholder: "예: 12:00" },
      { key: "breakTimeEnd", label: "휴게 종료 시간 (Break End)", type: "text", placeholder: "예: 13:00" },
      { key: "workingDays", label: "근무 요일 (Working Days)", type: "text", placeholder: "예: 월요일부터 금요일까지 (Mon-Fri)" },
      { key: "holiday", label: "주휴일 요일 (Holidays)", type: "text", placeholder: "예: 매주 일요일 (Every Sunday)" },
      { key: "salaryType", label: "임금 형태 (Type of Wage)", type: "select", options: ["월급", "시급"] },
      { key: "salaryAmt", label: "임금 액수 (Wage Amount)", type: "text", placeholder: "예: 2,200,000" },
      { key: "payDay", label: "임금 지급일 (Payment Date)", type: "text", placeholder: "예: 매월 25일" },
      { key: "payMethod", label: "지급 방법 (Method of Payment)", type: "select", options: ["근로자 명의 예금계좌에 입금", "근로자에게 직접 지급"] },
      { key: "lodgingProvided", label: "숙식제공 여부 (Provision of Lodging/Meals)", type: "select", options: ["숙소 및 식사 제공(근로자 전액부담)", "숙소만 제공(식사는 근로자 부담)", "숙식 모두 미제공"] },
      { key: "lodgingFee", label: "숙식비용 부담액 (Lodging Expense)", type: "text", placeholder: "예: 월 150,000원" },
      { key: "socialInsurance", label: "보험 가입 사항 (Social Insurances)", type: "text", placeholder: "예: 고용보험, 산재보험, 건강보험, 국민연금 가입" },
      { key: "date", label: "계약 체결 일자 (Date of Agreement)", type: "text", placeholder: "예: 2026년 06월 15일" }
    ],
    initialValues: {
      employerName: "마음데이터 텍스타일",
      employerCEO: "김철수",
      employerAddr: "경기도 양주시 평화로 20",
      employerRegNo: "120-81-00000",
      employeeName: "John Doe",
      employeeBirth: "1995년 08월 12일",
      employeePassport: "JR1234567",
      employeeNationality: "미국 (USA)",
      contractStart: "2026년 07월 01일",
      contractEnd: "2027년 06월 30일",
      workPlace: "양주 제1공장 생산라인",
      workTask: "섬유 재단 및 패키징 조립",
      workTimeStart: "08:30",
      workTimeEnd: "17:30",
      breakTimeStart: "12:00",
      breakTimeEnd: "13:00",
      workingDays: "월요일부터 금요일까지 (주 5일)",
      holiday: "매주 일요일 (Every Sunday)",
      salaryType: "월급",
      salaryAmt: "2,200,000",
      payDay: "매월 25일",
      payMethod: "근로자 명의 예금계좌에 입금",
      lodgingProvided: "숙소 및 식사 제공(근로자 전액부담)",
      lodgingFee: "월 150,000원",
      socialInsurance: "고용보험, 산재보험, 건강보험, 국민연금 가입",
      date: "",
      useApproval: false
    }
  }
];

// DB에 대규모 서식 벌크 적재 실행
async function importLargeDatasetToDB() {
  try {
    console.log("🚀 대규모 실무/행정/법률 서식 20여 종 적재 시작...");
    
    for (const doc of largeDocumentDataset) {
      console.log(`💾 DB 벌크 적재 중: [${doc.id}] ${doc.title}`);
      
      await pool.query(`
        INSERT INTO document_templates (
          id, title, category, description, popular, tags, fields, initial_values
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          tags = EXCLUDED.tags,
          fields = EXCLUDED.fields,
          initial_values = EXCLUDED.initial_values
      `, [
        doc.id,
        doc.title,
        doc.category,
        doc.description,
        false,
        doc.tags,
        JSON.stringify(doc.fields),
        JSON.stringify(doc.initialValues)
      ]);
    }
    
    console.log("✅ 대규모 핵심 20종 서식이 완벽하게 DB에 인서트/업데이트 적재되었습니다!");
  } catch (err) {
    console.error("❌ 대규모 벌크 적재 가동 실패 에러:", err);
  } finally {
    await pool.end();
  }
}

importLargeDatasetToDB();
