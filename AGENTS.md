<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 개발 지침 (Development Guidelines)

## 가짜/폴백 데이터 전면 금지 규칙 (No Fake/Fallback Data Rule)
- 외부 API 호출(KIPRIS, DART, 조달청 등)이 한도 초과 또는 일시적인 오류로 실패하는 경우, **가짜 데이터(폴백 데이터셋, Mock 데이터)를 절대로 사용하지 마십시오.**
- 데이터가 수집되지 않으면 그냥 해당 부분을 **빈 상태(비어 있음)로 유지**하십시오. 가짜 데이터를 노출하여 사용자를 오도하는 것보다, 실제 정상 데이터를 조회하지 못했을 때 비어 있게 두는 것이 당사 개발 원칙입니다.

