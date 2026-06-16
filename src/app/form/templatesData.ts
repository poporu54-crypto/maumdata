export interface FormField {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "list";
  placeholder?: string;
  options?: string[]; // select 타입인 경우 옵션들
  listFields?: { key: string; label: string; placeholder: string; width: string }[]; // list 타입인 경우 컬럼 설정
}

export interface LayoutCell {
  label: string; // {birth} 와 같이 데이터 바인딩 지원
  width?: string;
  align?: "center" | "left" | "right";
  bold?: boolean;
  bg?: string;
  colSpan?: number;
  rowSpan?: number;
  key?: string; // 편집(contentEditable) 연동 대상 data 키
  style?: React.CSSProperties;
}

export interface LayoutRow {
  height?: string;
  repeatKey?: string; // 리스트 형태 데이터 반복 렌더링용 키
  cells: LayoutCell[];
}

export interface LayoutElement {
  type: "title" | "subtitle" | "paragraph" | "table" | "sign-block" | "approval-block" | "spacer";
  value?: string; // 텍스트 또는 {name} 바인딩
  style?: any;
  rows?: LayoutRow[];
}

export interface DocumentTemplate {
  id: string;
  title: string;
  category: "노무" | "행정" | "재무" | "계약";
  desc: string;
  popular: boolean;
  tags: string[];
  fields: FormField[];
  initialValues: Record<string, any>;
  layout?: LayoutElement[]; // 동적 템플릿용 레이아웃 정의
}

