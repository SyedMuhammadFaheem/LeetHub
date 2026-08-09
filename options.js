function refreshStatus() {
  chrome.storage.local.get(["githubOwner", "githubRepo", "githubToken", "authMethod"], function (r) {
    document.getElementById("owner").value = r.githubOwner || "";
    document.getElementById("repo").value = r.githubRepo || "";
    var status = document.getElementById("authStatus");
    var dot = document.getElementById("statusDot");
    if (r.githubToken) {
      status.textContent = "Connected via " + (r.authMethod === "oauth" ? "GitHub OAuth" : "Personal Access Token") + ".";
      dot.className = "status-dot status-dot--ok";
    } else {
      status.textContent = "Not connected.";
      dot.className = "status-dot status-dot--warn";
    }
  });
}

document.getElementById("saveRepo").addEventListener("click", function () {
  chrome.storage.local.set({
    githubOwner: document.getElementById("owner").value.trim(),
    githubRepo: document.getElementById("repo").value.trim(),
  });
});

document.getElementById("savePat").addEventListener("click", function () {
  var token = document.getElementById("token").value.trim();
  if (!token) return;
  chrome.storage.local.set({ githubToken: token, authMethod: "pat" }, refreshStatus);
});

document.getElementById("signOut").addEventListener("click", function () {
  chrome.storage.local.remove(["githubToken", "authMethod"], refreshStatus);
});

document.getElementById("connectOAuth").addEventListener("click", function () {
  if (!GITHUB_CLIENT_ID || GITHUB_CLIENT_ID === "REPLACE_ME") {
    alert("Set GITHUB_CLIENT_ID in lib/config.js first (register a GitHub OAuth App with Device Flow enabled).");
    return;
  }
  fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, scope: "repo" }),
  })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      document.getElementById("deviceCodeBox").hidden = false;
      document.getElementById("userCode").textContent = data.user_code;
      var link = document.getElementById("verificationLink");
      link.href = data.verification_uri;
      link.textContent = data.verification_uri;
      window.open(data.verification_uri, "_blank");
      chrome.runtime.sendMessage({
        type: "START_DEVICE_POLL",
        deviceCode: data.device_code,
        interval: data.interval,
      });
    });
});

chrome.runtime.onMessage.addListener(function (message) {
  if (message && message.type === "DEVICE_FLOW_COMPLETE") {
    document.getElementById("deviceCodeBox").hidden = true;
    if (message.ok) {
      refreshStatus();
    } else {
      document.getElementById("authStatus").textContent = "Connection failed: " + message.error;
    }
  }
});

refreshStatus();
