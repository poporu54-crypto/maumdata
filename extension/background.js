// Install context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "maumdata-quick-biz-search",
    title: "마음데이터로 기업 조회하기",
    contexts: ["selection"]
  });
  
  // 크롬 116+ 지원: 아이콘 클릭 시 사이드패널이 열리도록 설정
  if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

// Fallback routing helper if sidepanel cannot be opened programmatically
function openFallbackTab(text) {
  const cleanNum = text.replace(/[^0-9]/g, "");
  let destUrl = `https://www.maumdata.com/search?query=${encodeURIComponent(text)}`;
  if (cleanNum.length === 10) {
    destUrl = `https://www.maumdata.com/biz/${cleanNum}`;
  }
  chrome.tabs.create({ url: destUrl });
}

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "maumdata-quick-biz-search") {
    const text = info.selectionText ? info.selectionText.trim() : "";
    if (!text) return;
    
    // Save to local storage for sidepanel to read
    await chrome.storage.local.set({ 
      "draggedText": text,
      "lastUpdated": Date.now() 
    });

    // Open side panel
    if (chrome.sidePanel && typeof chrome.sidePanel.open === 'function') {
      chrome.sidePanel.open({ windowId: tab.windowId }, () => {
        if (chrome.runtime.lastError) {
          openFallbackTab(text);
        } else {
          chrome.runtime.sendMessage({ 
            type: "DRAGGED_TEXT_UPDATED", 
            text: text
          }).catch(() => {});
        }
      });
    } else {
      openFallbackTab(text);
    }
  }
});

// Handle messages from content.js (Floating button)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TRIGGER_SIDEPANEL_OPEN") {
    const text = message.text ? message.text.trim() : "";
    if (!text) return;

    // Save to local storage
    chrome.storage.local.set({ 
      "draggedText": text,
      "lastUpdated": Date.now() 
    });

    const windowId = sender.tab ? sender.tab.windowId : null;

    if (chrome.sidePanel && typeof chrome.sidePanel.open === 'function') {
      if (windowId !== null) {
        try {
          chrome.sidePanel.open({ windowId: windowId }, () => {
            if (chrome.runtime.lastError) {
              openFallbackTab(text);
            } else {
              chrome.runtime.sendMessage({ 
                type: "DRAGGED_TEXT_UPDATED", 
                text: text
              }).catch(() => {});
            }
          });
        } catch (err) {
          openFallbackTab(text);
        }
      }
    } else {
      openFallbackTab(text);
    }
  }
});
