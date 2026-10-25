import { Metadata } from "next";

export const metadata: Metadata = {
  title: "대한민국 기업 실데이터 인사이트 & 매출·고용 리더보드",
  description:
    "국세청 사업자 상태 검증, 국민연금 가입 임직원 및 DART 재무제표를 실시간 SQL로 직접 집계한 업종별·지역별 기업 분포 및 매출·고용 상위 기업 리더보드입니다.",
  alternates: {
    canonical: "/insights",
  },
  openGraph: {
    title: "대한민국 기업 실데이터 인사이트 | 마음데이타",
    description:
      "추정치 없이 실제 국세청·국민연금·DART 검증 데이터를 집계한 업종·시도별 분포 및 매출·고용 상위 기업 랭킹을 확인하세요.",
    url: "https://www.maumdata.com/insights",
    type: "website",
  },
};

export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
