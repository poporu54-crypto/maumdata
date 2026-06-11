/**
 * 대한민국 국세청 표준 사업자등록번호 체크섬 검증 함수
 * @param bNo 사업자등록번호 (하이픈 포함 혹은 미포함 10자리 숫자 문자열)
 * @returns 유효한 사업자등록번호 체계인지 여부 (수학적 검증)
 */
export function validateBizrNo(bNo: string): boolean {
  const cleanBNo = bNo.replace(/[^0-9]/g, "");
  if (cleanBNo.length !== 10) return false;

  // 000-00-00000과 같이 0으로만 채워진 번호 걸러내기
  if (/^0+$/.test(cleanBNo)) return false;

  const key = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;

  // 1. 앞 8자리와 가중치 곱하여 합산
  for (let i = 0; i < 8; i++) {
    sum += parseInt(cleanBNo[i], 10) * key[i];
  }

  // 2. 9번째 자리에 5를 곱한 뒤 십의 자리와 일의 자리를 분리해서 합산
  const lastMultiply = parseInt(cleanBNo[8], 10) * 5;
  sum += Math.floor(lastMultiply / 10) + (lastMultiply % 10);

  // 3. 합계를 10으로 나눈 나머지
  const remainder = sum % 10;

  // 4. 체크 디지트 계산 및 최종 10번째 자리 대조
  const checkDigit = (10 - remainder) % 10;
  return checkDigit === parseInt(cleanBNo[9], 10);
}
