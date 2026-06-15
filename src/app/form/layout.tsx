import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | 마음데이터 FORM",
    default: "무료 직장 서식 & 스마트 양식 센터",
  },
  description: "사직서, 이력서, 근로계약서, 기안서, 회의록, 견적서, 차용증 등 직장인 필수 서식 12종을 회원가입 없이 무료로 다운로드하고 실시간 웹에서 작성하여 A4 PDF로 즉시 저장하세요.",
  keywords: ["사직서 양식", "무료 이력서 다운로드", "근로계약서 양식", "기안서 양식", "무료 문서 서식", "마음데이터 FORM"],
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
