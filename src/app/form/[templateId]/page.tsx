import { Metadata } from "next";
import { getTemplateByIdFromDB } from "@/lib/db";
import { getTemplateById } from "../templatesData";
import DocumentEditor from "./DocumentEditor";

interface PageProps {
  params: Promise<{ templateId: string }>;
}

// 1. 동적 SEO 메타데이터 생성 (검색엔진 최적화)
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { templateId } = await props.params;
  
  // 로컬 혹은 DB에서 템플릿 정보 로드
  const tpl = getTemplateById(templateId) || await getTemplateByIdFromDB(templateId);
  
  if (!tpl) {
    return {
      title: "서식을 찾을 수 없습니다 - 마음데이터",
      description: "요청하신 무료 문서 서식 양식을 찾을 수 없거나 삭제되었습니다."
    };
  }

  // 템플릿의 카테고리 태그 및 상세 설명을 활용한 맞춤형 SEO 최적화
  return {
    title: `무료 ${tpl.title} 양식 (즉시 작성/인쇄) | 마음데이터 FORM`,
    description: tpl.desc || `${tpl.title} 서식의 필수 항목들을 회원가입 없이 실시간으로 작성하고, 최적화된 A4 비율의 PDF로 저장 및 즉시 인쇄해보세요.`,
    keywords: [...(tpl.tags || []), tpl.title, "무료서식", "A4인쇄", "마음데이터"],
    openGraph: {
      title: `무료 ${tpl.title} 양식 (즉시 작성/인쇄) | 마음데이터 FORM`,
      description: tpl.desc || `${tpl.title} 서식을 웹에서 타이핑하여 즉시 PDF로 저장하고 A4 인쇄하세요.`,
      type: "website"
    }
  };
}

// 2. 서버 컴포넌트 렌더러
export default async function Page(props: PageProps) {
  const { templateId } = await props.params;

  // 서버 단에서 서식 데이터 pre-fetch
  const tpl = getTemplateById(templateId) || await getTemplateByIdFromDB(templateId);

  // 클라이언트 에디터 컴포넌트로 데이터 넘기기
  return <DocumentEditor templateId={templateId} initialTemplate={tpl} />;
}
