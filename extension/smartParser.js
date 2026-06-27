/**
 * 스마트 마음 계산기 자연어 파서 및 연산 엔진 (Chrome Extension MV3용 Vanilla JS)
 */

const UNIT_MULTIPLIERS = {
  // 한국어 / 일본어 / 중국어
  '억': 100000000,
  '億': 100000000,
  '만': 10000,
  '万': 10000,
  '萬': 10000,
  '천': 1000,
  '백': 100,
  '십': 10,
  
  // 글로벌 (K, M, B, T)
  'k': 1000,
  'K': 1000,
  'm': 1000000,
  'M': 1000000,
  'b': 1000000000,
  'B': 1000000000,
  't': 1000000000000,
  'T': 1000000000000,
  
  // 베트남어
  'tr': 1000000,
  'TR': 1000000,
  'tỷ': 1000000000,
  'TỶ': 1000000000,
};

const KOREAN_DIGITS = {
  '일': '1', '이': '2', '삼': '3', '사': '4', '오': '5',
  '육': '6', '칠': '7', '팔': '8', '구': '9', '열': '10'
};

function replaceKoreanDigits(text) {
  let result = text;
  for (const [kor, num] of Object.entries(KOREAN_DIGITS)) {
    result = result.replace(new RegExp(kor, 'g'), num);
  }
  return result;
}

function preprocessKoreanUnits(text) {
  let result = text;
  result = result.replace(/(\d+(?:\.\d+)?)\s*억\s*([1-9])\s*천(?!\s*만)/g, '$1억 $2천만');
  result = result.replace(/(\d+(?:\.\d+)?)\s*억\s*([1-9])\s*백(?!\s*만)/g, '$1억 $2백만');
  result = result.replace(/(\d+(?:\.\d+)?)\s*억\s*([1-9])\s*십(?!\s*만)/g, '$1억 $2십만');
  result = result.replace(/(\d+(?:\.\d+)?)\s*億\s*([1-9])\s*千(?!\s*万)/g, '$1億 $2千万');
  return result;
}

function parseNaturalLanguageToExpression(input) {
  let clean = input.replace(/,/g, '');
  clean = replaceKoreanDigits(clean);
  clean = preprocessKoreanUnits(clean);
  clean = clean.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1 * 0.01)');
  
  const unitRegex = /(\d+(?:\.\d+)?)\s*(억|만|천|백|십|万|億|萬|k|K|m|M|b|B|t|T|tỷ|tr|TR)\b/gi;
  const asianUnitRegex = /(\d+(?:\.\d+)?)\s*(억|만|천|백|십|万|億|萬|tỷ|tr|TR)/g;
  
  const replacer = (match, numStr, unit) => {
    const multiplier = UNIT_MULTIPLIERS[unit] || UNIT_MULTIPLIERS[unit.toLowerCase()];
    if (multiplier) {
      const num = parseFloat(numStr);
      return (num * multiplier).toString();
    }
    return match;
  };
  
  let prevReplace;
  do {
    prevReplace = clean;
    clean = clean.replace(unitRegex, replacer);
    clean = clean.replace(asianUnitRegex, replacer);
  } while (clean !== prevReplace);
  
  let prevClean;
  do {
    prevClean = clean;
    clean = clean.replace(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/g, '$1 + $2');
  } while (clean !== prevClean);
  
  return clean;
}

function evaluateExpression(expression) {
  const tokens = [];
  let i = 0;
  const expr = expression.replace(/\s+/g, '');
  
  while (i < expr.length) {
    const char = expr[i];
    
    if (char === '+' || char === '-' || char === '*' || char === '/' || char === '(' || char === ')') {
      if (char === '-' && (tokens.length === 0 || tokens[tokens.length - 1] === '(' || ['+', '-', '*', '/'].includes(tokens[tokens.length - 1]))) {
        let numStr = '-';
        i++;
        while (i < expr.length && (/[0-9.]/).test(expr[i])) {
          numStr += expr[i];
          i++;
        }
        if (numStr === '-') {
          tokens.push('-');
        } else {
          tokens.push(numStr);
        }
        continue;
      }
      tokens.push(char);
      i++;
    } else if (/[0-9.]/.test(char)) {
      let numStr = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        numStr += expr[i];
        i++;
      }
      tokens.push(numStr);
    } else {
      return null;
    }
  }
  
  if (tokens.length === 0) return null;
  
  const outputQueue = [];
  const operatorStack = [];
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
  
  for (const token of tokens) {
    if (!isNaN(Number(token))) {
      outputQueue.push(token);
    } else if (token === '(') {
      operatorStack.push(token);
    } else if (token === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        outputQueue.push(operatorStack.pop());
      }
      if (operatorStack.length === 0) return null;
      operatorStack.pop();
    } else if (['+', '-', '*', '/'].includes(token)) {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '(' &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(operatorStack.pop());
      }
      operatorStack.push(token);
    } else {
      return null;
    }
  }
  
  while (operatorStack.length > 0) {
    const op = operatorStack.pop();
    if (op === '(' || op === ')') return null;
    outputQueue.push(op);
  }
  
  const evalStack = [];
  for (const token of outputQueue) {
    if (!isNaN(Number(token))) {
      evalStack.push(Number(token));
    } else {
      if (evalStack.length < 2) return null;
      const b = evalStack.pop();
      const a = evalStack.pop();
      switch (token) {
        case '+': evalStack.push(a + b); break;
        case '-': evalStack.push(a - b); break;
        case '*': evalStack.push(a * b); break;
        case '/': 
          if (b === 0) return 0;
          evalStack.push(a / b); 
          break;
        default: return null;
      }
    }
  }
  
  if (evalStack.length !== 1) return null;
  return evalStack[0];
}

