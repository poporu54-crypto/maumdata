export interface FormFaqItem {
  q: string;
  a: string;
}

export interface FormSynergyToolLink {
  label: string;
  desc: string;
  href: string;
  external: boolean;
  emoji: string;
}

export interface FormPracticalGuide {
  badge: string;
  heading: string;
  checkpoints: string[];
  faqs: FormFaqItem[];
  synergyTools: FormSynergyToolLink[];
}

const MAUMCALC_NET_SALARY: FormSynergyToolLink = {
  emoji: "🧮",
  label: "연봉 실수령액 계산기 (마음계산기)",
  desc: "4대보험·근로소득세 공제 후 실제 월 통장 입금액 계산",
  href: "https://www.maumcalc.com/calculators/net-salary",
  external: true,
};

const MAUMCALC_SEVERANCE: FormSynergyToolLink = {
  emoji: "💰",
  label: "퇴직금 계산기 (마음계산기)",
  desc: "1년 이상 근속 시 법정 퇴직금 및 퇴직소득세 미리 계산",
  href: "https://www.maumcalc.com/calculators/severance-pay",
  external: true,
};

const MAUMCALC_WEEKLY_HOLIDAY: FormSynergyToolLink = {
  emoji: "📅",
  label: "주휴수당 계산기 (마음계산기)",
  desc: "주 15시간 이상 근무 시 필수 지급 주휴수당 자동 산정",
  href: "https://www.maumcalc.com/calculators/weekly-holiday-pay",
  external: true,
};

const MAUMCALC_OVERTIME: FormSynergyToolLink = {
  emoji: "⏰",
  label: "통상임금 · 연장/야간수당 계산기",
  desc: "시급·통상임금 기준 연장·야간·휴일 가산수당 계산",
  href: "https://www.maumcalc.com/calculators/ordinary-overtime-pay",
  external: true,
};

const MAUMCALC_VAT: FormSynergyToolLink = {
  emoji: "🧾",
  label: "부가가치세(VAT) 계산기 (마음계산기)",
  desc: "공급가액·부가세 10% 분리 및 합계금액 역산 검증",
  href: "https://www.maumcalc.com/calculators/vat",
  external: true,
};

const MAUMCALC_STAMP_TAX: FormSynergyToolLink = {
  emoji: "📜",
  label: "계약서 인지세 계산기 (마음계산기)",
  desc: "도급·용역·금전소비대차 계약금액별 납부 인지세 조회",
  href: "https://www.maumcalc.com/calculators/stamp-tax",
  external: true,
};

const MAUMCALC_CORP_TAX: FormSynergyToolLink = {
  emoji: "🏛️",
  label: "법인세 계산기 (마음계산기)",
  desc: "과세표준 구간별 법인세율 및 예상 산출세액 계산",
  href: "https://www.maumcalc.com/calculators/corporate-tax",
  external: true,
};

const MAUMCALC_INCOME_TAX: FormSynergyToolLink = {
  emoji: "📊",
  label: "종합소득세 계산기 (마음계산기)",
  desc: "개인사업자·프리랜서 연간 종합소득세 구간별 계산",
  href: "https://www.maumcalc.com/calculators/global-income-tax",
  external: true,
};

const MAUMCALC_OVERDUE_INTEREST: FormSynergyToolLink = {
  emoji: "⚖️",
  label: "법정이자 · 지연손해금 계산기",
  desc: "변제기일 경과 시 약정이자 및 연체 지연손해금 계산",
  href: "https://www.maumcalc.com/calculators/overdue-rent-interest",
  external: true,
};

const INTERNAL_BULK_CHECK: FormSynergyToolLink = {
  emoji: "⚡",
  label: "거래처 휴·폐업 100건 일괄 검증기",
  desc: "계약·견적 전 상대 사업자 계속·폐업·간이과세 1초 확인",
  href: "/bulk-check",
  external: false,
};

const INTERNAL_COMPARE: FormSynergyToolLink = {
  emoji: "⚖️",
  label: "A사 vs B사 기업 1:1 스펙 비교기",
  desc: "지원·이직 기업 간 추정 연봉·입퇴사율·매출 나란히 비교",
  href: "/compare",
  external: false,
};

const INTERNAL_DIRECTORY: FormSynergyToolLink = {
  emoji: "🏆",
  label: "알짜 기업 랭킹 · 업무지구 디렉토리",
  desc: "평균연봉·신규채용 상위 기업과 권역·산업별 리더보드",
  href: "/directory",
  external: false,
};

