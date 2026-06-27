// content.js - 웹페이지 드래그 텍스트 기반 마음데이터 퀵 연동
let quickBizBtn = null;
let currentSelectedText = "";

function createFloatingButton() {
  if (quickBizBtn) return;

  quickBizBtn = document.createElement("div");
  quickBizBtn.id = "maumdata-floating-btn";
  quickBizBtn.title = "마음데이터 비서로 기업 조회하기";
  
  const icon = document.createElement("span");
  icon.className = "maumdata-btn-icon";
  icon.innerText = "🏢";
  quickBizBtn.appendChild(icon);

  const label = document.createElement("span");
  label.className = "maumdata-btn-label";
  label.innerText = "기업정보 조회";
  quickBizBtn.appendChild(label);

  quickBizBtn.addEventListener("mousedown", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentSelectedText) {
      chrome.runtime.sendMessage({
        type: "TRIGGER_SIDEPANEL_OPEN",
        text: currentSelectedText
      });
    }

    hideFloatingButton();
  });

  document.body.appendChild(quickBizBtn);
}

function showFloatingButton(x, y) {
  createFloatingButton();
  quickBizBtn.style.left = `${x}px`;
  quickBizBtn.style.top = `${y}px`;
  quickBizBtn.classList.add("visible");
}

function hideFloatingButton() {
  if (quickBizBtn) {
    quickBizBtn.classList.remove("visible");
  }
}

function isValidQuery(str) {
  if (!str) return false;
  const clean = str.trim();
  
  // 1. 사업자등록번호 형식 감지 (대시 포함 3자리-2자리-5자리)
  const bizNoReg = /^\d{3}-\d{2}-\d{5}$/;
  if (bizNoReg.test(clean)) {
    return true;
  }
  
  // 2. 회사명 식별을 위한 법인 키워드 체크 (글자수 제한: 25자 이하의 단수 라인 대상)
  if (clean.length >= 3 && clean.length <= 25 && !clean.includes("\n")) {
    const corpKeywords = [
      "(주)", "주식회사",
      "(유)", "유한회사",
      "(합)", "합자회사",
      "합명회사",
      "농업법인회사", "농업회사법인"
    ];
    
    // 키워드가 문자열 내에 포함되어 있는지 검사
    const hasKeyword = corpKeywords.some(keyword => clean.includes(keyword));
    if (hasKeyword) {
      return true;
    }
  }
  
  return false;
}

document.addEventListener("mouseup", (e) => {
  if (quickBizBtn && quickBizBtn.contains(e.target)) return;

  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (isValidQuery(selectedText)) {
      currentSelectedText = selectedText;

      const x = e.pageX - 45;
      const y = e.pageY + 12;

      showFloatingButton(x, y);
    } else {
      hideFloatingButton();
      currentSelectedText = "";
    }
  }, 10);
});

document.addEventListener("mousedown", (e) => {
  if (quickBizBtn && !quickBizBtn.contains(e.target)) {
    hideFloatingButton();
  }
});
