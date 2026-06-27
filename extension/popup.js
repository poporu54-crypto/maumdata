document.getElementById("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  
  const query = document.getElementById("search-input").value.trim();
  const errorEl = document.getElementById("error-msg");
  
  if (query.length < 2) {
    errorEl.innerText = "두 글자 이상 입력해 주세요.";
    errorEl.classList.remove("hidden");
    return;
  }
  
  errorEl.classList.add("hidden");
  
  chrome.runtime.sendMessage({
    type: "TRIGGER_SIDEPANEL_OPEN",
    text: query
  });
  
  window.close();
});
