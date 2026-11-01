import React from "react";
import { Metadata } from "next";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "개인정보처리방침 | 마음데이타",
  description: "지윤 주식회사가 운영하는 마음데이타(MaumData) 서비스의 개인정보처리방침입니다.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "개인정보처리방침 | 마음데이타",
    description: "지윤 주식회사가 운영하는 마음데이타(MaumData) 서비스의 개인정보처리방침입니다.",
    url: "https://www.maumdata.com/privacy",
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <div className="animate-fade-in" style={{ padding: "40px 0 80px 0" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        <div className="card" style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "28px" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 850, color: "var(--color-text-main)", marginBottom: "8px" }}>
              개인정보처리방침
            </h1>
            <p style={{ fontSize: "0.95rem", color: "var(--color-text-desc)" }}>
              시행일자: 2026년 11월 2일
            </p>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: 0 }} />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              lineHeight: "1.7",
              color: "var(--color-text-sub)",
              fontSize: "0.95rem",
            }}
          >
            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제1조 (개인정보의 처리 목적)
              </h2>
              <p>
                <strong>지윤 주식회사</strong>(이하 &ldquo;회사&rdquo;)는 이용자의 개인정보를 중요하게 생각하며,
                「개인정보 보호법」, 「전자문서 및 전자거래 기본법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등
                관련 법령을 준수하고 있습니다. 회사는 수집한 개인정보를 다음의 목적을 위해서만 처리하며, 목적이 변경되는
                경우에는 관련 법령에 따라 사전 동의를 받습니다.
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li>
                  <strong>기업 데이터 및 상권 통계 서비스 제공</strong>: 실시간 사업자 상태 검증, 공공데이터 통합 기업
                  리포트 제공, 상권·인구 분포 통계 시각화.
                </li>
                <li>
                  <strong>전자문서 작성 및 비대면 전자계약 서비스 운영</strong>: 무료 표준 서식 작성·인쇄 지원, 전자계약
                  보관함 계정 식별(이메일·카카오·구글 간편 로그인), 비대면 전자서명 요청 발송, 당사자 본인 확인(보안 PIN),
                  체결 계약서의 위·변조 방지 및 원본 증적 보관.
                </li>
                <li>
                  <strong>고객 문의·피드백 및 기업 정보 정정 처리</strong>: 서비스 오류 제보 응대, 기업 관계자·방문자의
                  기업 정보 수정 제안 검토 및 처리 결과 안내.
                </li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제2조 (처리하는 개인정보의 항목)
              </h2>
              <p>
                회사는 회원가입 없이도 사업자 조회·통계 열람·일반 서식 작성 서비스를 이용할 수 있도록 운영하며, 이용자가
                선택한 기능에 한하여 최소한의 개인정보만 수집합니다.
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>
                  <strong>1. 서비스 이용 시 자동 생성·수집 항목</strong>: 접속 IP 주소, 쿠키(Cookie), 방문 및 서비스 이용
                  기록, 브라우저 및 운영체제(OS) 정보.
                </li>
                <li>
                  <strong>2. 전자계약 보관함 회원가입 및 소셜 로그인 시</strong>:
                  <br />- 이메일 간편 가입: 이메일 주소, 이름(또는 담당자명), 회사/상호명(선택), 단방향 암호화된 비밀번호 해시값.
                  <br />- 소셜 로그인(카카오·구글): 소셜 제공자 고유 식별값, 이메일 주소, 프로필 이름(닉네임).
                </li>
                <li>
                  <strong>3. 비대면 전자계약 발송 및 서명 체결 시</strong>: 계약 당사자(갑·을)의 성명/상호, 연락처(휴대전화번호),
                  이메일 주소(입력 시), 사업자등록번호(입력 시), 계약 본문 기재 항목, 자필 전자서명 이미지, 서명 완료 일시 및
                  서명 시점 접속 IP 주소(전자서명 부인방지 및 진본성 증적 목적).
                </li>
                <li>
                  <strong>4. 고객 피드백 및 기업 정보 수정 제안 시</strong>: 회신용 이메일 주소 또는 연락처(이용자가 직접 입력한
                  경우), 문의·제안 본문, 접수 페이지 URL.
                </li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제3조 (개인정보의 처리 및 보유 기간)
              </h2>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>
                  <strong>전자계약 보관함 계정 정보</strong>: 회원 탈퇴 시 <strong>즉시 파기</strong>합니다. 이용자는 전자계약
                  보관함 상단의 <code>[계정 탈퇴]</code> 기능을 통해 언제든지 직접 계정을 즉시 삭제할 수 있습니다.
                </li>
                <li>
                  <strong>체결 완료된 전자계약 원본 및 서명 증적</strong>: 계약 당사자 간 권리·의무 확인 및 분쟁 예방,
                  「전자문서 및 전자거래 기본법」·「상법」 등 관련 법령에 따른 거래 증빙 보관을 위하여 계약 체결일로부터{" "}
                  <strong>5년간 암호화 분리 보관</strong> 후 파기합니다(미체결 상태에서 발송자가 삭제한 문서는 보관함에서 즉시
                  제외).
                </li>
                <li>
                  <strong>고객 문의·피드백 및 기업 정보 수정 제안 기록</strong>: 민원 및 검토 처리가 완료된 날로부터{" "}
                  <strong>3년간</strong> 보관 후 파기합니다.
                </li>
                <li>
                  <strong>서비스 접속 로그</strong>: 「통신비밀보호법」에 따라 <strong>3개월간</strong> 보관 후 자동 파기합니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제4조 (개인정보의 제3자 제공)
              </h2>
              <p>
                회사는 이용자의 개인정보를 제1조에서 명시한 범위 내에서만 처리하며, 이용자의 사전 동의가 있거나 법령의
                특별한 규정에 해당하는 경우를 제외하고는 외부 제3자에게 제공하지 않습니다. 단, 비대면 전자계약 서비스의
                특성상 계약 당사자(갑·을) 상호 간에는 해당 계약서에 기재된 상대방 정보 및 서명 사실이 공유됩니다.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제5조 (개인정보 처리 위탁 및 클라우드 인프라 운영)
              </h2>
              <p>
                회사는 안정적인 서비스 제공과 전자계약 원본의 무결성 보관을 위하여 아래와 같이 검증된 글로벌 클라우드
                인프라 및 인증 사업자를 이용하고 있습니다.
              </p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li>
                  <strong>Cloudflare, Inc. (Cloudflare R2 Object Storage)</strong>: 전자계약 원본 문서 및 서명 증적 데이터의
                  암호화 저장·보관.
                </li>
                <li>
                  <strong>Neon, Inc. &amp; Vercel Inc.</strong>: 클라우드 데이터베이스(PostgreSQL) 운영 및 웹 애플리케이션
                  서버 호스팅.
                </li>
                <li>
                  <strong>주식회사 카카오 / Google LLC</strong>: 이용자가 소셜 간편 로그인을 선택한 경우의 OAuth 2.0 본인
                  인증 연동.
                </li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제6조 (정보주체의 권리·의무 및 행사방법)
              </h2>
              <p>
                이용자는 언제든지 자신의 개인정보에 대해 열람·정정·삭제·처리정지를 요구할 수 있습니다. 전자계약 보관함
                회원은 로그인 후 보관함 화면의 <code>[계정 탈퇴]</code> 버튼을 클릭하여 계정 정보를 즉시 삭제할 수 있으며,
                추가적인 권리 행사는 개인정보 보호책임자 이메일(poporu54@gmail.com)로 요청하시면 지체 없이 조치합니다.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제7조 (개인정보의 안전성 확보 조치)
              </h2>
              <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 기술적·관리적 보호조치를 적용하고 있습니다.</p>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li>
                  <strong>암호화 및 위·변조 방지</strong>: 비밀번호는 솔트 기반 단방향 해시(<code>scrypt</code>)로 암호화
                  저장하며, 모든 구간에 SSL/TLS 암호화 통신을 적용합니다. 체결 완료된 전자계약 증적은 덮어쓰기가 차단된
                  불변(Immutable) 객체로 분리 보관합니다.
                </li>
                <li>
                  <strong>인증 및 접근 통제</strong>: 사용자 및 관리자 세션에 서버 비밀키 기반 HMAC-SHA256 전자서명 쿠키
                  (<code>HttpOnly</code>)와 비대면 계약 6자리 보안 PIN 및 요청 횟수 제한(Rate Limit)을 적용합니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "12px" }}>
                제8조 (🛡️ 개인정보 보호 담당조직)
              </h2>
              <p>
                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및
                피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
              </p>
              <div
                style={{
                  backgroundColor: "var(--bg-color-main)",
                  padding: "20px 24px",
                  borderRadius: "12px",
                  marginTop: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                  🛡️ 개인정보 보호 담당조직
                </div>
                <div>
                  <strong>개인정보 보호책임자:</strong> 박상욱
                </div>
                <div>
                  <strong>문의 이메일:</strong> poporu54@gmail.com
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-desc)", marginTop: "4px" }}>
                  * 마음데이타 서비스와 관련된 개인정보보호 문의 및 불만을 신속하게 처리해 드립니다.
                </div>
              </div>
            </section>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: 0 }} />

          <div
            style={{
              backgroundColor: "var(--bg-color-main)",
              padding: "24px",
              borderRadius: "12px",
              fontSize: "0.85rem",
              color: "var(--color-text-desc)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <h3 style={{ fontWeight: 800, color: "var(--color-text-sub)", fontSize: "0.9rem", marginBottom: "8px" }}>
              사업자 및 서비스 운영 정보
            </h3>
            <div>• 상호명: 지윤 주식회사</div>
            <div>• 대표자: 박상욱</div>
            <div>• 사업자등록번호: 137-86-51839</div>
            <div>• 이메일 문의: poporu54@gmail.com</div>
            <div>• 웹사이트: https://www.maumdata.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}
