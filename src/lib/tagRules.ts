/**
 * 서식 카테고리 및 태그 지능형 매핑 규칙 (Tag Synonym & Keyword Expansion)
 * 사용자가 특정 태그나 카테고리를 선택했을 때, 관련 서식이 누락 없이 풍성하게 검색되도록 지원합니다.
 */

export interface TagRule {
  category?: string;
  keywords: string[];
  tags: string[];
}

export const TAG_RULES: Record<string, TagRule> = {
  // 1. 인사 / 노무
  "근로계약서": {
    category: "노무",
    keywords: ["근로계약", "표준근로", "알바", "단시간", "단기근로", "정규직", "계약직", "파트타임"],
    tags: ["근로계약서", "근로기준법", "노무", "계약서"]
  },
  "사직서": {
    category: "노무",
    keywords: ["사직", "사임", "퇴직", "퇴사", "해고", "퇴직원"],
    tags: ["사직서", "퇴사", "사임서", "노무"]
  },
  "휴가신청서": {
    category: "노무",
    keywords: ["휴가", "연차", "휴직", "병가", "출산", "육아휴직", "경조휴가", "반차"],
    tags: ["휴가신청서", "휴가", "연차", "복리후생", "노무"]
  },
  "이력서": {
    category: "노무",
    keywords: ["이력서", "자기소개", "자소서", "경력", "입사지원", "채용", "이력", "포트폴리오"],
    tags: ["이력서", "자소서", "입사", "노무", "취업"]
  },
  "이력서/자소설": {
    category: "노무",
    keywords: ["이력서", "자기소개", "자소서", "경력", "입사지원", "채용"],
    tags: ["이력서", "자소서", "입사", "노무", "취업"]
  },
  "인사": {
    category: "노무",
    keywords: ["인사", "노무", "취업규칙", "서약", "징계", "복무", "면접", "평가", "인사발령"],
    tags: ["인사", "노무", "근로기준법"]
  },
  "인사/노무일반": {
    category: "노무",
    keywords: ["인사", "노무", "취업규칙", "서약", "징계", "복무", "고용", "근로자"],
    tags: ["인사", "노무", "근로기준법"]
  },

  // 2. 기획 / 행정
  "기안서": {
    category: "행정",
    keywords: ["기안", "업무보고", "사업계획", "보고서", "기획", "제안서"],
    tags: ["기안서", "보고서", "행정", "기획"]
  },
  "품의서": {
    category: "행정",
    keywords: ["품의", "결재", "승인", "집행", "구매품의", "예산품의"],
    tags: ["품의서", "결재", "행정"]
  },
  "회의록": {
    category: "행정",
    keywords: ["회의", "의사록", "주총", "이사회", "간담회", "미팅"],
    tags: ["회의록", "의사록", "이사회", "주주총회", "행정"]
  },
  "경위서/시말서": {
    category: "행정",
    keywords: ["경위", "시말", "사유서", "해명", "사고보고", "과실", "전말서"],
    tags: ["경위서", "시말서", "사유서", "행정"]
  },
  "경위서": {
    category: "행정",
    keywords: ["경위", "시말", "사유서", "사고보고"],
    tags: ["경위서", "시말서", "행정"]
  },
  "행정": {
    category: "행정",
    keywords: ["행정", "총무", "공문", "관리", "서식", "비품", "차량", "보안"],
    tags: ["행정", "총무"]
  },
  "행정/사무일반": {
    category: "행정",
    keywords: ["행정", "총무", "공문", "관리", "서식", "비품", "인수인계"],
    tags: ["행정", "총무"]
  },

  // 3. 세무 / 회계 / 경리
  "지출결의서": {
    category: "재무",
    keywords: ["지출", "결의", "경비", "영수", "출납", "접대비", "전표", "비용"],
    tags: ["지출결의서", "영수증", "경리", "재무"]
  },
  "경리": {
    category: "재무",
    keywords: ["경리", "출납", "영수", "입금", "현금", "어음", "장부", "경비"],
    tags: ["경리", "출납", "재무"]
  },
  "경리/출납": {
    category: "재무",
    keywords: ["경리", "출납", "영수", "입금", "현금", "어음", "지출증빙"],
    tags: ["경리", "출납", "재무"]
  },
  "회계": {
    category: "재무",
    keywords: ["회계", "재무", "결산", "원가", "손익", "대차대조", "재무제표", "감사"],
    tags: ["회계", "재무"]
  },
  "회계/재무": {
    category: "재무",
    keywords: ["회계", "재무", "결산", "원가", "손익", "대차대조", "재무제표"],
    tags: ["회계", "재무"]
  },
  "세무": {
    category: "재무",
    keywords: ["세무", "소득", "원천징수", "부가세", "법인세", "체납", "과세", "환급"],
    tags: ["세무", "소득세", "원천징수", "재무"]
  },
  "세무/소득세": {
    category: "재무",
    keywords: ["세무", "소득", "원천징수", "부가세", "법인세", "소득세", "체납"],
    tags: ["세무", "소득세", "재무"]
  },

  // 4. 계약 / 영업 / 구매
  "견적서": {
    category: "계약",
    keywords: ["견적", "RFQ", "Quotation", "산출", "단가"],
    tags: ["견적서", "계약"]
  },
  "발주서": {
    category: "계약",
    keywords: ["발주", "구매주문", "PO", "발주확인", "주문서"],
    tags: ["발주서", "구매주문서", "계약"]
  },
  "구매": {
    category: "계약",
    keywords: ["구매", "자재", "납품", "조달", "물품", "원자재", "공급"],
    tags: ["구매", "자재", "계약"]
  },
  "구매/자재": {
    category: "계약",
    keywords: ["구매", "자재", "납품", "조달", "물품", "검수"],
    tags: ["구매", "자재", "계약"]
  },
  "영업": {
    category: "계약",
    keywords: ["영업", "판매", "마케팅", "유통", "대리점", "총판", "판촉", "라이브커머스"],
    tags: ["영업", "판매", "마케팅", "계약"]
  },
  "판매/영업": {
    category: "계약",
    keywords: ["판매", "영업", "마케팅", "유통", "대리점", "스마트스토어", "위탁판매"],
    tags: ["영업", "판매", "마케팅", "계약"]
  },
  "계약": {
    category: "계약",
    keywords: ["계약", "협약", "합의", "MOU", "용역", "도급", "외주", "임대차"],
    tags: ["계약", "계약서"]
  },
  "거래일반": {
    category: "계약",
    keywords: ["계약", "거래", "협약", "합의", "MOU", "용역", "도급", "외주"],
    tags: ["계약", "계약서"]
  },

  // 5. 법률 / 민사
  "차용증/금전": {
    category: "법률",
    keywords: ["차용", "금전소비대차", "대여금", "어음", "대부", "융자", "이자", "변제"],
    tags: ["차용증", "금전", "법률"]
  },
  "차용증": {
    category: "법률",
    keywords: ["차용", "금전소비대차", "대여금", "대부", "융자"],
    tags: ["차용증", "금전", "법률"]
  },
  "내용증명": {
    category: "법률",
    keywords: ["내용증명", "독촉", "통고", "최고장", "계약해제", "손해배상"],
    tags: ["내용증명", "법률"]
  },
  "채권": {
    category: "법률",
    keywords: ["채권", "채무", "변제", "가압류", "압류", "담보", "질권", "양도"],
    tags: ["채권", "채무", "법률"]
  },
  "채권/채무": {
    category: "법률",
    keywords: ["채권", "채무", "변제", "가압류", "압류", "담보", "채권양도"],
    tags: ["채권", "채무", "법률"]
  },
  "민사": {
    category: "법률",
    keywords: ["민사", "가사", "합의", "화해", "소송", "위임", "공증", "손해배상"],
    tags: ["민사", "가사", "법률"]
  },
  "민사/가사": {
    category: "법률",
    keywords: ["민사", "가사", "합의", "화해", "소송", "위임", "이혼", "상속"],
    tags: ["민사", "가사", "법률"]
  },
  "법률": {
    category: "법률",
    keywords: ["법률", "소송", "고소", "등기", "변호사", "법원", "합의서", "약관"],
    tags: ["법률"]
  },
  "법률일반": {
    category: "법률",
    keywords: ["법률", "소송", "고소", "등기", "변호사", "법원", "합의서"],
    tags: ["법률"]
  },

  // 6. 정부 / 공공 민원
  "주민등록": {
    category: "정부",
    keywords: ["주민등록", "등본", "초본", "전입", "세대", "주민센터", "정부24"],
    tags: ["주민등록", "공공민원", "정부서식"]
  },
  "가족관계": {
    category: "정부",
    keywords: ["가족관계", "기본증명", "혼인", "출생", "사망", "가족", "제적"],
    tags: ["가족관계", "공공민원", "정부서식"]
  },
  "사업자등록": {
    category: "정부",
    keywords: ["사업자등록", "정정신고", "휴업", "폐업", "개업", "세무서", "부가세"],
    tags: ["사업자등록", "국세청", "정부서식"]
  },
  "납세증명서": {
    category: "정부",
    keywords: ["납세", "체납", "완납", "국세", "지방세", "세무서", "증명발급"],
    tags: ["납세증명서", "국세청", "세무서", "정부서식"]
  },
  "정부서식": {
    category: "정부",
    keywords: ["정부", "민원", "공공", "신청서", "신고서", "허가", "인가", "인감"],
    tags: ["정부서식", "공공민원", "정부"]
  },
  "정부서식일반": {
    category: "정부",
    keywords: ["정부", "민원", "공공", "신청서", "신고서", "인감", "위임장"],
    tags: ["정부서식", "공공민원", "정부"]
  }
};

