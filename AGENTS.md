<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 개발 지침 (Development Guidelines)

## 가짜/폴백 데이터 전면 금지 규칙 (No Fake/Fallback Data Rule)
- 외부 API 호출(KIPRIS, DART, 조달청 등)이 한도 초과 또는 일시적인 오류로 실패하는 경우, **가짜 데이터(폴백 데이터셋, Mock 데이터)를 절대로 사용하지 마십시오.**
- 데이터가 수집되지 않으면 그냥 해당 부분을 **빈 상태(비어 있음)로 유지**하십시오. 가짜 데이터를 노출하여 사용자를 오도하는 것보다, 실제 정상 데이터를 조회하지 못했을 때 비어 있게 두는 것이 당사 개발 원칙입니다.

## 트래픽·전송량 절약 및 프리패치·쿼리 최적화 헌법 (Traffic & Prefetch Optimization Rules)
1. **모든 `<Link>` 컴포넌트 `prefetch={false}` 의무화 및 시맨틱 `<a href>` 유지**
   - 페이지·컴포넌트를 신설하거나 수정할 때 `next/link`의 모든 `<Link>` 태그(기업/서식 카드 그리드, 랭킹 표, 디렉토리, 연관 추천, 헤더/푸터/모바일 탭바 포함)에는 **예외 없이 `prefetch={false}`를 명시**합니다.
   - 이를 통해 스크롤만으로 클릭하지 않은 수십~수백 건의 백그라운드 RSC 요청이 발사되어 서버 트래픽·DB 비용이 폭증하거나 Cloudflare 속도 제한(Rate Limit 429)에 일반 유저가 차단되는 현상을 원천 방지합니다.
   - 단, 검색엔진(Googlebot, Yeti) 크롤링 품질 유지를 위해 내부 페이지 이동은 `<button onClick={router.push}>`가 아닌 `<Link href="..." prefetch={false}>`(`<a href>`) 구조를 반드시 유지합니다.

2. **프리패치·단순 조회 시 사이드이펙트(조회수 증가·외부 공공 API 동기화) 원천 차단**
   - 순수 DB 조회 함수(`getBusinessByBNo` 등) 내부에 `view_count + 1` `UPDATE`나 `business_view_logs` `INSERT` 등 쓰기(Write) 쿼리를 절대 포함하지 않습니다.
   - 조회수 기록(`recordBusinessView`) 및 자가치유·백그라운드 외부 API 수집(국세청·금융위·국민연금·공정위·DART·조달청·특허청)은 반드시 `isPrefetchRequest()`(`next-router-prefetch`, `purpose: prefetch`, `sec-purpose` 등 검사)가 `false`인 실제 사용자 진입 시에만 실행합니다.
   - 이미 동기화 완료 시각(`dartLastSyncAt`, `bidsLastSyncAt`, `patentsLastSyncAt`, `ntsLastSyncAt`, `npsLastSyncAt`)이 기록된 기업에 대해 매 조회마다 외부 API를 재호출하거나 하위 테이블을 반복 `DELETE`/`INSERT`하지 않도록 필드명(카멜/스네이크 케이스) 매핑을 엄격히 검증합니다.

3. **요청 단위 중복 쿼리 제거(`React.cache`) 및 병렬·단건 인덱스 조회 필수**
   - 동적 상세 페이지(`/biz/[b_no]`, `/form/[templateId]`, `/stats/market-area/[dongCd]` 등)에서 `generateMetadata()`와 페이지 본문 컴포넌트가 동일한 DB 로더를 중복 실행하지 않도록 반드시 `React.cache()`로 단일화합니다.
   - 서로 독립된 하위 이력 테이블 조회는 직렬 `await` 대신 `Promise.all`로 병렬 실행하여 RTT를 줄이고, 블랙리스트(`invalid_businesses`) 등 존재 여부 확인은 전체 테이블 풀스캔(`SELECT *`) 대신 반드시 PK 단건 조회(`SELECT 1 ... WHERE b_no = $1 LIMIT 1`)를 사용합니다.

4. **목록·카탈로그 오버페칭(Over-fetching) 금지 및 공통 통계 캐싱**
   - 검색(`/search`), 서식 카탈로그(`/form`), 통계·인사이트 목록에서는 카드 표시에 필요한 최소 요약 컬럼만 `SELECT`·직렬화하고 `LIMIT`(페이지네이션/더보기)을 강제하며, 전체 입력 필드 배열이나 대용량 상세 본문을 목록 초기 응답이나 `localStorage`에 통째로 담지 않습니다.
   - 동일 업종 평균(`industryGroupStatsCache`)이나 전체 DB 거시 집계처럼 여러 요청에서 공통으로 참조되는 고비용 SQL 집계는 서버 메모리 캐시 또는 ISR(`revalidate`) 캐시를 적용해 반복 연산을 차단합니다.

5. **클라이언트 중복 `fetch` 금지 및 온디맨드 지연 로딩**
   - 서버 컴포넌트(SSR/ISR)에서 이미 전달한 초기 데이터를 클라이언트 마운트(`useEffect`) 시점에 다시 `fetch`하지 않으며, 검색·자동완성 요청에는 디바운스(`250ms+`)를 적용하고 무거운 모달·스캐너·에디터는 실제 사용자 액션 시점에 지연 로드합니다.