function parseSmartNotes(text, locale = 'ko') {
  const lines = text.split('\n');
  const variables = {};
  const results = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('#')) {
      results.push({ lineIndex: index, originalText: line, result: null, error: false });
      return;
    }
    
    let expressionPart = trimmed;
    let varName = null;
    
    if (trimmed.includes('=')) {
      const parts = trimmed.split('=');
      const namePart = parts[0].trim();
      if (/^[a-zA-Z가-힣0-9_]+$/.test(namePart)) {
        varName = namePart;
        expressionPart = parts.slice(1).join('=').trim();
      }
    }
    
    let exprWithVars = expressionPart;
    const sortedVarNames = Object.keys(variables).sort((a, b) => b.length - a.length);
    for (const name of sortedVarNames) {
      exprWithVars = exprWithVars.split(name).join(variables[name].toString());
    }
    
    const parsedExpr = parseNaturalLanguageToExpression(exprWithVars);
    let valResult = evaluateExpression(parsedExpr);
    let isError = false;
    
    if (valResult === null && !isNaN(Number(parsedExpr.trim()))) {
      valResult = parseFloat(parsedExpr.trim());
    } else if (valResult === null && parsedExpr.trim() !== '') {
      isError = true;
    }
    
    if (varName && valResult !== null) {
      variables[varName] = valResult;
    }
    
    results.push({
      lineIndex: index,
      originalText: line,
      cleanText: expressionPart,
      variableName: varName,
      expression: parsedExpr,
      result: valResult,
      error: isError
    });
  });
  
  return results;
}

function formatNumberToReadableLocale(num, locale) {
  if (num === null) return '';
  if (isNaN(num) || !isFinite(num)) return 'Error';
  const absNum = Math.abs(num);
  const isNegative = num < 0;
  
  // locale 정규화 ('zh-tw' -> 'zh-tw')
  const normLocale = locale.toLowerCase();
  
  if (normLocale === 'ko' || normLocale === 'ja' || normLocale === 'zh-tw' || normLocale === 'zh_tw') {
    if (absNum === 0) return '0';
    const units = normLocale === 'ko' ? ['', '만', '억', '조', '경'] :
                  normLocale === 'ja' ? ['', '万', '億', '兆', '京'] :
                  ['', '萬', '億', '兆', '京'];
    const result = [];
    let temp = Math.floor(absNum);
    const remainder = absNum - temp;
    let unitIndex = 0;
    while (temp > 0) {
      const chunk = temp % 10000;
      if (chunk > 0) {
        const chunkStr = chunk.toLocaleString(normLocale === 'ko' ? 'ko-KR' : normLocale === 'ja' ? 'ja-JP' : 'zh-TW');
        result.unshift(`${chunkStr}${units[unitIndex]}`);
      }
      temp = Math.floor(temp / 10000);
      unitIndex++;
    }
    let finalStr = result.join(' ');
    if (remainder > 0) {
      const dec = remainder.toFixed(4).replace(/^0/, '').replace(/0+$/, '');
      if (dec !== '.') finalStr += dec;
    }
    const currencyUnit = normLocale === 'ko' ? ' 원' : normLocale === 'ja' ? ' 円' : ' 元';
    return (isNegative ? '-' : '') + finalStr + currencyUnit;
  }
  
  if (normLocale === 'vi') {
    if (absNum === 0) return '0 VND';
    if (absNum >= 1000000000) return `${(num / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ VND`;
    if (absNum >= 1000000) return `${(num / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tr VND`;
    return `${num.toLocaleString('vi-VN')} VND`;
  }
  
  const suffix = normLocale === 'es' ? ' EUR' : ' USD';
  if (absNum === 0) return `0${suffix}`;
  if (absNum >= 1000000000000) return `${(num / 1000000000000).toLocaleString('en-US', { maximumFractionDigits: 2 })}T${suffix}`;
  if (absNum >= 1000000000) return `${(num / 1000000000).toLocaleString('en-US', { maximumFractionDigits: 2 })}B${suffix}`;
  if (absNum >= 1000000) return `${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 2 })}M${suffix}`;
  if (absNum >= 1000) return `${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 })}K${suffix}`;
  return `${num.toLocaleString('en-US')}${suffix}`;
}

// 브라우저 또는 모듈 환경 수출
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseSmartNotes,
    formatNumberToReadableLocale,
    parseNaturalLanguageToExpression,
    evaluateExpression
  };
}
