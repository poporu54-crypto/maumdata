import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

const DART_API_KEY = "0ee2cc9103b1efb7f69767eee411270a9a1fc4a7";
const CACHE_FILE_PATH = path.join(process.cwd(), "src/data/dart_codes.json");

interface DartMapData {
  byName: { [key: string]: string };
  byStock: { [key: string]: string };
}

// 회사 이름 정제 함수 (노이즈 단어 제거하여 일치 확률 극대화)
function sanitizeCorpName(name: string): string {
  return name
    .replace(/\(.*?\)/g, "")
    .replace(/주식회사/g, "")
    .replace(/\(주\)/g, "")
    .replace(/\s+/g, "")
    .trim();
}

/**
 * OpenDART API로부터 전체 고유번호 xml zip 파일을 받아 파싱하여 로컬 캐시 JSON 파일을 생성/업데이트합니다.
 */
export async function updateDartCodesCache(): Promise<void> {
  const url = `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${DART_API_KEY}`;
  console.log("[DART Map] Downloading corpCode.xml from OpenDART...");

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`OpenDART corpCode HTTP error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("[DART Map] Extracting zip file...");
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    const corpCodeEntry = zipEntries.find((entry) => entry.entryName === "CORPCODE.xml");

    if (!corpCodeEntry) {
      throw new Error("CORPCODE.xml not found in DART zip archive");
    }

    console.log("[DART Map] Parsing CORPCODE.xml...");
    const xmlContent = corpCodeEntry.getData().toString("utf-8");

    const byName: { [key: string]: string } = {};
    const byStock: { [key: string]: string } = {};

    const listRegex = /<list>([\s\S]*?)<\/list>/g;
    let match;
    let count = 0;

    while ((match = listRegex.exec(xmlContent)) !== null) {
      const block = match[1];
      const corpCodeMatch = /<corp_code>(\d{8})<\/corp_code>/.exec(block);
      const corpNameMatch = /<corp_name>(.*?)<\/corp_name>/.exec(block);
      const stockCodeMatch = /<stock_code>(.*?)<\/stock_code>/.exec(block);

      if (corpCodeMatch && corpNameMatch) {
        const corpCode = corpCodeMatch[1];
        const corpName = corpNameMatch[1].trim();
        const stockCode = stockCodeMatch ? stockCodeMatch[1].trim() : "";

        // 일반 이름 매핑
        byName[corpName] = corpCode;

        // 정제된 이름 매핑 (검색율 향상)
        const cleanName = sanitizeCorpName(corpName);
        if (cleanName) {
          byName[cleanName] = corpCode;
        }

        // 상장 종목코드 매핑
        if (stockCode && stockCode.length === 6) {
          byStock[stockCode] = corpCode;
        }
        count++;
      }
    }

    const cacheData: DartMapData = { byName, byStock };
    
    // src/data 디렉토리 생성 보장
    const dirPath = path.dirname(CACHE_FILE_PATH);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cacheData, null, 2), "utf-8");
    console.log(`[DART Map] Cache successfully updated. Parsed ${count} companies.`);
  } catch (error) {
    console.error("[DART Map] Failed to update DART codes cache:", error);
    throw error;
  }
}

/**
 * 법인명 또는 종목코드로 DART 8자리 고유번호(corp_code)를 조회합니다.
 */
export async function findDartCode(corpName: string, stockCode?: string): Promise<string> {
  // 1. 캐시 파일이 존재하지 않는 경우 최초 생성
  if (!fs.existsSync(CACHE_FILE_PATH)) {
    try {
      await updateDartCodesCache();
    } catch (e) {
      console.error("[DART Map] First time cache generation failed, returning empty.");
      return "";
    }
  }

  try {
    const fileContent = fs.readFileSync(CACHE_FILE_PATH, "utf-8");
    const data = JSON.parse(fileContent) as DartMapData;

    // 2. 종목코드로 검색 시도 (가장 정확한 1:1 매칭)
    if (stockCode && stockCode.trim().length === 6) {
      const cleanStock = stockCode.trim();
      if (data.byStock[cleanStock]) {
        console.log(`[DART Map] Found DART code by stock code [${cleanStock}]: ${data.byStock[cleanStock]}`);
        return data.byStock[cleanStock];
      }
    }

    // 3. 법인명 완전 일치 검색
    const trimmedName = corpName.trim();
    if (data.byName[trimmedName]) {
      console.log(`[DART Map] Found DART code by exact name [${trimmedName}]: ${data.byName[trimmedName]}`);
      return data.byName[trimmedName];
    }

    // 4. 정제된 법인명 검색
    const cleanName = sanitizeCorpName(corpName);
    if (data.byName[cleanName]) {
      console.log(`[DART Map] Found DART code by sanitized name [${cleanName}]: ${data.byName[cleanName]}`);
      return data.byName[cleanName];
    }

    console.warn(`[DART Map] DART code not found for company: ${corpName}`);
    return "";
  } catch (error) {
    console.error("[DART Map] Error reading DART codes cache:", error);
    return "";
  }
}
