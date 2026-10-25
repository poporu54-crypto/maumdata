import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "비대면 전자계약 서명",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignContractLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