/**
 * 주어진 서식이 특정 태그/규칙과 일치하는지 판별하는 헬퍼 함수 (클라이언트/서버 공용)
 */
export function matchesTagRule(
  item: { title: string; desc?: string; category?: string; tags: string[] },
  targetTag: string
): boolean {
  if (!targetTag) return true;
  
  // 1. 단순 완전 일치 체크
  if (item.tags && item.tags.includes(targetTag)) return true;
  
  const rule = TAG_RULES[targetTag];
  if (!rule) {
    // 정의된 규칙이 없으면 유연한 부분 검색
    const lower = targetTag.toLowerCase();
    const inTitle = item.title.toLowerCase().includes(lower);
    const inDesc = item.desc ? item.desc.toLowerCase().includes(lower) : false;
    const inTags = item.tags ? item.tags.some(t => t.toLowerCase().includes(lower)) : false;
    return inTitle || inDesc || inTags;
  }

  // 2. 규칙 태그 매칭
  if (rule.tags && rule.tags.some(t => item.tags && item.tags.includes(t))) {
    return true;
  }

  // 3. 키워드 매칭 (제목 또는 설명)
  const titleLower = item.title.toLowerCase();
  const descLower = item.desc ? item.desc.toLowerCase() : "";
  const matchKeyword = rule.keywords.some(kw => {
    const kLower = kw.toLowerCase();
    return titleLower.includes(kLower) || descLower.includes(kLower);
  });
  if (matchKeyword) return true;

  return false;
}
