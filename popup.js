function setStatus(text, dotState) {
  document.getElementById("status").textContent = text;
  var dot = document.getElementById("statusDot");
  dot.className = "status-dot" + (dotState ? " status-dot--" + dotState : "");
}

document.getElementById("settingsButton").addEventListener("click", function () {
  chrome.runtime.openOptionsPage();
});

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  var currentURL = tabs[0] && tabs[0].url ? new URL(tabs[0].url) : null;
  var onLeetCode = currentURL && currentURL.hostname === "leetcode.com";
  var commitButton = document.getElementById("commitButton");

  if (!onLeetCode) {
    setStatus("Open a LeetCode problem to use LeetHub.", null);
    return;
  }

  chrome.storage.local.get(["githubOwner", "githubRepo", "githubToken"], function (r) {
    if (!r.githubToken || !r.githubOwner || !r.githubRepo) {
      setStatus("Not connected — open Settings to connect GitHub.", "warn");
      return;
    }
    setStatus("Watching for an accepted submission.", "ok");
    document.getElementById("repoOwner").textContent = r.githubOwner;
    document.getElementById("repoName").textContent = r.githubRepo;
    document.getElementById("repoPath").hidden = false;
    commitButton.hidden = false;
  });

  commitButton.addEventListener("click", function () {
    chrome.tabs.sendMessage(tabs[0].id, { type: "MANUAL_COMMIT" });
  });
});
