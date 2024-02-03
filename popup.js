function saveCredentials(username, repo, token, fileName) {
  chrome.storage.local.set({
    username: username,
    repo: repo,
    token: token,
  });
}

function loadCredentials() {
  chrome.storage.local.get(["username", "repo", "token"], function (result) {
    const username = result.username || "";
    const repo = result.repo || "";
    const token = result.token || "";

    document.getElementById("username").value = username;
    document.getElementById("repo").value = repo;
    document.getElementById("token").value = token;
  });
}

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var currentURL = tabs[0].url;
    var urlPattern = /^https:\/\/leetcode\.com\/submissions\/detail\/\d*\/?$/;

    console.log(urlPattern.test(currentURL))


  
  if (urlPattern.test(currentURL)) {
    document.getElementById(
      "popupContent"
    ).innerHTML = `<label for="username">GitHub Username:</label>
        <input type="text" id="username" />
        
        <label for="repo">GitHub Repository:</label>
        <input type="text" id="repo" />
        
        <label for="token">Personal Access Token:</label>
        <input type="text" id="token" />
        
        <button id="commitButton">Commit to GitHub</button>`;
    loadCredentials();
    document
      .getElementById("commitButton")
      .addEventListener("click", function () {
        const username = document.getElementById("username").value;
        const repo = document.getElementById("repo").value;
        const token = document.getElementById("token").value;

        saveCredentials(username, repo, token);
        console.log(username, repo, token);
        chrome.tabs.executeScript(tabs[0].id, { file: "content.js" });
      });
  } 

  
});