export const TEMPLATES: DocumentTemplate[] = [
  // 1. 인사 / 노무
  {
    id: "resignation",
    title: "사직서",
    category: "노무",
    desc: "퇴사 의사를 공식적으로 소속 부서 및 대표이사에게 표명하고, 실무 행정(기밀유지 서약 등)을 위해 인적사항 및 사유를 구체적으로 작성하는 사직 서식입니다.",
    popular: true,
    tags: ["사직서", "퇴직", "인사", "노무", "회사", "부서별", "경영기획"],
    fields: [
      { key: "dept", label: "소속 / 부서", type: "text", placeholder: "예: 경영기획실" },
      { key: "rank", label: "직위 / 직급", type: "text", placeholder: "예: 대리" },
      { key: "name", label: "성명", type: "text", placeholder: "예: 홍길동" },
      { key: "birth", label: "생년월일 (또는 주민번호 앞자리)", type: "text", placeholder: "예: 1990년 01월 01일" },
      { key: "phone", label: "연락처", type: "text", placeholder: "예: 010-1234-5678" },
      { key: "address", label: "주소", type: "text", placeholder: "예: 서울시 마포구 마포대로 14" },
      { key: "leaveDate", label: "사직 예정일", type: "text", placeholder: "예: 2026년 07월 15일" },
      { key: "reason", label: "상세 사직 사유", type: "textarea", placeholder: "예: 개인 사정 및 일신상의 사유로 인하여 퇴사하고자 합니다." },
      { key: "date", label: "신청/작성 일자", type: "text", placeholder: "예: 2026년 06월 15일" },
      { key: "company", label: "소속 회사명 (수신처)", type: "text", placeholder: "예: 마음데이터 주식회사" }
    ],
    initialValues: {
      dept: "경영기획실",
      rank: "대리",
      name: "홍길동",
      birth: "1990년 01월 01일",
      phone: "010-1234-5678",
      address: "서울특별시 마포구 마포대로 14",
      leaveDate: "2026년 07월 15일",
      reason: "개인 사정 및 일신상의 사유로 인하여 퇴사하고자 합니다.",
      date: "", // 폼 로드 시 오늘 날짜 매핑
      company: "마음데이터 주식회사",
      useApproval: true
    },
    layout: [
      { type: "title", value: "사 직 서" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "소 속", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dept}", colSpan: 4, key: "dept", align: "center" },
              { label: "직 위", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{rank}", colSpan: 4, key: "rank", align: "center" }
            ]
          },
          {
            cells: [
              { label: "성 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", colSpan: 4, key: "name", align: "center" },
              { label: "생년월일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{birth}", colSpan: 4, key: "birth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "연락처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{phone}", colSpan: 4, key: "phone", align: "center" },
              { label: "사직예정일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{leaveDate}", colSpan: 4, key: "leaveDate", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{address}", colSpan: 10, key: "address" }
            ]
          },
          {
            cells: [
              { label: "사직사유", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{reason}", colSpan: 10, key: "reason", style: { height: "140px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "본인은 위와 같은 사유로 사직하고자 하오니 승인하여 주시기 바랍니다.\n\n또한 퇴사 시 업무 인수 인계를 충실히 이행할 것이며, 재직 중 취득한 회사의 기술 정보 및 기밀 사항에 대해 비밀을 준수할 것을 서약합니다.", style: { textAlign: "center", margin: "15px 0", lineHeight: 1.6 } },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "작성인 : {name} (서명 또는 인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{company} 대표이사 귀하", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },
  {
    id: "resume",
    title: "표준 이력서",
    category: "노무",
    desc: "인적사항, 최종 학력, 근무 경험, 취득한 자격 면허를 한눈에 볼 수 있도록 입사 지원 양식의 핵심을 담아낸 표 형태의 이력서입니다.",
    popular: true,
    tags: ["이력서", "자기소개서", "채용", "입사", "이력서/자소설", "인사", "노무", "생활"],
    fields: [
      { key: "nameKo", label: "성명 (한글)", type: "text", placeholder: "홍길동" },
      { key: "nameEn", label: "성명 (영문)", type: "text", placeholder: "Hong Gil Dong" },
      { key: "birth", label: "생년월일", type: "text", placeholder: "1990.01.01" },
      { key: "phone", label: "연락처", type: "text", placeholder: "010-1234-5678" },
      { key: "email", label: "이메일", type: "text", placeholder: "gildong@maumdata.com" },
      { key: "address", label: "주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      {
        key: "education",
        label: "학력 사항",
        type: "list",
        listFields: [
          { key: "period", label: "재학 기간", placeholder: "2009.03 - 2013.02", width: "35%" },
          { key: "school", label: "학교명", placeholder: "한국대학교", width: "25%" },
          { key: "major", label: "전공", placeholder: "컴퓨터공학", width: "25%" },
          { key: "status", label: "구분", placeholder: "졸업", width: "15%" }
        ]
      },
      {
        key: "experience",
        label: "경력 사항",
        type: "list",
        listFields: [
          { key: "period", label: "근무 기간", placeholder: "2023.05 - 2026.06", width: "35%" },
          { key: "company", label: "회사명", placeholder: "마음데이터(주)", width: "25%" },
          { key: "rank", label: "직급", placeholder: "대리", width: "15%" },
          { key: "task", label: "담당 업무", placeholder: "개발 및 설계", width: "25%" }
        ]
      },
      {
        key: "skills",
        label: "자격 및 어학",
        type: "list",
        listFields: [
          { key: "date", label: "취득일자", placeholder: "2020.08.15", width: "25%" },
          { key: "name", label: "자격/어학명", placeholder: "정보처리기사", width: "40%" },
          { key: "org", label: "발급기관", placeholder: "한국산업인력공단", width: "20%" },
          { key: "score", label: "결과/점수", placeholder: "합격", width: "15%" }
        ]
      },
      { key: "intro", label: "자기 소개서", type: "textarea", placeholder: "본인의 강점과 지원동기를 간략하게 기재하세요." }
    ],
    initialValues: {
      nameKo: "홍길동",
      nameEn: "Hong Gil Dong",
      birth: "1990.01.01",
      phone: "010-1234-5678",
      email: "gildong@maumdata.com",
      address: "서울특별시 마포구 마포대로 14",
      education: [
        { period: "2009.03 - 2013.02", school: "한국대학교", major: "컴퓨터공학과", status: "졸업" }
      ],
      experience: [
        { period: "2023.05 - 2026.06", company: "마음데이터(주)", rank: "대리", task: "프론트엔드 개발 및 API 연동" }
      ],
      skills: [
        { date: "2020.08.15", name: "정보처리기사", org: "한국산업인력공단", score: "합격" }
      ],
      intro: "열정적이고 도전적인 소프트웨어 엔지니어 홍길동입니다. 사용자 경험 최적화를 통해 데이터 서비스의 가치를 널리 알리고자 지원하였습니다.",
      useApproval: false
    },
    layout: [
      { type: "title", value: "이 력 서" },
      { type: "subtitle", value: "1. 인적 사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성명 (한글)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{nameKo}", colSpan: 4, key: "nameKo", align: "center" },
              { label: "성명 (영문)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{nameEn}", colSpan: 4, key: "nameEn", align: "center" }
            ]
          },
          {
            cells: [
              { label: "생년월일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{birth}", colSpan: 4, key: "birth", align: "center" },
              { label: "연락처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{phone}", colSpan: 4, key: "phone", align: "center" }
            ]
          },
          {
            cells: [
              { label: "이메일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{email}", colSpan: 10, key: "email" }
            ]
          },
          {
            cells: [
              { label: "주소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{address}", colSpan: 10, key: "address" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 학력 사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "재학 기간", colSpan: 4, bold: true, align: "center", bg: "#f9fafb" },
              { label: "학교명", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "전공", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "구분", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" }
            ]
          },
          {
            repeatKey: "education",
            cells: [
              { label: "{period}", colSpan: 4, key: "period", align: "center" },
              { label: "{school}", colSpan: 3, key: "school", align: "center" },
              { label: "{major}", colSpan: 3, key: "major", align: "center" },
              { label: "{status}", colSpan: 2, key: "status", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 경력 사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "근무 기간", colSpan: 4, bold: true, align: "center", bg: "#f9fafb" },
              { label: "회사명", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "직급", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "담당 업무", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" }
            ]
          },
          {
            repeatKey: "experience",
            cells: [
              { label: "{period}", colSpan: 4, key: "period", align: "center" },
              { label: "{company}", colSpan: 3, key: "company", align: "center" },
              { label: "{rank}", colSpan: 2, key: "rank", align: "center" },
              { label: "{task}", colSpan: 3, key: "task" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "4. 자격 및 어학" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "취득일자", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "자격/어학명", colSpan: 4, bold: true, align: "center", bg: "#f9fafb" },
              { label: "발급기관", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "결과/점수", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" }
            ]
          },
          {
            repeatKey: "skills",
            cells: [
              { label: "{date}", colSpan: 3, key: "date", align: "center" },
              { label: "{name}", colSpan: 4, key: "name" },
              { label: "{org}", colSpan: 3, key: "org", align: "center" },
              { label: "{score}", colSpan: 2, key: "score", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "5. 자기소개서" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{intro}", colSpan: 12, key: "intro", style: { height: "150px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "contract",
    title: "표준 근로계약서",
    category: "노무",
    desc: "근로기준법 제17조에 의거하여 고용노동부에서 고시한 표준 양식입니다. 근로계약기간, 근무장소, 업무내용, 소정근로시간, 근무일 및 휴일, 임금조건, 연차유급휴가, 4대 사회보험 가입여부 등 고용노동부 표준 11대 법정 필수항목이 모두 수록되어 실제 법적 효력을 지닙니다.",
    popular: true,
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
    },
    layout: [
      { type: "title", value: "표 준 근 로 계 약 서" },
      { type: "spacer" },
      { type: "paragraph", value: "{employerName} (이하 \"사업주\"라 함)과(와) {employeeName} (이하 \"근로자\"라 함)은 상호 합의 하에 다음과 같이 근로계약을 체결하고 이를 성실히 이행할 것을 서약한다.", style: { lineHeight: 1.5, marginBottom: "12px" } },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "1. 근로계약기간", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{contractStart} 부터  {contractEnd} 까지", colSpan: 9, key: "contractEnd" }
            ]
          },
          {
            cells: [
              { label: "2. 근무 장소", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{workPlace}", colSpan: 9, key: "workPlace" }
            ]
          },
          {
            cells: [
              { label: "3. 담당 업무", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{workTask}", colSpan: 9, key: "workTask" }
            ]
          },
          {
            cells: [
              { label: "4. 근로 시간", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{workTimeStart} 부터 {workTimeEnd} 까지 (휴게시간: {breakTimeStart} ~ {breakTimeEnd})", colSpan: 9, key: "workTimeEnd" }
            ]
          },
          {
            cells: [
              { label: "5. 근무요일 / 휴일", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "근무일: {workingDays} / 주휴일: {holiday}", colSpan: 9, key: "holiday" }
            ]
          },
          {
            cells: [
              { label: "6. 임금 조건", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{salaryType} : {salaryAmt} 원  (상여금: {bonusAmt} / 기타수당: {otherPayAmt})", colSpan: 9, key: "salaryAmt" }
            ]
          },
          {
            cells: [
              { label: "7. 임금 지급일", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "매월 {payDay} (지급방법: {payMethod})", colSpan: 9, key: "payDay" }
            ]
          },
          {
            cells: [
              { label: "8. 사회보험", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{socialInsurance}", colSpan: 9, key: "socialInsurance" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "본 계약서에 명시되지 않은 사항은 근로기준법 및 관련 노동 관계 법령이 정하는 바에 따릅니다.", style: { fontSize: "8.5pt", color: "#333333" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center", margin: "10px 0" } },
      {
        type: "table",
        style: { border: "none" },
        rows: [
          {
            cells: [
              { label: "[사업주]\n사업체명: {employerName}\n주      소: {employerAddr}\n대 표 자: {employerCEO} (인)", colSpan: 6, style: { border: "none", fontSize: "9.5pt", whiteSpace: "pre-line", lineHeight: 1.5 } },
              { label: "[근로자]\n성      명: {employeeName}\n주      소: {employeeAddr}\n연 락 처: {employeePhone} (인)", colSpan: 6, style: { border: "none", fontSize: "9.5pt", whiteSpace: "pre-line", lineHeight: 1.5 } }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "contract_minor",
    title: "연소근로자 표준근로계약서 (친권자 동의서 포함)",
    category: "노무",
    desc: "만 18세 미만인 연소근로자를 고용할 때 체결하는 표준근로계약서로, 근로기준법령에 따른 근로조건 명시와 함께 친권자 또는 후견인의 동의서가 원스톱으로 포함되어 있는 서식입니다.",
    popular: false,
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
      { key: "workTimeEnd", label: "근로 종료 시간", type: "text", placeholder: "예: 18:00 (연소자 하루 최대 7시간 제한)" },
      { key: "breakTimeStart", label: "휴게 시작 시간", type: "text", placeholder: "예: 15:00" },
      { key: "breakTimeEnd", label: "휴게 종료 시간", type: "text", placeholder: "예: 15:30" },
      { key: "workingDays", label: "근무 요일 (주당 근무일수)", type: "text", placeholder: "예: 월요일부터 금요일까지 (주 5일)" },
      { key: "holiday", label: "주휴일 요일", type: "text", placeholder: "예: 매주 일요일" },
      { key: "salaryType", label: "임금 형태", type: "select", options: ["시급", "월급"] },
      { key: "salaryAmt", label: "임금 액수 (원)", type: "text", placeholder: "예: 10,030 (최저임금 이상)" },
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
    },
    layout: [
      { type: "title", value: "연소근로자 표준근로계약서" },
      { type: "spacer" },
      { type: "paragraph", value: "{employerName} (이하 \"사업주\"라 함)과(와) {employeeName} (이하 \"근로자\"라 함)은 상호 합의 하에 다음과 같이 근로계약을 체결하고 친권자(후견인) 동의 하에 근로를 개시한다.", style: { lineHeight: 1.4, marginBottom: "8px" } },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "1. 근로계약기간", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{contractStart} 부터  {contractEnd} 까지", colSpan: 9, key: "contractEnd" }
            ]
          },
          {
            cells: [
              { label: "2. 근무 장소", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{workPlace}", colSpan: 9, key: "workPlace" }
            ]
          },
          {
            cells: [
              { label: "3. 담당 업무", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{workTask}", colSpan: 9, key: "workTask" }
            ]
          },
          {
            cells: [
              { label: "4. 근로 시간", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{workTimeStart} 부터 {workTimeEnd} 까지 (휴게시간: {breakTimeStart} ~ {breakTimeEnd})", colSpan: 9, key: "workTimeEnd" }
            ]
          },
          {
            cells: [
              { label: "5. 임금 및 지급", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{salaryType} : {salaryAmt} 원 (매월 {payDay} 지급 / {payMethod})", colSpan: 9, key: "salaryAmt" }
            ]
          },
          {
            cells: [
              { label: "6. 사회보험", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{socialInsurance}", colSpan: 9, key: "socialInsurance" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "친권자 (법정대리인) 동의서" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "동의인 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{parentName}", colSpan: 4, key: "parentName" },
              { label: "생년월일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{parentBirth}", colSpan: 4, key: "parentBirth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주   소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{parentAddr}", colSpan: 10, key: "parentAddr" }
            ]
          },
          {
            cells: [
              { label: "근로자와 관계", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{parentRelation}", colSpan: 4, key: "parentRelation", align: "center" },
              { label: "연 락 처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{parentPhone}", colSpan: 4, key: "parentPhone", align: "center" }
            ]
          }
        ]
      },
      { type: "paragraph", value: "본인은 친권자(법정대리인)로서 만 18세 미만 근로자 {employeeName}이(가) 상기 사업주와 체결한 근로계약서 상의 근로조건으로 성실하게 근무하는 것에 동의합니다.", style: { fontSize: "8.5pt", textAlign: "center", margin: "6px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "10pt", fontWeight: "bold", textAlign: "center", margin: "6px 0" } },
      {
        type: "table",
        style: { border: "none" },
        rows: [
          {
            cells: [
              { label: "[사업주]\n상호: {employerName}\n주소: {employerAddr}\n대표: {employerCEO} (인)", colSpan: 4, style: { border: "none", fontSize: "8.5pt", whiteSpace: "pre-line" } },
              { label: "[근로자]\n성명: {employeeName}\n주소: {employeeAddr}\n연락처: {employeePhone} (인)", colSpan: 4, style: { border: "none", fontSize: "8.5pt", whiteSpace: "pre-line" } },
              { label: "[친권자]\n성명: {parentName}\n주소: {parentAddr}\n연락처: {parentPhone} (인)", colSpan: 4, style: { border: "none", fontSize: "8.5pt", whiteSpace: "pre-line" } }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "contract_construction",
    title: "건설일용근로자 표준근로계약서",
    category: "노무",
    desc: "건설 현장에서 일용직 근로자를 채용할 때 작성하는 표준 계약 서식으로, 현장 주소, 공사명, 직종 분류와 일급/시급 형태의 임금 구성 항목(기본급, 주휴수당 등)을 구체적으로 기재할 수 있습니다.",
    popular: false,
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
    },
    layout: [
      { type: "title", value: "건설일용근로자 표준근로계약서" },
      { type: "spacer" },
      { type: "paragraph", value: "{employerName} (이하 \"사업주\"라 함)과(와) {employeeName} (이하 \"근로자\"라 함)은 상호 합의 하에 다음과 같이 근로계약을 체결하고 이를 성실히 이행할 것을 서약한다.", style: { lineHeight: 1.4, marginBottom: "8px" } },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "근로개시일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{contractStart} 부터", colSpan: 4, key: "contractStart", align: "center" },
              { label: "계약종료일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{contractEnd}", colSpan: 4, key: "contractEnd", align: "center" }
            ]
          },
          {
            cells: [
              { label: "공사 현장명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{workPlace}", colSpan: 4, key: "workPlace" },
              { label: "담당 직종", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{workTask}", colSpan: 4, key: "workTask", align: "center" }
            ]
          },
          {
            cells: [
              { label: "근로 시간", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{workTimeStart} ~ {workTimeEnd} (휴게: {breakTimeStart} ~ {breakTimeEnd})", colSpan: 10, key: "workTimeEnd", align: "center" }
            ]
          },
          {
            cells: [
              { label: "임금 조건", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{salaryType} : {salaryAmt} 원 (기본급: {salaryBaseAmt} 원 / 제수당: {salaryAllowance} 원)", colSpan: 10, key: "salaryAmt", align: "center" }
            ]
          },
          {
            cells: [
              { label: "임금지급기일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{payDay} (지급방법: {payMethod})", colSpan: 10, key: "payDay", align: "center" }
            ]
          },
          {
            cells: [
              { label: "사회보험", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{socialInsurance}", colSpan: 10, key: "socialInsurance", align: "center" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "본 계약에 정하지 않은 사항은 근로기준법 및 건설근로자법 등 법령의 정함에 따르며, 근로자 서명 날인으로 계약서 1부를 교부한다.", style: { fontSize: "8.5pt", color: "#333333" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center", margin: "8px 0" } },
      {
        type: "table",
        style: { border: "none" },
        rows: [
          {
            cells: [
              { label: "[사업주]\n회사명: {employerName}\n주  소: {employerAddr}\n대표자: {employerCEO} (인)", colSpan: 6, style: { border: "none", fontSize: "9pt", whiteSpace: "pre-line", lineHeight: 1.4 } },
              { label: "[근로자]\n성  명: {employeeName}\n주  소: {employeeAddr}\n연락처: {employeePhone} (인)", colSpan: 6, style: { border: "none", fontSize: "9pt", whiteSpace: "pre-line", lineHeight: 1.4 } }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "contract_short_time",
    title: "단시간근로자 표준근로계약서",
    category: "노무",
    desc: "파트타임(알바 등) 단시간 근로자를 채용할 때 작성하는 표준 계약 서식으로, 요일별 시업/종업/휴게시간을 정밀하게 나누어 근로기준법 준수 상태를 기록하는 서식입니다.",
    popular: false,
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
    },
    layout: [
      { type: "title", value: "단시간근로자 표준근로계약서" },
      { type: "spacer" },
      { type: "paragraph", value: "{employerName} (사업주)와 {employeeName} (근로자)은 상호 합의에 따라 단시간 근로계약을 체결하고 성실히 준수할 것을 서약한다.", style: { lineHeight: 1.4, marginBottom: "8px" } },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "근로계약기간", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{contractStart} 부터 {contractEnd} 까지", colSpan: 9, key: "contractEnd", align: "center" }
            ]
          },
          {
            cells: [
              { label: "근무지 및 업무", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "장소: {workPlace} / 업무: {workTask}", colSpan: 9, key: "workTask" }
            ]
          },
          {
            cells: [
              { label: "요일별 근로시간", rowSpan: 4, colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "월요일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{monTime}", colSpan: 8, key: "monTime", align: "center" }
            ]
          },
          {
            cells: [
              { label: "화요일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{tueTime}", colSpan: 3, key: "tueTime", align: "center" },
              { label: "수요일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{wedTime}", colSpan: 3, key: "wedTime", align: "center" }
            ]
          },
          {
            cells: [
              { label: "목요일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{thuTime}", colSpan: 3, key: "thuTime", align: "center" },
              { label: "금요일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{friTime}", colSpan: 3, key: "friTime", align: "center" }
            ]
          },
          {
            cells: [
              { label: "토요일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{satTime}", colSpan: 3, key: "satTime", align: "center" },
              { label: "일요일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{sunTime}", colSpan: 3, key: "sunTime", align: "center" }
            ]
          },
          {
            cells: [
              { label: "근무일 / 휴일", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "근무요일: {workingDays} / 주휴일: {holiday}", colSpan: 9, key: "holiday", align: "center" }
            ]
          },
          {
            cells: [
              { label: "임금 및 지급", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{salaryType} : {salaryAmt} 원 (매월 {payDay} 지급 / {payMethod})", colSpan: 9, key: "salaryAmt", align: "center" }
            ]
          },
          {
            cells: [
              { label: "사회보험", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{socialInsurance}", colSpan: 9, key: "socialInsurance", align: "center" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "본 근로계약은 근로기준법 및 기간제법 등 노동 관계법령에 따르며, 체결 즉시 근로자에게 1부를 교부한다.", style: { fontSize: "8.5pt", color: "#333333" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center", margin: "8px 0" } },
      {
        type: "table",
        style: { border: "none" },
        rows: [
          {
            cells: [
              { label: "[사업주]\n회사명: {employerName}\n주  소: {employerAddr}\n대표자: {employerCEO} (인)", colSpan: 6, style: { border: "none", fontSize: "9pt", whiteSpace: "pre-line", lineHeight: 1.4 } },
              { label: "[근로자]\n성  명: {employeeName}\n주  소: {employeeAddr}\n연락처: {employeePhone} (인)", colSpan: 6, style: { border: "none", fontSize: "9pt", whiteSpace: "pre-line", lineHeight: 1.4 } }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "contract_foreigner",
    title: "외국인근로자 표준근로계약서 (Standard Labor Contract)",
    category: "노무",
    desc: "외국인근로자를 고용할 때 체결하는 영한 대역 표준근로계약서(Standard Labor Contract)로, 기본 근로조건과 숙소 제공 방식, 숙식비 부담 한도를 명확히 적시하는 전용 서식입니다.",
    popular: false,
    tags: ["근로계약서", "외국인근로자", "Standard Labor Contract", "영한대역", "노무", "숙식제공", "계약"],
    fields: [
      { key: "employerName", label: "사업주 상호 (Company Name)", type: "text", placeholder: "예: 마음데이터 텍스타일 (Maumdata Textile)" },
      { key: "employerCEO", label: "대표자 성명 (CEO Name)", type: "text", placeholder: "예: 김철수 (Kim Cheol-su)" },
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
      { key: "lodgingFee", label: "숙식비용 부담액 (Lodging Expense)", type: "text", placeholder: "예: 월 150,000원 (또는 제공 시 한도액)" },
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
    },
    layout: [
      { type: "title", value: "외국인근로자 표준근로계약서\nStandard Labor Contract" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "사업주\nEmployer", rowSpan: 3, colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "회사명 / 명칭\nCompany Name", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{employerName}", colSpan: 3, key: "employerName" },
              { label: "대표자 성명\nCEO Name", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{employerCEO}", colSpan: 3, key: "employerCEO", align: "center" }
            ]
          },
          {
            cells: [
              { label: "사업장 주소\nAddress", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{employerAddr}", colSpan: 8, key: "employerAddr" }
            ]
          },
          {
            cells: [
              { label: "사업자등록번호\nBusiness Reg No.", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{employerRegNo}", colSpan: 8, key: "employerRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "근로자\nEmployee", rowSpan: 2, colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "성 명\nFull Name", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{employeeName}", colSpan: 3, key: "employeeName" },
              { label: "생년월일\nDate of Birth", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{employeeBirth}", colSpan: 3, key: "employeeBirth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "여권번호\nPassport No.", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{employeePassport}", colSpan: 3, key: "employeePassport", align: "center" },
              { label: "국 적\nNationality", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{employeeNationality}", colSpan: 3, key: "employeeNationality", align: "center" }
            ]
          },
          {
            cells: [
              { label: "계약기간\nTerm", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{contractStart} ~ {contractEnd}", colSpan: 9, key: "contractEnd", align: "center" }
            ]
          },
          {
            cells: [
              { label: "근무지 및 과업\nPlace & Job", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "장소(Place): {workPlace} / 업무(Job): {workTask}", colSpan: 9, key: "workTask" }
            ]
          },
          {
            cells: [
              { label: "근로시간\nWork Hours", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{workTimeStart} ~ {workTimeEnd} (휴게 Break: {breakTimeStart} ~ {breakTimeEnd}) / {workingDays}", colSpan: 9, key: "workTimeEnd", align: "center" }
            ]
          },
          {
            cells: [
              { label: "임금 조건\nWage Terms", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{salaryType} : {salaryAmt} 원 (매월 {payDay} 지급 / {payMethod})", colSpan: 9, key: "salaryAmt", align: "center" }
            ]
          },
          {
            cells: [
              { label: "숙식 제공\nBoard & Lodging", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{lodgingProvided} / 비용부담액(Lodging Fee): {lodgingFee}", colSpan: 9, key: "lodgingProvided", align: "center" }
            ]
          },
          {
            cells: [
              { label: "사회보험\nInsurance", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{socialInsurance}", colSpan: 9, key: "socialInsurance", align: "center" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "This contract is written in both Korean and English. In case of any discrepancy or conflict between the Korean and English versions, the Korean version shall prevail.", style: { fontSize: "7.5pt", color: "#666666", textAlign: "justify" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "10.5pt", fontWeight: "bold", textAlign: "center", margin: "6px 0" } },
      {
        type: "table",
        style: { border: "none" },
        rows: [
          {
            cells: [
              { label: "[Employer 사업주]\nCompany: {employerName}\nCEO: {employerCEO} (인)", colSpan: 6, style: { border: "none", fontSize: "8.5pt", whiteSpace: "pre-line" } },
              { label: "[Employee 근로자]\nName: {employeeName}\nPassport: {employeePassport} (인)", colSpan: 6, style: { border: "none", fontSize: "8.5pt", whiteSpace: "pre-line" } }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "leave",
    title: "연차 휴가 신청서",
    category: "노무",
    desc: "근로기준법상 발생한 연차, 경조사, 병가 등의 유급 휴가를 공식적으로 결재 및 사용 신청하기 위한 결재 문서입니다.",
    popular: false,
    tags: ["휴가신청서", "휴가", "인사", "노무", "회사", "부서별"],
    fields: [
      { key: "dept", label: "부서명", type: "text", placeholder: "경영기획실" },
      { key: "rank", label: "직급", type: "text", placeholder: "대리" },
      { key: "name", label: "성명", type: "text", placeholder: "홍길동" },
      { key: "leaveType", label: "휴가 구분", type: "select", options: ["연차", "반차", "경조사 휴가", "병가", "특별 휴가"] },
      { key: "leavePeriod", label: "휴가 기간", type: "text", placeholder: "예: 2026.06.24 ~ 2026.06.26 (3일간)" },
      { key: "emergencyContact", label: "비상 연락망", type: "text", placeholder: "010-1234-5678" },
      { key: "reason", label: "휴가 사유", type: "text", placeholder: "개인 사유 및 리프레시" },
      { key: "date", label: "신청 일자", type: "text", placeholder: "2026년 06월 15일" },
      { key: "company", label: "소속 회사명", type: "text", placeholder: "마음데이터 주식회사" }
    ],
    initialValues: {
      dept: "경영기획실",
      rank: "대리",
      name: "홍길동",
      leaveType: "연차",
      leavePeriod: "2026.06.24 ~ 2026.06.26 (3일간)",
      emergencyContact: "010-1234-5678",
      reason: "가족 행사 참석 및 리프레시를 위한 유급 휴가 사용",
      date: "",
      company: "마음데이터 주식회사",
      useApproval: true
    },
    layout: [
      { type: "title", value: "휴 가 신 청 서" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "신 청 인", rowSpan: 2, colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "소 속 부 서", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dept}", colSpan: 3, key: "dept", align: "center" },
              { label: "직 급", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{rank}", colSpan: 3, key: "rank", align: "center" }
            ]
          },
          {
            cells: [
              { label: "성 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", colSpan: 8, key: "name", align: "center" }
            ]
          },
          {
            cells: [
              { label: "휴가 구분", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{leaveType}", colSpan: 10, key: "leaveType", align: "center" }
            ]
          },
          {
            cells: [
              { label: "휴가 기간", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{leavePeriod}", colSpan: 10, key: "leavePeriod", align: "center" }
            ]
          },
          {
            cells: [
              { label: "비상연락처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{emergencyContact}", colSpan: 10, key: "emergencyContact", align: "center" }
            ]
          },
          {
            cells: [
              { label: "휴가 사유", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{reason}", colSpan: 10, key: "reason", style: { height: "100px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "위와 같이 휴가를 신청하오니 결재하여 주시기 바랍니다.", style: { textAlign: "center", margin: "15px 0" } },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "신청인 : {name} (인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{company} 귀하", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },

  // 2. 기획 / 행정
  {
    id: "report",
    title: "업무 경위서 / 시말서",
    category: "행정",
    desc: "업무 중 실책이나 지연, 사고가 생겼을 때 경위를 객관적으로 증명하고 재발 방지책을 서약하는 사내 보고 양식입니다.",
    popular: true,
    tags: ["경위서/시말서", "시말서", "사고", "행정", "회사", "부서별"],
    fields: [
      { key: "dept", label: "부서명", type: "text", placeholder: "경영기획실" },
      { key: "rank", label: "직급", type: "text", placeholder: "대리" },
      { key: "name", label: "보고자 성명", type: "text", placeholder: "홍길동" },
      { key: "eventTime", label: "사건 발생 일시", type: "text", placeholder: "2026년 06월 15일 14시경" },
      { key: "eventPlace", label: "사건 발생 장소", type: "text", placeholder: "본사 3층 대회의실" },
      { key: "title", label: "경위서 제목", type: "text", placeholder: "사내 네트워킹 스위치 장애 보고" },
      { key: "description", label: "경위 및 상세 내용", type: "textarea", placeholder: "발생 원인과 과정에 대해 상세히 기록하세요." },
      { key: "measure", label: "수습 대책 및 의견", type: "textarea", placeholder: "재발 방지를 위한 조치를 기재하세요." },
      { key: "date", label: "작성 일자", type: "text", placeholder: "2026년 06월 15일" }
    ],
    initialValues: {
      dept: "경영기획실",
      rank: "대리",
      name: "홍길동",
      eventTime: "2026년 06월 15일 14시경",
      eventPlace: "본사 3층 대회의실",
      title: "사내 네트워킹 스위치 장애 보고",
      description: "2026년 6월 15일 14시경 사내 백본 스위치의 일시적인 전원 과부하로 인하여 약 20분간 사내 내부 네트워킹 전송 장애가 발생하였습니다. 긴급 스페어 장비 교체 작업 진행 후 14시 25분 기준으로 내부망 전송 상태가 완전히 정상 복구되었음을 보고합니다.",
      measure: "노후화된 스위치 전원 모듈 정밀 진단 진행 및 다음 분기 장비 조기 교체 검토.",
      date: "",
      useApproval: true
    },
    layout: [
      { type: "title", value: "시 말 서 (경 위 서)" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "소 속 부 서", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dept}", colSpan: 4, key: "dept", align: "center" },
              { label: "직급 / 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{rank}  {name}", colSpan: 4, key: "name", align: "center" }
            ]
          },
          {
            cells: [
              { label: "사건 일시", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{eventTime}", colSpan: 4, key: "eventTime", align: "center" },
              { label: "발생 장소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{eventPlace}", colSpan: 4, key: "eventPlace", align: "center" }
            ]
          },
          {
            cells: [
              { label: "사 건 제 목", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{title}", colSpan: 10, key: "title", bold: true }
            ]
          }
        ]
      },
      { type: "subtitle", value: "사건 경위 및 상세 내용" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{description}", colSpan: 12, key: "description", style: { height: "130px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "subtitle", value: "수습 대책 및 재발 방지안" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{measure}", colSpan: 12, key: "measure", style: { height: "90px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "본인은 상기 발생한 업무 실책(사고)에 대하여 경위를 사실대로 기술하였으며, 회사의 제반 규정을 준수하고 향후 동일한 과실이 발생하지 않도록 각별히 유의할 것을 서약합니다.", style: { lineHeight: 1.5, textIndent: "10px" } },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "작성인 : {name} (인)" }
    ]
  },
  {
    id: "proposal",
    title: "기안서",
    category: "행정",
    desc: "특정 업무 시행 방안이나 안건에 대해 결재권자에게 결재를 득하기 위해 사내 공식 문서를 기안하는 표준 서식입니다.",
    popular: true,
    tags: ["기안서", "기안", "결재", "행정", "회사", "부서별"],
    fields: [
      { key: "dept", label: "기안 부서", type: "text", placeholder: "경영기획실" },
      { key: "drafter", label: "기안자 성명", type: "text", placeholder: "홍길동 대리" },
      { key: "title", label: "기안 제목", type: "text", placeholder: "예: 2026년 하반기 사무용 소모품 일괄 구매 기안" },
      { key: "purpose", label: "기안 목적", type: "text", placeholder: "예: 정기 부서 사무용품 보충 및 사무 비용 절감" },
      { key: "content", label: "상세 내용 및 기대 효과", type: "textarea", placeholder: "기안 안건의 디테일과 예상 성과를 적어주세요." },
      { key: "date", label: "기안 일자", type: "text", placeholder: "2026년 06월 15일" }
    ],
    initialValues: {
      dept: "경영지원팀",
      drafter: "홍길동 대리",
      title: "2026년 하반기 전사 사무실 소모품 및 필기구 구매 기안",
      purpose: "각 부서별 사무용품 정기 보충 및 단체 구매를 통한 소모 예산 절감",
      content: "1. 구매 품목: 복사용지 A4 20박스, 재생 토너 카트리지 4개, 볼펜 및 필기구 10세트 등\n2. 집행 금액: 약 450,000원 (총무부 일괄 집행)\n3. 기대 효과: 전사 소모품의 대량 구매로 개별 청구 대비 비용 약 15% 절감 및 원활한 사무 환경 유지.",
      date: "",
      useApproval: true
    },
    layout: [
      { type: "title", value: "기 안 서" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "기 안 부 서", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dept}", colSpan: 4, key: "dept", align: "center" },
              { label: "기 안 자", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{drafter}", colSpan: 4, key: "drafter", align: "center" }
            ]
          },
          {
            cells: [
              { label: "기 안 일 자", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{date}", colSpan: 10, key: "date", align: "center" }
            ]
          },
          {
            cells: [
              { label: "기 안 제 목", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{title}", colSpan: 10, key: "title", bold: true }
            ]
          },
          {
            cells: [
              { label: "기 안 목 적", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{purpose}", colSpan: 10, key: "purpose" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "상세 기안 내용" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{content}", colSpan: 12, key: "content", style: { height: "240px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "상기와 같이 기안 안건을 상신하오니 재가하여 주시기 바랍니다.", style: { textAlign: "center", margin: "10px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "기안자 : {drafter} (인)" }
    ]
  },
  {
    id: "approval",
    title: "품의서",
    category: "행정",
    desc: "회사 예산을 집행하거나 구매, 행사 집행 등 사전에 결재권자의 승인을 구하기 위한 품의 문서입니다.",
    popular: false,
    tags: ["품의서", "품의", "결재", "행정", "회사", "부서별"],
    fields: [
      { key: "dept", label: "품의 부서", type: "text", placeholder: "경영지원팀" },
      { key: "name", label: "품의자 성명", type: "text", placeholder: "홍길동 대리" },
      { key: "title", label: "품의 제목", type: "text", placeholder: "영업부 노후 사무용 의자 교체 구매의 건" },
      { key: "itemDetails", label: "품의 내역 및 수량", type: "text", placeholder: "사무용 메쉬 의자 6대" },
      { key: "amount", label: "품의 예산 총액", type: "text", placeholder: "900,000원 (VAT 포함)" },
      { key: "reason", label: "품의 사유 및 설명", type: "textarea", placeholder: "구매 목적과 정합성을 설명해 주세요." },
      { key: "date", label: "품의 일자", type: "text", placeholder: "2026년 06월 15일" }
    ],
    initialValues: {
      dept: "경영지원팀",
      name: "홍길동 대리",
      title: "영업부 및 총무부 노후 사무용 의자 교체 및 신규 구매 품의",
      itemDetails: "표준형 인체공학 사무용 메쉬 의자 6대 (대당 150,000원)",
      amount: "총 900,000원 (VAT 포함)",
      reason: "사무실 내 기존 의자의 시트 파손 및 틸팅 실린더 기능 고장으로 직원들의 피로도 증가를 방지하고, 신규 충원 인원의 착석 공간 지원을 위해 노후 의자 교체(4대) 및 신규 구매(2대) 건을 품의합니다.",
      date: "",
      useApproval: true
    },
    layout: [
      { type: "title", value: "품 의 서" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "품 의 부 서", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dept}", colSpan: 4, key: "dept", align: "center" },
              { label: "품 의 자", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", colSpan: 4, key: "name", align: "center" }
            ]
          },
          {
            cells: [
              { label: "품 의 일 자", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{date}", colSpan: 10, key: "date", align: "center" }
            ]
          },
          {
            cells: [
              { label: "품 의 제 목", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{title}", colSpan: 10, key: "title", bold: true }
            ]
          },
          {
            cells: [
              { label: "품 의 내 역", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{itemDetails}", colSpan: 4, key: "itemDetails" },
              { label: "예 산 총 액", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{amount}", colSpan: 4, key: "amount", bold: true, align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "품의 사유 및 설명" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{reason}", colSpan: 12, key: "reason", style: { height: "240px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "상기 품의 내용을 정히 승인하여 주시기 바랍니다.", style: { textAlign: "center", margin: "10px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "품의자 : {name} (인)" }
    ]
  },
  {
    id: "meeting",
    title: "회의록",
    category: "행정",
    desc: "사내외 회의의 참석자, 의안, 토의 과정, 최종 결정 사항 및 향후 액션 아이템을 공식적으로 기록하는 회의 결과 문서입니다.",
    popular: false,
    tags: ["회의록", "회의", "기록", "행정", "회사", "부서별"],
    fields: [
      { key: "title", label: "회의 주제", type: "text", placeholder: "예: 마움데이터 UI/UX 개선 1차 정기회의" },
      { key: "meetingTime", label: "회의 일시", type: "text", placeholder: "2026.06.15 10:00 ~ 11:30" },
      { key: "meetingPlace", label: "회의 장소", type: "text", placeholder: "본사 2층 소회의실" },
      { key: "attendees", label: "참석자 명단", type: "text", placeholder: "김철수, 이영희, 홍길동" },
      { key: "agenda", label: "회의 안건 (Agenda)", type: "text", placeholder: "서식 다운로드 UX 고도화 및 광고 지면 설계" },
      { key: "discussion", label: "주요 토의 및 회의 내용", type: "textarea", placeholder: "회의 중 제기된 안건별 주장과 피드백 내용을 정리하세요." },
      { key: "decision", label: "결정 사항 및 액션 아이템", type: "textarea", placeholder: "회의 완료 후의 의결사항과 다음 작업 배분을 기록하세요." },
      { key: "date", label: "기록 일자", type: "text", placeholder: "2026년 06월 15일" }
    ],
    initialValues: {
      title: "마음데이터 스마트 서식 센터 출시 회의록",
      meetingTime: "2026년 06월 15일 10:00 ~ 11:30",
      meetingPlace: "본사 2층 소회의실",
      attendees: "김철수 대표, 이영희 실장, 홍길동 대리",
      agenda: "무료 서식 센터 론칭 일정 및 PDF 렌더링, 애드센스 가상 광고 지면 검증",
      discussion: "1. PDF 다운로드 방식: 서버 사이드 대신 브라우저의 @media print CSS 최적화를 통해 PDF 다운로드 해상도 극대화 확인.\n2. 수익화 레이아웃: 사용자 클릭 방해 없이 로딩될 수 있도록 카드 리스트 상단 and 입력 폼 좌측 아래에 AdSpace 배치안 검토.",
      decision: "1. 6월 20일 이전 12종 서식 실시간 랜더러를 마움데이터 FORM 서브 도메인 아래에 전면 배포 완료.\n2. HWP/WordBlob 다운로드 헬퍼 브릿지 테스트 통과 완료.",
      date: "",
      useApproval: false
    },
    layout: [
      { type: "title", value: "회 의 록" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "회 의 주 제", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{title}", colSpan: 10, key: "title", bold: true }
            ]
          },
          {
            cells: [
              { label: "회 의 일 시", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{meetingTime}", colSpan: 4, key: "meetingTime", align: "center" },
              { label: "회 의 장 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{meetingPlace}", colSpan: 4, key: "meetingPlace" }
            ]
          },
          {
            cells: [
              { label: "참 석 자", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{attendees}", colSpan: 10, key: "attendees" }
            ]
          },
          {
            cells: [
              { label: "회 의 안 건", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agenda}", colSpan: 10, key: "agenda" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "주요 토의 및 회의 내용" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{discussion}", colSpan: 12, key: "discussion", style: { height: "160px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "subtitle", value: "결정 사항 및 Action Item" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{decision}", colSpan: 12, key: "decision", style: { height: "100px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "위와 같이 회의록을 작성하여 보고합니다.", style: { textAlign: "right", margin: "10px 0 0 0", paddingRight: "15px" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "10pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },

  // 3. 재무 / 총무
  {
    id: "payment",
    title: "지출결의서",
    category: "재무",
    desc: "사내 공무로 집행된 소액 경비, 소모품 구입비, 도서구입비 등의 비용을 사후 또는 사전에 증빙(카드 전표 등)과 결재 상신하는 문서입니다.",
    popular: true,
    tags: ["지출결의서", "지출", "경리/출납", "경리", "회계/재무", "회계", "재무", "회사", "부서별"],
    fields: [
      { key: "dept", label: "결의 부서", type: "text", placeholder: "경영기획실" },
      { key: "resolver", label: "결의자 성명", type: "text", placeholder: "홍길동" },
      { key: "purpose", label: "지출 목적", type: "text", placeholder: "개발팀 회식 및 도서 구입비" },
      { key: "amount", label: "지출 금액 총액", type: "text", placeholder: "350,000원" },
      { key: "details", label: "상세 집행 내역", type: "textarea", placeholder: "지출 일자, 가맹점, 집행 내역 목록을 작성하세요." },
      { key: "date", label: "결의 일자", type: "text", placeholder: "2026년 06월 15일" }
    ],
    initialValues: {
      dept: "경영기획실",
      resolver: "홍길동 대리",
      purpose: "2026년 6월 개발팀 정기 도서 구입 및 식대 지출",
      amount: "320,000원",
      details: "1. 2026.06.14 - 교보문고 (Next.js 전문 개발도서 3권) : 90,000원\n2. 2026.06.14 - 스타벅스 (개발 세미나 다과 비용) : 30,000원\n3. 2026.06.15 - 마포갈비 (개발팀 정기 팀빌딩 회식비) : 200,000원",
      date: "",
      useApproval: true
    },
    layout: [
      { type: "title", value: "지 출 결 의 서" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "결 의 부 서", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dept}", colSpan: 4, key: "dept", align: "center" },
              { label: "결  의  자", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{resolver}", colSpan: 4, key: "resolver", align: "center" }
            ]
          },
          {
            cells: [
              { label: "결 의 일 자", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{date}", colSpan: 4, key: "date", align: "center" },
              { label: "지 출 금 금액", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{amount}", colSpan: 4, key: "amount", bold: true, align: "center" }
            ]
          },
          {
            cells: [
              { label: "지 출 목 적", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{purpose}", colSpan: 10, key: "purpose" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "지출 상세 집행 내역 (증빙 첨부)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{details}", colSpan: 12, key: "details", style: { height: "250px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "상기와 같이 업무 추진을 위해 경비를 지출하였기에 결의서를 제출하오니 정히 영수 및 재가하여 주시기 바랍니다.", style: { lineHeight: 1.5 } },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "영수/결의자 : {resolver} (인)" }
    ]
  },
  {
    id: "estimate",
    title: "표준 견적서",
    category: "재무",
    desc: "공급업자가 거래처에 상품 또는 서비스에 관한 거래 가격 및 규격 조건을 명시하여 미리 알려주기 위한 거래 제안 서식입니다.",
    popular: true,
    tags: ["견적서", "견적", "계약", "영업", "판매/영업", "구매/자재", "구매", "회사", "부서별"],
    fields: [
      { key: "provider", label: "공급자 상호 / 대표", type: "text", placeholder: "예: 마음데이터 주식회사 (대표 김철수)" },
      { key: "customer", label: "수신처 / 귀하", type: "text", placeholder: "예: 미래상사 귀하" },
      { key: "estDate", label: "견적 일자", type: "text", placeholder: "2026년 06월 15일" },
      { key: "estDetails", label: "견적 주요 품목", type: "text", placeholder: "예: 마움데이터 API 서비스 연간 구독료" },
      { key: "totalPrice", label: "견적 금액 합계", type: "text", placeholder: "금 5,500,000원 (VAT 포함)" },
      { key: "description", label: "상세 견적 조건 및 유효기간", type: "textarea", placeholder: "결제 조건 및 견적 유효기간 등을 작성해 주세요." }
    ],
    initialValues: {
      provider: "마음데이터 주식회사 (대표 김철수)\n사업자등록번호: 120-81-00000\n주소: 서울시 마포구 마포대로 14",
      customer: "미래소프트 주식회사 귀하",
      estDate: "",
      estDetails: "마음데이터 기업분석 API 서비스 연간 패키지 라이선스",
      totalPrice: "금 5,500,000원 (단가 5,000,000원 / 부가세 500,000원)",
      description: "1. 견적 유효기간 : 제출일로부터 30일간\n2. 결제 조건 : 계약 후 7일 이내 현금 결제\n3. 기술 지원 : 연간 무상 원격 API 유지보수 지원 포함.",
      useApproval: false
    },
    layout: [
      { type: "title", value: "견  적  서" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "공급받는자 (수신)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{customer}", colSpan: 4, key: "customer", bold: true, align: "center" },
              { label: "견 적 일 자", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{estDate}", colSpan: 4, key: "estDate", align: "center" }
            ]
          },
          {
            cells: [
              { label: "공 급 자 정보", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{provider}", colSpan: 10, key: "provider", style: { fontSize: "8.5pt", whiteSpace: "pre-line" } }
            ]
          },
          {
            cells: [
              { label: "견 적 제 목", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{estDetails}", colSpan: 10, key: "estDetails", bold: true }
            ]
          },
          {
            cells: [
              { label: "견적 총액 (합계)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{totalPrice}", colSpan: 10, key: "totalPrice", bold: true, align: "center", style: { fontSize: "11pt", color: "#111" } }
            ]
          }
        ]
      },
      { type: "subtitle", value: "견적 상세 내용 및 특약조건" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{description}", colSpan: 12, key: "description", style: { height: "220px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "※ 견적 내용에 대한 유효기간 및 특약조건을 확인하시기 바랍니다. 관련 문의사항은 공급자 정보에 기재된 연락처로 문의바랍니다.", style: { fontSize: "8.5pt", color: "#555555" } }
    ]
  },
  {
    id: "order",
    title: "발주서",
    category: "재무",
    desc: "구매처가 공급업자에게 특정 제품 또는 가공품의 수량, 단가, 납품 장소 등을 명시하여 납품을 공식 의뢰하는 구매 서식입니다.",
    popular: false,
    tags: ["발주서", "발주", "계약", "영업", "판매/영업", "구매/자재", "구매", "회사", "부서별"],
    fields: [
      { key: "provider", label: "공급자 정보 (받는 곳)", type: "text", placeholder: "마음데이터 주식회사" },
      { key: "customer", label: "발주자 정보 (보내는 곳)", type: "text", placeholder: "미래상사" },
      { key: "orderDate", label: "발주 일자", type: "text", placeholder: "2026년 06월 15일" },
      { key: "deliveryDate", label: "납기 기한", type: "text", placeholder: "2026년 06월 30일" },
      { key: "totalPrice", label: "발주 금액 총액", type: "text", placeholder: "3,300,000원 (VAT 포함)" },
      { key: "description", label: "발주 상세 내용 및 특일사항", type: "textarea", placeholder: "납품 방식 및 운송 조건 등을 기재하세요." }
    ],
    initialValues: {
      provider: "마음데이터 주식회사 귀하",
      customer: "주식회사 미래테크\n사업자등록번호: 220-81-12345\n주소: 경기도 수원시 광교로 156",
      orderDate: "",
      deliveryDate: "2026년 06월 30일 (화요일限)",
      totalPrice: "3,300,000원 (VAT 포함)",
      description: "1. 발주 품목: 기업 API 분석 커스텀 라이브러리 SDK 1식\n2. 납품 장소: 발주처 메일 전송 또는 클라우드 다운로드 배포\n3. 기타: 성능 테스트 통과 후 정산서 발행 요망.",
      useApproval: true
    },
    layout: [
      { type: "title", value: "발  주  서" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "발 주 일 자", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{orderDate}", colSpan: 4, key: "orderDate", align: "center" },
              { label: "납 기 기 한", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{deliveryDate}", colSpan: 4, key: "deliveryDate", align: "center" }
            ]
          },
          {
            cells: [
              { label: "공 급 처 (수신)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{provider}", colSpan: 4, key: "provider", align: "center" },
              { label: "발 주 처 (발신)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{customer}", colSpan: 4, key: "customer", style: { fontSize: "8.5pt", whiteSpace: "pre-line" } }
            ]
          },
          {
            cells: [
              { label: "발주 금액 총액", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{totalPrice}", colSpan: 10, key: "totalPrice", bold: true, align: "center", style: { fontSize: "11pt" } }
            ]
          }
        ]
      },
      { type: "subtitle", value: "발주 품목 명세 및 요청 사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{description}", colSpan: 12, key: "description", style: { height: "240px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "위와 같이 정히 발주하오니 납기일을 준수하여 성실히 납품하여 주시기 바랍니다. 규격 위반이나 파손 시 책임을 물을 수 있습니다.", style: { fontSize: "8.5pt", color: "#555555" } }
    ]
  },

  // 4. 계약 / 총무
  {
    id: "iou",
    title: "금전차용증",
    category: "계약",
    desc: "돈을 빌려주는 채권자와 빌리는 채무자 간에 차용금액, 이자 조건, 변제 기일 등을 명시하여 채무 관계를 증명하고 서명 날인하는 법적 효력 있는 계약 양식입니다.",
    popular: true,
    tags: ["차용증/금전", "금전", "차용증", "계약", "내용증명", "채권/채무", "채권", "민사/가사", "민사", "법률일반", "법률"],
    fields: [
      { key: "creditorName", label: "채권자 성명", type: "text", placeholder: "김철수" },
      { key: "creditorRegNo", label: "채권자 주민등록번호", type: "text", placeholder: "750101-1234567" },
      { key: "creditorAddr", label: "채권자 주소", type: "text", placeholder: "서울특별시 강남구 테헤란로 100" },
      { key: "creditorPhone", label: "채권자 연락처", type: "text", placeholder: "010-1111-2222" },
      { key: "debtorName", label: "채무자 성명", type: "text", placeholder: "홍길동" },
      { key: "debtorRegNo", label: "채무자 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "debtorAddr", label: "채무자 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "debtorPhone", label: "채무자 연락처", type: "text", placeholder: "010-3333-4444" },
      { key: "amount", label: "차용 원금액 (숫자/한글)", type: "text", placeholder: "금 10,000,000원 정 (일천만원整)" },
      { key: "interestRate", label: "이자율 (연 %)", type: "text", placeholder: "연 4.5%" },
      { key: "interestPayDay", label: "이자 지급일 및 방법", type: "text", placeholder: "매월 말일 채권자의 지정 계좌로 송금" },
      { key: "dueDate", label: "변제 기일 (만기일)", type: "text", placeholder: "2027년 06월 15일" },
      { key: "conditions", label: "차용 세부 특약 조항", type: "textarea", placeholder: "1. 채무자는 약정한 매월 말일에 이자를 지급하며, 만기 변제 기일에 원금을 전액 일시 상환하기로 한다.\n2. 채무자가 이자 지급을 2회 이상 지체할 경우, 채무자는 기한의 이익을 상실하고 채권자의 즉시 변제 독촉에 응하여야 한다." },
      { key: "date", label: "차용증 작성 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      creditorName: "김철수",
      creditorRegNo: "750101-1234567",
      creditorAddr: "서울특별시 강남구 테헤란로 100",
      creditorPhone: "010-1111-2222",
      debtorName: "홍길동",
      debtorRegNo: "900101-1234567",
      debtorAddr: "서울특별시 마포구 마포대로 14",
      debtorPhone: "010-3333-4444",
      amount: "금 10,000,000원 정 (일천만원整)",
      interestRate: "연 4.5%",
      interestPayDay: "매월 말일 채권자의 지정 계좌로 송금",
      dueDate: "2027년 06월 15일",
      conditions: "1. 채무자는 약정한 매월 말일에 이자를 지급하며, 만기 변제 기일에 원금을 전액 일시 상환하기로 한다.\n2. 채무자가 이자 지급을 2회 이상 지체할 경우, 채무자는 기한의 이익을 상실하고 채권자의 즉시 변제 독촉에 응하여야 한다.\n3. 본 계약과 관련한 분쟁 해결은 채권자 주소지 관할 법원으로 하기로 합의한다.",
      date: "",
      useApproval: false
    },
    layout: [
      { type: "title", value: "금 전 차 용 증" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "차 용 원 금", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{amount}", colSpan: 3, key: "amount", bold: true, align: "center", style: { fontSize: "12pt" } }
            ]
          },
          {
            cells: [
              { label: "이 자 율", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{interestRate}", width: "30%", key: "interestRate", align: "center" },
              { label: "변 제 기 일", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dueDate}", width: "30%", key: "dueDate", align: "center" }
            ]
          },
          {
            cells: [
              { label: "이자지급방법", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{interestPayDay}", colSpan: 3, key: "interestPayDay" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "1. 채권자 및 채무자 정보" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "채권자 (빌려준 사람)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "채무자 (빌린 사람)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" }
            ]
          },
          {
            cells: [
              { label: "성 명", width: "15%", bold: true, align: "center" },
              { label: "{creditorName}", width: "35%", key: "creditorName", align: "center" },
              { label: "성 명", width: "15%", bold: true, align: "center" },
              { label: "{debtorName}", width: "35%", key: "debtorName", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주민번호", bold: true, align: "center" },
              { label: "{creditorRegNo}", key: "creditorRegNo", align: "center" },
              { label: "주민번호", bold: true, align: "center" },
              { label: "{debtorRegNo}", key: "debtorRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center" },
              { label: "{creditorAddr}", key: "creditorAddr" },
              { label: "주 소", bold: true, align: "center" },
              { label: "{debtorAddr}", key: "debtorAddr" }
            ]
          },
          {
            cells: [
              { label: "연락처", bold: true, align: "center" },
              { label: "{creditorPhone}", key: "creditorPhone", align: "center" },
              { label: "연락처", bold: true, align: "center" },
              { label: "{debtorPhone}", key: "debtorPhone", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 차용증 특약 조항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{conditions}", colSpan: 4, key: "conditions", style: { height: "100px", verticalAlign: "top" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "채무자는 채권자로부터 위 원금을 정히 차용하였으며, 상기 약정 조항을 성실히 이행할 것을 서약하고 본 차용증을 작성하여 날인합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      {
        type: "table",
        style: { border: "none" },
        rows: [
          {
            cells: [
              { label: "채권자 : {creditorName} (인)", width: "50%", style: { border: "none" } },
              { label: "채무자 : {debtorName} (인)", width: "50%", style: { border: "none" } }
            ]
          }
        ]
      }
    ]
  },
  // 5. 범용 / 하부 민원행정·법률 서식 (freeforms 기반 우리화)
  {
    id: "generic_prosecution",
    title: "고소장",
    category: "계약",
    desc: "범죄 피해자가 범죄 사실을 수사기관에 신고하여 범인의 처벌을 요구하는 표준 고소 서식입니다.",
    popular: true,
    tags: ["고소장", "경찰청", "경찰서", "민원", "법률", "법률일반", "형사"],
    fields: [
      { key: "name", label: "고소인 성명", type: "text", placeholder: "홍길동" },
      { key: "birth", label: "고소인 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "address", label: "고소인 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "phone", label: "고소인 연락처", type: "text", placeholder: "010-1234-5678" },
      { key: "accusedName", label: "피고소인 성명", type: "text", placeholder: "김철수" },
      { key: "accusedPhone", label: "피고소인 연락처", type: "text", placeholder: "010-9876-5432" },
      { key: "accusedAddress", label: "피고소인 주소", type: "text", placeholder: "서울특별시 서초구 반포대로 30" },
      { key: "purpose", label: "고소 취지", type: "textarea", placeholder: "피고소인을 사기 혐의로 고소하오니 철저히 수사하여 법에 따라 처벌하여 주시기 바랍니다." },
      { key: "facts", label: "범죄 사실", type: "textarea", placeholder: "1. 피고소인은 2026년 5월 1일 고소인에게 사업 투자금 명목으로 금 10,000,000원을 편취하였습니다.\n2. 피고소인은 당초 약정한 수익금 지급 및 원금 변제 의사나 능력이 없었음에도 거짓으로 고소인을 기망하였습니다." },
      { key: "date", label: "제출 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "company", label: "제출 수사기관", type: "text", placeholder: "마포경찰서 귀중" }
    ],
    initialValues: {
      name: "홍길동",
      birth: "900101-1234567",
      address: "서울특별시 마포구 마포대로 14",
      phone: "010-1234-5678",
      accusedName: "김철수",
      accusedPhone: "010-9876-5432",
      accusedAddress: "서울특별시 서초구 반포대로 30",
      purpose: "피고소인을 사기 혐의로 고소하오니 철저히 수사하여 법에 따라 처벌하여 주시기 바랍니다.",
      facts: "1. 피고소인은 2026년 5월 1일 고소인에게 사업 투자금 명목으로 금 10,000,000원을 편취하였습니다.\n2. 피고소인은 당초 약정한 수익금 지급 및 원금 변제 의사나 능력이 없었음에도 거짓으로 고소인을 기망하였습니다.",
      date: "",
      company: "마포경찰서 귀중",
      useApproval: false
    },
    layout: [
      { type: "title", value: "고 소 장" },
      { type: "subtitle", value: "1. 고소인 (피해자)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", width: "30%", key: "name", align: "center" },
              { label: "주민등록번호", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{birth}", width: "30%", key: "birth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{address}", colSpan: 3, key: "address" }
            ]
          },
          {
            cells: [
              { label: "연락처", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{phone}", colSpan: 3, key: "phone", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 피고소인 (가해자)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{accusedName}", width: "30%", key: "accusedName", align: "center" },
              { label: "연락처", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{accusedPhone}", width: "30%", key: "accusedPhone", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{accusedAddress}", colSpan: 3, key: "accusedAddress" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 고소 취지" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{purpose}", colSpan: 4, key: "purpose", style: { height: "60px", verticalAlign: "top" } }
            ]
          }
        ]
      },
      { type: "subtitle", value: "4. 범죄 사실" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{facts}", colSpan: 4, key: "facts", style: { height: "100px", verticalAlign: "top" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "고소인 : {name} (인)" },
      { type: "paragraph", value: "{company}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },
  {
    id: "generic_complaint",
    title: "진정서",
    category: "계약",
    desc: "개인 또는 단체가 국가나 공공기관에 대하여 유리한 조치를 취해줄 것을 희망하는 의사를 제출하는 표준 서식입니다.",
    popular: false,
    tags: ["진정서", "경찰청", "고용노동부", "민원", "법률", "행정"],
    fields: [
      { key: "name", label: "진정인 성명", type: "text", placeholder: "홍길동" },
      { key: "birth", label: "진정인 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "address", label: "진정인 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "phone", label: "진정인 연락처", type: "text", placeholder: "010-1234-5678" },
      { key: "accusedName", label: "피진정인 성명", type: "text", placeholder: "김철수" },
      { key: "accusedPhone", label: "피진정인 연락처", type: "text", placeholder: "010-9876-5432" },
      { key: "accusedAddress", label: "피진정인 주소", type: "text", placeholder: "서울특별시 영등포구 여의도동 1" },
      { key: "purpose", label: "진정 취지", type: "textarea", placeholder: "피진정인의 임금 체불 및 무단 해고 행위에 대하여 신속한 조사와 시정 명령을 요청합니다." },
      { key: "reason", label: "진정 이유", type: "textarea", placeholder: "1. 진정인은 피진정인의 사업장에서 근무하였으나, 최근 2개월분의 임금 및 퇴직금이 미지급되었습니다.\n2. 이에 근로기준법 위반 사실을 조사하여 주실 것을 간곡히 진정합니다." },
      { key: "date", label: "제출 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "company", label: "제출처 (기관명)", type: "text", placeholder: "서울지방고용노동청 귀중" }
    ],
    initialValues: {
      name: "홍길동",
      birth: "900101-1234567",
      address: "서울특별시 마포구 마포대로 14",
      phone: "010-1234-5678",
      accusedName: "김철수",
      accusedPhone: "010-9876-5432",
      accusedAddress: "서울특별시 영등포구 여의도동 1",
      purpose: "피진정인의 임금 체불 및 무단 해고 행위에 대하여 신속한 조사와 시정 명령을 요청합니다.",
      reason: "1. 진정인은 피진정인의 사업장에서 근무하였으나, 최근 2개월분의 임금 및 퇴직금이 미지급되었습니다.\n2. 이에 근로기준법 위반 사실을 조사하여 주실 것을 간곡히 진정합니다.",
      date: "",
      company: "서울지방고용노동청 귀중",
      useApproval: false
    },
    layout: [
      { type: "title", value: "진 정 서" },
      { type: "subtitle", value: "1. 진정인 (민원신청인)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", width: "30%", key: "name", align: "center" },
              { label: "주민등록번호", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{birth}", width: "30%", key: "birth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{address}", colSpan: 3, key: "address" }
            ]
          },
          {
            cells: [
              { label: "연락처", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{phone}", colSpan: 3, key: "phone", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 피진정인 (대상자)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{accusedName}", width: "30%", key: "accusedName", align: "center" },
              { label: "연락처", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{accusedPhone}", width: "30%", key: "accusedPhone", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{accusedAddress}", colSpan: 3, key: "accusedAddress" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 진정 취지" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{purpose}", colSpan: 4, key: "purpose", style: { height: "60px", verticalAlign: "top" } }
            ]
          }
        ]
      },
      { type: "subtitle", value: "4. 진정 이유" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{reason}", colSpan: 4, key: "reason", style: { height: "100px", verticalAlign: "top" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "진정인 : {name} (인)" },
      { type: "paragraph", value: "{company}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },
  {
    id: "generic_power_of_attorney",
    title: "위임장",
    category: "계약",
    desc: "특정인에게 대리권을 수여하여 대리 행위를 할 수 있도록 본인이 작성 및 날인하는 권한 위임 서식입니다.",
    popular: true,
    tags: ["위임장", "대리", "계약", "법률", "법률일반", "민사", "행정"],
    fields: [
      { key: "name", label: "위임인 (본인) 성명", type: "text", placeholder: "홍길동" },
      { key: "birth", label: "위임인 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "address", label: "위임인 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "agentName", label: "대리인 (수임인) 성명", type: "text", placeholder: "이영희" },
      { key: "agentBirth", label: "대리인 주민등록번호", type: "text", placeholder: "930202-2345678" },
      { key: "agentAddress", label: "대리인 주소", type: "text", placeholder: "서울특별시 마포구 망원동 12" },
      { key: "relation", label: "위임인과의 관계", type: "text", placeholder: "대리인" },
      { key: "content", label: "위임할 내용 및 범위", type: "textarea", placeholder: "본인은 대리인 이영희에게 부동산 계약 체결 및 행정 일체 권한을 위임합니다." },
      { key: "date", label: "위임 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "company", label: "제출처", type: "text", placeholder: "부동산 거래 이해관계인 귀중" }
    ],
    initialValues: {
      name: "홍길동",
      birth: "900101-1234567",
      address: "서울특별시 마포구 마포대로 14",
      agentName: "이영희",
      agentBirth: "930202-2345678",
      agentAddress: "서울특별시 마포구 망원동 12",
      relation: "대리인",
      content: "본인은 대리인 이영희에게 아래 부동산 계약에 관한 체결, 보증금 수령 및 행정 일체 권한을 위임합니다.\n- 대상 부동산: 서울특별시 마포구 마포대로 14, 101호\n- 위임 범위: 계약서 작성, 도장 날인, 영수증 발행 권한 등",
      date: "",
      company: "부동산 거래 이해관계인 귀중",
      useApproval: false
    },
    layout: [
      { type: "title", value: "위 임 장" },
      { type: "subtitle", value: "1. 위임인 (본인)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", width: "30%", key: "name", align: "center" },
              { label: "주민등록번호", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{birth}", width: "30%", key: "birth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{address}", colSpan: 3, key: "address" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 수임인 (대리인)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agentName}", width: "30%", key: "agentName", align: "center" },
              { label: "주민등록번호", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agentBirth}", width: "30%", key: "agentBirth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agentAddress}", colSpan: 3, key: "agentAddress" }
            ]
          },
          {
            cells: [
              { label: "위임인과의 관계", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{relation}", colSpan: 3, key: "relation", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 위임할 구체적 내용" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{content}", colSpan: 4, key: "content", style: { height: "100px", verticalAlign: "top" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "위임인은 수임인에게 상기 위임 대상 업무 처리에 관한 권한을 정히 위임합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "위임인 : {name} (인)" },
      { type: "paragraph", value: "{company}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },
  {
    id: "generic_settlement",
    title: "합의서",
    category: "계약",
    desc: "사고나 분쟁이 발생했을 때 양 당사자가 조건과 보상액을 합의하고 향후 이의 제기를 않기로 약정하는 표준 합의 서식입니다.",
    popular: true,
    tags: ["합의서", "교통사고", "민사", "형사", "법률", "합의"],
    fields: [
      { key: "firstParty", label: "당사자 (갑) 성명", type: "text", placeholder: "홍길동" },
      { key: "firstPartyBirth", label: "당사자 (갑) 주민번호", type: "text", placeholder: "900101-1234567" },
      { key: "firstPartyAddr", label: "당사자 (갑) 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "secondParty", label: "당사자 (을) 성명", type: "text", placeholder: "김철수" },
      { key: "secondPartyBirth", label: "당사자 (을) 주민번호", type: "text", placeholder: "850101-1234567" },
      { key: "secondPartyAddr", label: "당사자 (을) 주소", type: "text", placeholder: "서울특별시 강남구 테헤란로 100" },
      { key: "title", label: "합의 사건명", type: "text", placeholder: "대인/대물 교통사고 피해보상 합의" },
      { key: "content", label: "합의 내용 및 조건", type: "textarea", placeholder: "1. 을은 갑에게 수리비 및 치료비 명목으로 일백만원을 지급한다." },
      { key: "date", label: "합의 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      firstParty: "홍길동",
      firstPartyBirth: "900101-1234567",
      firstPartyAddr: "서울특별시 마포구 마포대로 14",
      secondParty: "김철수",
      secondPartyBirth: "850101-1234567",
      secondPartyAddr: "서울특별시 강남구 테헤란로 100",
      title: "대인/대물 교통사고 피해보상 합의",
      content: "1. '을(가해자 김철수)'은 '갑(피해자 홍길동)'에게 2026년 6월 10일 발생한 마포대로 교통사고의 차량 수리비 및 치료비 명목으로 합의금 일백만 원(₩1,000,000)을 즉시 지급합니다.\n2. '갑'은 위 금액을 영수함과 동시에 향후 본 사고에 대하여 민/형사상 일체의 청구 및 소송 제기를 하지 않을 것에 합의합니다.",
      date: "",
      useApproval: false
    },
    layout: [
      { type: "title", value: "합 의 서" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "사 건 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{title}", colSpan: 3, key: "title", bold: true }
            ]
          }
        ]
      },
      { type: "subtitle", value: "1. 당사자 정보" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "갑 (피해자)", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{firstParty}", width: "30%", key: "firstParty", align: "center" },
              { label: "주민등록번호", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{firstPartyBirth}", width: "30%", key: "firstPartyBirth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{firstPartyAddr}", colSpan: 3, key: "firstPartyAddr" }
            ]
          },
          {
            cells: [
              { label: "을 (가해자)", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{secondParty}", width: "30%", key: "secondParty", align: "center" },
              { label: "주민등록번호", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{secondPartyBirth}", width: "30%", key: "secondPartyBirth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{secondPartyAddr}", colSpan: 3, key: "secondPartyAddr" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 합의 사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{content}", colSpan: 4, key: "content", style: { height: "120px", verticalAlign: "top" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "위 당사자(갑, 을)는 상기 사건에 대하여 상호 원만히 합의를 하였으며, 향후 이에 대한 어떠한 민·형사상의 소송이나 이의도 제기하지 않을 것을 약정합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      {
        type: "table",
        style: { border: "none" },
        rows: [
          {
            cells: [
              { label: "갑 (피해자) : {firstParty} (인)", width: "50%", style: { border: "none", fontSize: "10pt" } },
              { label: "을 (가해자) : {secondParty} (인)", width: "50%", style: { border: "none", fontSize: "10pt" } }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "generic_statement",
    title: "진술서",
    category: "계약",
    desc: "사건이나 정황에 대하여 본인이 겪은 사실을 그대로 기술하여 증빙이나 소명용으로 제출하는 표준 서식입니다.",
    popular: false,
    tags: ["진술서", "증명", "경찰청", "법률", "법률일반", "행정"],
    fields: [
      { key: "name", label: "진술인 성명", type: "text", placeholder: "홍길동" },
      { key: "birth", label: "생년월일 / 주민번호", type: "text", placeholder: "900101-1234567" },
      { key: "phone", label: "연락처", type: "text", placeholder: "010-1234-5678" },
      { key: "address", label: "주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "title", label: "진술 사건명", type: "text", placeholder: "목격자 정황 진술" },
      { key: "content", label: "진술 내용", type: "textarea", placeholder: "사건 경위를 사실대로 작성하세요." },
      { key: "date", label: "진술 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "company", label: "제출처", type: "text", placeholder: "마포경찰서 사고조사계 귀중" }
    ],
    initialValues: {
      name: "홍길동",
      birth: "900101-1234567",
      phone: "010-1234-5678",
      address: "서울특별시 마포구 마포대로 14",
      title: "목격자 정황 진술의 건",
      content: "본 진술인은 2026년 6월 12일 15시경 서울 마포구 마포대로 14 빌딩 주차장 입구에서 검정색 승용차가 주차장 펜스를 충돌하고 별도의 조치 없이 이동하는 상황을 목격하였음을 사실대로 진술합니다.",
      date: "",
      company: "마포경찰서 사고조사계 귀중",
      useApproval: false
    },
    layout: [
      { type: "title", value: "진 슐 서" },
      { type: "subtitle", value: "1. 진술인 인적사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", width: "30%", key: "name", align: "center" },
              { label: "주민등록번호", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{birth}", width: "30%", key: "birth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{address}", colSpan: 3, key: "address" }
            ]
          },
          {
            cells: [
              { label: "연락처", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{phone}", colSpan: 3, key: "phone", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 진술 사건" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "사 건 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{title}", colSpan: 3, key: "title", bold: true }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 진술 내용 (경위 및 사실관계)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{content}", colSpan: 4, key: "content", style: { height: "180px", verticalAlign: "top" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "본인은 상기 진술 내용이 사실과 다름없음을 서약하며 진술서를 제출합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "진술인 : {name} (인)" },
      { type: "paragraph", value: "{company}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },
  {
    id: "generic_cancellation",
    title: "고소 취소장",
    category: "계약",
    desc: "수사기관에 제출했던 고소를 철회하고 처벌을 희망하지 않음을 공식 소명하는 고소취소 서식입니다.",
    popular: false,
    tags: ["고소 취소장", "고소취소장", "철회", "경찰청", "경찰서", "법률", "형사"],
    fields: [
      { key: "name", label: "고소인 성명", type: "text", placeholder: "홍길동" },
      { key: "accusedName", label: "피고소인 성명", type: "text", placeholder: "김철수" },
      { key: "caseNo", label: "사건 번호 / 사건명", type: "text", placeholder: "2026형제 5678호 (사기)" },
      { key: "reason", label: "취소 사유", type: "textarea", placeholder: "피고소인과 원만히 합의하여 피고소인의 처벌을 원하지 않으므로 이에 고소 취소장을 제출합니다." },
      { key: "date", label: "취소 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "company", label: "제출 수사기관", type: "text", placeholder: "서울서부지방검찰청 귀중" }
    ],
    initialValues: {
      name: "홍길동",
      accusedName: "김철수",
      caseNo: "2026형제 5678호 (사기)",
      reason: "피고소인과 원만히 합의하여 피고소인의 처벌을 원하지 않으므로 이에 고소 취소장을 제출합니다.",
      date: "",
      company: "서울서부지방검찰청 귀중",
      useApproval: false
    },
    layout: [
      { type: "title", value: "고소 취소장" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "사 건 번 호", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{caseNo}", colSpan: 3, key: "caseNo" }
            ]
          },
          {
            cells: [
              { label: "고 소 인", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", width: "30%", key: "name", align: "center" },
              { label: "피고소인", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{accusedName}", width: "30%", key: "accusedName", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "취소 취지 및 사유" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{reason}", colSpan: 4, key: "reason", style: { height: "150px", verticalAlign: "top" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "고소인은 피고소인에 대한 위 고소 사건과 관련하여 피고소인과 원만하게 합의하였기에 피고소인에 대한 고소를 전부 취소하며, 향후 이 건과 관련하여 어떠한 민·형사상 법적 책임도 묻지 않을 것을 확인하고 고소취소장을 제출합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "위 고소인 : {name} (인)" },
      { type: "paragraph", value: "{company}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },
  {
    id: "generic_employment_cert",
    title: "재직증명서",
    category: "노무",
    desc: "근로자가 현재 당사에 소속되어 근무하고 있음을 증명하는 범용 재직 확인 서식입니다.",
    popular: true,
    tags: ["재직증명서", "인사", "노무", "회사", "부서별", "증명"],
    fields: [
      { key: "name", label: "성명", type: "text", placeholder: "홍길동" },
      { key: "birth", label: "생년월일", type: "text", placeholder: "1990년 01월 01일" },
      { key: "address", label: "주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "dept", label: "소속 부서", type: "text", placeholder: "경영기획실" },
      { key: "rank", label: "직위 / 직급", type: "text", placeholder: "대리" },
      { key: "duration", label: "재직 기간", type: "text", placeholder: "2023년 05월 01일 ~ 현재" },
      { key: "purpose", label: "사용 용도", type: "text", placeholder: "금융기관 제출용" },
      { key: "date", label: "발행 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "company", label: "발행 회사명", type: "text", placeholder: "마음데이터 주식회사" }
    ],
    initialValues: {
      name: "홍길동",
      birth: "1990년 01월 01일",
      address: "서울특별시 마포구 마포대로 14",
      dept: "경영기획실",
      rank: "대리",
      duration: "2023년 05월 01일 ~ 현재",
      purpose: "금융기관 제출용",
      date: "",
      company: "마음데이터 주식회사",
      useApproval: true
    },
    layout: [
      { type: "title", value: "재 직 증 명 서" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", width: "30%", key: "name", align: "center" },
              { label: "생년월일", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{birth}", width: "30%", key: "birth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{address}", colSpan: 3, key: "address" }
            ]
          }
        ]
      },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "소 속", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dept}", width: "30%", key: "dept", align: "center" },
              { label: "직 위", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{rank}", width: "30%", key: "rank", align: "center" }
            ]
          },
          {
            cells: [
              { label: "재직 기간", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{duration}", colSpan: 3, key: "duration", align: "center" }
            ]
          },
          {
            cells: [
              { label: "용 도", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{purpose}", colSpan: 3, key: "purpose" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "상기와 같이 재직하고 있음을 증명합니다.", style: { textAlign: "center", fontSize: "11pt" } },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "{company} 대표이사 김철수 (인)" }
    ]
  },
  {
    id: "generic_career_cert",
    title: "경력증명서",
    category: "노무",
    desc: "근로기준법 제39조에 따른 사용증명서로, 근로자의 재직 경력 및 상세 수행 업무를 공식 확인해주는 경력 서식입니다.",
    popular: false,
    tags: ["경력증명서", "경력", "채용", "입사", "인사", "노무", "회사", "부서별", "증명"],
    fields: [
      { key: "name", label: "성명", type: "text", placeholder: "홍길동" },
      { key: "birth", label: "생년월일", type: "text", placeholder: "1990년 01월 01일" },
      { key: "address", label: "주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "dept", label: "최종 소속 부서", type: "text", placeholder: "개발본부" },
      { key: "rank", label: "최종 직위", type: "text", placeholder: "대리" },
      { key: "duration", label: "근무 기간", type: "text", placeholder: "2023년 05월 01일 ~ 2026년 06월 15일" },
      { key: "task", label: "담당 업무", type: "text", placeholder: "웹 프론트엔드 개발 및 유지보수" },
      { key: "leaveReason", label: "퇴직 사유", type: "text", placeholder: "개인 사정으로 인한 전직" },
      { key: "purpose", label: "사용 용도", type: "text", placeholder: "이직 제출용" },
      { key: "date", label: "발행 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "company", label: "발행 회사명", type: "text", placeholder: "마음데이터 주식회사" }
    ],
    initialValues: {
      name: "홍길동",
      birth: "1990년 01월 01일",
      address: "서울특별시 마포구 마포대로 14",
      dept: "개발본부 프론트엔드팀",
      rank: "대리",
      duration: "2023년 05월 01일 ~ 2026년 06월 15일",
      task: "웹 프론트엔드 개발 및 유지보수",
      leaveReason: "개인 사정으로 인한 전직",
      purpose: "이직 제출용",
      date: "",
      company: "마음데이터 주식회사",
      useApproval: true
    },
    layout: [
      { type: "title", value: "경 력 증 명 서" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", width: "30%", key: "name", align: "center" },
              { label: "생년월일", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{birth}", width: "30%", key: "birth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{address}", colSpan: 3, key: "address" }
            ]
          }
        ]
      },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "소 속", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dept}", width: "30%", key: "dept", align: "center" },
              { label: "직 위", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{rank}", width: "30%", key: "rank", align: "center" }
            ]
          },
          {
            cells: [
              { label: "근무 기간", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{duration}", colSpan: 3, key: "duration", align: "center" }
            ]
          },
          {
            cells: [
              { label: "담당 업무", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{task}", colSpan: 3, key: "task" }
            ]
          },
          {
            cells: [
              { label: "퇴직 사유", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{leaveReason}", colSpan: 3, key: "leaveReason" }
            ]
          },
          {
            cells: [
              { label: "용 도", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{purpose}", colSpan: 3, key: "purpose" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "상기인의 재직 경력을 정히 증명합니다.", style: { textAlign: "center", fontSize: "11pt" } },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "{company} 대표이사 김철수 (인)" }
    ]
  },
  {
    id: "generic_handover",
    title: "업무 인수인계서",
    category: "노무",
    desc: "퇴사 또는 부서 이동 시 담당하던 업무의 프로세스, 산출물 및 미결 사항 등을 명확히 정리하여 후임자에게 인계하는 서식입니다.",
    popular: false,
    tags: ["인수인계서", "인계", "퇴직", "인사", "노무", "회사", "부서별"],
    fields: [
      { key: "name", label: "인계자 성명", type: "text", placeholder: "홍길동" },
      { key: "rank", label: "인계자 직급", type: "text", placeholder: "대리" },
      { key: "dept", label: "소속 부서", type: "text", placeholder: "경영기획실" },
      { key: "successor", label: "인수자 성명", type: "text", placeholder: "이영희" },
      { key: "successorRank", label: "인수자 직급", type: "text", placeholder: "대리" },
      { key: "date", label: "인계 완료일", type: "text", placeholder: "2026년 06월 16일" },
      { key: "tasks", label: "주요 인수인계 업무", type: "textarea", placeholder: "- 월간 자금 지출결의서 취합 및 정산 회계 감사 업무" },
      { key: "documents", label: "인계 문서 및 산출물", type: "textarea", placeholder: "- 로컬 서버 계정 패스워드 및 소스 깃 저장소 이전 완료" },
      { key: "pending", label: "미결 및 특이사항", type: "textarea", placeholder: "- 다음 분기 광고 수익형 지면 구축 연동 협의" },
      { key: "company", label: "회사명", type: "text", placeholder: "마음데이터 주식회사" }
    ],
    initialValues: {
      name: "홍길동",
      rank: "대리",
      dept: "경영기획실",
      successor: "이영희",
      successorRank: "대리",
      date: "",
      tasks: "1. 월간 자금 지출결의서 취합 및 정산 회계 감사 업무\n2. 마음데이터 FORM 템플릿 유지보수 및 기획서 관리",
      documents: "1. 템플릿 소스 코드 저장소 이전 완료\n2. 로컬 서버 관리자 계정 패스워드 인계 완료",
      pending: "1. IT개발팀과 연계하여 다음 분기 광고 수익형 지면 구축 관련 연동 협약 체결 진행 요망",
      company: "마음데이터 주식회사",
      useApproval: true
    },
    layout: [
      { type: "title", value: "업무 인수인계서" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "인계 소속", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dept}", width: "30%", key: "dept", align: "center" },
              { label: "인계 일자", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{date}", width: "30%", key: "date", align: "center" }
            ]
          },
          {
            cells: [
              { label: "인 계 자", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name} {rank}", width: "30%", key: "name", align: "center" },
              { label: "인 수 자", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{successor} {successorRank}", width: "30%", key: "successor", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "1. 주요 인수인계 업무 내용" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{tasks}", colSpan: 4, key: "tasks", style: { height: "90px", verticalAlign: "top" } }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 인계 주요 문서 및 산출물 목록" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{documents}", colSpan: 4, key: "documents", style: { height: "60px", verticalAlign: "top" } }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 미결 업무 및 특별 협의사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{pending}", colSpan: 4, key: "pending", style: { height: "60px", verticalAlign: "top" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "상기 기술된 업무 인수인계 사항을 상호 간에 확인하고 정히 인계인수합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      {
        type: "table",
        style: { border: "none" },
        rows: [
          {
            cells: [
              { label: "인계자 : {name} (인)", width: "50%", style: { border: "none", fontSize: "10pt" } },
              { label: "인수자 : {successor} (인)", width: "50%", style: { border: "none", fontSize: "10pt" } }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "generic_receipt",
    title: "영수증",
    category: "재무",
    desc: "대금 또는 물품을 정히 영수했음을 증명하기 위해 돈을 수령한 발행자가 납부자에게 발행해주는 간이 영수 서식입니다.",
    popular: true,
    tags: ["영수증", "수납", "경리/출납", "경리", "회계/재무", "회계", "재무", "생활"],
    fields: [
      { key: "payer", label: "공급받는 자 (고객명)", type: "text", placeholder: "미래상사" },
      { key: "amount", label: "영수 금액 (한글 및 숫자)", type: "text", placeholder: "일금 삼십이만 원 정 (\\320,000)" },
      { key: "item", label: "영수 내역 / 항목", type: "text", placeholder: "사내 개발 서버 라이브러리 검증 비용 대금" },
      { key: "date", label: "영수 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "supplierRegNo", label: "공급자 등록번호", type: "text", placeholder: "120-81-00000" },
      { key: "supplierName", label: "공급자 상호 / 회사명", type: "text", placeholder: "마음데이터 주식회사" },
      { key: "supplierCEO", label: "공급자 대표자 성명", type: "text", placeholder: "김철수" },
      { key: "supplierAddr", label: "공급자 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" }
    ],
    initialValues: {
      payer: "미래상사",
      amount: "일금 삼십이만 원 정 (\\320,000)",
      item: "사내 개발 서버 라이브러리 검증 비용 대금",
      date: "",
      supplierRegNo: "120-81-00000",
      supplierName: "마음데이터 주식회사",
      supplierCEO: "김철수",
      supplierAddr: "서울특별시 마포구 마포대로 14",
      useApproval: false
    },
    layout: [
      { type: "title", value: "영 수 증" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "공급받는 자", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{payer} 귀하", colSpan: 3, key: "payer", bold: true }
            ]
          },
          {
            cells: [
              { label: "영 수 금 액", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{amount}", colSpan: 3, key: "amount", bold: true, align: "center", style: { fontSize: "12pt" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "공 급 자 정보", colSpan: 4, bold: true, align: "center", bg: "#f9fafb" }
            ]
          },
          {
            cells: [
              { label: "등록번호", width: "20%", bold: true, align: "center" },
              { label: "{supplierRegNo}", width: "30%", key: "supplierRegNo", align: "center" },
              { label: "상호 (법인명)", width: "20%", bold: true, align: "center" },
              { label: "{supplierName}", width: "30%", key: "supplierName", align: "center" }
            ]
          },
          {
            cells: [
              { label: "성 명 (대표자)", bold: true, align: "center" },
              { label: "{supplierCEO} (인)", colSpan: 3, key: "supplierCEO" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center" },
              { label: "{supplierAddr}", colSpan: 3, key: "supplierAddr" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "영수 내역" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "품명 및 내용", width: "70%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "비고", width: "30%", bold: true, align: "center", bg: "#f9fafb" }
            ]
          },
          {
            cells: [
              { label: "{item}", key: "item" },
              { label: "정히 영수함", align: "center" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "위 금액을 정히 영수하고 이에 영수증을 발행합니다.", style: { textAlign: "center" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" }
    ]
  },
  {
    id: "generic_agreement",
    title: "개인정보 수집 및 이용 동의서",
    category: "행정",
    desc: "법률 제15조에 따라 개인정보를 수집 및 제3자 제공, 활용하기 위해 정보주체에게 고지하고 서명을 취득하는 법정 서식입니다.",
    popular: false,
    tags: ["동의서", "개인정보", "계약", "법률", "행정"],
    fields: [
      { key: "title", label: "수집 동의서 제목", type: "text", placeholder: "서비스 회원 가입 및 정보 제공" },
      { key: "purpose", label: "수집 및 이용 목적", type: "textarea", placeholder: "마음데이터 서비스 회원가입, 본인 인증 및 고객 관리" },
      { key: "items", label: "수집하는 개인정보 항목", type: "textarea", placeholder: "성명, 생년월일, 연락처, 이메일 주소, 주소" },
      { key: "period", label: "보유 및 이용 기간", type: "textarea", placeholder: "회원 탈퇴 시 또는 목적 달성 시 즉시 파기" },
      { key: "name", label: "동의인 성명", type: "text", placeholder: "홍길동" },
      { key: "phone", label: "동의인 연락처", type: "text", placeholder: "010-1234-5678" },
      { key: "date", label: "동의 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "company", label: "정보 수집 주체 (회사명)", type: "text", placeholder: "마음데이터 주식회사" }
    ],
    initialValues: {
      title: "서비스 이용 및 맞춤 무료 서식 정보 제공",
      purpose: "마음데이터 서비스 가입, 본인 인증 및 맞춤 무료 서식 서비스 제공",
      items: "성명, 연락처, 이메일 주소, 주소",
      period: "목적 달성 시 즉시 파기 (단, 법령에 특별한 규정이 있는 경우 해당 기간 보관)",
      name: "홍길동",
      phone: "010-1234-5678",
      date: "",
      company: "마음데이터 주식회사",
      useApproval: false
    },
    layout: [
      { type: "title", value: "개인정보 수집 · 이용 동의서" },
      { type: "paragraph", value: "귀사에서 제공하는 서비스를 이용하고자 본인은 아래 고지사항을 확인하고 개인정보의 수집 및 이용에 동의합니다." },
      { type: "subtitle", value: "개인정보 수집 및 이용 고지사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "동의 목적 범위", width: "25%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{title}", colSpan: 3, key: "title" }
            ]
          },
          {
            cells: [
              { label: "수집 · 이용 목적", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{purpose}", colSpan: 3, key: "purpose" }
            ]
          },
          {
            cells: [
              { label: "수집하는 항목", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{items}", colSpan: 3, key: "items" }
            ]
          },
          {
            cells: [
              { label: "보유 및 이용기간", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{period}", colSpan: 3, key: "period" }
            ]
          }
        ]
      },
      { type: "paragraph", value: "※ 귀하는 개인정보 수집 및 이용 동의를 거부할 권리가 있으나, 거부 시 서비스 이용이 제한될 수 있습니다.", style: { fontSize: "9pt", color: "#ef4444" } },
      { type: "spacer" },
      { type: "paragraph", value: "본인은 상기 개인정보의 수집 및 이용 고지사항을 충분히 이해하였으며, 이에 동의합니다.", style: { fontWeight: "bold" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      {
        type: "table",
        style: { border: "none" },
        rows: [
          {
            cells: [
              { label: "동의자 성명 : {name} (인)", width: "50%", style: { border: "none" } },
              { label: "연락처 : {phone}", width: "50%", style: { border: "none" } }
            ]
          }
        ]
      },
      { type: "paragraph", value: "{company} 귀중", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center", marginTop: "15px" } }
    ]
  },
  {
    id: "generic_pledge",
    title: "보안 서약서",
    category: "행정",
    desc: "임직원이나 외부 협력업체가 업무 중 지득한 회사 기밀이나 영업 비밀을 외부로 유출하지 않을 것을 민형사상 서약하는 문서입니다.",
    popular: false,
    tags: ["서약서", "보안", "퇴직", "행정", "회사", "부서별"],
    fields: [
      { key: "name", label: "서약인 성명", type: "text", placeholder: "홍길동" },
      { key: "dept", label: "소속 부서", type: "text", placeholder: "경영기획실" },
      { key: "rank", label: "직위 / 직급", type: "text", placeholder: "대리" },
      { key: "birth", label: "생년월일", type: "text", placeholder: "1990년 01월 01일" },
      { key: "rules", label: "서약 규정 조항", type: "textarea", placeholder: "1. 회사의 소스코드, 기술정보를 무단 유출하지 않는다." },
      { key: "date", label: "서약 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "company", label: "서약 대상 회사명", type: "text", placeholder: "마음데이터 주식회사" }
    ],
    initialValues: {
      name: "홍길동",
      dept: "경영기획실",
      rank: "대리",
      birth: "1990년 01월 01일",
      rules: "1. 본인은 업무를 수행함에 있어 지득한 회사의 영업 비밀, 기술 정보, 고객 정보, 기획안, 소스 코드 등의 일체 기밀을 재직 중은 물론 퇴직 후에도 무단 유출하거나 제3자에게 누설하지 않겠습니다.\n2. 본인은 회사의 보안 규정 및 지침을 철저히 준수하겠습니다.\n3. 만일 본 서약 조항을 위반하여 회사에 유무형의 손해를 입힌 경우에는 부정경쟁방지 및 영업비밀보호에 관한 법률 등 관련 법령에 따른 민·형사상의 책임을 전적으로 지겠습니다.",
      date: "",
      company: "마음데이터 주식회사",
      useApproval: false
    },
    layout: [
      { type: "title", value: "보 안 서 약 서" },
      { type: "subtitle", value: "1. 서약자 인적사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", width: "30%", key: "name", align: "center" },
              { label: "생년월일", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{birth}", width: "30%", key: "birth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "소 속", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dept}", key: "dept", align: "center" },
              { label: "직 위", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{rank}", key: "rank", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 서약 내용" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{rules}", colSpan: 4, key: "rules", style: { height: "150px", verticalAlign: "top" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "서약인은 마음데이터 주식회사의 일원으로서 위 서약 조항을 성실히 준수할 것을 엄숙히 서약하며 본 서약서를 제출합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "서약인 : {name} (인)" },
      { type: "paragraph", value: "{company} 귀중", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center", marginTop: "15px" } }
    ]
  },
  {
    id: "generic_report_incident",
    title: "분실 신고서",
    category: "행정",
    desc: "사내 자산(노트북, 보안 카드 등)이나 물품을 유실했을 때 유실 장소와 정황을 기재하여 신고하는 행정 양식입니다.",
    popular: false,
    tags: ["분실신고서", "분실", "사고", "경찰청", "경찰서", "민원", "행정", "회사", "부서별"],
    fields: [
      { key: "name", label: "분실자 성명", type: "text", placeholder: "홍길동" },
      { key: "dept", label: "소속 부서", type: "text", placeholder: "개발본부" },
      { key: "rank", label: "직위 / 직급", type: "text", placeholder: "대리" },
      { key: "item", label: "분실 물품", type: "text", placeholder: "회사 지급용 크롬북 1대 (시리얼: MD-2026-999)" },
      { key: "lostTime", label: "분실 일시", type: "text", placeholder: "2026년 06월 14일 19시경" },
      { key: "lostPlace", label: "분실 장소", type: "text", placeholder: "지하철 2호선 홍대입구역 부근" },
      { key: "reason", label: "분실 경위", type: "textarea", placeholder: "퇴근길 지하철 이동 중 개인 가방 내부 지퍼가 열리면서 회사 지급 물품이 유실된 것으로 판단됩니다." },
      { key: "date", label: "신고 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "company", label: "수신처 (부서/회사)", type: "text", placeholder: "총무팀" }
    ],
    initialValues: {
      name: "홍길동",
      dept: "개발본부 프론트엔드팀",
      rank: "대리",
      item: "회사 지급용 크롬북 1대 (시리얼: MD-2026-999)",
      lostTime: "2026년 06월 14일 19시경",
      lostPlace: "지하철 2호선 홍대입구역 부근",
      reason: "퇴근길 지하철 이동 중 개인 가방 내부 지퍼가 열리면서 회사 지급 물품이 유실된 것으로 판단됩니다. 즉시 지하철 유실물 센터 및 관할 경찰서에 분실물 접수를 완료하였으나, 사내 자산 보안 관리를 위하여 본 분실 신고서를 제출합니다.",
      date: "",
      company: "총무팀",
      useApproval: true
    },
    layout: [
      { type: "title", value: "분 실 신 고 서" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "신 고 부 서", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dept}", width: "30%", key: "dept", align: "center" },
              { label: "신 고 일 자", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{date}", width: "30%", key: "date", align: "center" }
            ]
          },
          {
            cells: [
              { label: "분 실 자", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name} {rank}", colSpan: 3, key: "name", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "분실 상세 내용" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "분 실 물 품", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{item}", colSpan: 3, key: "item" }
            ]
          },
          {
            cells: [
              { label: "분 실 일 시", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{lostTime}", width: "30%", key: "lostTime", align: "center" },
              { label: "분 실 장 소", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{lostPlace}", width: "30%", key: "lostPlace", align: "center" }
            ]
          },
          {
            cells: [
              { label: "분 실 경 위", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{reason}", colSpan: 3, key: "reason", style: { height: "100px", verticalAlign: "top" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "위와 같이 사내 자산 분실에 대해 사실대로 작성하여 신고서를 제출합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "신고인 : {name} (인)" },
      { type: "paragraph", value: "{company} 귀중", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center", marginTop: "15px" } }
    ]
  },
  // 6. 대한민국 정부/공공기관 공식 민원 서식
  {
    id: "generic_gov_residence",
    title: "주민등록표 등·초본 교부 신청서",
    category: "행정",
    desc: "주민센터(읍·면·동 행정복지센터) 제출용 주민등록표 등본 및 초본 교부 또는 열람 신청서 대한민국 공식 행정 양식입니다.",
    popular: true,
    tags: ["주민등록", "등본", "초본", "정부24", "동사무소관련서식", "공공민원", "정부서식", "행정"],
    fields: [
      { key: "name", label: "신청인 성명", type: "text", placeholder: "홍길동" },
      { key: "regNo", label: "신청인 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "addr", label: "신청인 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "phone", label: "신청인 전화번호", type: "text", placeholder: "010-1234-5678" },
      { key: "applicantType", label: "신청인 구분", type: "text", placeholder: "본인" },
      { key: "targetName", label: "대상자 성명", type: "text", placeholder: "홍길동" },
      { key: "targetRegNo", label: "대상자 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "targetOwner", label: "대상 세대주 성명", type: "text", placeholder: "홍길동" },
      { key: "targetRelation", label: "세대주와의 관계", type: "text", placeholder: "본인" },
      { key: "qty", label: "발급 부수 (등본/초본)", type: "text", placeholder: "등본 1부, 초본 1부" },
      { key: "purpose", label: "신청 사유 (용도)", type: "text", placeholder: "금융기관 제출용" },
      { key: "company", label: "수신 관청 (읍·면·동장)", type: "text", placeholder: "마포동장 귀하" },
      { key: "date", label: "신청 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      name: "홍길동",
      regNo: "900101-1234567",
      addr: "서울특별시 마포구 마포대로 14 (도화동)",
      phone: "010-1234-5678",
      applicantType: "본인 (또는 세대원)",
      targetName: "홍길동",
      targetRegNo: "900101-1234567",
      targetOwner: "홍길동",
      targetRelation: "본인",
      qty: "주민등록표 등본: 1부 / 주민등록표 초본: 1부",
      purpose: "시중 은행 주택담보대출 증빙 및 금융기관 제출용",
      company: "마포동장 귀하",
      date: "",
      useApproval: false
    },
    layout: [
      { type: "paragraph", value: "■ 주민등록법 시행규칙 [별지 제9호서식] <개정 2021. 10. 15.>", style: { fontSize: "7.5pt", textAlign: "left", margin: "2px 0", color: "#333333" } },
      { type: "paragraph", value: "(앞쪽)", style: { fontSize: "7.5pt", textAlign: "right", margin: "-14px 0 2px 0", color: "#333333" } },
      {
        type: "paragraph",
        value: "주민등록표 [  ]열람  [ ☑ ]등본 교부  [ ☑ ]초본 교부 신청서",
        style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center", margin: "6px 0", border: "1.5px solid #000000", padding: "6px", backgroundColor: "#f9fafb" }
      },
      { type: "subtitle", value: "1. 신청인 정보" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", colSpan: 4, key: "name", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{regNo}", colSpan: 4, key: "regNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{addr}", colSpan: 10, key: "addr" }
            ]
          },
          {
            cells: [
              { label: "전화번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{phone}", colSpan: 4, key: "phone", align: "center" },
              { label: "신청인 구분", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{applicantType}", colSpan: 4, key: "applicantType", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 대상자 정보 (열람 또는 교부 대상자)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{targetName}", colSpan: 4, key: "targetName", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{targetRegNo}", colSpan: 4, key: "targetRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "세대주 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{targetOwner}", colSpan: 4, key: "targetOwner", align: "center" },
              { label: "세대주와의 관계", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{targetRelation}", colSpan: 4, key: "targetRelation", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 신청 내용 및 교부 범위 설정" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "등본 교부\n선택 사항", colSpan: 2, rowSpan: 2, bold: true, align: "center", bg: "#f9fafb", style: { fontSize: "8.5pt" } },
              { label: "표시 항목", colSpan: 2, bold: true, align: "center", bg: "#f9fafb", style: { fontSize: "8.5pt" } },
              { label: "[ ☑ ] 과거의 주소 변동 사항  [ ☑ ] 세대주와의 관계  [ ☑ ] 세대원 주민번호 뒷자리\n[  ] 동거인 표기 여부  [  ] 세대원의 신분 변동 사유", colSpan: 8, style: { fontSize: "8pt", lineHeight: 1.4 } }
            ]
          },
          {
            cells: [
              { label: "주소 변동", colSpan: 2, bold: true, align: "center", bg: "#f9fafb", style: { fontSize: "8.5pt" } },
              { label: "[ ☑ ] 전체 기간 포함  [  ] 최근 5년 분만 포함  [  ] 미포함", colSpan: 8, style: { fontSize: "8pt" } }
            ]
          },
          {
            cells: [
              { label: "초본 교부\n선택 사항", colSpan: 2, rowSpan: 2, bold: true, align: "center", bg: "#f9fafb", style: { fontSize: "8.5pt" } },
              { label: "표시 항목", colSpan: 2, bold: true, align: "center", bg: "#f9fafb", style: { fontSize: "8.5pt" } },
              { label: "[ ☑ ] 개인 인적사항 변경 내용  [ ☑ ] 과거의 주소 변동 사항 (전체 포함)\n[ ☑ ] 주민등록번호 뒷자리 포함  [  ] 병역사항 표기 여부", colSpan: 8, style: { fontSize: "8pt", lineHeight: 1.4 } }
            ]
          },
          {
            cells: [
              { label: "기타 표기", colSpan: 2, bold: true, align: "center", bg: "#f9fafb", style: { fontSize: "8.5pt" } },
              { label: "[  ] 외국인등록번호 표기  [  ] 국내거소신고번호 표기  [  ] 세대주 관계 표기", colSpan: 8, style: { fontSize: "8pt" } }
            ]
          },
          {
            cells: [
              { label: "신청 부수", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{qty}", colSpan: 10, key: "qty" }
            ]
          },
          {
            cells: [
              { label: "증명서 용도\n(제출 사유)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{purpose}", colSpan: 10, key: "purpose" }
            ]
          }
        ]
      },
      { type: "paragraph", value: "「주민등록법」 제29조 및 같은 법 시행령 제47조에 따라 위와 같이 주민등록표의 열람 또는 등·초본의 교부를 신청합니다.", style: { fontSize: "8.5pt", textAlign: "center", margin: "6px 0 4px 0", lineHeight: 1.3 } },
      { type: "paragraph", value: "{date}", style: { fontSize: "8.5pt", fontWeight: "bold", textAlign: "center", margin: "2px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "신청인 : {name} (인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{company}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center", marginTop: "10px" } }
    ]
  },
  {
    id: "generic_gov_family",
    title: "가족관계등록부 발급 신청서",
    category: "행정",
    desc: "가족관계증명서, 기본증명서, 혼인관계증명서 등 대법원 소관 가족관계 서류의 교부 및 열람을 요청하기 위한 공식 정부 규격 서식입니다.",
    popular: true,
    tags: ["가족관계", "가족관계증명서", "기본증명서", "대법원", "동사무소관련서식", "공공민원", "정부서식", "행정"],
    fields: [
      { key: "targetName", label: "대상자 성명", type: "text", placeholder: "홍길동" },
      { key: "targetRegNo", label: "대상자 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "targetOrigin", label: "대상자 등록기준지", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "name", label: "신청인 성명", type: "text", placeholder: "홍길동" },
      { key: "regNo", label: "신청인 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "addr", label: "신청인 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "phone", label: "신청인 연락처", type: "text", placeholder: "010-1234-5678" },
      { key: "relation", label: "대상자와의 관계", type: "text", placeholder: "본인" },
      { key: "qtyFamilyG", label: "가족관계증명서 일반 부수", type: "text", placeholder: "1부" },
      { key: "qtyFamilyS", label: "가족관계증명서 상세 부수", type: "text", placeholder: "0부" },
      { key: "qtyFamilyT", label: "가족관계증명서 특정 부수", type: "text", placeholder: "0부" },
      { key: "qtyBasicG", label: "기본증명서 일반 부수", type: "text", placeholder: "1부" },
      { key: "qtyBasicS", label: "기본증명서 상세 부수", type: "text", placeholder: "0부" },
      { key: "qtyBasicT", label: "기본증명서 특정 부수", type: "text", placeholder: "0부" },
      { key: "qtyMarriageG", label: "혼인관계증명서 일반 부수", type: "text", placeholder: "1부" },
      { key: "qtyMarriageS", label: "혼인관계증명서 상세 부수", type: "text", placeholder: "0부" },
      { key: "qtyMarriageT", label: "혼인관계증명서 특정 부수", type: "text", placeholder: "0부" },
      { key: "qtyAdoptionG", label: "입양관계증명서 일반 부수", type: "text", placeholder: "0부" },
      { key: "qtyAdoptionS", label: "입양관계증명서 상세 부수", type: "text", placeholder: "0부" },
      { key: "qtyAdoptionT", label: "입양관계증명서 특정 부수", type: "text", placeholder: "0부" },
      { key: "qtyFosteringG", label: "친양자입양증명 일반 부수", type: "text", placeholder: "0부" },
      { key: "qtyFosteringS", label: "친양자입양증명 상세 부수", type: "text", placeholder: "0부" },
      { key: "qtyFosteringT", label: "친양자입양증명 특정 부수", type: "text", placeholder: "0부" },
      { key: "purpose", label: "신청 사유 (용도)", type: "text", placeholder: "여권 발급용" },
      { key: "company", label: "수신 관청 (구청장/동장)", type: "text", placeholder: "마포구청장 귀하" },
      { key: "date", label: "신청 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      targetName: "홍길동",
      targetRegNo: "900101-1234567",
      targetOrigin: "서울특별시 마포구 마포대로 14 (도화동)",
      name: "홍길동",
      regNo: "900101-1234567",
      addr: "서울특별시 마포구 마포대로 14 (도화동)",
      phone: "010-1234-5678",
      relation: "본인",
      qtyFamilyG: "1부",
      qtyFamilyS: "0부",
      qtyFamilyT: "0부",
      qtyBasicG: "1부",
      qtyBasicS: "0부",
      qtyBasicT: "0부",
      qtyMarriageG: "0부",
      qtyMarriageS: "0부",
      qtyMarriageT: "0부",
      qtyAdoptionG: "0부",
      qtyAdoptionS: "0부",
      qtyAdoptionT: "0부",
      qtyFosteringG: "0부",
      qtyFosteringS: "0부",
      qtyFosteringT: "0부",
      purpose: "여권 신규 발급 신청 및 신원 증명 제출용",
      company: "마포구청장 귀하",
      date: "",
      useApproval: false
    },
    layout: [
      { type: "paragraph", value: "■ 가족관계등록예규 [별지 제1호서식]", style: { fontSize: "7.5pt", textAlign: "left", margin: "2px 0", color: "#333333" } },
      {
        type: "paragraph",
        value: "가 족 관 계 등 록 부 교 부 신 청 서",
        style: { fontSize: "14pt", fontWeight: "bold", textAlign: "center", margin: "8px 0 12px 0", letterSpacing: "2px" }
      },
      { type: "subtitle", value: "1. 발급 대상자 (증명서 기준이 되는 사람)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{targetName}", colSpan: 4, key: "targetName", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{targetRegNo}", colSpan: 4, key: "targetRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "등록기준지", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{targetOrigin}", colSpan: 10, key: "targetOrigin" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 청구인 (신청인) 정보" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", colSpan: 4, key: "name", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{regNo}", colSpan: 4, key: "regNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{addr}", colSpan: 10, key: "addr" }
            ]
          },
          {
            cells: [
              { label: "전화번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{phone}", colSpan: 4, key: "phone", align: "center" },
              { label: "대상자와의 관계", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{relation}", colSpan: 4, key: "relation", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 신청 증명서 종류 및 부수" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "증명서 종류", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "일반 (통수)", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "상세 (통수)", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "특정 (통수)", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" }
            ]
          },
          {
            cells: [
              { label: "가족관계증명서", colSpan: 3, bold: true, align: "center", bg: "#f9fafb", style: { fontSize: "8.5pt" } },
              { label: "{qtyFamilyG}", colSpan: 3, key: "qtyFamilyG", align: "center" },
              { label: "{qtyFamilyS}", colSpan: 3, key: "qtyFamilyS", align: "center" },
              { label: "{qtyFamilyT}", colSpan: 3, key: "qtyFamilyT", align: "center" }
            ]
          },
          {
            cells: [
              { label: "기본증명서", colSpan: 3, bold: true, align: "center", bg: "#f9fafb", style: { fontSize: "8.5pt" } },
              { label: "{qtyBasicG}", colSpan: 3, key: "qtyBasicG", align: "center" },
              { label: "{qtyBasicS}", colSpan: 3, key: "qtyBasicS", align: "center" },
              { label: "{qtyBasicT}", colSpan: 3, key: "qtyBasicT", align: "center" }
            ]
          },
          {
            cells: [
              { label: "혼인관계증명서", colSpan: 3, bold: true, align: "center", bg: "#f9fafb", style: { fontSize: "8.5pt" } },
              { label: "{qtyMarriageG}", colSpan: 3, key: "qtyMarriageG", align: "center" },
              { label: "{qtyMarriageS}", colSpan: 3, key: "qtyMarriageS", align: "center" },
              { label: "{qtyMarriageT}", colSpan: 3, key: "qtyMarriageT", align: "center" }
            ]
          },
          {
            cells: [
              { label: "입양관계증명서", colSpan: 3, bold: true, align: "center", bg: "#f9fafb", style: { fontSize: "8.5pt" } },
              { label: "{qtyAdoptionG}", colSpan: 3, key: "qtyAdoptionG", align: "center" },
              { label: "{qtyAdoptionS}", colSpan: 3, key: "qtyAdoptionS", align: "center" },
              { label: "{qtyAdoptionT}", colSpan: 3, key: "qtyAdoptionT", align: "center" }
            ]
          },
          {
            cells: [
              { label: "친양자입양증명서", colSpan: 3, bold: true, align: "center", bg: "#f9fafb", style: { fontSize: "8.5pt" } },
              { label: "{qtyFosteringG}", colSpan: 3, key: "qtyFosteringG", align: "center" },
              { label: "{qtyFosteringS}", colSpan: 3, key: "qtyFosteringS", align: "center" },
              { label: "{qtyFosteringT}", colSpan: 3, key: "qtyFosteringT", align: "center" }
            ]
          },
          {
            cells: [
              { label: "신청 사유 / 용도", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{purpose}", colSpan: 9, key: "purpose" }
            ]
          }
        ]
      },
      { type: "paragraph", value: "「가족관계의 등록 등에 관한 법률」 제14조에 따라 위와 같이 교부(열람)를 신청합니다.", style: { fontSize: "8.5pt", textAlign: "center", margin: "6px 0 4px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "8.5pt", fontWeight: "bold", textAlign: "center", margin: "2px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "청구인 : {name} (인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{company}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center", marginTop: "10px" } }
    ]
  },
  {
    id: "generic_gov_biz_reg",
    title: "사업자등록신청서 (개인사업자용)",
    category: "계약",
    desc: "신규 사업 개시 후 관할 세무서에 개인사업자 신규 등록 및 업태/종목 지정을 상신하기 위한 국세청 법정 행정 서식입니다.",
    popular: true,
    tags: ["사업자등록", "국세청", "사업자등록신청서", "세무서", "창업관련", "공공민원", "정부서식", "계약"],
    fields: [
      { key: "bizName", label: "상호 (단체명)", type: "text", placeholder: "마음데이터 팩토리" },
      { key: "name", label: "대표자 성명", type: "text", placeholder: "홍길동" },
      { key: "delegatorRegNo", label: "대표자 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "bizPhone", label: "전화번호 (사업장)", type: "text", placeholder: "010-1234-5678" },
      { key: "bizAddr", label: "사업장 소재지 (주소)", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "bizType", label: "주업태", type: "text", placeholder: "도매 및 소매업" },
      { key: "bizItem", label: "주종목", type: "text", placeholder: "전자상거래업" },
      { key: "openingDate", label: "개업 년월일", type: "text", placeholder: "2026년 07월 01일" },
      { key: "rentDesc", label: "사업장 구분 (임차료 명세)", type: "text", placeholder: "임차 (보증금 1천만원, 월세 50만원)" },
      { key: "deliveryAddr", label: "국세 서류 송달 장소", type: "text", placeholder: "사업장 주소와 동일" },
      { key: "company", label: "수신 (관할 세무서장)", type: "text", placeholder: "마포세무서장 귀하" },
      { key: "date", label: "신청 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      bizName: "마음데이터 테크놀로지",
      name: "홍길동",
      delegatorRegNo: "900101-1234567",
      bizPhone: "010-1234-5678",
      bizAddr: "서울특별시 마포구 마포대로 14 (도화동)",
      bizType: "도매 및 소매업",
      bizItem: "전자상거래 소매 및 데이터 서비스 소프트웨어 개발",
      openingDate: "2026년 07월 01일",
      rentDesc: "임차 (임대인: 김철수, 임차보증금: 10,000,000원 / 월세: 500,000원)",
      deliveryAddr: "서울특별시 마포구 마포대로 14 (사업장 소재지)",
      company: "마포세무서장 귀하",
      date: "",
      useApproval: false
    },
    layout: [
      { type: "paragraph", value: "■ 부가가치세법 시행규칙 [별지 제4호서식] <개정 2021. 3. 16.>", style: { fontSize: "7.5pt", textAlign: "left", margin: "2px 0", color: "#333333" } },
      {
        type: "paragraph",
        value: "사 업 자 등 록 신 청 서 (개인사업자용)",
        style: { fontSize: "13pt", fontWeight: "bold", textAlign: "center", margin: "6px 0 10px 0" }
      },
      { type: "subtitle", value: "1. 인적 사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "상호 (단체명)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizName}", colSpan: 4, key: "bizName", align: "center" },
              { label: "전화번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizPhone}", colSpan: 4, key: "bizPhone", align: "center" }
            ]
          },
          {
            cells: [
              { label: "대표자 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", colSpan: 4, key: "name", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{delegatorRegNo}", colSpan: 4, key: "delegatorRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "사업장 소재지", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizAddr}", colSpan: 10, key: "bizAddr" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 사업장 현황" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "업 태 (주업종)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizType}", colSpan: 4, key: "bizType", align: "center" },
              { label: "종 목 (주업종)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizItem}", colSpan: 4, key: "bizItem", align: "center" }
            ]
          },
          {
            cells: [
              { label: "개업 년월일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{openingDate}", colSpan: 4, key: "openingDate", align: "center" },
              { label: "사업장 구분", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{rentDesc}", colSpan: 4, key: "rentDesc", align: "center", style: { fontSize: "8.5pt" } }
            ]
          },
          {
            cells: [
              { label: "서류송달장소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{deliveryAddr}", colSpan: 10, key: "deliveryAddr" }
            ]
          }
        ]
      },
      { type: "paragraph", value: "「부가가치세법」 제8조제1항 및 같은 법 시행령 제11조제1항에 따라 위와 같이 사업자등록을 신청합니다.", style: { fontSize: "8.5pt", textAlign: "center", margin: "6px 0 4px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "8.5pt", fontWeight: "bold", textAlign: "center", margin: "2px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "신청인 (대표자) : {name} (인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{company}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center", marginTop: "10px" } }
    ]
  },
  {
    id: "generic_gov_tax_cert",
    title: "납세증명 신청서",
    category: "재무",
    desc: "세무서 제출용 국세 및 지방세 체납내역 없음 확인을 청구하기 위한 대한민국 공식 납세증명서 발급 신청서입니다.",
    popular: true,
    tags: ["납세증명서", "국세청", "세무서", "세무/회계", "공공민원", "정부서식", "재무"],
    fields: [
      { key: "name", label: "신청인 성명 (상호)", type: "text", placeholder: "마음데이터 주식회사" },
      { key: "delegatorRegNo", label: "주민(사업자)등록번호", type: "text", placeholder: "120-81-00000" },
      { key: "delegatorAddr", label: "주소 (본점소재지)", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "bizPhone", label: "연락처", type: "text", placeholder: "010-1234-5678" },
      { key: "purpose", label: "용도 (사용 목적)", type: "text", placeholder: "공공기관 대금 수령용" },
      { key: "submission", label: "제출처", type: "text", placeholder: "마포구청" },
      { key: "qty", label: "신청 부수", type: "text", placeholder: "1부" },
      { key: "company", label: "수신 (세무서장 귀하)", type: "text", placeholder: "마포세무서장 귀하" },
      { key: "date", label: "신청 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      name: "마음데이터 주식회사 (대표자: 홍길동)",
      delegatorRegNo: "120-81-00000",
      delegatorAddr: "서울특별시 마포구 마포대로 14 (도화동)",
      bizPhone: "010-1234-5678 (대표전화)",
      purpose: "공공기관 IT 용역 계약 대금 청구 및 수령용",
      submission: "마포구청 재무과",
      qty: "1부",
      company: "마포세무서장 귀하",
      date: "",
      useApproval: false
    },
    layout: [
      { type: "paragraph", value: "■ 국세징수법 시행규칙 [별지 제1호서식]", style: { fontSize: "7.5pt", textAlign: "left", margin: "2px 0", color: "#333333" } },
      {
        type: "paragraph",
        value: "납 세 증 명 신 청 서",
        style: { fontSize: "14pt", fontWeight: "bold", textAlign: "center", margin: "8px 0 12px 0", letterSpacing: "4px" }
      },
      { type: "subtitle", value: "1. 신청인 인적사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성명 (상호)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", colSpan: 4, key: "name", align: "center" },
              { label: "주민(사업자)번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{delegatorRegNo}", colSpan: 4, key: "delegatorRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주소 (본점)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{delegatorAddr}", colSpan: 10, key: "delegatorAddr" }
            ]
          },
          {
            cells: [
              { label: "전화번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizPhone}", colSpan: 10, key: "bizPhone", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 신청 내용 및 용도" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "증명서 용도", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{purpose}", colSpan: 10, key: "purpose", align: "center" }
            ]
          },
          {
            cells: [
              { label: "제 출 처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{submission}", colSpan: 4, key: "submission", align: "center" },
              { label: "신청 부수", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{qty}", colSpan: 4, key: "qty", align: "center" }
            ]
          }
        ]
      },
      { type: "paragraph", value: "「국세징수법 시행령」 제6조에 따라 상기와 같이 납세증명서의 발급을 청구 및 신청합니다.", style: { fontSize: "8.5pt", textAlign: "center", margin: "6px 0 4px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "8.5pt", fontWeight: "bold", textAlign: "center", margin: "2px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "신청인 : {name} (인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{company}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center", marginTop: "10px" } }
    ]
  },
  // 17. 재직증명서
  {
    id: "employment_certificate",
    title: "재직증명서",
    category: "노무",
    desc: "근로자가 해당 회사에 소속되어 재직 중임을 공식적으로 증명하기 위해 인적사항, 소속, 재직기간 및 용도를 기재하는 필수 증명 양식입니다.",
    popular: true,
    tags: ["재직증명서", "인사", "노무", "증명서", "회사", "행정"],
    fields: [
      { key: "name", label: "성명", type: "text", placeholder: "홍길동" },
      { key: "birth", label: "주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "address", label: "주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "dept", label: "소속 부서", type: "text", placeholder: "경영기획실" },
      { key: "rank", label: "직위 / 직급", type: "text", placeholder: "대리" },
      { key: "duration", label: "재직 기간", type: "text", placeholder: "2023년 05월 01일 ~ 현재" },
      { key: "purpose", label: "사용 용도", type: "text", placeholder: "금융기관 제출용" },
      { key: "date", label: "작성/발급 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "company", label: "회사명", type: "text", placeholder: "마음데이터 주식회사" }
    ],
    initialValues: {
      name: "홍길동",
      birth: "900101-1234567",
      address: "서울특별시 마포구 마포대로 14",
      dept: "경영기획실",
      rank: "대리",
      duration: "2023년 05월 01일 ~ 현재",
      purpose: "금융기관 제출용",
      date: "",
      company: "마음데이터 주식회사",
      useApproval: true
    },
    layout: [
      { type: "title", value: "재 직 증 명 서" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", width: "30%", key: "name", align: "center" },
              { label: "주민등록번호", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{birth}", width: "30%", key: "birth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{address}", colSpan: 3, key: "address" }
            ]
          }
        ]
      },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "소 속", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dept}", width: "30%", key: "dept", align: "center" },
              { label: "직 위", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{rank}", width: "30%", key: "rank", align: "center" }
            ]
          },
          {
            cells: [
              { label: "재직 기간", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{duration}", colSpan: 3, key: "duration", align: "center" }
            ]
          },
          {
            cells: [
              { label: "용 도", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{purpose}", colSpan: 3, key: "purpose" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "상기와 같이 재직하고 있음을 증명합니다." },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "{company} 대표이사 김철수 (인)" }
    ]
  },
  // 18. 위임장
  {
    id: "power_of_attorney",
    title: "위임장",
    category: "행정",
    desc: "위임인이 대리인(수임인)에게 특정 행정 권한이나 업무 처리를 위임한다는 약정을 기록하는 표준 공인 위임 서식입니다.",
    popular: true,
    tags: ["위임장", "대리", "행정", "민원", "생활", "법률"],
    fields: [
      { key: "name", label: "위임인 성명", type: "text", placeholder: "홍길동" },
      { key: "birth", label: "위임인 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "address", label: "위임인 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "agentName", label: "대리인 성명", type: "text", placeholder: "장길산" },
      { key: "agentBirth", label: "대리인 생년월일", type: "text", placeholder: "1992년 05월 10일" },
      { key: "agentAddress", label: "대리인 주소", type: "text", placeholder: "경기도 김포시 김포대로 10" },
      { key: "relation", label: "위임인과의 관계", type: "text", placeholder: "직원" },
      { key: "content", label: "위임할 사항 및 범위", type: "textarea", placeholder: "예: 마포구청 민원 서류 신청 및 발급에 관한 일체의 권한" },
      { key: "date", label: "위임 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      name: "홍길동",
      birth: "900101-1234567",
      address: "서울특별시 마포구 마포대로 14",
      agentName: "장길산",
      agentBirth: "1992년 05월 10일",
      agentAddress: "경기도 김포시 김포대로 10",
      relation: "직원",
      content: "마포구청 민원 서류 신청 및 발급에 관한 일체의 권한 및 위임인 명의 법인 인감 확인의 건",
      date: "",
      useApproval: false
    },
    layout: [
      { type: "title", value: "위 임 장" },
      { type: "subtitle", value: "1. 위임인 (임명하는 사람)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", width: "30%", key: "name", align: "center" },
              { label: "주민등록번호", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{birth}", width: "30%", key: "birth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{address}", colSpan: 3, key: "address" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 수임인 (대리인)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agentName}", width: "30%", key: "agentName", align: "center" },
              { label: "생년월일", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agentBirth}", width: "30%", key: "agentBirth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agentAddress}", colSpan: 3, key: "agentAddress" }
            ]
          },
          {
            cells: [
              { label: "위임인과의 관계", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{relation}", colSpan: 3, key: "relation", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 위임할 상세 내역" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "위임 사항", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{content}", colSpan: 3, key: "content", style: { height: "90px", verticalAlign: "top" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "위임인은 수임인에게 상기 위임 대상 권한을 정히 위임합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "위임인 : {name} (인)" }
    ]
  },
  // 19. 합의서
  {
    id: "settlement_agreement",
    title: "합의서",
    category: "계약",
    desc: "사건이나 분쟁이 원만하게 종결되었음을 합의하고, 당사자(갑, 을) 간 보상 금액 및 향후 민형사상 이의 제기를 않겠다는 부제소 조항을 수록하는 합의 규격 양식입니다.",
    popular: true,
    tags: ["합의서", "합의", "계약", "법률", "사건", "화해"],
    fields: [
      { key: "title", label: "합의 사건명", type: "text", placeholder: "교통사고 피해 보상 및 화해의 건" },
      { key: "summary", label: "사건 개요 / 설명", type: "textarea", placeholder: "2026년 06월 10일 서울 마포구 인근에서 발생한..." },
      { key: "amount", label: "합의 금액", type: "text", placeholder: "일금 삼백만원 정 (₩3,000,000)" },
      { key: "payMethod", label: "지급 방법 / 계좌", type: "text", placeholder: "합의서 작성 당일 지정 계좌로 송금" },
      { key: "firstParty", label: "당사자 (갑) 성명", type: "text", placeholder: "김철수" },
      { key: "secondParty", label: "당사자 (을) 성명", type: "text", placeholder: "홍길동" },
      { key: "date", label: "합의 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      title: "교통사고 피해 보상 및 화해의 건",
      summary: "2026년 06월 10일 서울특별시 마포구 마포대로 14 인근 도로에서 발생한 차량 간 접촉 사고와 관련하여, 피해자(을)의 대인/대물 피해 복구 보상 건에 대해 당사자 간 합의를 체결함.",
      amount: "일금 삼백만원 정 (₩3,000,000)",
      payMethod: "2026년 06월 16일 은행 지정 계좌(국민은행 123-456-7890)로 송금 완료",
      firstParty: "김철수",
      secondParty: "홍길동",
      date: "",
      useApproval: false
    },
    layout: [
      { type: "title", value: "합 의 서" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "사 건 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{title}", colSpan: 3, key: "title", bold: true }
            ]
          },
          {
            cells: [
              { label: "사건 개요", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{summary}", colSpan: 3, key: "summary", style: { height: "70px", verticalAlign: "top" } }
            ]
          }
        ]
      },
      { type: "subtitle", value: "합의 조건 및 이행 방법" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "합의 금액", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{amount}", colSpan: 3, key: "amount", bold: true, align: "center" }
            ]
          },
          {
            cells: [
              { label: "지급 방법", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{payMethod}", colSpan: 3, key: "payMethod" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "위 당사자(갑, 을)는 상기 사건에 대하여 상호 원만히 합의를 하였으며, 피해자는 합의금 수령과 동시에 가해자의 처벌을 원치 않으며, 향후 이에 대한 어떠한 민·형사상의 이의도 제기하지 않을 것을 서약합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      {
        type: "table",
        style: { border: "none" },
        rows: [
          {
            cells: [
              { label: "갑 (가해자) : {firstParty} (인)", width: "50%", key: "firstParty", style: { border: "none", fontSize: "10pt" } },
              { label: "을 (피해자) : {secondParty} (인)", width: "50%", key: "secondParty", style: { border: "none", fontSize: "10pt" } }
            ]
          }
        ]
      }
    ]
  },
  // 20. 비밀유지계약서 (NDA)
  {
    id: "generic_nda",
    title: "비밀유지계약서",
    category: "계약",
    desc: "기업 간 비즈니스 협력 및 제휴 검토 과정에서 제공되는 상호 비밀정보를 규정하고, 무단 누출 시의 배상 책임을 명시하는 표준 비밀유지 약정서입니다.",
    popular: true,
    tags: ["비밀유지", "NDA", "계약", "협약", "보안", "법률"],
    fields: [
      { key: "firstParty", label: "정보제공자 (갑) 상호", type: "text", placeholder: "마음데이터 주식회사" },
      { key: "firstCEO", label: "갑 대표이사 성명", type: "text", placeholder: "김철수" },
      { key: "firstAddr", label: "갑 본점 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "secondParty", label: "정보수령자 (을) 상호", type: "text", placeholder: "디지털파트너스 주식회사" },
      { key: "secondCEO", label: "을 대표이사 성명", type: "text", placeholder: "이영희" },
      { key: "secondAddr", label: "을 본점 주소", type: "text", placeholder: "서울특별시 강남구 테헤란로 100" },
      { key: "purpose", label: "계약 목적 및 업무 범위", type: "text", placeholder: "양사 간 신규 인공지능 플랫폼 공동 연구 및 비즈니스 협력 모델 검토" },
      { key: "period", label: "비밀유지 기간", type: "text", placeholder: "본 계약 체결일로부터 3년간" },
      { key: "compensation", label: "위반 시 위약금", type: "text", placeholder: "일천만원 (₩10,000,000)" },
      { key: "date", label: "계약 체결 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      firstParty: "마음데이터 주식회사",
      firstCEO: "김철수",
      firstAddr: "서울특별시 마포구 마포대로 14",
      secondParty: "디지털파트너스 주식회사",
      secondCEO: "이영희",
      secondAddr: "서울특별시 강남구 테헤란로 100",
      purpose: "양사 간 신규 인공지능 플랫폼 공동 연구 및 비즈니스 협력 모델 검토의 건",
      period: "본 계약 체결일로부터 3년간",
      compensation: "일금 일천만원 정 (₩10,000,000)",
      date: "",
      useApproval: false
    },
    layout: [
      { type: "title", value: "비 밀 유 지 계 약 서" },
      { type: "spacer" },
      { type: "paragraph", value: "정보제공자 {firstParty} (이하 \"갑\")와 정보수령자 {secondParty} (이하 \"을\")는 상호 간의 비즈니스 협력과 관련하여 신뢰를 바탕으로 취득한 비밀정보를 보호하고자 다음과 같이 계약을 체결한다." },
      { type: "subtitle", value: "제1조 (목적)" },
      { type: "paragraph", value: "본 계약은 양사 간 \"{purpose}\"을(를) 위한 협의 과정에서 제공되는 제반 비밀정보의 누설과 오용을 방지하고 상호 비밀유지 의무를 정함을 목적으로 한다." },
      { type: "subtitle", value: "제2조 (비밀정보의 유지 및 보호)" },
      { type: "paragraph", value: "\"을\"은 \"갑\"으로부터 서면, 구두, 또는 전자적 수단으로 제공받은 모든 기술 및 영업상 비밀정보를 본 계약의 목적 외의 용도로 사용하여서는 아니 되며, 철저히 비밀로 유지하여야 한다." },
      { type: "subtitle", value: "제3조 (유효 기간)" },
      { type: "paragraph", value: "본 계약에 따른 비밀유지 의무는 계약 체결일로부터 \"{period}\" 동안 효력을 유지하며, 유효기간 경과 후에도 상대방의 서면 동의 없이는 비밀을 누설할 수 없다." },
      { type: "subtitle", value: "제4조 (손해배상)" },
      { type: "paragraph", value: "어느 일방이 본 계약상의 의무를 위반하여 상대방에게 손해를 입힌 경우, 그 위반 당사자는 위약금으로 \"{compensation}\"을(를) 지급하고 상대방에게 발생한 제반 손해를 전액 배상할 책임을 진다." },
      { type: "spacer" },
      { type: "paragraph", value: "본 계약의 성립을 증명하기 위해 계약서 2부를 작성하여 갑과 을이 기명날인 후 각각 1부씩 보관한다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      {
        type: "table",
        style: { border: "none" },
        rows: [
          {
            cells: [
              { label: "갑 (정보제공자)\n상호: {firstParty}\n주소: {firstAddr}\n대표: {firstCEO} (인)", width: "50%", style: { border: "none", fontSize: "10pt", whiteSpace: "pre-line" } },
              { label: "을 (정보수령자)\n상호: {secondParty}\n주소: {secondAddr}\n대표: {secondCEO} (인)", width: "50%", style: { border: "none", fontSize: "10pt", whiteSpace: "pre-line" } }
            ]
          }
        ]
      }
    ]
  },
  // 21. 동업계약서
  {
    id: "generic_memorandum",
    title: "동업계약서",
    category: "계약",
    desc: "공동의 목적을 실현하기 위해 상호 협력하여 사업을 경영하고, 출자 비율에 따른 권리, 책임, 수익 분배 방안을 명확히 정의하는 동업 표준계약서입니다.",
    popular: true,
    tags: ["동업", "동업계약", "계약", "공동사업", "스타트업"],
    fields: [
      { key: "businessName", label: "공동 사업명", type: "text", placeholder: "마음데이터 카페 공동 창업" },
      { key: "firstParty", label: "동업자 (갑) 성명", type: "text", placeholder: "김철수" },
      { key: "firstBirth", label: "갑 주민등록번호", type: "text", placeholder: "750101-1234567" },
      { key: "firstAddr", label: "갑 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "firstInvest", label: "갑 출자 금액", type: "text", placeholder: "오천만원 (₩50,000,000)" },
      { key: "secondParty", label: "동업자 (을) 성명", type: "text", placeholder: "이영희" },
      { key: "secondBirth", label: "을 주민등록번호", type: "text", placeholder: "800202-2345678" },
      { key: "secondAddr", label: "을 주소", type: "text", placeholder: "서울특별시 서초구 서초대로 50" },
      { key: "secondInvest", label: "을 출자 금액", type: "text", placeholder: "오천만원 (₩50,000,000)" },
      { key: "profitRatio", label: "이익 및 손실 분배 비율", type: "text", placeholder: "갑 50% : 을 50%" },
      { key: "date", label: "동업 계약 체결일", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      businessName: "마음데이터 카페 공동 창업 및 운영",
      firstParty: "김철수",
      firstBirth: "750101-1234567",
      firstAddr: "서울특별시 마포구 마포대로 14",
      firstInvest: "일금 오천만원 정 (₩50,000,000) 현금 출자",
      secondParty: "이영희",
      secondBirth: "800202-2345678",
      secondAddr: "서울특별시 서초구 서초대로 50",
      secondInvest: "일금 오천만원 정 (₩50,000,000) 현금 출자",
      profitRatio: "이익금 및 발생 손실 모두 갑 50%, 을 50%의 비율로 균등하게 분배 및 분담함",
      date: "",
      useApproval: false
    },
    layout: [
      { type: "title", value: "동 업 계 약 서" },
      { type: "spacer" },
      { type: "paragraph", value: "동업자 김철수 (이하 \"갑\")와 동업자 이영희 (이하 \"을\")는 공동으로 추진하는 사업 \"{businessName}\"(이하 \"공동사업\")을 공동 경영하기로 합의하고 다음과 같이 계약을 체결한다." },
      { type: "subtitle", value: "제1조 (목적)" },
      { type: "paragraph", value: "본 계약은 \"갑\"과 \"을\"이 신의성실의 원칙에 따라 공동사업을 원활히 추진 및 운영하기 위한 출자, 업무 분담, 지분 등 필요한 약정 사항을 정함을 목적으로 한다." },
      { type: "subtitle", value: "제2조 (출자 및 지분)" },
      { type: "paragraph", value: "1. \"갑\"은 공동사업의 개시를 위해 \"{firstInvest}\"을(를) 출자한다.\n2. \"을\"은 공동사업의 개시를 위해 \"{secondInvest}\"을(를) 출자한다.\n3. 출자 금액에 따른 지분 비율은 양사 간의 실질 출자 기여도를 반영하여 균등하게 배분한다." },
      { type: "subtitle", value: "제3조 (손익 분배)" },
      { type: "paragraph", value: "공동사업의 운영으로 발생하는 영업 이익 및 발생한 손실은 당사자 간의 사전에 약정된 배분안 \"{profitRatio}\"에 의거하여 분배 및 분담한다." },
      { type: "subtitle", value: "제4조 (의사결정 및 업무 집행)" },
      { type: "paragraph", value: "공동사업과 관련된 중요한 사업 방향의 결정, 신규 예산 지출, 고용 계약 등 주요 사안은 갑과 을 전원의 서면 합의로 결정하고, 실무 업무는 공동 분담하여 수행한다." },
      { type: "spacer" },
      { type: "paragraph", value: "본 계약을 증명하기 위해 계약서 2부를 작성하여 갑과 을이 기명날인 후 1부씩 보관한다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      {
        type: "table",
        style: { border: "none" },
        rows: [
          {
            cells: [
              { label: "동업자 (갑)\n성명: {firstParty}\n주소: {firstAddr}\n서명: (인)", width: "50%", style: { border: "none", fontSize: "10pt", whiteSpace: "pre-line" } },
              { label: "동업자 (을)\n성명: {secondParty}\n주소: {secondAddr}\n서명: (인)", width: "50%", style: { border: "none", fontSize: "10pt", whiteSpace: "pre-line" } }
            ]
          }
        ]
      }
    ]
  },
  // 22. 용역 표준계약서
  {
    id: "generic_partnership",
    title: "용역 표준계약서",
    category: "계약",
    desc: "발주처와 수행사 간에 이루어지는 용역 과업의 명세, 용역 금액, 검수 일정 및 결과물 인도 절차를 투명하게 합의하는 표준 비즈니스 용역 계약서입니다.",
    popular: true,
    tags: ["용역계약", "표준계약서", "외주", "프리랜서", "계약", "비즈니스"],
    fields: [
      { key: "client", label: "발주사 (갑) 상호", type: "text", placeholder: "마음데이터 주식회사" },
      { key: "clientCEO", label: "갑 대표자 성명", type: "text", placeholder: "김철수" },
      { key: "clientAddr", label: "갑 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "provider", label: "용역수행사 (을) 상호", type: "text", placeholder: "개발컴퍼니 주식회사" },
      { key: "providerCEO", label: "을 대표자 성명", type: "text", placeholder: "이영희" },
      { key: "providerAddr", label: "을 주소", type: "text", placeholder: "경기도 성남시 분당구 판교역로 20" },
      { key: "taskName", label: "용역 과업명", type: "text", placeholder: "인공지능 대시보드 UI/UX 설계 및 개발" },
      { key: "taskScope", label: "용역 과업 범위", type: "textarea", placeholder: "화면 설계안 10종 및 프론트엔드 연동 퍼블리싱 코드 납품" },
      { key: "period", label: "용역 수행 기간", type: "text", placeholder: "2026년 07월 01일 ~ 2026년 08월 31일" },
      { key: "paymentAmt", label: "총 용역 대금", type: "text", placeholder: "일천만원 (₩10,000,000)" },
      { key: "paymentTerms", label: "대금 지급 조건", type: "text", placeholder: "계약금 30% 착수 시 지급, 잔금 70% 최종 납품 검수 완료 후 지급" },
      { key: "date", label: "계약 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      client: "마음데이터 주식회사",
      clientCEO: "김철수",
      clientAddr: "서울특별시 마포구 마포대로 14",
      provider: "개발컴퍼니 주식회사",
      providerCEO: "이영희",
      providerAddr: "경기도 성남시 분당구 판교역로 20",
      taskName: "인공지능 대시보드 UI/UX 설계 및 웹 개발",
      taskScope: "1. 기획 설계 및 화면 정의서 10종\n2. React 기반의 프론트엔드 UI 컴포넌트 개발 코드 일체\n3. 최종 결과물의 웹 테스트 완료 보고서",
      period: "2026년 07월 01일 ~ 2026년 08월 31일",
      paymentAmt: "일금 일천만원 정 (₩10,000,000) (부가가치세 별도)",
      paymentTerms: "계약 시 착수금 일금 삼백만원(₩3,000,000)을 지급하며, 최종 과업 검수가 완료된 후 7일 이내에 잔금 일금 칠백만원(₩7,000,000)을 현금 송금한다.",
      date: "",
      useApproval: false
    },
    layout: [
      { type: "title", value: "용 역 표 준 계 약 서" },
      { type: "spacer" },
      { type: "paragraph", value: "발주사 {client} (이하 \"갑\")와 수행사 {provider} (이하 \"을\")는 상기 과업명에 관한 용역 위탁 계약을 신의성실 원칙에 입각하여 다음과 같이 체결한다." },
      { type: "subtitle", value: "1. 용역 과업 개요" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "용 역 과 업 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{taskName}", colSpan: 3, key: "taskName" }
            ]
          },
          {
            cells: [
              { label: "용 역 기 간", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{period}", colSpan: 3, key: "period", align: "center" }
            ]
          },
          {
            cells: [
              { label: "과 업 범 위", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{taskScope}", colSpan: 3, key: "taskScope", style: { height: "70px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 용역 대금 및 지급 조건" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "총 용역 대금", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{paymentAmt}", colSpan: 3, key: "paymentAmt", bold: true }
            ]
          },
          {
            cells: [
              { label: "지급 방법 / 시기", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{paymentTerms}", colSpan: 3, key: "paymentTerms" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 결과물 검수 및 소유권" },
      { type: "paragraph", value: "\"을\"은 용역 기간 내 결과물을 최종 제출하며, \"갑\"은 5일 이내 검수를 마친다. 용역 대금이 완납된 시점부터 납품된 결과물의 지식재산권은 \"갑\"에게 귀속된다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      {
        type: "table",
        style: { border: "none" },
        rows: [
          {
            cells: [
              { label: "갑 (발주사)\n상호: {client}\n주소: {clientAddr}\n대표자: {clientCEO} (인)", width: "50%", style: { border: "none", fontSize: "10pt", whiteSpace: "pre-line" } },
              { label: "을 (수행사)\n상호: {provider}\n주소: {providerAddr}\n대표자: {providerCEO} (인)", width: "50%", style: { border: "none", fontSize: "10pt", whiteSpace: "pre-line" } }
            ]
          }
        ]
      }
    ]
  },
  // 23. 기밀유지서약서 (개인용)
  {
    id: "generic_personal_nda",
    title: "기밀유지서약서 (개인용)",
    category: "노무",
    desc: "신규 입사자 또는 재직자가 회사의 기술 및 영업 정보를 철저히 비밀로 유지하고, 퇴사 이후에도 무단 사용 및 제3자 제공을 하지 않음을 서약하는 양식입니다.",
    popular: true,
    tags: ["비밀유지", "서약서", "보안서약", "노무", "회사", "보안"],
    fields: [
      { key: "name", label: "서약자 성명", type: "text", placeholder: "홍길동" },
      { key: "birth", label: "주민등록번호 앞자리", type: "text", placeholder: "900101-1234567" },
      { key: "address", label: "서약자 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "dept", label: "소속 부서", type: "text", placeholder: "기술개발팀" },
      { key: "rank", label: "직급", type: "text", placeholder: "대리" },
      { key: "company", label: "서약 회사명 (귀하)", type: "text", placeholder: "마음데이터 주식회사" },
      { key: "targetSecrets", label: "서약 대상 비밀 범위", type: "textarea", placeholder: "회사의 마케팅 계획, 소스코드, 고객 데이터베이스, 인공지능 모형 가중치 등" },
      { key: "date", label: "서약 작성 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      name: "홍길동",
      birth: "900101-1234567",
      address: "서울특별시 마포구 마포대로 14",
      dept: "기술개발팀",
      rank: "대리",
      company: "마음데이터 주식회사 대표이사 귀하",
      targetSecrets: "1. 회사가 보유한 웹 서비스 소스코드 및 데이터베이스 스키마 정보\n2. 마케팅 기획안, 재무 실적 통계 및 고객 정보\n3. 회사가 특허 출원 중이거나 독점적으로 운영하는 알고리즘 모형 데이터",
      date: "",
      useApproval: false
    },
    layout: [
      { type: "title", value: "기 밀 유 지 서 약 서" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", width: "30%", key: "name", align: "center" },
              { label: "주민등록번호", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{birth}", width: "30%", key: "birth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "소 속", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dept}", width: "30%", key: "dept", align: "center" },
              { label: "직 급", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{rank}", width: "30%", key: "rank", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{address}", colSpan: 3, key: "address" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "서약인은 귀사에서 근무하는 기간 및 퇴직 이후에도 아래 기재된 모든 약정 내용을 성실히 준수하며 비밀 준수 의무를 이행할 것을 강력히 서약합니다." },
      { type: "subtitle", value: "서 약 사 항" },
      { type: "paragraph", value: "1. 서약인은 재직 중 알게 된 회사의 제반 기밀 사항(이하 \"기밀정보\")이 회사 고유의 유산이며 지식재산임을 명확히 인지한다.\n2. 서약인은 아래 명시된 중요 영업 및 기술 기밀 범위를 무단 소지, 제3자 유출, 또는 개인적 용도로 사용하지 아니한다.\n\n[기밀 준수 대상 범위]\n{targetSecrets}\n\n3. 본 약정을 위반하여 회사에 직간접적 손해를 입힌 경우 서약인은 관련 민·형사상 법적 책임 및 회사 규정에 따른 징계를 전적으로 수용한다." },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "서약인 : {name} (인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{company}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },
  // 24. 경위서 / 시말서
  {
    id: "generic_written_apology",
    title: "경위서 (시말서)",
    category: "노무",
    desc: "사무 현장이나 영업소에서 발생한 사고나 과실의 명확한 사건 발생 경위를 정리하고 재발 방지에 관한 대책과 본인의 반성 의견을 공식 제출하는 양식입니다.",
    popular: true,
    tags: ["경위서", "시말서", "사고보고", "반성문", "노무", "회사행정"],
    fields: [
      { key: "dept", label: "소속 부서", type: "text", placeholder: "마케팅기획부" },
      { key: "rank", label: "직급", type: "text", placeholder: "대리" },
      { key: "name", label: "작성인 성명", type: "text", placeholder: "홍길동" },
      { key: "accidentDate", label: "과실 발생 일시", type: "text", placeholder: "2026년 06월 12일 14:00" },
      { key: "accidentPlace", label: "발생 장소", type: "text", placeholder: "마포 본사 3층 대회의실" },
      { key: "title", label: "사건 제목 (건명)", type: "text", placeholder: "광고 예산 결제 오류 및 시스템 오작동 건" },
      { key: "details", label: "발생 경위 및 상세 정황", type: "textarea", placeholder: "사건의 발생 원인, 진행 과정 등을 사실대로 기재하세요." },
      { key: "countermeasure", label: "반성 및 향후 대책", type: "textarea", placeholder: "재발 방지를 위한 행동 수칙 및 다짐을 기재하세요." },
      { key: "date", label: "경위서 작성 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "company", label: "수신 (제출처)", type: "text", placeholder: "마음데이터 주식회사 대표이사 귀하" }
    ],
    initialValues: {
      dept: "마케팅기획부",
      rank: "대리",
      name: "홍길동",
      accidentDate: "2026년 06월 12일 14:00경",
      accidentPlace: "마포 본사 3층 마케팅 회의실",
      title: "페이스북 정기 온라인 광고 예산 결제 금액 초과 지출의 건",
      details: "2026년 6월 12일 광고 관리자 페이지 내에서 일일 예산 설정값을 정비하는 과정에서, 대리인의 키보드 오타 입력으로 인해 설정 한도가 과잉 세팅되어 당초 예산이었던 500,000원 대비 2,000,000원이 초과하여 결제 및 지출되는 실수가 발생하였습니다.",
      countermeasure: "차후에는 광고비 지출 설정을 마친 후 즉시 부서장과의 이중 확인 절차를 거치겠으며, 시스템 설정 모듈 내 정기 모니터링 체크리스트를 준수하여 동종의 오입력 사고가 재발하지 않도록 각별히 유의하겠습니다.",
      date: "",
      company: "마음데이터 주식회사 대표이사 귀하",
      useApproval: true
    },
    layout: [
      { type: "title", value: "경 위 서" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "소 속", width: "15%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dept}", width: "35%", key: "dept", align: "center" },
              { label: "직 급 / 성 명", width: "15%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{rank}  {name}", width: "35%", key: "name", align: "center" }
            ]
          },
          {
            cells: [
              { label: "발생 일시", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{accidentDate}", key: "accidentDate", align: "center" },
              { label: "발생 장소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{accidentPlace}", key: "accidentPlace", align: "center" }
            ]
          },
          {
            cells: [
              { label: "사건 건명", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{title}", colSpan: 3, key: "title", bold: true }
            ]
          }
        ]
      },
      { type: "subtitle", value: "사건 발생 경위" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{details}", colSpan: 4, key: "details", style: { height: "100px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "subtitle", value: "재발 방지책 및 반성의견" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{countermeasure}", colSpan: 4, key: "countermeasure", style: { height: "70px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "본인은 상기 발생한 업무 실책에 대하여 그 원인 및 정황을 숨김없이 기재하였으며, 귀사 사규에 따른 처분을 감수하며 이에 재발 방지를 다짐하는 경위서를 정히 제출합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "제출인 : {name} (인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{company}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },
  // 25. 지출결의서
  {
    id: "generic_expense_resolution",
    title: "지출결의서",
    category: "재무",
    desc: "회사 내부 예산의 지출을 결재받기 위해 사용하며, 발의부서 및 목적, 지출 목록 및 총금액을 명확하게 파악할 수 있는 재무 표준 서식입니다.",
    popular: true,
    tags: ["지출결의서", "재무", "회계", "영수증", "지출결정", "회사비용"],
    fields: [
      { key: "dept", label: "기안 부서", type: "text", placeholder: "경영기획실" },
      { key: "requester", label: "발의자 성명", type: "text", placeholder: "홍길동" },
      { key: "requestDate", label: "발의/상신 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "totalAmount", label: "결의 총금액", type: "text", placeholder: "150,000" },
      { key: "subject", label: "지출 과목 / 성격", type: "text", placeholder: "도서 인쇄비 및 사무 비품비" },
      { key: "payMethod", label: "지급 방법", type: "select", options: ["법인카드 결제", "계좌 이체", "현금 지급"] },
      { key: "description", label: "상세 지출 내역 및 목적", type: "textarea", placeholder: "예: 신규 프로젝트 수행용 참고 도서 3권 구매 및 사무용 펜 등 문구류 대금" }
    ],
    initialValues: {
      dept: "경영기획실",
      requester: "홍길동",
      requestDate: "",
      totalAmount: "일금 일십오만원 정 (₩150,000)",
      subject: "사무용 소모품비 및 참고 도서 인쇄비",
      payMethod: "법인카드 결제",
      description: "1. 참고 도서: '실무 데이터 사이언스 입문' 외 2권 구입 (₩90,000)\n2. 소모품비: 개발실용 필기구 및 복사용지 A4 2박스 구입 (₩60,000)\n\n※ 관련 세금계산서 및 영수증 증빙은 기안 문서 뒤에 첨부함.",
      date: "",
      useApproval: true
    },
    layout: [
      { type: "title", value: "지 출 결 의 서" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "발의 부서", width: "15%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dept}", width: "35%", key: "dept", align: "center" },
              { label: "발 의 자", width: "15%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{requester}", width: "35%", key: "requester", align: "center" }
            ]
          },
          {
            cells: [
              { label: "발의 일자", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{requestDate}", key: "requestDate", align: "center" },
              { label: "지급 방법", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{payMethod}", key: "payMethod", align: "center" }
            ]
          },
          {
            cells: [
              { label: "계정 과목", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{subject}", colSpan: 3, key: "subject" }
            ]
          },
          {
            cells: [
              { label: "결의 금액", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{totalAmount}", colSpan: 3, key: "totalAmount", bold: true, align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "상세 지출 내역" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{description}", colSpan: 4, key: "description", style: { height: "130px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "상기와 같이 업무 관련 소요 비용에 대한 지출 결의를 상신하오니 정히 결재하여 주시기 바랍니다." },
      { type: "paragraph", value: "{requestDate}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "기안자 : {requester} (인)" }
    ]
  },
  // 26. 탄원서
  {
    id: "generic_petition",
    title: "탄원서",
    category: "행정",
    desc: "개인이나 단체의 억울한 사정을 진술하고, 피탄원인의 선처 및 형사처벌 감경 등을 사법기관에 호소하기 위해 정중한 격식으로 작성하는 문서입니다.",
    popular: true,
    tags: ["탄원서", "선처호소", "법원제출", "경감신청", "생활행정", "법률"],
    fields: [
      { key: "petitionerName", label: "탄원인 성명", type: "text", placeholder: "김덕배" },
      { key: "petitionerBirth", label: "탄원인 생년월일", type: "text", placeholder: "1972년 04월 15일" },
      { key: "petitionerAddr", label: "탄원인 주소", type: "text", placeholder: "서울특별시 강동구 천호대로 55" },
      { key: "petitionerPhone", label: "탄원인 연락처", type: "text", placeholder: "010-9876-5432" },
      { key: "defendantName", label: "피탄원인 (선처대상자)", type: "text", placeholder: "홍길동" },
      { key: "relationship", label: "피탄원인과의 관계", type: "text", placeholder: "직장 상사 및 오랜 지인" },
      { key: "title", label: "탄원 사건 제목", type: "text", placeholder: "피고인 홍길동의 음주운전 사고 선처에 관한 탄원" },
      { key: "content", label: "탄원 이유 및 호소 내용", type: "textarea", placeholder: "피탄원인의 평소 성품, 과실에 대한 반성 여부, 처벌 시 발생할 가정의 곤경 등을 상세히 기술하세요." },
      { key: "date", label: "탄원 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "recipient", label: "제출처 (수신)", type: "text", placeholder: "서울중앙지방법원 판사님 귀하" }
    ],
    initialValues: {
      petitionerName: "김덕배",
      petitionerBirth: "1972년 04월 15일",
      petitionerAddr: "서울특별시 강동구 천호대로 55",
      petitionerPhone: "010-9876-5432",
      defendantName: "홍길동",
      relationship: "피탄원인의 직장 부서장 (소속 회사 동료)",
      title: "피탄원인 홍길동에 대한 형사 처벌 감경을 바라는 탄원",
      content: "피탄원인 홍길동은 평소 성실하고 주변의 신망이 두터운 동료입니다. 본 사건 발생 이후 깊이 반성하고 있으며, 피해자와도 원만히 합의를 이행하였습니다. 현재 피탄원인은 한 가정의 생계를 전담하고 있어 만약 구금에 이르게 된다면 생계에 중대한 타격을 겪을 우려가 큽니다. 부디 정상을 참작하시어 피탄원인이 사회의 건전한 구성원으로 다시금 기여할 수 있도록 관대한 처분을 베풀어 주시길 앙망합니다.",
      date: "",
      recipient: "서울중앙지방법원 제3형사단독 판사님 귀하",
      useApproval: false
    },
    layout: [
      { type: "title", value: "탄 원 서" },
      { type: "subtitle", value: "1. 탄원인 및 피탄원인 정보" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "탄원인 성명", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{petitionerName}", width: "30%", key: "petitionerName", align: "center" },
              { label: "생년월일", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{petitionerBirth}", width: "30%", key: "petitionerBirth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "연 락 처", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{petitionerPhone}", key: "petitionerPhone", align: "center" },
              { label: "관계 (선처대상)", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{relationship}", key: "relationship", align: "center" }
            ]
          },
          {
            cells: [
              { label: "탄원인 주소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{petitionerAddr}", colSpan: 3, key: "petitionerAddr" }
            ]
          },
          {
            cells: [
              { label: "피탄원인(대상)", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{defendantName}", colSpan: 3, key: "defendantName", bold: true, align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 탄원 취지 및 탄원 사유" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "탄원 제목", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{title}", colSpan: 3, key: "title", bold: true }
            ]
          },
          {
            cells: [
              { label: "탄원 이유\n및 호소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{content}", colSpan: 3, key: "content", style: { height: "120px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "탄원인은 피탄원인에 대한 정상을 굽어살펴 주실 것을 앙망하며 연명으로 탄원서를 정히 제출합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "탄원인 : {petitionerName} (인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{recipient}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },
  // 27. 내용증명 (연체 및 계약해지)
  {
    id: "generic_certification_of_contents",
    title: "내용증명서",
    category: "행정",
    desc: "채무 연체 또는 임대 계약 위반에 대하여 법적인 독촉을 이행하고, 향후 해지 통보의 증거 자료로 확보하기 위해 작성하는 공식 내용증명 표준 서식입니다.",
    popular: true,
    tags: ["내용증명", "채무독촉", "임대차", "계약해지", "법률서식", "생활법률"],
    fields: [
      { key: "senderName", label: "발신인 성명 / 상호", type: "text", placeholder: "김철수" },
      { key: "senderAddr", label: "발신인 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "receiverName", label: "수신인 성명 / 상호", type: "text", placeholder: "홍길동" },
      { key: "receiverAddr", label: "수신인 주소", type: "text", placeholder: "서울특별시 영등포구 여의도동 5" },
      { key: "title", label: "내용증명 제목", type: "text", placeholder: "임대료 미납에 따른 연체금 독촉 및 계약 해지 통보의 건" },
      { key: "content", label: "구체적 독촉 및 통보 본문", type: "textarea", placeholder: "계약 사실, 위반 내역(미납 회차 및 금액), 미조치 시 법적 조치 경고 등을 조항 형태로 상세히 기술하세요." },
      { key: "deadline", label: "이행 기한", type: "text", placeholder: "2026년 06월 30일까지" },
      { key: "date", label: "발송 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      senderName: "김철수 (임대인)",
      senderAddr: "서울특별시 마포구 마포대로 14",
      receiverName: "홍길동 (임차인)",
      receiverAddr: "서울특별시 영등포구 여의도동 5 (여의도아파트 101동 202호)",
      title: "월 차임(임대료) 연체에 따른 독촉 및 임대차 계약 해지 통보",
      content: "1. 귀하와 발신인은 2025년 6월 15일 보증금 50,000,000원, 월 차임 1,500,000원으로 하는 임대차 계약을 체결하였습니다.\n2. 그러나 귀하는 현재 2026년 4월분 및 5월분의 월 차임 총 3,000,000원을 납부 기일이 경과하도록 입금하지 않고 있는 실정입니다.\n3. 이에 본 서면을 통해 임대료 입금을 최종 독촉하오니 아래 명시된 기일까지 연체된 금액을 정히 입금해 주시기 바랍니다.\n4. 만약 기한 내에 이행이 이루어지지 않을 경우, 민법 제640조에 의거하여 본 계약은 해지 통보되며 상가/주택 명도 및 연체금 청구 소송 등 즉각적인 법적 조치를 취할 것임을 알려드립니다.",
      deadline: "2026년 06월 30일 (기한 내 송금 요망)",
      date: "",
      useApproval: false
    },
    layout: [
      { type: "title", value: "내 용 증 명 서" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "발 신 인", width: "15%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{senderName}", width: "35%", key: "senderName", align: "center" },
              { label: "수 신 인", width: "15%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{receiverName}", width: "35%", key: "receiverName", align: "center" }
            ]
          },
          {
            cells: [
              { label: "발신 주소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{senderAddr}", colSpan: 3, key: "senderAddr" }
            ]
          },
          {
            cells: [
              { label: "수신 주소", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{receiverAddr}", colSpan: 3, key: "receiverAddr" }
            ]
          }
        ]
      },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "제   목", width: "15%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{title}", colSpan: 3, key: "title", bold: true }
            ]
          }
        ]
      },
      { type: "subtitle", value: "통 보 내 용" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{content}", colSpan: 4, key: "content", style: { height: "130px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          },
          {
            cells: [
              { label: "최종 이행기한", width: "20%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{deadline}", colSpan: 3, key: "deadline", bold: true, align: "center" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "본 우편은 차후 민형사상 증거 확보 및 공식 의사를 표시하기 위한 것이므로 조속한 조치와 합의를 기대합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "sign-block", value: "발신인 : {senderName} (인)" }
    ]
  },
  // 28. 사업제휴 제안서 (간이형)
  {
    id: "generic_business_proposal",
    title: "사업제휴제안서",
    category: "재무",
    desc: "타 기업에 사업 제휴 제안을 전달하고 기획 목적, 협력 내용 및 상세 실행 계획을 수록한 고품격 1페이지 제안 서식입니다.",
    popular: true,
    tags: ["제안서", "사업제휴", "제안", "비즈니스", "재무", "기획서"],
    fields: [
      { key: "proposer", label: "제안사 상호", type: "text", placeholder: "마음데이터 주식회사" },
      { key: "proposerCEO", label: "대표자 성명", type: "text", placeholder: "김철수" },
      { key: "contact", label: "담당자 연락처 / 메일", type: "text", placeholder: "gildong@maumdata.com" },
      { key: "proposalTitle", label: "제안서 제목", type: "text", placeholder: "빅데이터 기반 서식 플랫폼 공동 API 제휴 제안" },
      { key: "background", label: "제안 배경 및 필요성", type: "textarea", placeholder: "제안을 추진하게 된 계기 및 목적을 설명하세요." },
      { key: "details", label: "상세 제안 및 협력 내용", type: "textarea", placeholder: "협력 모델의 구조 및 역할 분담 등에 대해 기술하세요." },
      { key: "expectedEffect", label: "제안 기대 효과", type: "textarea", placeholder: "제휴를 통해 양사가 얻게 되는 시너지 효과 및 가치를 기술하세요." },
      { key: "date", label: "제안 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      proposer: "마음데이터 주식회사",
      proposerCEO: "김철수",
      contact: "홍길동 팀장 (010-1234-5678, gildong@maumdata.com)",
      proposalTitle: "인공지능 기반 오피스 서식 조판 기술 공동 제약 및 API 연동 제휴",
      background: "현재 문서 자동화 시장의 급격한 성장에 따라 정형화된 행정 및 비즈니스 서식에 대한 기업들의 수요가 증가하고 있습니다. 이에 본 제안사는 고도화된 동적 서식 조판 기술을 귀사의 서비스에 내재화하여 이용자의 편의성을 도모하고자 합니다.",
      details: "1. 마음데이터의 서식 설계 API 엔진을 귀사 포털 사이트에 임베딩 방식으로 연동\n2. 사용자별 맞춤형 실무 서식 100종의 템플릿 실시간 스트리밍 제공\n3. 사용료 결제 시스템의 연동 및 수익 5:5 배분 쉐어 모델 구축",
      expectedEffect: "1. 귀사 고객의 문서 작업 소요 시간을 80% 이상 획기적으로 절감\n2. 신규 트래픽 유입 및 월정액 서식 구독 비즈니스를 통한 공동 영업 이익 창출\n3. 고품격 인쇄 출력 기능을 제공함으로써 오피스 브랜드 신뢰도 제고",
      date: "",
      useApproval: true
    },
    layout: [
      { type: "title", value: "사 업 제 휴 제 안 서" },
      { type: "spacer" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "제 안 사", width: "15%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{proposer}", width: "35%", key: "proposer", align: "center" },
              { label: "대 표 자", width: "15%", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{proposerCEO}", width: "35%", key: "proposerCEO", align: "center" }
            ]
          },
          {
            cells: [
              { label: "제안 제목", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{proposalTitle}", colSpan: 3, key: "proposalTitle", bold: true }
            ]
          },
          {
            cells: [
              { label: "제안 문의", bold: true, align: "center", bg: "#f9fafb" },
              { label: "{contact}", colSpan: 3, key: "contact" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "1. 제안 배경 및 추진 목적" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{background}", colSpan: 4, key: "background", style: { height: "70px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 주요 제안 내용" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{details}", colSpan: 4, key: "details", style: { height: "80px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 기대 효과" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{expectedEffect}", colSpan: 4, key: "expectedEffect", style: { height: "75px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "본 사업 제안에 대하여 검토 후 연락을 주시면 성실히 협의에 임하겠습니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "11pt", fontWeight: "bold", textAlign: "center" } },
      { type: "sign-block", value: "{proposer} 대표이사 {proposerCEO} (인)" }
    ]
  },
  // 29. 인감증명서 발급 위임장 (정부 공식 별지 제13호 서식)
  {
    id: "generic_gov_seal_attorney",
    title: "위임장 (인감증명서 발급용)",
    category: "행정",
    desc: "대한민국 인감증명법 시행령 별지 제13호 서식에 따라 본인을 대신하여 대리인이 인감증명서를 신청 및 발급받을 수 있도록 지정 위임하는 정부 법정 표준 서식입니다.",
    popular: true,
    tags: ["인감증명", "위임장", "정부서식", "행정", "민원", "주민센터", "법률"],
    fields: [
      { key: "delegatorName", label: "위임인 성명", type: "text", placeholder: "홍길동" },
      { key: "delegatorRegNo", label: "위임인 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "delegatorNationality", label: "위임인 국적", type: "text", placeholder: "대한민국" },
      { key: "delegatorAddr", label: "위임인 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "delegatorIdType", label: "위임인 신분증 종류", type: "text", placeholder: "주민등록증" },
      { key: "purpose", label: "용도", type: "text", placeholder: "부동산 매매 계약용" },
      { key: "qty", label: "발급통수", type: "text", placeholder: "1부" },
      { key: "agentName", label: "대리인 성명", type: "text", placeholder: "장길산" },
      { key: "agentRegNo", label: "대리인 주민등록번호", type: "text", placeholder: "920510-1234568" },
      { key: "agentAddr", label: "대리인 주소", type: "text", placeholder: "경기도 김포시 김포대로 10" },
      { key: "agentRelation", label: "위임인과의 관계", type: "text", placeholder: "직원" },
      { key: "reason", label: "위임 사유", type: "text", placeholder: "해외 출장 및 질병으로 인한 본인 방문 불가" },
      { key: "consentName", label: "동의인 성명", type: "text", placeholder: "김철수" },
      { key: "consentRegNo", label: "동의인 주민등록번호", type: "text", placeholder: "650101-1234567" },
      { key: "consentAddr", label: "동의인 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "consentRelation", label: "동의인 관계", type: "text", placeholder: "부 (법정대리인)" },
      { key: "consentQty", label: "동의인 발급통수", type: "text", placeholder: "1부" },
      { key: "consentSign", label: "동의인 날인", type: "text", placeholder: "(서명 또는 인)" },
      { key: "consentTarget", label: "동의 대상자 성명", type: "text", placeholder: "홍길동" },
      { key: "officerTitle", label: "교도관 직급/성명", type: "text", placeholder: "교도교사 박보검" },
      { key: "realEstateType", label: "부동산 종류", type: "text", placeholder: "아파트" },
      { key: "realEstateAddr", label: "부동산 소재지", type: "text", placeholder: "서울특별시 마포구 도화동 10" },
      { key: "taxOffice", label: "세무서명", type: "text", placeholder: "마포" },
      { key: "date", label: "위임 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      delegatorName: "홍길동",
      delegatorRegNo: "900101-1234567",
      delegatorNationality: "대한민국",
      delegatorAddr: "서울특별시 마포구 마포대로 14",
      delegatorIdType: "주민등록증",
      purpose: "부동산 매매 계약 및 금융거래용",
      qty: "1부",
      agentName: "장길산",
      agentRegNo: "920510-1234568",
      agentAddr: "경기도 김포시 김포대로 10",
      agentRelation: "직원 (위임인의 대리인)",
      reason: "해외 출장 일정으로 주민센터 방문 불가",
      consentName: "김철수",
      consentRegNo: "650101-1234567",
      consentAddr: "서울특별시 마포구 마포대로 14",
      consentRelation: "부 (법정대리인)",
      consentQty: "1부",
      consentSign: "(인)",
      consentTarget: "홍길동",
      officerTitle: "교도관 박보검",
      realEstateType: "상가 건물 (마음 빌딩)",
      realEstateAddr: "서울특별시 마포구 도화동 10-5",
      taxOffice: "마포",
      date: "",
      useApproval: false
    },
    layout: [
      { type: "paragraph", value: "■ 인감증명법 시행령 [별지 제13호서식] <개정 2020. 2. 18.>", style: { fontSize: "7.5pt", textAlign: "left", margin: "2px 0", color: "#333333" } },
      { type: "paragraph", value: "(앞쪽)", style: { fontSize: "7.5pt", textAlign: "right", margin: "-14px 0 2px 0", color: "#333333" } },
      {
        type: "paragraph",
        value: "☑ 인감증명서 발급 위임장 또는 미성년자의 법정대리인 · 한정후견인 및 성년후견인 동의서\n[  ] 재외공관 및 수감기관 확인서    [  ] 세무서(세무서장) 확인서",
        style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", whiteSpace: "pre-line", margin: "6px 0", border: "1.5px solid #000000", padding: "8px", lineHeight: 1.4, backgroundColor: "#f9fafb" }
      },
      {
        type: "paragraph",
        value: "※ 뒤쪽의 유의사항을 읽고 위임자 자필로 작성하기 바라며, 국적란은 재외공관에서 확인하는 경우에만 작성합니다.\n위임자가 사망한 경우 사망시점부터 인감증명을 대리 발급 신청하면 수사기관에 형사고발될 수 있습니다.",
        style: { fontSize: "7pt", textAlign: "left", whiteSpace: "pre-line", margin: "4px 0 6px 0", lineHeight: 1.3, color: "#e11d48" }
      },
      { type: "subtitle", value: "1. 인감증명서 발급 위임장 (위임자 및 대리인 정보)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "위임자", rowSpan: 3, colSpan: 1, bold: true, align: "center", bg: "#f9fafb" },
              { label: "성 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{delegatorName}", colSpan: 3, key: "delegatorName", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{delegatorRegNo}", colSpan: 4, key: "delegatorRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "국 적", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{delegatorNationality}", colSpan: 3, key: "delegatorNationality", align: "center" },
              { label: "주 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{delegatorAddr}", colSpan: 4, key: "delegatorAddr" }
            ]
          },
          {
            cells: [
              { label: "신분증 종류", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{delegatorIdType}", colSpan: 3, key: "delegatorIdType", align: "center" },
              { label: "용 도", colSpan: 1, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{purpose}", colSpan: 2, key: "purpose" },
              { label: "발급통수", colSpan: 1, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{qty}", colSpan: 2, key: "qty", align: "center" }
            ]
          },
          {
            cells: [
              { label: "대리인", rowSpan: 2, colSpan: 1, bold: true, align: "center", bg: "#f9fafb" },
              { label: "성 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agentName}", colSpan: 3, key: "agentName", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agentRegNo}", colSpan: 4, key: "agentRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agentAddr}", colSpan: 5, key: "agentAddr" },
              { label: "관 계", colSpan: 1, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agentRelation}", colSpan: 3, key: "agentRelation", align: "center" }
            ]
          },
          {
            cells: [
              { label: "위임 사유", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{reason}", colSpan: 9, key: "reason" }
            ]
          }
        ]
      },
      { type: "paragraph", value: "본인은 상기와 같은 사유로 인감증명서 발급을 위 대리인에게 위임합니다.", style: { fontSize: "8.5pt", textAlign: "center", margin: "4px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "8.5pt", fontWeight: "bold", textAlign: "center", margin: "2px 0" } },
      { type: "subtitle", value: "2. 법정대리인 동의서 (미성년자, 피한정후견인 등에 한함)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "동의인 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{consentName}", colSpan: 4, key: "consentName", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{consentRegNo}", colSpan: 4, key: "consentRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{consentAddr}", colSpan: 10, key: "consentAddr" }
            ]
          },
          {
            cells: [
              { label: "관계 (선처)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{consentRelation}", colSpan: 3, key: "consentRelation", align: "center" },
              { label: "발급통수", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{consentQty}", colSpan: 2, key: "consentQty", align: "center" },
              { label: "서명 / 날인", colSpan: 2, bold: true, align: "center", bg: "#f9fafb", style: { fontSize: "8pt" } },
              { label: "{consentSign}", colSpan: 1, key: "consentSign", align: "center" }
            ]
          }
        ]
      },
      { type: "paragraph", value: "({consentTarget}) 에 대한 인감증명서 발급을 동의합니다.", style: { fontSize: "8.5pt", textAlign: "center", margin: "4px 0" } },
      { type: "paragraph", value: "위의 위임(동의) 사실을 확인합니다.", style: { fontSize: "9pt", fontWeight: "bold", textAlign: "center", margin: "6px 0 2px 0" } },
      {
        type: "table",
        style: { marginBottom: "6px" },
        rows: [
          {
            cells: [
              { label: "[  ] 재외공관(영사관) 확인", colSpan: 6, bold: true, align: "left", bg: "#f9fafb" },
              { label: "(서명 또는 인)", colSpan: 6, align: "center" }
            ]
          },
          {
            cells: [
              { label: "[  ] 수감기관(교도관) 확인", colSpan: 6, bold: true, align: "left", bg: "#f9fafb" },
              { label: "{officerTitle}   (서명 또는 인)", colSpan: 6, key: "officerTitle", align: "center" }
            ]
          }
        ]
      },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "세무서장\n확인란\n(부동산매도용)", rowSpan: 2, colSpan: 2, bold: true, align: "center", bg: "#f9fafb", style: { fontSize: "8pt" } },
              { label: "부동산 종류", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{realEstateType}", colSpan: 8, key: "realEstateType", align: "center" }
            ]
          },
          {
            cells: [
              { label: "부동산 소재지", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{realEstateAddr}", colSpan: 8, key: "realEstateAddr" }
            ]
          }
        ]
      },
      { type: "paragraph", value: "위의 사항에 대하여 확인합니다.", style: { fontSize: "8.5pt", textAlign: "center", margin: "4px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "8.5pt", fontWeight: "bold", textAlign: "center", margin: "2px 0" } },
      {
        type: "table",
        style: { border: "none", marginTop: "4px" },
        rows: [
          {
            cells: [
              { label: "", colSpan: 4, style: { border: "none" } },
              { label: "{taxOffice} 세무서장", colSpan: 5, key: "taxOffice", style: { border: "none", fontSize: "13pt", fontWeight: "bold", textAlign: "right", paddingRight: "10px" } },
              { label: "직인", colSpan: 3, style: { border: "2px solid #ef4444", color: "#ef4444", fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", padding: "4px 6px", borderRadius: "2px", backgroundColor: "#fef2f2" } }
            ]
          }
        ]
      }
    ]
  },
  // 30. 전입신고서 (주민등록법 시행규칙 별지 제15호서식)
  {
    id: "generic_gov_move_in",
    title: "전입신고서 (세대주 직접 신고용)",
    category: "행정",
    desc: "주민등록법 시행규칙 별지 제15호서식에 따라 다른 거주지로 이동한 경우 관할 읍·면·동 행정복지센터에 거주지 이동 사실을 법적으로 알리기 위한 대한민국 정부 공식 전입 서식입니다.",
    popular: true,
    tags: ["전입신고", "동사무소", "행정", "민원", "정부서식", "주민등록"],
    fields: [
      { key: "applicantName", label: "신고인 성명", type: "text", placeholder: "홍길동" },
      { key: "applicantRegNo", label: "신고인 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "applicantPhone", label: "신고인 연락처", type: "text", placeholder: "010-1234-5678" },
      { key: "newAddr", label: "전입지 주소 (새 주소)", type: "text", placeholder: "서울특별시 마포구 마포대로 14 (도화동)" },
      { key: "newOwnerName", label: "전입지 세대주 성명", type: "text", placeholder: "홍길동" },
      { key: "newOwnerRelation", label: "전입지 세대주와의 관계", type: "text", placeholder: "본인" },
      { key: "oldAddr", label: "전출지 주소 (이전 주소)", type: "text", placeholder: "서울특별시 영등포구 여의도동 1" },
      { key: "oldOwnerName", label: "전출지 세대주 성명", type: "text", placeholder: "이몽룡" },
      { key: "moveReason", label: "전입 사유", type: "select", options: ["직업(취업/이직)", "주택(자가/임대)", "교육(진학/전학)", "가족(분가/합가)", "기타"] },
      { key: "movingMembers", label: "전입자 인적사항 (성명 / 생년월일 / 세대주와의 관계)", type: "textarea", placeholder: "예:\n1. 홍길동 / 1990.01.01 / 세대주(본인)\n2. 성춘향 / 1992.05.05 / 처" },
      { key: "date", label: "신고 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "company", label: "수신 관청 (읍·면·동장)", type: "text", placeholder: "도화동장 귀하" }
    ],
    initialValues: {
      applicantName: "홍길동",
      applicantRegNo: "900101-1234567",
      applicantPhone: "010-1234-5678",
      newAddr: "서울특별시 마포구 마포대로 14 (도화동, 마음아파트 101동 202호)",
      newOwnerName: "홍길동",
      newOwnerRelation: "본인 (세대주)",
      oldAddr: "서울특별시 영등포구 여의도동 1 (여의도빌라 301호)",
      oldOwnerName: "이몽룡",
      moveReason: "주택(자가/임대)",
      movingMembers: "1. 홍길동 / 1990.01.01 / 세대주(본인)\n2. 성춘향 / 1992.05.05 / 처\n3. 홍일동 / 2020.10.10 / 자",
      date: "",
      company: "도화동장 귀하",
      useApproval: false
    },
    layout: [
      { type: "paragraph", value: "■ 주민등록법 시행규칙 [별지 제15호서식] <개정 2021. 11. 1.>", style: { fontSize: "7.5pt", textAlign: "left", margin: "2px 0", color: "#333333" } },
      { type: "paragraph", value: "(앞쪽)", style: { fontSize: "7.5pt", textAlign: "right", margin: "-14px 0 2px 0", color: "#333333" } },
      { type: "title", value: "전 입 신 고 서" },
      { type: "paragraph", value: "※ [  ]에는 해당되는 곳에 ☑ 표시를 합니다. 뒤쪽의 작성방법 및 유의사항을 읽고 작성하시기 바랍니다.", style: { fontSize: "7pt", textAlign: "left", color: "#555", marginBottom: "6px" } },
      { type: "subtitle", value: "1. 신고인 정보" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "신고인 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{applicantName}", colSpan: 4, key: "applicantName", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{applicantRegNo}", colSpan: 4, key: "applicantRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "연 락 처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{applicantPhone}", colSpan: 10, key: "applicantPhone", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 주소지 변동 정보" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "새로 사는 곳\n(전입지)", rowSpan: 2, colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "주    소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{newAddr}", colSpan: 8, key: "newAddr" }
            ]
          },
          {
            cells: [
              { label: "세대주 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{newOwnerName}", colSpan: 3, key: "newOwnerName", align: "center" },
              { label: "세대주와 관계", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{newOwnerRelation}", colSpan: 3, key: "newOwnerRelation", align: "center" }
            ]
          },
          {
            cells: [
              { label: "전에 살던 곳\n(전출지)", rowSpan: 2, colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "주    소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{oldAddr}", colSpan: 8, key: "oldAddr" }
            ]
          },
          {
            cells: [
              { label: "세대주 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{oldOwnerName}", colSpan: 8, key: "oldOwnerName", align: "center" }
            ]
          },
          {
            cells: [
              { label: "전입 사유", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{moveReason}", colSpan: 10, key: "moveReason", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 전입자 인적사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성명 / 생년월일 / 세대주와의 관계", colSpan: 2, bold: true, align: "center", bg: "#f9fafb", style: { fontSize: "8.5pt" } },
              { label: "{movingMembers}", colSpan: 10, key: "movingMembers", style: { height: "110px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "주민등록법 제11조부터 제13조까지 및 제16조에 따라 위와 같이 신고합니다.", style: { fontSize: "8.5pt", textAlign: "center", margin: "4px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "신고인 : {applicantName} (서명 또는 인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{company}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },
  // 31. 표준 고소장 (수사기관 제출용)
  {
    id: "generic_gov_complaint",
    title: "표준 고소장",
    category: "행정",
    desc: "범죄 피해자가 수사기관(경찰청 또는 검찰청)에 피해 사실을 공식 신고하고 피고소인의 형사처벌을 정식으로 강력히 요구하는 사법 표준 고소 서식입니다.",
    popular: true,
    tags: ["고소장", "경찰서", "검찰청", "법률", "소장", "행정"],
    fields: [
      { key: "complainantName", label: "고소인 성명", type: "text", placeholder: "홍길동" },
      { key: "complainantRegNo", label: "고소인 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "complainantAddr", label: "고소인 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "complainantPhone", label: "고소인 연락처", type: "text", placeholder: "010-1234-5678" },
      { key: "complainantJob", label: "고소인 직업", type: "text", placeholder: "회사원" },
      { key: "accusedName", label: "피고소인 성명 (알 수 없으면 '성명불상')", type: "text", placeholder: "임꺽정" },
      { key: "accusedPhone", label: "피고소인 연락처", type: "text", placeholder: "010-9876-5432" },
      { key: "accusedAddr", label: "피고소인 주소", type: "text", placeholder: "서울특별시 영등포구 여의도동 5" },
      { key: "title", label: "고소 죄명 (제목)", type: "text", placeholder: "예: 정보통신망법 위반(명예훼손) 및 모욕의 건" },
      { key: "factDetails", label: "고소 취지 및 범죄 사실", type: "textarea", placeholder: "사건의 육하원칙에 따른 경위와 범죄 사실을 상세히 기재하세요." },
      { key: "evidence", label: "첨부 증거 자료 목록", type: "textarea", placeholder: "예:\n1. 모욕성 댓글 캡처 이미지 5부\n2. 피고소인과의 문자 메시지 대화 캡처 1부" },
      { key: "date", label: "고소 작성 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "recipient", label: "관할 수신처 (경찰서/검찰청)", type: "text", placeholder: "서울마포경찰서장 귀하" }
    ],
    initialValues: {
      complainantName: "홍길동",
      complainantRegNo: "900101-1234567",
      complainantAddr: "서울특별시 마포구 마포대로 14 (도화동)",
      complainantPhone: "010-1234-5678",
      complainantJob: "IT 개발자",
      accusedName: "임꺽정 (아이디: kkowang)",
      accusedPhone: "010-9876-5432 (또는 인적사항 모름)",
      accusedAddr: "서울특별시 영등포구 여의도동 5 (여의도빌라 102호)",
      title: "정보통신망법 위반(명예훼손) 및 모욕의 건",
      factDetails: "1. 피고소인은 2026년 6월 10일경 네이버 카페 '서식정보 공유카페' 게시판에서 고소인을 특정하여 공공연하게 허위 사실을 적시하고 입에 담지 못할 욕설을 유포하였습니다.\n2. 이로 인하여 고소인은 다수의 이용자로부터 조롱과 비방을 받아 정신적으로 심각한 피해와 명예 훼손을 겪고 있습니다.\n3. 이에 피고소인의 철저한 수사와 법률에 따른 엄중한 처벌을 구하고자 본 고소를 상신합니다.",
      evidence: "1. 비방 게시물 및 모욕성 댓글 PDF 캡처본 3부\n2. 해당 ID 회원 정보 캡처본 1부",
      date: "",
      recipient: "서울마포경찰서장 귀하",
      useApproval: false
    },
    layout: [
      { type: "title", value: "고  소  장" },
      { type: "spacer" },
      { type: "subtitle", value: "1. 고소인 인적사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{complainantName}", colSpan: 4, key: "complainantName", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{complainantRegNo}", colSpan: 4, key: "complainantRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{complainantAddr}", colSpan: 10, key: "complainantAddr" }
            ]
          },
          {
            cells: [
              { label: "연 락 처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{complainantPhone}", colSpan: 4, key: "complainantPhone", align: "center" },
              { label: "직 업", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{complainantJob}", colSpan: 4, key: "complainantJob", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 피고소인 인적사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명 / 아이디", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{accusedName}", colSpan: 4, key: "accusedName", align: "center" },
              { label: "연 락 처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{accusedPhone}", colSpan: 4, key: "accusedPhone", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{accusedAddr}", colSpan: 10, key: "accusedAddr" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 고소 취지 및 죄명" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "고소 죄명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{title}", colSpan: 10, key: "title", bold: true }
            ]
          }
        ]
      },
      { type: "subtitle", value: "4. 범죄 사실 및 고소 이유" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{factDetails}", colSpan: 12, key: "factDetails", style: { height: "130px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "subtitle", value: "5. 증거 자료" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "첨부 서류", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{evidence}", colSpan: 10, key: "evidence", style: { height: "65px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "본 고소장에 기재한 내용은 고소인이 알고 있는 사실에 의거하여 작성하였으며, 만약 상대방을 해할 목적으로 무고한 사실이 밝혀지는 경우 무고죄 등의 형사처벌을 감수할 것을 서약합니다.", style: { fontSize: "8.5pt", color: "#333", textAlign: "justify" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "10pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "sign-block", value: "고소인 : {complainantName} (인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{recipient}", style: { fontSize: "11.5pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },
  // 32. 일반 위임장 (행정 제출용 공용)
  {
    id: "generic_gov_power_of_attorney",
    title: "위임장 (일반 행정기관 제출용)",
    category: "행정",
    desc: "주민센터, 구청, 세무서 등 행정기관에 민원 신청 및 발급 등을 본인을 대신하여 대리인이 처리할 수 있도록 권한을 정식으로 수여하는 공용 위임 서식입니다.",
    popular: true,
    tags: ["위임장", "대리인", "민원신청", "동사무소", "공용서식", "행정"],
    fields: [
      { key: "delegatorName", label: "위임인 성명", type: "text", placeholder: "홍길동" },
      { key: "delegatorRegNo", label: "위임인 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "delegatorPhone", label: "위임인 연락처", type: "text", placeholder: "010-1234-5678" },
      { key: "delegatorAddr", label: "위임인 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "agentName", label: "대리인 성명", type: "text", placeholder: "이몽룡" },
      { key: "agentRegNo", label: "대리인 주민등록번호", type: "text", placeholder: "920510-1234567" },
      { key: "agentPhone", label: "대리인 연락처", type: "text", placeholder: "010-9876-5432" },
      { key: "agentAddr", label: "대리인 주소", type: "text", placeholder: "서울특별시 영등포구 여의도동 1" },
      { key: "agentRelation", label: "위임인과의 관계", type: "text", placeholder: "형제 (또는 직원)" },
      { key: "delegateTask", label: "위임할 구체적 내용", type: "textarea", placeholder: "예: 본인의 개인정보 열람 및 행정 정보 서류 대리 발급 신청에 관한 일체의 권한" },
      { key: "date", label: "위임 작성 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "recipient", label: "수신 기관 (제출처)", type: "text", placeholder: "서울특별시 마포구청장 귀하" }
    ],
    initialValues: {
      delegatorName: "홍길동",
      delegatorRegNo: "900101-1234567",
      delegatorPhone: "010-1234-5678",
      delegatorAddr: "서울특별시 마포구 마포대로 14 (도화동)",
      agentName: "이몽룡",
      agentRegNo: "920510-1234567",
      agentPhone: "010-9876-5432",
      agentAddr: "서울특별시 영등포구 여의도동 1 (여의도아파트 101동 302호)",
      agentRelation: "직장 동료 및 대리인",
      delegateTask: "1. 2026년도 정기 지방세 완납증명서 및 주민등록등본 대리 발급 신청\n2. 관련 행정민원 서류 수령 및 날인에 관한 일체의 권한 위임",
      date: "",
      recipient: "마포구청장 귀하",
      useApproval: false
    },
    layout: [
      { type: "title", value: "위  임  장" },
      { type: "spacer" },
      { type: "subtitle", value: "1. 위임인 (본인) 정보" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{delegatorName}", colSpan: 4, key: "delegatorName", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{delegatorRegNo}", colSpan: 4, key: "delegatorRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "연 락 처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{delegatorPhone}", colSpan: 10, key: "delegatorPhone", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{delegatorAddr}", colSpan: 10, key: "delegatorAddr" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 대리인 (수임인) 정보" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agentName}", colSpan: 4, key: "agentName", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agentRegNo}", colSpan: 4, key: "agentRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agentAddr}", colSpan: 10, key: "agentAddr" }
            ]
          },
          {
            cells: [
              { label: "연 락 처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agentPhone}", colSpan: 4, key: "agentPhone", align: "center" },
              { label: "위임인과 관계", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agentRelation}", colSpan: 4, key: "agentRelation", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 위임할 사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "{delegateTask}", colSpan: 12, key: "delegateTask", style: { height: "130px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "본인은 상기 대리인에게 위 서술된 행정 사무 및 증명서 신청/수령에 관한 모든 권한을 위임합니다.", style: { fontSize: "8.5pt", textAlign: "center", margin: "4px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "10pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "위임인(본인) : {delegatorName} (인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{recipient}", style: { fontSize: "11.5pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },
  // 33. 인감(변경)신고서 (인감증명법 시행령 별지 제1호서식)
  {
    id: "generic_gov_seal_register",
    title: "인감(변경)신고서 (서면신고)",
    category: "행정",
    desc: "인감증명법 시행령 별지 제1호서식에 따라 관할 읍·면·동 주민센터에 본인의 개인 인감을 최초로 신고(등록)하거나, 기존에 신고된 인감을 변경할 때 사용하는 정부 공식 행정 서식입니다.",
    popular: false,
    tags: ["인감신고", "인감변경", "주민센터", "동사무소", "정부서식", "행정"],
    fields: [
      { key: "name", label: "신고인 성명", type: "text", placeholder: "홍길동" },
      { key: "regNo", label: "신고인 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "nationality", label: "국적", type: "text", placeholder: "대한민국" },
      { key: "addr", label: "신고인 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "reason", label: "신고 사유", type: "select", options: ["신규 등록", "인감 분실/마멸 변경", "성명 개명 변경", "기타"] },
      { key: "parentName", label: "법정대리인(동의인) 성명", type: "text", placeholder: "김철수 (미성년자 등만 기재)" },
      { key: "parentRegNo", label: "법정대리인 주민등록번호", type: "text", placeholder: "650101-1234567" },
      { key: "parentRelation", label: "대리인과 관계", type: "text", placeholder: "부" },
      { key: "date", label: "신고 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "company", label: "수신 관청 (읍·면·동장)", type: "text", placeholder: "도화동장 귀하" }
    ],
    initialValues: {
      name: "홍길동",
      regNo: "900101-1234567",
      nationality: "대한민국",
      addr: "서울특별시 마포구 마포대로 14 (도화동)",
      reason: "인감 분실/마멸 변경",
      parentName: "김철수",
      parentRegNo: "650101-1234567",
      parentRelation: "부 (법정대리인)",
      date: "",
      company: "도화동장 귀하",
      useApproval: false
    },
    layout: [
      { type: "paragraph", value: "■ 인감증명법 시행령 [별지 제1호서식] <개정 2016. 7. 1.>", style: { fontSize: "7.5pt", textAlign: "left", margin: "2px 0", color: "#333333" } },
      { type: "paragraph", value: "(앞쪽)", style: { fontSize: "7.5pt", textAlign: "right", margin: "-14px 0 2px 0", color: "#333333" } },
      { type: "title", value: "인감(변경)신고서 (서면신고용)" },
      { type: "paragraph", value: "※ 위 신고내용에 따라 본인의 인감을 신고합니다.", style: { fontSize: "7.5pt", color: "#555", marginBottom: "5px" } },
      { type: "subtitle", value: "1. 인감 신고인 정보" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", colSpan: 4, key: "name", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{regNo}", colSpan: 4, key: "regNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "국 적", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{nationality}", colSpan: 4, key: "nationality", align: "center" },
              { label: "신고 사유", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{reason}", colSpan: 4, key: "reason", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{addr}", colSpan: 10, key: "addr" }
            ]
          }
        ]
      },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "신고할 인감 도장 (날인란)\nSeal Space", colSpan: 6, bold: true, align: "center", bg: "#f9fafb", style: { height: "70px", verticalAlign: "middle" } },
              { label: "(이 상자에 도장을 선명하게 날인하십시오)\n\n[                ]", colSpan: 6, align: "center", style: { height: "70px", verticalAlign: "middle", fontSize: "11pt", color: "#777" } }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 법정대리인 동의란 (미성년자, 피한정후견인 등에 한함)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "동의인 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{parentName}", colSpan: 4, key: "parentName", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{parentRegNo}", colSpan: 4, key: "parentRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "관계 (선처)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{parentRelation}", colSpan: 10, key: "parentRelation", align: "center" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "인감증명법 시행령 제3조제2항에 따라 위와 같이 서면으로 인감을 신고합니다.", style: { fontSize: "8.5pt", textAlign: "center", margin: "4px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "신고인 : {name} (서명 또는 인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{company}", style: { fontSize: "11.5pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },
  // 34. 사업자등록 정정신청서 (부가가치세법 시행규칙 별지 제11호서식)
  {
    id: "generic_gov_biz_update",
    title: "사업자등록 정정신청서 (개인사업자용)",
    category: "행정",
    desc: "부가가치세법 시행규칙 별지 제11호서식에 따라 상호 변경, 사업장 소재지 이전, 업종 추가 등 등록 사항의 정정이 필요한 개인사업자가 관할 세무서에 이를 신청하는 정식 세무 민원 서식입니다.",
    popular: true,
    tags: ["사업자등록", "사업자변경", "사업자정정", "세무서", "국세청", "행정"],
    fields: [
      { key: "bizNo", label: "사업자등록번호", type: "text", placeholder: "120-81-00000" },
      { key: "bizName", label: "상호 (회사명)", type: "text", placeholder: "마음데이터 주식회사" },
      { key: "ownerName", label: "대표자 성명", type: "text", placeholder: "홍길동" },
      { key: "bizPhone", label: "대표 연락처", type: "text", placeholder: "010-1234-5678" },
      { key: "updateItem", label: "정정할 항목", type: "text", placeholder: "예: 사업장 소재지 이전" },
      { key: "oldValue", label: "변경 전 내용", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "newValue", label: "변경 후 내용", type: "text", placeholder: "서울특별시 영등포구 여의도동 1" },
      { key: "date", label: "신청 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "recipient", label: "수신처 (세무서장)", type: "text", placeholder: "마포세무서장 귀하" }
    ],
    initialValues: {
      bizNo: "120-81-00000",
      bizName: "마음데이터",
      ownerName: "홍길동",
      bizPhone: "02-123-4567 (010-1234-5678)",
      updateItem: "사업장 소재지 이전",
      oldValue: "서울특별시 마포구 마포대로 14 (도화동)",
      newValue: "서울특별시 영등포구 여의도동 1 (여의도빌딩 5층)",
      date: "",
      recipient: "마포세무서장 귀하",
      useApproval: false
    },
    layout: [
      { type: "paragraph", value: "■ 부가가치세법 시행규칙 [별지 제11호서식] <개정 2021. 3. 16.>", style: { fontSize: "7.5pt", textAlign: "left", margin: "2px 0", color: "#333333" } },
      { type: "paragraph", value: "(앞쪽)", style: { fontSize: "7.5pt", textAlign: "right", margin: "-14px 0 2px 0", color: "#333333" } },
      { type: "title", value: "사업자등록 정정신청서 (개인사업자용)" },
      { type: "paragraph", value: "※ 국세정보통신망(홈택스)을 통해서도 정정신청을 하실 수 있습니다.", style: { fontSize: "7.5pt", color: "#555", marginBottom: "5px" } },
      { type: "subtitle", value: "1. 기본 인적사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "사업자등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizNo}", colSpan: 4, key: "bizNo", align: "center", bold: true },
              { label: "상호 (사업자명)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizName}", colSpan: 4, key: "bizName" }
            ]
          },
          {
            cells: [
              { label: "대표자 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{ownerName}", colSpan: 4, key: "ownerName", align: "center" },
              { label: "대 표 연락처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizPhone}", colSpan: 4, key: "bizPhone", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 등록 사항 정정 내역" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "정정할 항목", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{updateItem}", colSpan: 9, key: "updateItem", bold: true, align: "center" }
            ]
          },
          {
            cells: [
              { label: "구 분", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "정정 전 (변경 전 내용)", colSpan: 9, bold: true, align: "center", bg: "#f9fafb" }
            ]
          },
          {
            cells: [
              { label: "변경 전", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{oldValue}", colSpan: 9, key: "oldValue" }
            ]
          },
          {
            cells: [
              { label: "구 분", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "정정 후 (변경 후 내용)", colSpan: 9, bold: true, align: "center", bg: "#f9fafb" }
            ]
          },
          {
            cells: [
              { label: "변경 후", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{newValue}", colSpan: 9, key: "newValue" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "부가가치세법 제8조제6항 및 같은 법 시행령 제14조제1항에 따라 사업자등록의 정정을 신청합니다.", style: { fontSize: "8.5pt", textAlign: "center", margin: "4px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      {
        type: "table",
        style: { border: "none" },
        rows: [
          {
            cells: [
              { label: "", colSpan: 3, style: { border: "none" } },
              { label: "{recipient}", colSpan: 6, key: "recipient", style: { border: "none", fontSize: "12pt", fontWeight: "bold", textAlign: "right", paddingRight: "10px" } },
              { label: "세무서장 귀하", colSpan: 3, style: { border: "none", fontSize: "11pt", fontWeight: "bold", textAlign: "left" } }
            ]
          }
        ]
      }
    ]
  },
  // 35. 휴업·폐업 신고서 (부가가치세법 시행규칙 별지 제9호서식)
  {
    id: "generic_gov_biz_close",
    title: "휴업·폐업 신고서",
    category: "행정",
    desc: "부가가치세법 시행규칙 별지 제9호서식에 따라 개인/법인 사업자가 사업을 일시 중단(휴업)하거나 완전히 종료(폐업)할 때 관할 세무서에 정식으로 상신하는 세무 민원 서식입니다.",
    popular: true,
    tags: ["휴업신고", "폐업신고", "세무서", "국세청", "사업중단", "행정"],
    fields: [
      { key: "bizNo", label: "사업자등록번호", type: "text", placeholder: "120-81-00000" },
      { key: "bizName", label: "상호 (법인명)", type: "text", placeholder: "마음데이터" },
      { key: "ownerName", label: "대표자 성명", type: "text", placeholder: "홍길동" },
      { key: "ownerRegNo", label: "주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "bizAddr", label: "사업장 소재지 (주소)", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "bizPhone", label: "대표 연락처", type: "text", placeholder: "010-1234-5678" },
      { key: "closeType", label: "신고 구분", type: "select", options: ["휴업 신고", "폐업 신고", "휴업기간 변경 신고"] },
      { key: "closeDate", label: "휴업/폐업 연월일", type: "text", placeholder: "2026년 07월 01일" },
      { key: "closePeriod", label: "휴업 기간 (휴업인 경우)", type: "text", placeholder: "2026.07.01 ~ 2026.12.31" },
      { key: "reason", label: "휴업/폐업 구체적 사유", type: "text", placeholder: "사업 부진 및 건강상의 사유" },
      { key: "date", label: "신청 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "recipient", label: "수신처 (세무서장)", type: "text", placeholder: "마포세무서장 귀하" }
    ],
    initialValues: {
      bizNo: "120-81-00000",
      bizName: "마음데이터 테크놀로지",
      ownerName: "홍길동",
      ownerRegNo: "900101-1234567",
      bizAddr: "서울특별시 마포구 마포대로 14 (도화동)",
      bizPhone: "02-123-4567 (010-1234-5678)",
      closeType: "폐업 신고",
      closeDate: "2026년 07월 01일",
      closePeriod: "해당 없음 (폐업)",
      reason: "경영 악화 및 업종 전환 준비",
      date: "",
      recipient: "마포세무서장 귀하",
      useApproval: false
    },
    layout: [
      { type: "paragraph", value: "■ 부가가치세법 시행규칙 [별지 제9호서식] <개정 2021. 3. 16.>", style: { fontSize: "7.5pt", textAlign: "left", margin: "2px 0", color: "#333333" } },
      { type: "paragraph", value: "(앞쪽)", style: { fontSize: "7.5pt", textAlign: "right", margin: "-14px 0 2px 0", color: "#333333" } },
      { type: "title", value: "휴업 · 폐업 신고서" },
      { type: "paragraph", value: "※ [  ]에는 해당되는 곳에 ☑ 표시를 합니다.", style: { fontSize: "7.5pt", color: "#555", marginBottom: "5px" } },
      { type: "subtitle", value: "1. 기본 인적사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "상호 (법인명)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizName}", colSpan: 4, key: "bizName", align: "center" },
              { label: "사업자등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizNo}", colSpan: 4, key: "bizNo", align: "center", bold: true }
            ]
          },
          {
            cells: [
              { label: "대표자 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{ownerName}", colSpan: 4, key: "ownerName", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{ownerRegNo}", colSpan: 4, key: "ownerRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "사업장 소재지", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizAddr}", colSpan: 10, key: "bizAddr" }
            ]
          },
          {
            cells: [
              { label: "전 화 번 호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizPhone}", colSpan: 10, key: "bizPhone", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 신고 내용" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "신고 구분", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{closeType}", colSpan: 10, key: "closeType", align: "center", bold: true }
            ]
          },
          {
            cells: [
              { label: "휴업/폐업일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{closeDate}", colSpan: 4, key: "closeDate", align: "center" },
              { label: "휴업 기간", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{closePeriod}", colSpan: 4, key: "closePeriod", align: "center" }
            ]
          },
          {
            cells: [
              { label: "사 유", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{reason}", colSpan: 10, key: "reason" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "부가가치세법 제8조제6항 및 같은 법 시행령 제13조제1항에 따라 위와 같이 휴업(폐업)을 신고합니다.", style: { fontSize: "8.5pt", textAlign: "center", margin: "4px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "신고인(대표자) : {ownerName} (서명 또는 인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{recipient}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },
  // 36. 주택임대차계약 신고서 (부동산 거래신고 등에 관한 법률 시행규칙 별지 제5호의2서식)
  {
    id: "generic_gov_rent_report",
    title: "주택임대차계약 신고서",
    category: "행정",
    desc: "부동산 거래신고 등에 관한 법률 시행규칙 별지 제5호의2서식에 따라 주택 임대차(전월세) 계약 체결 후 30일 이내에 관할 지자체에 계약 내용을 의무 신고하기 위한 정부 표준 서식입니다.",
    popular: true,
    tags: ["임대차신고", "전월세신고", "주택임대차", "동사무소", "부동산", "행정"],
    fields: [
      { key: "landlordName", label: "임대인 성명", type: "text", placeholder: "김임대" },
      { key: "landlordRegNo", label: "임대인 주민등록번호", type: "text", placeholder: "600101-1234567" },
      { key: "landlordAddr", label: "임대인 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "landlordPhone", label: "임대인 연락처", type: "text", placeholder: "010-1111-2222" },
      { key: "tenantName", label: "임차인 성명", type: "text", placeholder: "이임차" },
      { key: "tenantRegNo", label: "임차인 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "tenantAddr", label: "임차인 주소", type: "text", placeholder: "서울특별시 영등포구 여의도동 1" },
      { key: "tenantPhone", label: "임차인 연락처", type: "text", placeholder: "010-3333-4444" },
      { key: "rentAddr", label: "임대 목적물 주소", type: "text", placeholder: "서울특별시 마포구 도화동 10 (도화아파트 101동 505호)" },
      { key: "houseType", label: "주택 유형", type: "select", options: ["아파트", "단독주택", "다세대주택", "오피스텔", "기타"] },
      { key: "rentArea", label: "임대 면적 (전용면적 ㎡)", type: "text", placeholder: "84.95㎡" },
      { key: "deposit", label: "임대 보증금 (원)", type: "text", placeholder: "300,000,000" },
      { key: "monthlyRent", label: "월세 (원, 없을 시 0)", type: "text", placeholder: "500,000" },
      { key: "term", label: "임대차 계약 기간", type: "text", placeholder: "2026.07.01 ~ 2028.06.30 (24개월)" },
      { key: "contractType", label: "계약 구분", type: "select", options: ["신규 계약", "갱신 계약 (갱신요구권 사용)", "갱신 계약 (합의 갱신)"] },
      { key: "date", label: "신고 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "recipient", label: "수신 관청 (지자체장)", type: "text", placeholder: "마포구청장 귀하" }
    ],
    initialValues: {
      landlordName: "김임대",
      landlordRegNo: "600101-1234567",
      landlordAddr: "서울특별시 마포구 마포대로 14 (도화동)",
      landlordPhone: "010-1111-2222",
      tenantName: "이임차",
      tenantRegNo: "900101-1234567",
      tenantAddr: "서울특별시 영등포구 여의도동 1 (여의도아파트 101동 202호)",
      tenantPhone: "010-3333-4444",
      rentAddr: "서울특별시 마포구 도화동 10 (도화아파트 101동 505호)",
      houseType: "아파트",
      rentArea: "84.95㎡",
      deposit: "300,000,000원",
      monthlyRent: "500,000원",
      term: "2026년 07월 01일 ~ 2028년 06월 30일 (2년)",
      contractType: "신규 계약",
      date: "",
      recipient: "마포구청장 귀하",
      useApproval: false
    },
    layout: [
      { type: "paragraph", value: "■ 부동산 거래신고 등에 관한 법률 시행규칙 [별지 제5호의2서식] <개정 2021. 6. 1.>", style: { fontSize: "7.5pt", textAlign: "left", margin: "2px 0", color: "#333333" } },
      { type: "paragraph", value: "(앞쪽)", style: { fontSize: "7.5pt", textAlign: "right", margin: "-14px 0 2px 0", color: "#333333" } },
      { type: "title", value: "주택임대차계약 신고서" },
      { type: "paragraph", value: "※ 계약 당사자(임대인 및 임차인) 공동으로 서명 또는 날인하여 제출하여야 합니다.", style: { fontSize: "7.5pt", color: "#555", marginBottom: "5px" } },
      { type: "subtitle", value: "1. 계약 당사자 정보" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "임대인 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{landlordName}", colSpan: 4, key: "landlordName", align: "center" },
              { label: "임차인 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{tenantName}", colSpan: 4, key: "tenantName", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{landlordRegNo}", colSpan: 4, key: "landlordRegNo", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{tenantRegNo}", colSpan: 4, key: "tenantRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{landlordAddr}", colSpan: 4, key: "landlordAddr" },
              { label: "주 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{tenantAddr}", colSpan: 4, key: "tenantAddr" }
            ]
          },
          {
            cells: [
              { label: "연 락 처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{landlordPhone}", colSpan: 4, key: "landlordPhone", align: "center" },
              { label: "연 락 처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{tenantPhone}", colSpan: 4, key: "tenantPhone", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 임대 목적물 및 임대차 계약 내용" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "임대지 주소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{rentAddr}", colSpan: 10, key: "rentAddr" }
            ]
          },
          {
            cells: [
              { label: "주택 유형", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{houseType}", colSpan: 4, key: "houseType", align: "center" },
              { label: "임대 면적", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{rentArea}", colSpan: 4, key: "rentArea", align: "center" }
            ]
          },
          {
            cells: [
              { label: "임대 보증금", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{deposit}", colSpan: 4, key: "deposit", align: "center", bold: true },
              { label: "월 세", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{monthlyRent}", colSpan: 4, key: "monthlyRent", align: "center", bold: true }
            ]
          },
          {
            cells: [
              { label: "계약 기간", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{term}", colSpan: 4, key: "term", align: "center" },
              { label: "계약 구분", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{contractType}", colSpan: 4, key: "contractType", align: "center" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "부동산 거래신고 등에 관한 법률 제6조의2제1항 및 같은 법 시행규칙 제6조의2제1항에 따라 위와 같이 신고합니다.", style: { fontSize: "8.5pt", textAlign: "center", margin: "4px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "임대인 : {landlordName} (인)    임차인 : {tenantName} (인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{recipient}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },
  // 37. 소득금액증명 신청서 (국세청 세무민원 공용서식)
  {
    id: "generic_gov_income_cert",
    title: "소득금액증명 신청서",
    category: "재무",
    desc: "국세청 소관 법정 양식에 따라 종합소득세 신고자, 근로소득자 등이 금융기관 제출, 관공서 제출 등의 목적으로 본인의 전년도 소득금액증명서 발급을 세무서에 신청할 때 작성하는 양식입니다.",
    popular: true,
    tags: ["소득금액증명", "소득증명", "세무서", "국세청", "원천징수", "재무"],
    fields: [
      { key: "name", label: "신청인 성명", type: "text", placeholder: "홍길동" },
      { key: "regNo", label: "주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "bizName", label: "상호 (개인사업자인 경우)", type: "text", placeholder: "마음데이터" },
      { key: "addr", label: "신청인 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "phone", label: "연락처", type: "text", placeholder: "010-1234-5678" },
      { key: "year", label: "증명 대상 귀속연도", type: "text", placeholder: "2025년도" },
      { key: "incomeType", label: "소득 구분", type: "select", options: ["근로소득자용", "종합소득세신고자용", "사업소득자용(연말정산)", "종교인소득자용"] },
      { key: "purpose", label: "사용 목적 (용도)", type: "select", options: ["금융기관 제출용", "관공서 제출용", "여권발급용", "건강보험공단 제출용", "기타"] },
      { key: "qty", label: "신청 부수", type: "text", placeholder: "1부" },
      { key: "date", label: "신청 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "recipient", label: "수신 세무서 (세무서장 귀하)", type: "text", placeholder: "마포세무서장 귀하" }
    ],
    initialValues: {
      name: "홍길동",
      regNo: "900101-1234567",
      bizName: "마음데이터 테크 (개인사업자 겸업)",
      addr: "서울특별시 마포구 마포대로 14 (도화동)",
      phone: "010-1234-5678",
      year: "2025년도",
      incomeType: "종합소득세신고자용",
      purpose: "금융기관 제출용 (은행 대출 제출용)",
      qty: "2부",
      date: "",
      recipient: "마포세무서장 귀하",
      useApproval: false
    },
    layout: [
      { type: "paragraph", value: "■ 국세청 민원실 표준 서식 [소득금액증명 신청용]", style: { fontSize: "7.5pt", textAlign: "left", margin: "2px 0", color: "#333333" } },
      { type: "title", value: "소득금액증명 신청서" },
      { type: "paragraph", value: "※ 신청인의 귀속연도별 국세청 소득 신고 금액 증명을 요청하는 민원서식입니다.", style: { fontSize: "7.5pt", color: "#555", marginBottom: "5px" } },
      { type: "subtitle", value: "1. 신청인 정보" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", colSpan: 4, key: "name", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{regNo}", colSpan: 4, key: "regNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "상 호 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizName}", colSpan: 10, key: "bizName" }
            ]
          },
          {
            cells: [
              { label: "주 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{addr}", colSpan: 10, key: "addr" }
            ]
          },
          {
            cells: [
              { label: "연 락 처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{phone}", colSpan: 10, key: "phone", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 증명 신청 내용" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "귀속 연도", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{year}", colSpan: 4, key: "year", align: "center" },
              { label: "소득 구분", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{incomeType}", colSpan: 4, key: "incomeType", align: "center", bold: true }
            ]
          },
          {
            cells: [
              { label: "사용 목적", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{purpose}", colSpan: 4, key: "purpose", align: "center" },
              { label: "신청 부수", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{qty}", colSpan: 4, key: "qty", align: "center" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "종합소득세 및 근로소득 과세 표준 법령에 의거하여 위와 같이 소득금액증명 발급을 신청합니다.", style: { fontSize: "8.5pt", textAlign: "center", margin: "4px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "신청인 : {name} (서명 또는 인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{recipient}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } }
    ]
  },
  // 38. 자동차양도증명서 (직접거래용 - 자동차관리법 시행규칙 별지 제15호서식)
  {
    id: "generic_gov_car_transfer",
    title: "자동차양도증명서 (직접거래용)",
    category: "계약",
    desc: "자동차관리법 시행규칙 별지 제15호서식에 의거하여 매매업자를 거치지 않고 양도인과 양수인이 직접 중고 자동차 매매 계약을 체결하고 소유권 이전 등록을 진행할 때 작성하는 법정 표준 서식입니다.",
    popular: true,
    tags: ["양도증명서", "자동차매매", "차량매매", "차량이전", "직접거래", "계약"],
    fields: [
      { key: "sellerName", label: "양도인 성명", type: "text", placeholder: "김양도" },
      { key: "sellerRegNo", label: "양도인 주민등록번호", type: "text", placeholder: "700101-1234567" },
      { key: "sellerAddr", label: "양도인 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "sellerPhone", label: "양도인 연락처", type: "text", placeholder: "010-1111-2222" },
      { key: "buyerName", label: "양수인 성명", type: "text", placeholder: "이양수" },
      { key: "buyerRegNo", label: "양수인 주민등록번호", type: "text", placeholder: "900101-1234567" },
      { key: "buyerAddr", label: "양수인 주소", type: "text", placeholder: "서울특별시 영등포구 여의도동 1" },
      { key: "buyerPhone", label: "양수인 연락처", type: "text", placeholder: "010-3333-4444" },
      { key: "carNo", label: "자동차등록번호", type: "text", placeholder: "서울12가3456" },
      { key: "carType", label: "차종", type: "text", placeholder: "쏘나타 (중형승용)" },
      { key: "carVin", label: "차대번호", type: "text", placeholder: "KMHCT41BPGU000000" },
      { key: "price", label: "매매 금액 (원)", type: "text", placeholder: "15,000,000" },
      { key: "tradeDate", label: "매매 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "deliveryDate", label: "자동차 인도 일자", type: "text", placeholder: "2026년 06월 16일" },
      { key: "date", label: "증명 작성 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      sellerName: "김양도",
      sellerRegNo: "700101-1234567",
      sellerAddr: "서울특별시 마포구 마포대로 14 (도화동)",
      sellerPhone: "010-1111-2222",
      buyerName: "이양수",
      buyerRegNo: "900101-1234567",
      buyerAddr: "서울특별시 영등포구 여의도동 1 (여의도아파트 101동 202호)",
      buyerPhone: "010-3333-4444",
      carNo: "서울12가3456",
      carType: "그랜저 (대형승용)",
      carVin: "KMHGD41BPGU999999",
      price: "25,000,000원",
      tradeDate: "2026년 06월 16일",
      deliveryDate: "2026년 06월 16일",
      date: ""
    },
    layout: [
      { type: "paragraph", value: "■ 자동차관리법 시행규칙 [별지 제15호서식] <개정 2018. 1. 2.>", style: { fontSize: "7.5pt", textAlign: "left", margin: "2px 0", color: "#333333" } },
      { type: "title", value: "자동차양도증명서 (직접거래용)" },
      { type: "paragraph", value: "※ 매매업자를 거치지 않고 양도인과 양수인이 직접 거래하는 경우에 작성하며, 소유권 이전 등록 신청 시 함께 제출합니다.", style: { fontSize: "7.5pt", color: "#555", marginBottom: "5px" } },
      { type: "subtitle", value: "1. 계약 당사자 정보" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "양도인 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{sellerName}", colSpan: 4, key: "sellerName", align: "center" },
              { label: "양수인 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{buyerName}", colSpan: 4, key: "buyerName", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{sellerRegNo}", colSpan: 4, key: "sellerRegNo", align: "center" },
              { label: "주민등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{buyerRegNo}", colSpan: 4, key: "buyerRegNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "주 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{sellerAddr}", colSpan: 4, key: "sellerAddr" },
              { label: "주 소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{buyerAddr}", colSpan: 4, key: "buyerAddr" }
            ]
          },
          {
            cells: [
              { label: "연 락 처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{sellerPhone}", colSpan: 4, key: "sellerPhone", align: "center" },
              { label: "연 락 처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{buyerPhone}", colSpan: 4, key: "buyerPhone", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 매매 자동차 정보 및 거래 조건" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "자동차등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{carNo}", colSpan: 4, key: "carNo", align: "center", bold: true },
              { label: "차   종", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{carType}", colSpan: 4, key: "carType", align: "center" }
            ]
          },
          {
            cells: [
              { label: "차대 번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{carVin}", colSpan: 10, key: "carVin", align: "center" }
            ]
          },
          {
            cells: [
              { label: "매매 금액", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{price}", colSpan: 4, key: "price", align: "center", bold: true },
              { label: "매매 일자", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{tradeDate}", colSpan: 4, key: "tradeDate", align: "center" }
            ]
          },
          {
            cells: [
              { label: "자동차인도일자", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{deliveryDate}", colSpan: 10, key: "deliveryDate", align: "center" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "위 양도인과 양수인은 위 기재 내용에 따라 자동차 매매계약을 체결하고, 이를 증명하기 위하여 이 증서에 서명 또는 날인합니다.", style: { fontSize: "8.5pt", textAlign: "justify", margin: "4px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "양도인 (매도자) : {sellerName} (인)      양수인 (매수자) : {buyerName} (인)" }
    ]
  },
  // 39. 개인정보 수집·이용 및 제3자 제공 동의서 (정부/공공기관 공용 표준안)
  {
    id: "generic_gov_privacy_consent",
    title: "개인정보 수집·이용 및 제3자 제공 동의서",
    category: "행정",
    desc: "개인정보보호법에 의거하여 관공서 민원 접수, 정부 지원 사업 신청 및 기업 내 행정 처리 시 정보주체의 권리를 보호하고 적법하게 동의를 구하는 표준 법정 서식입니다.",
    popular: true,
    tags: ["개인정보동의서", "개인정보", "보안", "동의서", "공공기관", "행정"],
    fields: [
      { key: "name", label: "동의자 성명", type: "text", placeholder: "홍길동" },
      { key: "birth", label: "생년월일", type: "text", placeholder: "1990.01.01" },
      { key: "phone", label: "연락처", type: "text", placeholder: "010-1234-5678" },
      { key: "email", label: "이메일 주소", type: "text", placeholder: "gildong@maumdata.com" },
      { key: "recipient", label: "수신 기관 (제출 관청)", type: "text", placeholder: "마음데이터 행정지원실 귀중" },
      { key: "date", label: "동의 작성 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      name: "홍길동",
      birth: "1990년 01월 01일",
      phone: "010-1234-5678",
      email: "gildong@maumdata.com",
      recipient: "마포구청장 귀하",
      date: "",
      useApproval: false
    },
    layout: [
      { type: "paragraph", value: "■ 개인정보보호법 제15조 및 제17조에 따른 고시 양식", style: { fontSize: "7.5pt", textAlign: "left", margin: "2px 0", color: "#333333" } },
      { type: "title", value: "개인정보 수집·이용 및 제3자 제공 동의서" },
      { type: "paragraph", value: "※ 귀하는 아래의 동의를 거부할 권리가 있으며, 거부 시 행정 민원 처리의 지연 또는 불이익이 발생할 수 있습니다.", style: { fontSize: "7.5pt", color: "#e11d48", marginBottom: "5px" } },
      { type: "subtitle", value: "1. 개인정보 수집 및 이용 동의" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "수집 · 이용 목적", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "민원 사무의 접수, 처리 및 결과 통보, 신원 확인", colSpan: 4, align: "center" },
              { label: "수집 항목", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "성명, 생년월일, 주소, 연락처, 이메일", colSpan: 4, align: "center" }
            ]
          },
          {
            cells: [
              { label: "보유 및 이용기간", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "해당 행정 민원 사무 처리 및 관계법령에 따른 보존 기한 종료 시까지", colSpan: 10 }
            ]
          },
          {
            cells: [
              { label: "동의 여부", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "위의 개인정보 수집 및 이용에 동의하십니까?    [ ☑ ] 동의함    [  ] 동의하지 않음", colSpan: 10, bold: true }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 개인정보 제3자 제공 동의" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "제공받는 자", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "민원 사무 관할 관청 및 관계 행정 기관", colSpan: 4, align: "center" },
              { label: "제공 목적", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "합동 조사, 민원 사무 이첩 처리 및 사후 검증", colSpan: 4, align: "center" }
            ]
          },
          {
            cells: [
              { label: "제공하는 항목", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "성명, 생년월일, 주소, 연락처", colSpan: 10 }
            ]
          },
          {
            cells: [
              { label: "동의 여부", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "위의 개인정보 제3자 제공에 동의하십니까?    [ ☑ ] 동의함    [  ] 동의하지 않음", colSpan: 10, bold: true }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 동의자 정보" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "성 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{name}", colSpan: 4, key: "name", align: "center" },
              { label: "생년월일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{birth}", colSpan: 4, key: "birth", align: "center" }
            ]
          },
          {
            cells: [
              { label: "연 락 처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{phone}", colSpan: 4, key: "phone", align: "center" },
              { label: "이 메 일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{email}", colSpan: 4, key: "email", align: "center" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "본인은 개인정보보호법에 의거하여 상기 내용과 같이 본인의 개인정보를 수집·이용 및 제3자 제공하는 것에 동의합니다.", style: { fontSize: "8.5pt", textAlign: "justify", margin: "4px 0" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "동의자 : {name} (서명 또는 인)" },
      { type: "spacer" },
      { type: "paragraph", value: "{recipient}", style: { fontSize: "12pt", fontWeight: "bold", textAlign: "center" } }
    ]
  }
,
// 40. 주주간 계약서
  {
    id: "generic_gov_co_founder_agreement",
    title: "주주간 계약서",
    category: "계약",
    desc: "공동창업자 간 지분 회수, 역할 분담, 의사결정 방식 및 지분 처분에 대한 권리와 의무를 조율하여 분쟁을 예방하는 스타트업 필수 동업 계약 서식입니다.",
    popular: true,
    tags: ["주주간계약서", "동업계약서", "공동창업", "스타트업", "지분"],
    fields: [
      { key: "founderA", label: "공동창업자 A 성명", type: "text", placeholder: "김투자" },
      { key: "founderB", label: "공동창업자 B 성명", type: "text", placeholder: "이대표" },
      { key: "companyName", label: "회사명", type: "text", placeholder: "주식회사 마음테크" },
      { key: "shareRatioA", label: "창업자 A 지분율", type: "text", placeholder: "60%" },
      { key: "shareRatioB", label: "창업자 B 지분율", type: "text", placeholder: "40%" },
      { key: "date", label: "계약 체결일", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      founderA: "김투자",
      founderB: "이대표",
      companyName: "주식회사 마음테크",
      shareRatioA: "60%",
      shareRatioB: "40%",
      date: ""
    },
    layout: [
      { type: "title", value: "주 주 간 계 약 서" },
      { type: "paragraph", value: "본 계약은 {companyName}(이하 '회사')의 공동창업자인 {founderA}(이하 '갑')와 {founderB}(이하 '을') 간의 주주로서의 권리와 의무를 규정하고 상호 신의에 따라 성실히 이행할 것을 약정합니다.", style: { margin: "10px 0" } },
      { type: "subtitle", value: "제 1 조 (목적)" },
      { type: "paragraph", value: "본 계약은 '갑'과 '을'이 회사를 공동 설립 및 경영함에 있어 상호 주주간의 권리와 책임 관계를 명확히 하고, 회사의 건전한 발전을 도모하는 것을 목적으로 합니다." },
      { type: "subtitle", value: "제 2 조 (지분 및 경영 역할)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "구분", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "성명", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "소유 지분율", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "담당 주무 분야", colSpan: 4, bold: true, align: "center", bg: "#f9fafb" }
            ]
          },
          {
            cells: [
              { label: "갑", colSpan: 2, align: "center" },
              { label: "{founderA}", colSpan: 3, key: "founderA", align: "center" },
              { label: "{shareRatioA}", colSpan: 3, key: "shareRatioA", align: "center" },
              { label: "기술 개발 및 제품 총괄", colSpan: 4, align: "center" }
            ]
          },
          {
            cells: [
              { label: "을", colSpan: 2, align: "center" },
              { label: "{founderB}", colSpan: 3, key: "founderB", align: "center" },
              { label: "{shareRatioB}", colSpan: 3, key: "shareRatioB", align: "center" },
              { label: "경영 관리 및 투자 유치", colSpan: 4, align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "제 3 조 (지분 처분 및 회수)" },
      { type: "paragraph", value: "계약 당사자는 본 계약 체결일로부터 3년의 임기 의무 기간 내에 상대방의 서면 동의 없이 소유 주식의 전부 또는 일부를 제3자에게 양도하거나 담보로 제공할 수 없습니다." },
      { type: "spacer" },
      { type: "paragraph", value: "본 계약의 체결을 증명하기 위하여 계약서 2부를 작성하여 각 1부씩 보관합니다.", style: { fontSize: "8.5pt" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "주주 (갑) : {founderA} (인)          주주 (을) : {founderB} (인)" }
    ]
  },
  // 41. 스톡옵션 부여 계약서
  {
    id: "generic_gov_stock_option",
    title: "스톡옵션 부여 계약서",
    category: "계약",
    desc: "회사 성장에 기여할 임직원을 대상으로 상법 절차에 따라 주식을 매수할 수 있는 선택권을 부여하고 행사 조건 등을 규정하는 계약 서식입니다.",
    popular: true,
    tags: ["스톡옵션", "주식매수선택권", "임직원보상", "스타트업", "계약서"],
    fields: [
      { key: "receiver", label: "부여 대상자 성명", type: "text", placeholder: "박개발" },
      { key: "qty", label: "부여 주식 수", type: "text", placeholder: "1,000주" },
      { key: "price", label: "1주당 행사 가격", type: "text", placeholder: "5,000원" },
      { key: "period", label: "행사 가능 기간", type: "text", placeholder: "부여일로부터 2년 경과 후 5년 이내" },
      { key: "date", label: "부여 계약일", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      receiver: "박개발",
      qty: "1,000주",
      price: "5,000원",
      period: "부여일로부터 2년 경과 후 5년 이내",
      date: ""
    },
    layout: [
      { type: "title", value: "주식매수선택권(스톡옵션) 부여 계약서" },
      { type: "paragraph", value: "주식회사 마음테크(이하 '회사')와 임직원 {receiver}(이하 '부여대상자')는 상법 및 회사 정관의 규정에 의거하여 다음과 같이 주식매수선택권(이하 '스톡옵션') 부여 계약을 체결합니다." },
      { type: "subtitle", value: "1. 스톡옵션 부여 기본 사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "부여 대상자", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{receiver}", colSpan: 9, key: "receiver", align: "center" }
            ]
          },
          {
            cells: [
              { label: "부여 주식 수", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{qty} (보통주)", colSpan: 9, key: "qty", align: "center" }
            ]
          },
          {
            cells: [
              { label: "1주당 행사 가격", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{price}", colSpan: 9, key: "price", align: "center", bold: true }
            ]
          },
          {
            cells: [
              { label: "행사 가능 기간", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{period}", colSpan: 9, key: "period", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 권리 행사 조건 및 소멸" },
      { type: "paragraph", value: "- 행사 요건: 부여대상자는 스톡옵션을 부여하는 주주총회 특별결의일로부터 2년 이상 회사에 재직하여야 이를 행사할 수 있습니다.\n- 권리의 양도 금지: 본 스톡옵션은 부여대상자 개인에게 귀속되며, 제3자에게 양도하거나 상속할 수 없습니다. 다만, 재직 중 사망 또는 정년퇴직 등 불가피한 사유 발생 시 예외로 할 수 있습니다." },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "회사 대표이사 : 이대표 (인)          부여대상자 : {receiver} (인)" }
    ]
  },
  // 42. 이사회 의사록
  {
    id: "generic_gov_board_minutes",
    title: "이사회 의사록",
    category: "행정",
    desc: "법인 내 최고의사결정기구인 이사회 소집 및 의결 내용을 공정하게 기록하여 공증 및 등기 신청의 법적 증빙으로 제출하는 표준 서식입니다.",
    popular: true,
    tags: ["이사회", "의사록", "법인등기", "의결", "경영"],
    fields: [
      { key: "datetime", label: "회의 일시", type: "text", placeholder: "2026년 06월 16일 10시 00분" },
      { key: "location", label: "회의 장소", type: "text", placeholder: "서울특별시 마포구 마포대로 14, 본사 회의실" },
      { key: "agendas", label: "회의 안건", type: "textarea", placeholder: "제1호 의안: 본점 소재지 이전의 건\n제2호 의안: 신규 임원 선임의 건" },
      { key: "date", label: "작성 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      datetime: "2026년 06월 16일 10시 00분",
      location: "서울특별시 마포구 마포대로 14, 본사 회의실",
      agendas: "제1호 의안: 본점 소재지 이전의 건\n제2호 의안: 신규 이사 선임의 건",
      date: ""
    },
    layout: [
      { type: "title", value: "이 사 회 의 사 록" },
      { type: "subtitle", value: "1. 회의 소집 정보" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "회의 일시", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{datetime}", colSpan: 10, key: "datetime" }
            ]
          },
          {
            cells: [
              { label: "회의 장소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{location}", colSpan: 10, key: "location" }
            ]
          },
          {
            cells: [
              { label: "참석 이사", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "총 이사 3명 중 3명 참석", colSpan: 4, align: "center" },
              { label: "참석 감사", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "감사 1명 중 1명 참석", colSpan: 4, align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 회의 의안 및 심의 내용" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "안 건", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{agendas}", colSpan: 10, key: "agendas", style: { whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "paragraph", value: "의장 대표이사 이대표는 의장석에 등단하여 성원이 성립되었으므로 개회를 선언하고 심의에 착수함. 상기 안건에 대하여 이사회의 충분한 논의와 질의응답을 거쳐 참석 이사 전원의 찬성으로 가결 승인됨을 보고함.", style: { margin: "8px 0", textIndent: "10px" } },
      { type: "paragraph", value: "이상으로 이사회 의결에 차질이 없음을 확인하고 당일 폐회를 선언함.", style: { margin: "4px 0", textIndent: "10px" } },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "의장 대표이사 : 이대표 (인)          이사 : 김투자 (인)          이사 : 박사외 (인)" }
    ]
  },
  // 43. 간이 IR 피치덱 요약본
  {
    id: "generic_gov_pitch_deck",
    title: "간이 IR 피치덱 요약본",
    category: "재무",
    desc: "신규 사업 설명 및 투자 유치 목적의 핵심 항목(문제 정의, 해결안, 시장성, 비즈니스 모델)을 1장으로 기재하는 요약 IR 서식입니다.",
    popular: false,
    tags: ["IR", "피치덱", "스타트업", "투자유치", "사업요약"],
    fields: [
      { key: "projectName", label: "프로젝트 및 회사명", type: "text", placeholder: "마음데이터 (MaumData)" },
      { key: "problem", label: "문제 정의 (Problem)", type: "textarea", placeholder: "서류 조판의 디지털화 부재 및 조판 정밀도 한계" },
      { key: "solution", label: "해결 방안 (Solution)", type: "textarea", placeholder: "12열 대칭 격자 구조 기반의 실시간 PDF 조판 플랫폼 구축" },
      { key: "marketSize", label: "시장 규모 (Market)", type: "text", placeholder: "국내 비즈니스 서식 1.2조원 시장" },
      { key: "bizModel", label: "수익 모델 (Biz Model)", type: "text", placeholder: "SaaS 구독 서비스 및 API 라이선스 판매" }
    ],
    initialValues: {
      projectName: "마음데이터 (MaumData)",
      problem: "비즈니스 및 공공기관 서식의 디지털화 부족과 PDF 출력 시 격자 틀어짐 현상 발생으로 인한 불필요한 인쇄 자원 낭비 및 행정 피로도 누적",
      solution: "12열 대칭 격자를 엄격하게 준수하는 반응형 웹 레이아웃 템플릿 제공 및 1페이지 강제 조판 인쇄 컴파일러 구축",
      marketSize: "국내 비즈니스 서식 다운로드 및 전장 거래 시장 연간 1.2조원 규모 추산",
      bizModel: "프리미엄 템플릿 구독 서비스(월 19,900원) 및 중소기업/정부 전용 API 연동망 공급"
    },
    layout: [
      { type: "title", value: "간이 IR 피치덱 요약본" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "회사 / 프로젝트명", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{projectName}", colSpan: 9, key: "projectName", bold: true }
            ]
          },
          {
            cells: [
              { label: "1. 문제 정의\n(Problem)", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{problem}", colSpan: 9, key: "problem", style: { whiteSpace: "pre-wrap" } }
            ]
          },
          {
            cells: [
              { label: "2. 해결 방안\n(Solution)", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{solution}", colSpan: 9, key: "solution", style: { whiteSpace: "pre-wrap" } }
            ]
          },
          {
            cells: [
              { label: "3. 타깃 시장\n(Market)", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{marketSize}", colSpan: 9, key: "marketSize" }
            ]
          },
          {
            cells: [
              { label: "4. 수익 모델\n(Business Model)", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizModel}", colSpan: 9, key: "bizModel" }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "본 문서는 회사 소개 목적을 위해 제한적으로 작성된 자료로, 동의 없이 재배포를 금지합니다.", style: { fontSize: "8pt", color: "#666666", textAlign: "center" } },
      { type: "spacer" },
      { type: "sign-block", value: "작성 및 문의 : 주식회사 마음테크 대표이사 이대표" }
    ]
  },
  // 44. 표준 사업계획서 요약본
  {
    id: "generic_gov_biz_plan",
    title: "표준 사업계획서 요약본",
    category: "행정",
    desc: "정부 지원 사업이나 정책 자금 신청 시 중소벤처기업부 표준 사업계획서 서식 기준에 맞추어 과제 개요와 주요 내용을 간결하게 작성하는 요약 서식입니다.",
    popular: true,
    tags: ["사업계획서", "정부지원", "창업진흥원", "과제신청", "기획서"],
    fields: [
      { key: "company", label: "신청 기업명", type: "text", placeholder: "주식회사 마음테크" },
      { key: "item", label: "개발 과제명", type: "text", placeholder: "AI 디지털 서식 최적화 조판 시스템" },
      { key: "summary", label: "개발 개요", type: "textarea", placeholder: "서식의 반응형 템플릿 설계 및 자동 폼 매핑" },
      { key: "tech", label: "핵심 기술 목표", type: "textarea", placeholder: "18종 신규 공식 서식의 법률 규격 매핑 모듈 구축" },
      { key: "effect", label: "파급 및 기대 효과", type: "textarea", placeholder: "수기 작성 대비 업무 속도 80% 향상" }
    ],
    initialValues: {
      company: "주식회사 마음테크",
      item: "인공지능 기반 디지털 서식 최적화 조판 시스템 개발",
      summary: "대한민국 법정 공공 서식 및 기업 실무 서식을 웹 브라우저 상에서 정밀 12열 그리드로 자동 정렬하고, 사용자 인쇄 요구에 최적화하여 1페이지 내에 깔끔하게 출력해주는 지능형 템플릿 매핑 엔진 구축 과제입니다.",
      tech: "- 12열 격자 그리드 조판 엔진을 이용한 반응형 렌더링 최적화\n- PDF 인쇄 조판 규격의 픽셀 단위 정렬 제어 엔진 수립\n- 18종의 민관 고수요 법정 서식 패키지 이식",
      effect: "중소기업의 서식 작성 및 법적 증빙 관리 시간을 연간 60시간 이상 절약하고, 관공서 제출 문서 오기율을 90% 이상 절감하여 국가 행정 효율 증진에 기여함."
    },
    layout: [
      { type: "title", value: "정부 지원사업 계획 요약서" },
      { type: "subtitle", value: "1. 과제 기본 개요" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "신청 기관명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{company}", colSpan: 4, key: "company", align: "center" },
              { label: "과제 책임자", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "대표이사 이대표", colSpan: 4, align: "center" }
            ]
          },
          {
            cells: [
              { label: "개발 과제명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{item}", colSpan: 10, key: "item", bold: true }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 개발 세부 내용 및 기대효과" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "사업 및\n개발 개요", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{summary}", colSpan: 10, key: "summary", style: { whiteSpace: "pre-wrap" } }
            ]
          },
          {
            cells: [
              { label: "핵심 연구\n목표 사항", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{tech}", colSpan: 10, key: "tech", style: { whiteSpace: "pre-wrap" } }
            ]
          },
          {
            cells: [
              { label: "시장 파급\n및 기대효과", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{effect}", colSpan: 10, key: "effect", style: { whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "본 요약서는 중소벤처기업부 및 관련 전담기관의 국책과제 신청 자료 규격을 준수하여 신의 성실하게 작성되었습니다.", style: { fontSize: "8pt", color: "#444444" } },
      { type: "spacer" },
      { type: "sign-block", value: "신청기업 : {company} 대표이사 이대표 (인)" }
    ]
  },
  // 45. 표준 연봉계약서
  {
    id: "generic_gov_salary_contract",
    title: "표준 연봉계약서",
    category: "노무",
    desc: "근로기준법상 기본 근로계약과 병행하여 연간 임금 총액과 매월 지급받는 기본급 및 수당의 상세 계산 내역을 확정하는 노무 표준 서식입니다.",
    popular: true,
    tags: ["연봉계약서", "임금계약", "급여", "인사", "근로기준법"],
    fields: [
      { key: "emplyName", label: "근로자 성명", type: "text", placeholder: "김노무" },
      { key: "salary", label: "연봉 총액", type: "text", placeholder: "50,000,000원" },
      { key: "baseSalary", label: "기본급 (월)", type: "text", placeholder: "3,500,000원" },
      { key: "allowance", label: "제수당 (월)", type: "text", placeholder: "666,660원" },
      { key: "payDate", label: "임금 지급일", type: "text", placeholder: "매월 25일" },
      { key: "date", label: "계약 체결일", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      emplyName: "김노무",
      salary: "50,000,000원",
      baseSalary: "3,500,000원",
      allowance: "666,660원",
      payDate: "매월 25일",
      date: ""
    },
    layout: [
      { type: "title", value: "표 준 연 봉 계 약 서" },
      { type: "paragraph", value: "주식회사 마음테크(이하 '갑')와 근로자 {emplyName}(이하 '을')는 신의성실의 원칙에 근거하여 당사자 합의 하에 다음과 같이 연봉 계약을 체결하고 준수할 것을 선언합니다.", style: { margin: "8px 0" } },
      { type: "subtitle", value: "1. 당사자 인적사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "사용자 (갑)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "주식회사 마음테크 대표 이대표", colSpan: 4, align: "center" },
              { label: "근로자 (을)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{emplyName}", colSpan: 4, key: "emplyName", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 연봉 구성 및 지급 방법" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "연봉 총액", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{salary}", colSpan: 9, key: "salary", align: "center", bold: true }
            ]
          },
          {
            cells: [
              { label: "기본급 (월)", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{baseSalary}", colSpan: 3, key: "baseSalary", align: "center" },
              { label: "제수당 (월)", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{allowance}", colSpan: 3, key: "allowance", align: "center" }
            ]
          },
          {
            cells: [
              { label: "지급 방법", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "매월 임금 계산일(1일~말일)을 산정하여 {payDate}에 '을' 명의의 통장으로 이체 지급", colSpan: 9 }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 특약 사항" },
      { type: "paragraph", value: "1) 본 연봉 총액에 포함된 제수당은 소정근로시간 이외에 발생하는 주 12시간 한도의 법정 연장근로, 야간근로 및 휴일근로수당을 미리 포괄 산정한 고정 수당액입니다.\n2) 본 연봉 계약기간은 체결일로부터 당해 연도 12월 31일까지로 하며, 계약 연장 여부는 근무 성적을 기초로 매년 재계약 협상합니다." },
      { type: "spacer" },
      { type: "paragraph", value: "본 계약을 명확히 하고자 2부를 작성하여 서명날인 후 양 당사자가 각각 1부씩 보관합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "사용자 (갑) : 이대표 (인)          근로자 (을) : {emplyName} (인)" }
    ]
  },
  // 46. 유연근로제 합의서
  {
    id: "generic_gov_flexible_work",
    title: "유연근로제 합의서",
    category: "노무",
    desc: "근로기준법에 의거, 기업의 업무 환경 변화와 임직원의 워라밸 향상을 위해 시차출퇴근제, 선택적 근로시간제, 재택근무제 도입 시 작성하는 노사 간의 공식 합의 서식입니다.",
    popular: false,
    tags: ["유연근로제", "시차출퇴근", "재택근무", "탄력근로", "노사합의"],
    fields: [
      { key: "workType", label: "도입 근로제 유형", type: "text", placeholder: "시차출퇴근제 및 재택근무제" },
      { key: "target", label: "적용 대상 직무/임직원", type: "text", placeholder: "개발본부 및 디자인팀 전원" },
      { key: "coreTime", label: "의무 근로 시간 (코어타임)", type: "text", placeholder: "오후 13:00 ~ 오후 16:00" },
      { key: "settlePeriod", label: "합의 정산 단위 기간", type: "text", placeholder: "1개월 단위 정산" },
      { key: "date", label: "합의 체결일", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      workType: "시차출퇴근제 및 재택근무제",
      target: "개발본부 및 디자인팀 전 임직원",
      coreTime: "오후 13:00 ~ 오후 16:00 (의무 근무 시간)",
      settlePeriod: "1개월 단위 정산",
      date: ""
    },
    layout: [
      { type: "title", value: "유연근로시간제 도입 근로자합의서" },
      { type: "paragraph", value: "주식회사 마음테크(사용자)와 회사의 근로자 대표는 근로기준법 제51조 및 제52조에 의거하여, 기업 생산성 제고와 근로 환경의 유연한 확립을 위해 다음과 같이 유연근로시간제 실시에 합의합니다.", style: { margin: "8px 0" } },
      { type: "subtitle", value: "1. 합의 주요 요건" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "도입 근로제", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{workType}", colSpan: 9, key: "workType", bold: true }
            ]
          },
          {
            cells: [
              { label: "적용 대상", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{target}", colSpan: 9, key: "target" }
            ]
          },
          {
            cells: [
              { label: "의무 코어타임", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{coreTime}", colSpan: 9, key: "coreTime" }
            ]
          },
          {
            cells: [
              { label: "정산 단위", colSpan: 3, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{settlePeriod}", colSpan: 9, key: "settlePeriod" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 세부 운영 방침" },
      { type: "paragraph", value: "- 근로자는 코어타임 이외의 시간에는 본인 일정에 맞추어 출퇴근을 자율적으로 결정하되, 주 평균 40시간의 근로 의무를 충족하여야 합니다.\n- 재택근무를 행할 경우, 사전 결재 후 근무 장소(자택) 이탈 없이 상시 연락 체계를 유지하며 근태 의무를 게을리하지 않습니다." },
      { type: "spacer" },
      { type: "paragraph", value: "본 합의는 노사 당사자가 성명 기재하고 서명 또는 날인한 날로부터 유효하며 신의 성실에 기반하여 이행합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "사 측 대 표 : 대표이사 이대표 (인)          근로자 대 표 : 근로자대표 김노무 (인)" }
    ]
  },
  // 47. 시말서 · 경위서
  {
    id: "generic_gov_disciplinary_report",
    title: "시말서 · 경위서",
    category: "노무",
    desc: "사내 규정이나 의무 사항을 성실하게 수행하지 못하고 과실을 입힌 경우, 상세 발생 내역과 사유를 해명하고 본인의 깊은 반성과 재발 방지 대책을 약속하여 사측에 제출하는 경위서 양식입니다.",
    popular: true,
    tags: ["시말서", "경위서", "사고보고서", "경고", "인사발령"],
    fields: [
      { key: "reporter", label: "제출인 성명", type: "text", placeholder: "오실수" },
      { key: "dept", label: "소속 부서", type: "text", placeholder: "마케팅팀 대리" },
      { key: "incidentDate", label: "사건 발생 일시", type: "text", placeholder: "2026년 06월 10일 14:00경" },
      { key: "title", label: "사건명 및 제목", type: "text", placeholder: "회사 소셜미디어 계정 비밀번호 유출" },
      { key: "reason", label: "상세 발생 경위 및 반성", type: "textarea", placeholder: "보안 수칙을 엄수하지 못해 비밀번호를 유출한 사안에 대한 경위 기록" },
      { key: "date", label: "제출 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      reporter: "오실수",
      dept: "마케팅팀 대리",
      incidentDate: "2026년 06월 10일 14:00경",
      title: "회사 소셜미디어 공식 계정 패스워드 유출 사건",
      reason: "회사 마케팅 용역 협력업체와의 광고 세팅 진행 중, 암호화 처리되지 않은 마스터 비밀번호 공유 파일을 부주의하게 첨부하여 수신처가 불분명한 단체 메일로 1회 발송하였습니다. 즉시 상황을 파악하고 패스워드를 2차 OTP를 동반한 최신 비밀번호로 변경하여 타인의 직접 로그인 흔적 및 피해가 없음을 확인하였으나, 사내 정보보안 규정을 엄격하게 인지하고 지키지 못하여 회사 자산 안전에 물의를 일으킨 점 깊이 책임을 느끼며 통절히 반성합니다.",
      date: ""
    },
    layout: [
      { type: "title", value: "시 말 서 (경 위 서)" },
      { type: "subtitle", value: "1. 제출자 및 사고 기본 사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "소 속", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{dept}", colSpan: 4, key: "dept", align: "center" },
              { label: "성 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{reporter}", colSpan: 4, key: "reporter", align: "center" }
            ]
          },
          {
            cells: [
              { label: "사고 일시", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{incidentDate}", colSpan: 10, key: "incidentDate" }
            ]
          },
          {
            cells: [
              { label: "사 건 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{title}", colSpan: 10, key: "title", bold: true }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 사고 경위 및 재발 방지 대책" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "구체적\n상세경위\n및\n다짐", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{reason}", colSpan: 10, key: "reason", style: { height: "130px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "paragraph", value: "본인은 회사 취업규칙 및 상기 정보보안 지침을 불이행하여 회사에 물의와 관리상 손실 우려를 가한 것에 대해 사죄하며, 차후 본 건과 같은 규정 위반 및 불미스러운 사태가 절대 재발하지 않도록 각별히 유의할 것을 약속하여 시말서를 제출합니다.", style: { textIndent: "10px", margin: "6px 0" } },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "서약 및 제출자 : {reporter} (인)          주식회사 마음테크 대표이사 귀하" }
    ]
  },
  // 48. 해고예고 통지서
  {
    id: "generic_gov_layoff_notice",
    title: "해고예고 통지서",
    category: "노무",
    desc: "근로기준법 제26조에 의거하여 해고 30일 이전에 대상자에게 공식적인 해고 사유와 일정을 서면으로 송부하여 정당성을 확보하는 법정 통지서 양식입니다.",
    popular: false,
    tags: ["해고예고통지서", "징계해고", "해고예고수당", "노무", "행정"],
    fields: [
      { key: "targetName", label: "대상 근로자 성명", type: "text", placeholder: "박게으름" },
      { key: "targetDept", label: "대상 근로자 부서", type: "text", placeholder: "고객지원팀 사원" },
      { key: "layoffDate", label: "해고 예정 일자", type: "text", placeholder: "2026년 07월 20일 (30일 전 예고)" },
      { key: "reason", label: "해고 실질 사유", type: "textarea", placeholder: "취업규칙 위반 및 사유 상세 기록" },
      { key: "date", label: "통지서 발송일", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      targetName: "박게으름",
      targetDept: "고객지원팀 사원",
      layoffDate: "2026년 07월 20일 (해고 34일 전 예고)",
      reason: "귀하는 수 차례의 무단 결근 및 지각, 업무 시간 중 업무 배제, 고객 대상 욕설 등으로 사내 징계위원회에 회부되었으며, 총 3회의 시말서 미제출 및 시정 조치 무시 등 사내 취업규칙 제45조(징계 해고 사유)에 해당하여 부득이하게 고용 계약을 해지하게 됨을 알립니다.",
      date: ""
    },
    layout: [
      { type: "title", value: "해 고 예 고 통 지 서" },
      { type: "paragraph", value: "근로기준법 제26조(해고의 예고) 및 동법 제27조(해고사유 등의 서면통지)에 의거하여, 귀하와의 고용 계약이 다음 일정에 해지됨을 미리 공식 통지합니다.", style: { margin: "8px 0" } },
      { type: "subtitle", value: "1. 대상 근로자 인적사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "소 속", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{targetDept}", colSpan: 4, key: "targetDept", align: "center" },
              { label: "성 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{targetName}", colSpan: 4, key: "targetName", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 고용 해지 일정 및 정당 사유" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "해고 예정일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{layoffDate}", colSpan: 10, key: "layoffDate", bold: true, align: "center" }
            ]
          },
          {
            cells: [
              { label: "해고 실질 사유", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{reason}", colSpan: 10, key: "reason", style: { height: "90px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "paragraph", value: "※ 법적 고지: 회사는 근로자에게 30일 전에 정당하게 해고 예고 통지를 송부하였으므로 해고예고수당의 별도 청구 대상에서 제외됩니다. 귀하는 예정일 전까지 담당 사무에 인수인계를 성실하게 완수하여 주시기 바랍니다.", style: { fontSize: "8pt", color: "#e11d48", margin: "6px 0" } },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "발송인 (사용자) : 주식회사 마음테크 대표이사 이대표 (인)          수신인 : {targetName} 귀하" }
    ]
  },
  // 49. 법인 설립 및 사업자등록신청서
  {
    id: "generic_gov_corp_register",
    title: "법인 설립 및 사업자등록신청서",
    category: "행정",
    desc: "신규 설립하는 법인의 상호, 자본금, 대표자 정보 및 업태/종목을 명기하여 관할 세무서에 제출하고 법인 등록 및 사업자번호 발급을 요청하는 법정 행정 서식입니다.",
    popular: true,
    tags: ["법인설립", "사업자등록", "국세청", "세무서", "창업", "행정서식"],
    fields: [
      { key: "corpName", label: "법인명 (상호)", type: "text", placeholder: "주식회사 마음테크" },
      { key: "regNo", label: "법인등록번호", type: "text", placeholder: "110111-2222222" },
      { key: "address", label: "본점 소재지 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14, 5층" },
      { key: "ceo", label: "대표자 성명", type: "text", placeholder: "이대표" },
      { key: "bizType", label: "업 태", type: "text", placeholder: "정보통신업" },
      { key: "bizItem", label: "종 목", type: "text", placeholder: "소프트웨어 개발" },
      { key: "date", label: "신청 등록일", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      corpName: "주식회사 마음테크",
      regNo: "110111-2222222",
      address: "서울특별시 마포구 마포대로 14, 5층 501호",
      ceo: "이대표",
      bizType: "정보통신업",
      bizItem: "소프트웨어 개발 및 공급업",
      date: ""
    },
    layout: [
      { type: "paragraph", value: "■ 법인세법 시행규칙 [별지 제73호서식] <개정 2019. 3. 20.>", style: { fontSize: "7.5pt", color: "#444" } },
      { type: "title", value: "법인설립신고 및 사업자등록신청서" },
      { type: "subtitle", value: "1. 인적사항 및 법인 기본 인적사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "법인명 (상호)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{corpName}", colSpan: 4, key: "corpName", align: "center", bold: true },
              { label: "법인등록번호", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{regNo}", colSpan: 4, key: "regNo", align: "center" }
            ]
          },
          {
            cells: [
              { label: "대표자 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{ceo}", colSpan: 4, key: "ceo", align: "center" },
              { label: "대표자 연락처", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "010-1234-5678", colSpan: 4, align: "center" }
            ]
          },
          {
            cells: [
              { label: "본점 소재지", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{address}", colSpan: 10, key: "address" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 사업장 세부 현황" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "업 태", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizType}", colSpan: 4, key: "bizType", align: "center" },
              { label: "종 목", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{bizItem}", colSpan: 4, key: "bizItem", align: "center" }
            ]
          },
          {
            cells: [
              { label: "자본금 총액", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "50,000,000원", colSpan: 4, align: "center" },
              { label: "개업 연월일", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "2026년 06월 16일", colSpan: 4, align: "center" }
            ]
          }
        ]
      },
      { type: "paragraph", value: "부가가치세법 제8조 및 법인세법 제109조 내지 제111조 규정에 따라 상기 사항과 같이 법인설립신고 및 사업자등록을 신청합니다.", style: { margin: "6px 0", fontSize: "8.5pt" } },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "신청인 대표자 : {ceo} (서명 또는 인)          마포세무서장 귀하" }
    ]
  },
  // 50. 연구소 설립 신고서
  {
    id: "generic_gov_research_lab",
    title: "연구소 설립 신고서",
    category: "행정",
    desc: "기초연구진흥 및 기술개발지원에 관한 법률에 의거하여, 기업부설연구소를 적법하게 설치하고 세제 혜택 및 정부 연구 과제 가점을 받기 위해 과학기술정보통신부에 제출하는 법정 서식입니다.",
    popular: false,
    tags: ["연구소설립", "기업부설연구소", "과학기술정보통신부", "KOITA", "연구개발", "정부신고"],
    fields: [
      { key: "labName", label: "연구소 명칭", type: "text", placeholder: "주식회사 마음테크 부설 AI 연구소" },
      { key: "labAddress", label: "연구소 소재지", type: "text", placeholder: "서울특별시 마포구 마포대로 14, 5층 501호" },
      { key: "labCeo", label: "연구소장 성명", type: "text", placeholder: "김연구" },
      { key: "researchers", label: "연구 전담요원 수", type: "text", placeholder: "3명" },
      { key: "date", label: "신고서 작성일", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      labName: "주식회사 마음테크 부설 AI 연구소",
      labAddress: "서울특별시 마포구 마포대로 14, 5층 501호",
      labCeo: "김연구",
      researchers: "3명 (전담요원)",
      date: ""
    },
    layout: [
      { type: "paragraph", value: "■ 기초연구진흥 및 기술개발지원에 관한 법률 시행규칙 [별지 제1호서식]", style: { fontSize: "7.5pt", color: "#333333" } },
      { type: "title", value: "기업부설연구소 설립신고서" },
      { type: "subtitle", value: "1. 신고인 및 기업 기본 정보" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "신고 기업명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "주식회사 마음테크", colSpan: 4, align: "center" },
              { label: "대표자 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "이대표", colSpan: 4, align: "center" }
            ]
          },
          {
            cells: [
              { label: "연구소 명칭", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{labName}", colSpan: 10, key: "labName", bold: true, align: "center" }
            ]
          },
          {
            cells: [
              { label: "연구소 주소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{labAddress}", colSpan: 10, key: "labAddress" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 연구 인력 및 물적 요건 사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "연구소장 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{labCeo}", colSpan: 4, key: "labCeo", align: "center" },
              { label: "연구 전담 요원", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{researchers}", colSpan: 4, key: "researchers", align: "center" }
            ]
          },
          {
            cells: [
              { label: "물리적 독립공간", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "파티션 및 밀폐형 별도 룸 구획 완료 (전용면적 45㎡)", colSpan: 10 }
            ]
          }
        ]
      },
      { type: "paragraph", value: "기초연구진흥 및 기술개발지원에 관한 법률 제14조의2제1항 및 동법 시행규칙 제5조제1항의 규정에 의거하여 상기 사항과 같이 기업부설연구소를 설립하고 신고합니다.", style: { margin: "5px 0", fontSize: "8.5pt" } },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "신고 대표이사 : 이대표 (인)          과학기술정보통신부장관 귀하" }
    ]
  },
  // 51. 벤처기업 확인 신청 요약서
  {
    id: "generic_gov_venture_cert",
    title: "벤처기업 확인 신청 요약서",
    category: "행정",
    desc: "기술성 및 사업성 평가를 토대로 벤처기업 인증(혁신성장형 등)을 획득하고자 기업의 지재권, 매출 비중, 핵심 성과를 집약하는 공식 심사용 요약서식입니다.",
    popular: true,
    tags: ["벤처인증", "벤처기업", "기술보증기금", "혁신성장", "행정"],
    fields: [
      { key: "company", label: "신청 기업명", type: "text", placeholder: "주식회사 마음테크" },
      { key: "type", label: "벤처 신청 유형", type: "text", placeholder: "혁신성장유형" },
      { key: "coreTech", label: "핵심 혁신 기술명", type: "text", placeholder: "12열 그리드 조판 매핑 엔진" },
      { key: "patent", label: "특허 및 지재권 보유현황", type: "text", placeholder: "특허 출원 1건" },
      { key: "date", label: "작성 신청일", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      company: "주식회사 마음테크",
      type: "혁신성장유형 (벤처 투자 및 연구 개발 종합 평가)",
      coreTech: "12열 대칭 격자 변환 시스템 및 디지털 문서 조판용 픽셀 정렬 알고리즘",
      patent: "특허 출원 1건 완료 (출원번호 10-2026-1234567, '반응형 법정 문서 조판 컴파일 장치')",
      date: ""
    },
    layout: [
      { type: "title", value: "벤처기업 확인 신청 요약서" },
      { type: "subtitle", value: "1. 기업 개요 및 신청 유형" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "기 업 명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{company}", colSpan: 4, key: "company", align: "center", bold: true },
              { label: "대표이사", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "이대표", colSpan: 4, align: "center" }
            ]
          },
          {
            cells: [
              { label: "신청 유형", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{type}", colSpan: 10, key: "type", bold: true }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 기술 혁신성 입증 요소" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "핵심 기술", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{coreTech}", colSpan: 10, key: "coreTech" }
            ]
          },
          {
            cells: [
              { label: "특허 현황", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{patent}", colSpan: 10, key: "patent" }
            ]
          }
        ]
      },
      { type: "paragraph", value: "본 요약서는 벤처기업육성에 관한 특별조치법 제25조제2항에 근거하여 기술성·혁신성 성장요건에 준해 거짓 없이 성실하게 작성된 원본 요약서입니다.", style: { fontSize: "8.5pt", margin: "6px 0" } },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "벤처확인 신청기업 대표자 : 이대표 (인)          벤처기업확인위원회 귀중" }
    ]
  },
  // 52. 영문 비밀유지계약서
  {
    id: "generic_gov_english_nda",
    title: "영문 비밀유지계약서",
    category: "계약",
    desc: "해외 바이어나 외국계 글로벌 기업과의 업무 추진 혹은 기술 검토(M&A 포함) 과정에서 발생하는 핵심 기술의 무단 도용과 누설을 차단하는 영한 혼용 Mutual NDA 표준안 서식입니다.",
    popular: true,
    tags: ["NDA", "비밀유지계약서", "영문계약서", "글로벌", "IP보호", "M&A"],
    fields: [
      { key: "partyA", label: "Party A (Company A)", type: "text", placeholder: "MaumData Co., Ltd." },
      { key: "partyB", label: "Party B (Company B)", type: "text", placeholder: "Global Tech Inc." },
      { key: "purpose", label: "Purpose of Disclosure (목적)", type: "text", placeholder: "Discussion of strategic partnership" },
      { key: "date", label: "Effective Date (계약일)", type: "text", placeholder: "June 16, 2026" }
    ],
    initialValues: {
      partyA: "MaumData Co., Ltd.",
      partyB: "Global Tech Inc.",
      purpose: "Discussion of strategic technical partnership and layout compiler system integration",
      date: ""
    },
    layout: [
      { type: "title", value: "MUTUAL NON-DISCLOSURE AGREEMENT" },
      { type: "paragraph", value: "This Mutual Non-Disclosure Agreement ('Agreement') is entered into by and between the parties hereto to protect the confidential information disclosed for the purpose of assessing a potential business relationship.", style: { fontSize: "8.5pt" } },
      { type: "subtitle", value: "1. Parties to the Agreement (계약 당사자)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "Party A (갑)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{partyA}", colSpan: 4, key: "partyA", align: "center" },
              { label: "Party B (을)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{partyB}", colSpan: 4, key: "partyB", align: "center" }
            ]
          },
          {
            cells: [
              { label: "Purpose\n(공유 목적)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{purpose}", colSpan: 10, key: "purpose" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. Terms and Obligations (핵심 준수사항)" },
      { type: "paragraph", value: "- **Confidentiality**: Neither party shall disclose the other's technical/commercial data to any third party.\n- **Return of Materials**: Upon written request, the receiving party shall immediately return or destroy all documents received.\n- **Injunction**: Unauthorized disclosure may cause irreparable harm, and the disclosing party is entitled to seek court injunctions.", style: { fontSize: "9pt", lineHeight: 1.4 } },
      { type: "spacer" },
      { type: "paragraph", value: "IN WITNESS WHEREOF, the parties have executed this Agreement on the date written below.", style: { fontSize: "8pt", textAlign: "center" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "Party A: {partyA} (Sig)            Party B: {partyB} (Sig)" }
    ]
  },
  // 53. 프리랜서 용역위수탁계약서
  {
    id: "generic_gov_freelancer_contract",
    title: "프리랜서 용역위수탁계약서",
    category: "계약",
    desc: "외주 개발자, 디자이너 등 독립된 프리랜서에게 특정 프로젝트 과업을 위탁하고 용역비 지급 일정, 검수 절차 및 최종 성과물의 저작재산권 귀속 관계를 명확히 하는 표준 실무 계약서입니다.",
    popular: true,
    tags: ["프리랜서", "용역계약서", "위수탁", "외주개발", "디자인외주", "저작권"],
    fields: [
      { key: "client", label: "발주인 (갑) 명칭", type: "text", placeholder: "주식회사 마음테크" },
      { key: "worker", label: "용역자 (을) 성명", type: "text", placeholder: "최디자" },
      { key: "projectName", label: "위탁 용역 과제명", type: "text", placeholder: "UI/UX 고도화 디자인 용역" },
      { key: "price", label: "총 용역 대금", type: "text", placeholder: "3,500,000원" },
      { key: "payTerm", label: "지급 및 대금 결제방식", type: "text", placeholder: "착수 시 50%, 완료 후 50%" },
      { key: "date", label: "계약 일자", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      client: "주식회사 마음테크 대표이사 이대표",
      worker: "최디자",
      projectName: "마음데이터 법정 공식 서식 18종 반응형 UI 및 모듈 교정 용역",
      price: "3,500,000원 (부가가치세 별도)",
      payTerm: "계약 체결 시 선금 50%(1,750,000원), 최종 검수 통과 완료 후 50% 지급",
      date: ""
    },
    layout: [
      { type: "title", value: "프리랜서 용역 위탁 계약서" },
      { type: "paragraph", value: "발주처 {client}(이하 '갑')와 수임인 {worker}(이하 '을')는 신의성실에 의거하여 상기 과업의 이행을 위한 용역위수탁 계약을 다음과 같이 확정합니다.", style: { margin: "8px 0" } },
      { type: "subtitle", value: "1. 당사자 및 위탁 용역 개요" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "발주인 (갑)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{client}", colSpan: 4, key: "client", align: "center" },
              { label: "용역자 (을)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{worker}", colSpan: 4, key: "worker", align: "center" }
            ]
          },
          {
            cells: [
              { label: "용역 과제명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{projectName}", colSpan: 10, key: "projectName", bold: true }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 용역 대금 및 지식재산권 조항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "총 용역대금", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{price}", colSpan: 4, key: "price", bold: true, align: "center" },
              { label: "지급 일정", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "계약 체결 후 분할 송금", colSpan: 4, align: "center" }
            ]
          },
          {
            cells: [
              { label: "대금 지급방식", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{payTerm}", colSpan: 10, key: "payTerm" }
            ]
          },
          {
            cells: [
              { label: "저작권 귀속", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "'을'이 창작하여 납품 완료하고 '갑'의 승인을 득한 최종 산출물의 저작재산권 일체는 잔금 지급 완료와 동시에 자동적으로 '갑'에게 영구 귀속됩니다.", colSpan: 10 }
            ]
          }
        ]
      },
      { type: "spacer" },
      { type: "paragraph", value: "이를 증명하기 위해 계약서 2부를 인쇄하여 기명날인 후 보관합니다.", style: { fontSize: "8.5pt" } },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "발주자 (갑) : 이대표 (인)          수임인 (을) : {worker} (인)" }
    ]
  },
  // 54. 지식재산권 양도 계약서
  {
    id: "generic_gov_ip_transfer",
    title: "지식재산권 양도 계약서",
    category: "계약",
    desc: "특허권, 저작권, 디자인권 등 창작하거나 소유하고 있는 지식재산권의 일체(또는 일부)를 타 기업이나 개인에게 적법하게 이전하고 대금을 확정하는 매매/양도 표준계약 서식입니다.",
    popular: false,
    tags: ["지재권양도", "특허양도", "저작권양수도", "IP양도", "기술이전", "계약서"],
    fields: [
      { key: "transferor", label: "양도인 (갑) 성명", type: "text", placeholder: "김개발" },
      { key: "transferee", label: "양수인 (을) 명칭", type: "text", placeholder: "주식회사 마음테크" },
      { key: "ipDetail", label: "양도 대상 지재권 표시", type: "text", placeholder: "특허 출원 제10-2026-999999호" },
      { key: "price", label: "권리 양도 대금", type: "text", placeholder: "10,000,000원" },
      { key: "date", label: "계약 체결일", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      transferor: "김개발",
      transferee: "주식회사 마음테크 대표이사 이대표",
      ipDetail: "특허 출원 제10-2026-999999호 (그리드 조판 엔진 특허권 및 이에 수반하는 일체의 2차적 저작물 저작재산권)",
      price: "10,000,000원 (원천세 및 세금 별도)",
      date: ""
    },
    layout: [
      { type: "title", value: "지식재산권 양수도 계약서" },
      { type: "paragraph", value: "양도인 {transferor}(이하 '갑')와 양수인 {transferee}(이하 '을')는 '갑' 소유의 지식재산권 권리 이전에 대하여 다음과 같이 합의하고 본 계약을 성실히 준수합니다.", style: { margin: "8px 0" } },
      { type: "subtitle", value: "1. 권리 양수도 기본 개요" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "양도인 (갑)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{transferor}", colSpan: 4, key: "transferor", align: "center" },
              { label: "양수인 (을)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "주식회사 마음테크", colSpan: 4, align: "center" }
            ]
          },
          {
            cells: [
              { label: "양도 대상 권리", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{ipDetail}", colSpan: 10, key: "ipDetail" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 양도 대금 및 권리 변동 신청" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "양도 대금액", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{price}", colSpan: 10, key: "price", bold: true }
            ]
          },
          {
            cells: [
              { label: "권리 이전 의무", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "'갑'은 본 계약 체결 후 3일 이내에 특허청 권리이전 등록에 관한 신청서류를 구비하여 '을'에게 교부하고, '을' 명의로 권리가 완전 이전되도록 일체 협조합니다.", colSpan: 10 }
            ]
          }
        ]
      },
      { type: "paragraph", value: "본 양도 계약 이후 발생할 수 있는 제3자의 권리 침해 및 원천 저작권 하자 주장에 대해서는 '갑'이 책임지고 방어하여 '을'의 손실을 방지합니다.", style: { fontSize: "8.5pt" } },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "양도인 (갑) : {transferor} (인)          양수인 (을) : 이대표 (인)" }
    ]
  },
  // 55. 상가 권리금 표준계약서
  {
    id: "generic_gov_premium_rent",
    title: "상가 권리금 표준계약서",
    category: "계약",
    desc: "국토교통부 표준 권리금 고시 규격을 준수하여, 상가 점포 임대차 이전 시 기존 임차인이 구축한 영업 노하우, 단골 고객, 시설 비품 등의 가치를 합법적으로 신규 임차인에게 양도 및 대금 보장하는 계약서입니다.",
    popular: true,
    tags: ["상가권리금", "권리금계약서", "임대차표준계약서", "상가임대차", "부동산", "행정"],
    fields: [
      { key: "lesseeOld", label: "양도인 (기존 임차인)", type: "text", placeholder: "홍식당" },
      { key: "lesseeNew", label: "양수인 (신규 임차인)", type: "text", placeholder: "최가게" },
      { key: "shopName", label: "상가 상호 / 업종", type: "text", placeholder: "마음돈까스 마포점" },
      { key: "address", label: "상가 소재지 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14, 1층" },
      { key: "premium", label: "총 합의 권리금액", type: "text", placeholder: "50,000,000원" },
      { key: "date", label: "계약 체결일", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      lesseeOld: "홍식당 대표 홍길동",
      lesseeNew: "최가게 대표 최영수",
      shopName: "마음돈까스 마포점 (일식 분식 전문점)",
      address: "서울특별시 마포구 마포대로 14, 1층 102호 (도화동)",
      premium: "50,000,000원",
      date: ""
    },
    layout: [
      { type: "paragraph", value: "■ 국토교통부 고시 제2018-000호 상가권리금 표준서식 규격안", style: { fontSize: "7.5pt", color: "#333" } },
      { type: "title", value: "상가건물 임대차 권리금 표준계약서" },
      { type: "subtitle", value: "1. 당사자 및 대상 상가 점포" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "양도인 (기존)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{lesseeOld}", colSpan: 4, key: "lesseeOld", align: "center" },
              { label: "양수인 (신규)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{lesseeNew}", colSpan: 4, key: "lesseeNew", align: "center" }
            ]
          },
          {
            cells: [
              { label: "상호 및 업종", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{shopName}", colSpan: 4, key: "shopName", align: "center" },
              { label: "점포 소재지", colSpan: 6, key: "address" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 권리금 대금액 및 양도 항목" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "총 권리금액", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{premium}", colSpan: 10, key: "premium", bold: true, align: "center" }
            ]
          },
          {
            cells: [
              { label: "양도 범위", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "- 영업시설 · 집기 비품 및 인테리어 기재 물품 일체\n- 단골 영업처 신용망 및 축적된 레시피 노하우 전수\n- 점포 임차권리 보장 및 입지적 지리적 가치 보장", colSpan: 10 }
            ]
          }
        ]
      },
      { type: "paragraph", value: "본 계약은 건물 임대인의 신규 임대차계약 체결 승인을 전제로 하며, 임대인의 계약 거절 등 귀책 없이 신규 임대차 불성립 시 본 권리금 계약은 조건 없이 무효로 하고 수령한 계약금은 지체 없이 전액 반환합니다.", style: { fontSize: "8pt", textAlign: "justify" } },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "양도인 (갑) : {lesseeOld} (인)          양수인 (을) : {lesseeNew} (인)" }
    ]
  },
  // 56. 계약갱신요구권 행사/거절 통지서
  {
    id: "generic_gov_rent_renewal",
    title: "계약갱신요구권 행사/거절 통지서",
    category: "계약",
    desc: "주택 및 상가 건물 임대차보호법에 의거, 계약 종료 2개월 전까지 임차인이 갱신 요구권을 적법하게 행사하거나 임대인이 법적 정당 사유를 들어 거절할 때 증빙으로 사용하는 내용증명용 서식입니다.",
    popular: false,
    tags: ["계약갱신", "계약갱신요구권", "임대차3법", "거절통지", "내용증명", "부동산"],
    fields: [
      { key: "sender", label: "발신인 (임차인/임대인)", type: "text", placeholder: "홍임차 (임차인)" },
      { key: "receiver", label: "수신인 (임대인/임차인)", type: "text", placeholder: "김임대 (임대인)" },
      { key: "address", label: "대상 주택/상가 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14, 101동 502호" },
      { key: "option", label: "의사 표시 행사 구분", type: "text", placeholder: "계약갱신요구권 행사 통지" },
      { key: "date", label: "통지 발송일", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      sender: "홍임차 (임차인)",
      receiver: "김임대 (임대인)",
      address: "서울특별시 마포구 마포대로 14, 아파트 101동 502호",
      option: "주택임대차보호법 제6조의3에 의거한 임차인의 계약갱신요구권 행사",
      date: ""
    },
    layout: [
      { type: "title", value: "계약갱신 의사표시 통지서" },
      { type: "subtitle", value: "1. 당사자 및 임대차 목적 부동산" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "발신인 (송신)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{sender}", colSpan: 4, key: "sender", align: "center" },
              { label: "수신인 (수신)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{receiver}", colSpan: 4, key: "receiver", align: "center" }
            ]
          },
          {
            cells: [
              { label: "대상 임대건물", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{address}", colSpan: 10, key: "address" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 통지 의결 사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "의사표시 구분", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{option}", colSpan: 10, key: "option", bold: true }
            ]
          }
        ]
      },
      { type: "paragraph", value: "발신인은 관련 임대차 보호법률의 규정에 따라, 임대차 종료일 전 6개월부터 2개월 전까지의 행사 기한 내에 상기 갱신청구(또는 정당 사유에 의한 갱신거절)의 의사표시를 서면 발송하며, 본 서면은 향후 분쟁 조정 또는 소송 절차 시 확실한 의사 도달의 증거 자료로 활용됨을 알립니다.", style: { lineHeight: 1.6, textAlign: "justify" } },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "발신 통지인 : {sender} (서명 또는 인)          수신인 귀중" }
    ]
  },
  // 57. 상속재산 분할협의서
  {
    id: "generic_gov_inheritance_agreement",
    title: "상속재산 분할협의서",
    category: "계약",
    desc: "피상속인의 사망 시 상속인 전원이 합의 하에 상속재산(부동산, 예금 등)의 분할 비율과 취득 형태를 약정하고 관공서 소유권 이전 등기에 증빙 서류로 제출하는 법정 상속 양식입니다.",
    popular: true,
    tags: ["상속분할", "상속협의서", "상속재산", "부동산상속", "민사", "법원"],
    fields: [
      { key: "ancestor", label: "피상속인 (망자) 성명", type: "text", placeholder: "망 홍길동" },
      { key: "deathDate", label: "사망 일시", type: "text", placeholder: "2026년 05월 10일" },
      { key: "heirA", label: "공동상속인 A 인적사항", type: "text", placeholder: "홍큰아들 (상속지분 60%)" },
      { key: "heirB", label: "공동상속인 B 인적사항", type: "text", placeholder: "홍작은아들 (상속지분 40%)" },
      { key: "distribution", label: "상속재산 분할협의 상세내역", type: "textarea", placeholder: "상속재산별 지분 취득 내역" },
      { key: "date", label: "협의 성립일", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      ancestor: "망 홍길동",
      deathDate: "2026년 05월 10일",
      heirA: "홍큰아들 (상속인, 800101-1234567, 서울 거주)",
      heirB: "홍작은아들 (상속인, 850505-1234567, 부산 거주)",
      distribution: "1. 피상속인 소유의 서울특별시 마포구 마포대로 14 아파트 101동 502호 부동산 소유권 일체는 공동상속인 홍큰아들의 단독 소유로 취득한다.\n2. 피상속인 명의의 국민은행 정기예금 잔액 50,000,000원은 공동상속인 홍작은아들이 전액 취득 및 상속한다.",
      date: ""
    },
    layout: [
      { type: "title", value: "상속재산 분할협의서" },
      { type: "paragraph", value: "피상속인의 사망으로 인하여 공동상속인 전원은 민법 제1013조에 의거하여 피상속인의 상속재산에 대해 상호 전원 원만하게 분할하기로 아래와 같이 합의하고 약정합니다.", style: { margin: "8px 0" } },
      { type: "subtitle", value: "1. 피상속인 (사망자)" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "피상속인 성명", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{ancestor}", colSpan: 4, key: "ancestor", align: "center", bold: true },
              { label: "사망 일자", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{deathDate}", colSpan: 4, key: "deathDate", align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 공동 상속인 인적사항" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "상속인 A", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{heirA}", colSpan: 10, key: "heirA" }
            ]
          },
          {
            cells: [
              { label: "상속인 B", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{heirB}", colSpan: 10, key: "heirB" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 상속 재산의 분할 협의 상세 내역" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "상속 재산\n협의 내역", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{distribution}", colSpan: 10, key: "distribution", style: { height: "110px", verticalAlign: "top", whiteSpace: "pre-wrap" } }
            ]
          }
        ]
      },
      { type: "paragraph", value: "위 공동상속인 전원은 상기 분할 협의 사항에 이의가 없음을 명확히 증명하며, 등기 신청 및 소유권 이전 절차 등을 위해 본 협의서에 각자 서명 날인합니다.", style: { fontSize: "8.5pt", margin: "6px 0" } },
      { type: "spacer" },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "공동상속인 A : 홍큰아들 (인)          공동상속인 B : 홍작은아들 (인)" }
    ]
  }
,
// 58. 부동산 매매계약서 (서울중앙지법 표준 생활속계약서형)
  {
    id: "generic_gov_real_estate_sale",
    title: "부동산 매매계약서",
    category: "계약",
    desc: "서울중앙지방법원 '생활 속의 계약서' 표준 예시를 준수하여, 매도인과 매수인 간 부동산 표시, 매매대금 지급조건(계약금/중도금/잔금) 및 권리 이전 의무를 명확히 기록하는 계약서입니다.",
    popular: true,
    tags: ["부동산매매", "매매계약서", "부동산직거래", "아파트매매", "토지매매", "법원서식"],
    fields: [
      { key: "seller", label: "매도인 성명", type: "text", placeholder: "김매도" },
      { key: "buyer", label: "매수인 성명", type: "text", placeholder: "이매수" },
      { key: "address", label: "부동산 소재지 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "price", label: "매매 대금 총액", type: "text", placeholder: "500,000,000원" },
      { key: "downPayment", label: "계약금 및 지급 약정", type: "text", placeholder: "50,000,000원 (계약 시 지급)" },
      { key: "interimPayment", label: "중도금 및 지급일", type: "text", placeholder: "150,000,000원 (2026.07.16)" },
      { key: "balance", label: "잔금 및 지급 예정일", type: "text", placeholder: "300,000,000원 (2026.08.16)" },
      { key: "date", label: "계약 체결일", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      seller: "김매도",
      buyer: "이매수",
      address: "서울특별시 마포구 마포대로 14, 101동 202호 (도화동, 마포아파트)",
      price: "500,000,000원",
      downPayment: "50,000,000원 (계약 시 지급 및 영수)",
      interimPayment: "150,000,000원 (2026년 07월 16일 무통장 입금)",
      balance: "300,000,000원 (2026년 08월 16일 인도와 동시에 지급)",
      date: ""
    },
    layout: [
      { type: "title", value: "부 동 산 매 매 계 약 서" },
      { type: "paragraph", value: "매도인 {seller}(이하 '갑')와 매수인 {buyer}(이하 '을')는 당사자 간의 합의에 따라 아래 기재의 부동산을 매매계약 체결하고 성실히 이행할 것을 서약합니다.", style: { margin: "8px 0" } },
      { type: "subtitle", value: "1. 부동산의 표시" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "소재지 주소", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{address}", colSpan: 10, key: "address" }
            ]
          },
          {
            cells: [
              { label: "토지 면적", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "대지권 비율 84.9㎡", colSpan: 4, align: "center" },
              { label: "건물 면적", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "전용면적 84.9㎡ (아파트)", colSpan: 4, align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 매매 대금 및 변제 기일 조건" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "매매 대금", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{price}", colSpan: 10, key: "price", bold: true, align: "center" }
            ]
          },
          {
            cells: [
              { label: "계 약 금", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{downPayment}", colSpan: 10, key: "downPayment" }
            ]
          },
          {
            cells: [
              { label: "중 도 금", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{interimPayment}", colSpan: 10, key: "interimPayment" }
            ]
          },
          {
            cells: [
              { label: "잔   금", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{balance}", colSpan: 10, key: "balance" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 인도 및 권리 이전 특약 조항" },
      { type: "paragraph", value: "1) '갑'은 잔금 지급과 동시에 '을'에게 소유권 이전등기 신청에 필요한 일체의 서류를 제공하고 대상 부동산을 사실상 인도합니다.\
2) '갑'은 인도 전까지 국세/지방세 완납 및 부동산에 설정된 저당권, 가압류 등의 물권 제한사항을 완전히 소멸시켜 깨끗한 소유권을 양도합니다.\
3) 계약 당사자의 일방이 채무불이행 시 상대방은 서면 독촉 후 계약을 해제하고 위약금으로 계약금 상당액을 청구할 수 있습니다.", style: { fontSize: "8.5pt", lineHeight: 1.5 } },
      { type: "spacer" },
      { type: "paragraph", value: "본 계약의 성립을 증명하기 위해 계약서 2부를 인쇄하여 각자 서명 날인 후 보관합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "매도인 (갑) : {seller} (인)          매수인 (을) : {buyer} (인)" }
    ]
  },
  // 59. 부동산 임대차계약서 (서울중앙지법 표준 생활속계약서형)
  {
    id: "generic_gov_real_estate_rent",
    title: "부동산 임대차계약서",
    category: "계약",
    desc: "서울중앙지방법원 및 법무부 임대차 표준 가이드를 반영하여 임대인과 임차인 간 보증금 및 차임(월세) 거래 조건, 계약 기간, 임대 조건 및 원상복구 의무를 기재하는 계약 서식입니다.",
    popular: true,
    tags: ["부동산임대차", "임대차계약서", "월세계약서", "전세계약서", "직거래", "원상복구", "법원서식"],
    fields: [
      { key: "landlord", label: "임대인 성명", type: "text", placeholder: "박임대" },
      { key: "tenant", label: "임차인 성명", type: "text", placeholder: "최임차" },
      { key: "address", label: "임대차 부동산 주소", type: "text", placeholder: "서울특별시 마포구 마포대로 14" },
      { key: "deposit", label: "임대 보증금", type: "text", placeholder: "100,000,000원" },
      { key: "monthlyRent", label: "월세 (차임)", type: "text", placeholder: "500,000원 (매월 25일 후불)" },
      { key: "term", label: "임대차 계약 기간", type: "text", placeholder: "24개월 (2026.07.01 ~ 2028.06.30)" },
      { key: "date", label: "계약 체결일", type: "text", placeholder: "2026년 06월 16일" }
    ],
    initialValues: {
      landlord: "박임대",
      tenant: "최임차",
      address: "서울특별시 마포구 마포대로 14, 101동 202호 (도화동, 마포아파트)",
      deposit: "100,000,000원",
      monthlyRent: "500,000원 (매월 25일 을 명의로 송금)",
      term: "2026년 07월 01일부터 2028년 06월 30일까지 (24개월)",
      date: ""
    },
    layout: [
      { type: "title", value: "부 동 산 임 대 차 계 약 서" },
      { type: "paragraph", value: "임대인 {landlord}(이하 '갑')와 임차인 {tenant}(이하 '을')는 상호 신의 하에 아래의 부동산에 대하여 임대차 계약을 체결하고 준수할 것을 약정합니다.", style: { margin: "8px 0" } },
      { type: "subtitle", value: "1. 부동산의 표시" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "임대차 목적지", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{address}", colSpan: 10, key: "address" }
            ]
          },
          {
            cells: [
              { label: "임대 부문", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "건물 전체 (아파트)", colSpan: 4, align: "center" },
              { label: "주요 용도", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "주거용 단독 주택", colSpan: 4, align: "center" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "2. 계약 및 지불 조건" },
      {
        type: "table",
        rows: [
          {
            cells: [
              { label: "임대 보증금", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{deposit}", colSpan: 10, key: "deposit", bold: true, align: "center" }
            ]
          },
          {
            cells: [
              { label: "월세 (차임)", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{monthlyRent}", colSpan: 10, key: "monthlyRent" }
            ]
          },
          {
            cells: [
              { label: "임대 기한", colSpan: 2, bold: true, align: "center", bg: "#f9fafb" },
              { label: "{term}", colSpan: 10, key: "term" }
            ]
          }
        ]
      },
      { type: "subtitle", value: "3. 선량한 관리의 의무 특약" },
      { type: "paragraph", value: "1) '을'은 '갑'의 사전 동의 없이 해당 부동산의 용도를 변경하거나, 구조 개축 또는 전대할 수 없습니다.\
2) 계약 기간 만료 시 '을'은 임대 목적물을 원상태로 온전히 회복하여 '갑'에게 명도 반환합니다.\
3) '을'이 월세(차임) 연체액을 총 2회 분에 이르도록 밀리는 경우 '갑'은 본 임대차 계약을 최고 없이 해지할 수 있습니다.", style: { fontSize: "8.5pt", lineHeight: 1.5 } },
      { type: "spacer" },
      { type: "paragraph", value: "본 임대 계약 성립의 증명을 위해 계약서 2부를 인쇄하여 각자 서명 날인 후 보관합니다." },
      { type: "paragraph", value: "{date}", style: { fontSize: "9.5pt", fontWeight: "bold", textAlign: "center", margin: "4px 0" } },
      { type: "spacer" },
      { type: "sign-block", value: "임대인 (갑) : {landlord} (인)          임차인 (을) : {tenant} (인)" }
    ]
  }
];

export function getTemplateById(id: string): DocumentTemplate | undefined {
  return TEMPLATES.find((tpl) => tpl.id === id);
}