/**
 * 서식 ID·제목·카테고리에 맞춰 실무 작성 체크포인트, FAQ(FAQPage JSON-LD용),
 * 그리고 마음계산기(MaumCalc)·마음데이타 연관 도구를 반환합니다.
 */
export function resolveFormPracticalGuide(params: {
  templateId: string;
  title: string;
  category: string;
}): FormPracticalGuide {
  const id = (params.templateId || "").toLowerCase();
  const title = (params.title || "").trim();
  const category = (params.category || "행정").trim();
  const combined = `${id} ${title}`;

  // 1. 근로계약서 계열
  if (id.startsWith("contract") || combined.includes("근로계약")) {
    return {
      badge: "근로기준법 실무 체크",
      heading: `${title} 작성 시 놓치면 안 되는 필수 확인사항`,
      checkpoints: [
        "임금(기본급·제수당·상여금), 소정근로시간, 주휴일, 연차유급휴가는 근로기준법 제17조상 반드시 서면으로 명시하고 근로자에게 1부를 교부해야 합니다.",
        "주 15시간 이상 근무하고 소정근로일을 개근하면 단시간(알바) 근로자도 주휴수당 지급 대상이므로 시급과 주휴수당 포함 여부를 명확히 구분하세요.",
        "수습기간(최대 3개월) 감액 적용은 1년 이상 근로계약을 체결한 경우에만 최저임금의 90%까지 가능하며, 단순노무직은 감액이 불가합니다.",
        "전자서명으로 체결하면 계약 당사자 양측이 언제든 원본과 서명 시점을 증빙할 수 있어 분실·위변조 분쟁을 예방할 수 있습니다.",
      ],
      faqs: [
        {
          q: `${title}를 작성한 뒤 꼭 출력해서 도장을 찍어야 효력이 있나요?`,
          a: "아니요. 전자문서 및 전자거래 기본법과 근로기준법상 전자적 방법(비대면 전자서명)으로 작성·교부한 근로계약서도 종이 계약서와 동일한 법적 효력을 갖습니다.",
        },
        {
          q: "근로계약서를 작성하지 않거나 교부하지 않으면 어떤 불이익이 있나요?",
          a: "사용자가 근로조건을 서면으로 명시·교부하지 않을 경우 근로기준법에 따라 500만 원 이하의 벌금(기간제·단시간 근로자는 500만 원 이하 과태료) 처분 대상이 됩니다.",
        },
        {
          q: "계약 연봉 외에 4대보험과 세금을 뗀 실제 월급은 어떻게 확인하나요?",
          a: "아래 마음계산기 연봉 실수령액 계산기에서 계약 연봉과 비과세 식대(월 20만 원)를 입력하면 국민연금·건강보험·소득세 공제 후 실제 월 수령액을 바로 확인할 수 있습니다.",
        },
      ],
      synergyTools: [MAUMCALC_NET_SALARY, MAUMCALC_WEEKLY_HOLIDAY, MAUMCALC_OVERTIME, INTERNAL_COMPARE],
    };
  }

  // 2. 사직서 / 퇴직 계열
  if (id.includes("resignation") || combined.includes("사직") || combined.includes("퇴직")) {
    return {
      badge: "퇴사 · 퇴직 정산 체크",
      heading: `${title} 제출 전 꼭 챙겨야 할 실무 포인트`,
      checkpoints: [
        "퇴사 예정일과 실제 마지막 출근일(연차 소진 포함 여부)을 구분해 정확히 기재하면 급여·퇴직금 정산 시 혼선을 줄일 수 있습니다.",
        "권고사직이나 계약만료 등 비자발적 퇴사라면 '일신상의 사유'로 적지 말고 실제 사유를 사실대로 기재해야 실업급여 수급 자격에 불이익이 없습니다.",
        "1년 이상·주 15시간 이상 계속 근무한 경우 회사는 퇴직일로부터 14일 이내에 퇴직금과 미사용 연차수당을 정산·지급할 의무가 있습니다.",
        "제출 시 결재란 서명 또는 접수 일자가 남도록 사본·PDF를 개인 보관해 두면 향후 퇴직 효력 시점 확인에 유용합니다.",
      ],
      faqs: [
        {
          q: "사직서를 냈는데 회사가 수리해 주지 않으면 언제 퇴사가 인정되나요?",
          a: "기간의 약정이 없는 월급제 근로자의 경우 민법 제660조에 따라 사직 의사표시를 통고받은 당기 후의 1임금지급기가 경과하면(통상 다음 달 말일) 회사 수리 여부와 무관하게 효력이 발생합니다.",
        },
        {
          q: "퇴사 시 남은 연차휴가와 퇴직금은 언제까지 받아야 하나요?",
          a: "근로기준법 제36조에 따라 사용자는 당사자 간 연장 합의가 없는 한 퇴직일로부터 14일 이내에 임금·퇴직금·미사용 연차수당 등 일체의 금품을 청산해야 합니다.",
        },
        {
          q: "예상 퇴직금을 미리 계산해 보고 싶습니다.",
          a: "퇴직 전 3개월 급여와 상여금·연차수당을 기준으로 아래 마음계산기 퇴직금 계산기에서 세전·세후 예상 수령액을 간편하게 산출할 수 있습니다.",
        },
      ],
      synergyTools: [MAUMCALC_SEVERANCE, MAUMCALC_NET_SALARY, INTERNAL_COMPARE, INTERNAL_DIRECTORY],
    };
  }

  // 3. 견적서 / 발주서 / 거래명세서 / 용역계약서
  if (
    id.includes("estimate") ||
    id.includes("order") ||
    id.includes("transaction_statement") ||
    id.includes("partnership") ||
    category === "계약"
  ) {
    return {
      badge: "B2B 거래 · 세무 체크",
      heading: `${title} 작성 시 거래 분쟁을 막는 핵심 체크리스트`,
      checkpoints: [
        "공급가액과 부가가치세(VAT 10%)가 '별도'인지 '포함'인지 명확히 표기해야 정산 시 10% 차액 분쟁을 예방할 수 있습니다.",
        "거래 시작 전 상대방 사업자등록번호가 정상 계속사업자인지, 간이과세·폐업 상태는 아닌지 국세청 실시간 검증을 먼저 거쳐 두세요.",
        "납품·검수 기한, 대금 지급일(세금계산서 발행 후 N영업일 등), 견적 유효기간을 숫자로 구체화해 적는 것이 실무 안전장치입니다.",
        "상단 [기업 DB 자동입력] 버튼을 활용하면 상대 거래처의 상호·사업자번호·대표자·소재지를 오타 없이 1초 만에 채울 수 있습니다.",
      ],
      faqs: [
        {
          q: `${title}에 상대방 회사 정보를 일일이 타이핑하지 않고 넣을 수 있나요?`,
          a: "네. 에디터 상단의 기업 DB 불러오기 버튼을 누르거나 기업 상세페이지에서 바로 작성하기를 클릭하면 상호명·사업자등록번호·대표자·주소가 자동으로 채워집니다.",
        },
        {
          q: "견적서·발주서·용역계약서를 작성한 뒤 거래처와 비대면 서명도 가능한가요?",
          a: "네. 작성 완료 후 [비대면 서명 요청] 기능을 이용하면 보안 PIN이 걸린 전용 서명 링크가 생성되어 거래처 담당자가 별도 가입 없이 모바일·PC에서 즉시 서명할 수 있습니다.",
        },
        {
          q: "공급가액에서 부가세 10%를 분리하거나 합계 금액을 역산하려면 어떻게 하나요?",
          a: "아래 마음계산기 부가가치세(VAT) 계산기에서 합계 금액만 입력하면 공급가액과 세액(10%)이 즉시 분리되어 세금계산서·견적서 기입 실수를 줄일 수 있습니다.",
        },
      ],
      synergyTools: [MAUMCALC_VAT, INTERNAL_BULK_CHECK, MAUMCALC_STAMP_TAX, MAUMCALC_CORP_TAX],
    };
  }

  // 4. 차용증 / 내용증명 / 최고장 / 합의서 / 법률 서식
  if (
    id.includes("iou") ||
    id.includes("demand") ||
    id.includes("settlement") ||
    id.includes("power_of_attorney") ||
    category === "법률"
  ) {
    return {
      badge: "법률 효력 · 증빙 체크",
      heading: `${title} 법적 효력을 지키는 필수 작성 수칙`,
      checkpoints: [
        "금액은 아라비아 숫자와 한글(예: 금 일천만원정, ₩10,000,000)을 병기해 사후 변조나 해석 다툼의 여지를 없애야 합니다.",
        "금전 거래(차용증 등)에서 약정 이자율은 이자제한법상 법정 최고이자율(연 20%)을 초과할 수 없으며, 초과 부분은 무효 처리됩니다.",
        "당사자의 성명, 생년월일(또는 사업자번호), 주소, 연락처를 빠짐없이 적고 자필 서명 또는 인감 날인을 받아 원본을 각 1부씩 보관하세요.",
        "대금 회수나 이행 촉구가 목적이라면 내용증명·최고장 발송일과 계좌이체 내역을 함께 보관해야 향후 민사소송·지급명령 시 핵심 증거가 됩니다.",
      ],
      faqs: [
        {
          q: `${title}은 공증을 받지 않으면 법적 효력이 없나요?`,
          a: "아니요. 당사자 간 서명·날인이 완료된 사문서라도 실제 거래 증빙(이체확인증 등)이 뒷받침되면 민사상 충분한 증거 효력을 갖습니다. 공증은 소송 없이 즉시 강제집행이 필요할 때 추가로 선택하는 절차입니다.",
        },
        {
          q: "변제기일이 지났을 때 지연이자는 어떻게 계산하나요?",
          a: "약정 이율이 있다면 그 이율을, 별도 약정이 없다면 민법상 연 5%(상사채권 연 6%, 소송촉진특례법 연 12%)를 적용하며 아래 법정이자·지연손해금 계산기로 일수별 이자를 계산할 수 있습니다.",
        },
        {
          q: "작성한 문서를 한글(HWP)이나 워드(DOC), A4 PDF로 저장할 수 있나요?",
          a: "네. 에디터에서 내용을 기입한 뒤 상단 버튼으로 여백이 맞춰진 A4 PDF 인쇄 또는 HWP·DOC 파일 다운로드를 회원가입 없이 즉시 이용할 수 있습니다.",
        },
      ],
      synergyTools: [MAUMCALC_OVERDUE_INTEREST, MAUMCALC_STAMP_TAX, INTERNAL_BULK_CHECK, MAUMCALC_INCOME_TAX],
    };
  }

  // 5. 재무 / 경리 / 세무 서식
  if (id.includes("payment") || category === "재무") {
    return {
      badge: "회계 · 세무 증빙 체크",
      heading: `${title} 결재 및 세무 증빙 관리 체크포인트`,
      checkpoints: [
        "3만 원 초과 경비 지출 시 세금계산서·계산서·법인카드 매출전표·현금영수증 등 법정 적격증빙을 반드시 첨부해야 가산세를 피할 수 있습니다.",
        "거래처에 대금을 송금하기 전 휴·폐업 여부와 일반/간이과세 유형을 미리 점검하면 매입세액 불공제 사고를 원천 예방할 수 있습니다.",
        "지출 일자, 계정과목, 지급처, 공급가액·부가세, 결재선(담당·검토·승인)이 누락되지 않았는지 출력 전 미리보기로 확인하세요.",
        "상단 결재란 토글을 켜면 회사 내부 품의 규정에 맞춰 담당·팀장·대표이사 결재 서명란을 자동으로 배치할 수 있습니다.",
      ],
      faqs: [
        {
          q: `${title} 작성 시 부가세와 공급가액은 따로 적어야 하나요?`,
          a: "네. 회계 전표 처리와 부가가치세 매입세액 공제 확인을 위해 공급가액과 부가세(10%)를 구분해 기재하는 것이 원칙입니다.",
        },
        {
          q: "결재 전에 거래처 여러 곳의 폐업 여부를 한꺼번에 확인하는 방법이 있나요?",
          a: "마음데이타의 거래처 휴·폐업 100건 일괄 검증기에서 엑셀 번호 열을 그대로 붙여넣으면 1초 만에 계속·폐업·간이과세 여부를 표로 확인하고 CSV로 저장할 수 있습니다.",
        },
        {
          q: "작성한 서식 데이터는 서버에 남나요?",
          a: "일반 작성 및 PDF 인쇄·다운로드 시 입력 내용은 브라우저 안에서만 처리되어 외부에 저장되지 않으며, 사용자가 직접 [비대면 서명 요청]을 실행한 계약서만 암호화 보관됩니다.",
        },
      ],
      synergyTools: [INTERNAL_BULK_CHECK, MAUMCALC_VAT, MAUMCALC_CORP_TAX, MAUMCALC_INCOME_TAX],
    };
  }

  // 6. 노무 일반 (이력서 / 재직증명서 / 경력증명서 / 휴가신청서 등)
  if (category === "노무") {
    return {
      badge: "인사 · 노무 실무 체크",
      heading: `${title} 작성 및 발급 시 핵심 확인사항`,
      checkpoints: [
        "재직·경력증명서 등 사용증명서는 근로기준법 제39조에 따라 근로자가 청구한 사실(사용기간·업무종류·지위·임금 등)만 정확히 기재해야 합니다.",
        "이력서·경력기술서를 준비 중이라면 지원 대상 기업의 국민연금 추정 평균연봉·입퇴사율·재무 상태를 미리 비교해 보고 연봉 협상 근거로 활용해 보세요.",
        "직인이나 자필 서명이 필요한 경우 상단 [전자서명/도장] 기능으로 깔끔하게 날인한 뒤 바로 A4 PDF로 저장할 수 있습니다.",
        "인쇄 시 브라우저의 '배경 그래픽' 옵션을 켜고 머리글/바닥글을 끄면 공식 제출용 문서처럼 깨끗하게 출력됩니다.",
      ],
      faqs: [
        {
          q: `${title}를 작성할 때 회원가입이나 프로그램 설치가 필요한가요?`,
          a: "아니요. 마음데이타 FORM의 모든 표준 서식은 별도 로그인이나 한글·워드 프로그램 설치 없이 PC와 모바일 웹 브라우저에서 바로 작성·인쇄할 수 있습니다.",
        },
        {
          q: "지원하거나 이직하려는 회사의 실제 연봉과 퇴사율도 확인할 수 있나요?",
          a: "네. 마음데이타 기업 1:1 스펙 비교기와 기업 랭킹 디렉토리에서 국세청·국민연금·DART 실데이터 기반의 추정 평균연봉과 임직원 입퇴사 추이를 무료로 비교할 수 있습니다.",
        },
        {
          q: "문서에 회사 로고나 직인 이미지를 넣을 수 있나요?",
          a: "네. 에디터 상단의 서명·도장 입력 기능과 로고 업로드 기능을 이용하면 공식 제출용 문서 양식을 그대로 완성할 수 있습니다.",
        },
      ],
      synergyTools: [INTERNAL_COMPARE, MAUMCALC_NET_SALARY, MAUMCALC_SEVERANCE, INTERNAL_DIRECTORY],
    };
  }

  // 7. 행정 / 정부 민원 / 기타 표준 서식
  return {
    badge: `${category} 실무 작성 가이드`,
    heading: `${title} 깔끔하게 작성·출력하는 실무 체크포인트`,
    checkpoints: [
      "문서 번호, 작성 일자, 수신·발신처(담당자 및 소속), 핵심 제목을 상단에 명확히 기재하면 결재와 사후 이력 추적이 훨씬 수월합니다.",
      "외부 기관이나 거래처에 제출하는 공식 문서라면 제출일 기준 최신 사업자등록번호·법인명·대표자 표기가 일치하는지 확인하세요.",
      "에디터 상단의 [결재란 표시]와 [서명·도장] 기능을 활용하면 출력 후 다시 도장을 찍고 스캔하는 번거로움 없이 즉시 PDF 원본을 완성할 수 있습니다.",
      "작성한 문서는 A4 규격 PDF 인쇄뿐만 아니라 HWP(한글)·DOC(워드) 형식으로도 내려받아 사내 양식에 맞게 추가 편집할 수 있습니다.",
    ],
    faqs: [
      {
        q: `${title} 양식은 무료로 상업적·회사 업무에 사용해도 되나요?`,
        a: "네. 마음데이타에서 제공하는 표준 비즈니스·행정 서식은 개인 및 법인 실무자가 회원가입 없이 무료로 작성·인쇄·제출할 수 있습니다.",
      },
      {
        q: "작성 중 실수로 창을 닫거나 인쇄 레이아웃이 잘리면 어떻게 하나요?",
        a: "본 에디터는 한국 표준 A4(210×297mm) 규격에 맞춰 인쇄 전용 스타일이 적용되어 있으며, 우측 미리보기 화면과 동일한 비율로 PDF 저장 및 출력이 가능합니다.",
      },
      {
        q: "거래처나 관련 기관에 문서를 보내기 전 사업자 정보도 확인할 수 있나요?",
        a: "네. 마음데이타 상단 검색창이나 거래처 일괄 검증기에서 상대 기업명 또는 사업자번호를 입력하면 국세청 납세상태와 기업 정보를 바로 검증할 수 있습니다.",
      },
    ],
    synergyTools: [INTERNAL_DIRECTORY, INTERNAL_BULK_CHECK, MAUMCALC_VAT, MAUMCALC_INCOME_TAX],
  };
}
