importScripts("lib/config.js");

var DEVICE_CODE_URL = "https://github.com/login/device/code";
var ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";

var pollTimer = null;

function startDevicePoll(deviceCode, intervalSeconds) {
  clearTimeout(pollTimer);
  var interval = (intervalSeconds || 5) * 1000;

  function poll() {
    fetch(ACCESS_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        device_code: deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.access_token) {
          chrome.storage.local.set({ githubToken: data.access_token, authMethod: "oauth" });
          chrome.runtime.sendMessage({ type: "DEVICE_FLOW_COMPLETE", ok: true });
          return;
        }
        if (data.error === "authorization_pending") {
          pollTimer = setTimeout(poll, interval);
        } else if (data.error === "slow_down") {
          interval += 5000;
          pollTimer = setTimeout(poll, interval);
        } else {
          chrome.runtime.sendMessage({ type: "DEVICE_FLOW_COMPLETE", ok: false, error: data.error });
        }
      })
      .catch(function (err) {
        chrome.runtime.sendMessage({ type: "DEVICE_FLOW_COMPLETE", ok: false, error: String(err) });
      });
  }

  poll();
}

chrome.runtime.onMessage.addListener(function (message) {
  if (message && message.type === "START_DEVICE_POLL") {
    startDevicePoll(message.deviceCode, message.interval);
  }
  if (message && message.type === "COMMIT_SUCCESS" && chrome.action.setBadgeText) {
    chrome.action.setBadgeText({ text: "✓" });
    chrome.action.setBadgeBackgroundColor({ color: "#2ecc71" });
    setTimeout(function () {
      chrome.action.setBadgeText({ text: "" });
    }, 5000);
  }
});
