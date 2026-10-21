import { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 계약서 영구 보관함 | 마음데이타 전자계약",
  description: "마음데이타에서 작성하고 체결한 전자계약서를 클라우드 보관함에서 언제 어디서든 안전하게 열람하고 PDF로 인쇄하세요.",
  alternates: {
    canonical: "/contracts",
  },
  openGraph: {
    title: "내 계약서 영구 보관함 | 마음데이타",
    description: "작성하고 서명한 계약서를 영구 보관하고 관리하는 마음데이타 클라우드 전자계약 보관함입니다.",
    url: "https://www.maumdata.com/contracts",
    type: "website",
  },
};

export default function ContractsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
