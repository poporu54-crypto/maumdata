import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTemplateByIdFromDB } from "@/lib/db";
import { getTemplateById } from "../templatesData";
import DocumentEditor from "./DocumentEditor";

interface PageProps {
  params: Promise<{ templateId: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { templateId } = await props.params;
  const tpl = getTemplateById(templateId) || (await getTemplateByIdFromDB(templateId));
  const canonicalPath = `/form/${templateId}`;

  if (!tpl) {
    return {
      title: "서식을 찾을 수 없습니다",
      description: "요청하신 무료 문서 서식 양식을 찾을 수 없거나 삭제되었습니다.",
      robots: {
        index: false,
        follow: false,
      },
      alternates: {
        canonical: canonicalPath,
      },
    };
  }

  return {
    // form/layout.tsx의 "%s | 마음데이타 FORM" 템플릿과 결합되어 중복 없이 1회만 출력됨
    title: `무료 ${tpl.title} 양식 (즉시 작성/인쇄)`,
    description:
      tpl.desc ||
      `${tpl.title} 서식의 필수 항목들을 회원가입 없이 실시간으로 작성하고, 최적화된 A4 비율의 PDF로 저장 및 즉시 인쇄해보세요.`,
    keywords: [...(tpl.tags || []), tpl.title, "무료서식", "A4인쇄", "마음데이타"],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `무료 ${tpl.title} 양식 (즉시 작성/인쇄) | 마음데이타 FORM`,
      description:
        tpl.desc || `${tpl.title} 서식을 웹에서 타이핑하여 즉시 PDF로 저장하고 A4 인쇄하세요.`,
      url: `https://www.maumdata.com${canonicalPath}`,
      type: "website",
    },
  };
}

export default async function Page(props: PageProps) {
  const { templateId } = await props.params;
  const tpl = getTemplateById(templateId) || (await getTemplateByIdFromDB(templateId));

  if (!tpl) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    name: `${tpl.title} 표준 양식`,
    description:
      tpl.desc || `${tpl.title} 서식을 웹에서 작성하고 A4 PDF·한글·워드로 저장할 수 있는 무료 비즈니스 양식입니다.`,
    url: `https://www.maumdata.com/form/${templateId}`,
    inLanguage: "ko-KR",
    isAccessibleForFree: true,
    genre: tpl.category || "비즈니스 서식",
    publisher: {
      "@type": "Organization",
      name: "마음데이타",
      url: "https://www.maumdata.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DocumentEditor templateId={templateId} initialTemplate={tpl} />
    </>
  );
}
