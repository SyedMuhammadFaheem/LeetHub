(function () {
  var DEBOUNCE_MS = 300;
  var debounceTimer = null;
  var lastHandledPath = null;

  function showToast(message, isError) {
    var toast = document.createElement("div");
    var tag = document.createElement("span");
    tag.textContent = "LeetHub";
    tag.style.cssText =
      "font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700;margin-right:8px;opacity:.85;";
    var body = document.createElement("span");
    body.textContent = message;
    toast.appendChild(tag);
    toast.appendChild(body);
    toast.style.cssText =
      "position:fixed;bottom:20px;right:20px;z-index:999999;padding:10px 16px;" +
      "border-radius:6px;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;font-size:13px;color:#e6e8eb;" +
      "background:" + (isError ? "#3a1414" : "#0f2818") + ";" +
      "border:1px solid " + (isError ? "#f85149" : "#3fb950") + ";" +
      "box-shadow:0 4px 16px rgba(0,0,0,.35);";
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.remove();
    }, 4000);
  }

  function getSlugFromUrl() {
    var m = window.location.pathname.match(/\/problems\/([^/]+)/);
    return m ? m[1] : null;
  }

  function scrapeFromDom() {
    var codeLines = document.querySelectorAll(".view-lines .view-line");
    var code = Array.prototype.map
      .call(codeLines, function (l) {
        return l.textContent;
      })
      .join("\n");
    var langEl = document.querySelector("[data-e2e-locator='console-editor-lang-select'], button[id*='lang']");
    var titleEl = document.querySelector("[data-cy='question-title'], a[href*='/problems/'] div");
    var rawTitle = titleEl ? titleEl.textContent : document.title.replace(/ - LeetCode$/, "");
    var numberMatch = rawTitle.match(/^(\d+)\.\s*(.*)$/);
    return {
      code: code,
      language: langEl ? langEl.textContent : null,
      title: numberMatch ? numberMatch[2] : rawTitle,
      titleSlug: getSlugFromUrl(),
      difficulty: null,
      tags: [],
      runtime: null,
      memory: null,
      frontendId: numberMatch ? numberMatch[1] : null,
    };
  }

  function getSubmissionDetails(slug) {
    return fetchLatestSubmissionId(slug)
      .then(function (id) {
        return fetchSubmissionDetails(id);
      })
      .catch(function (err) {
        console.warn("LeetHub: GraphQL fetch failed, falling back to DOM scrape.", err);
        return scrapeFromDom();
      });
  }

  function commitToGitHub(details) {
    chrome.storage.local.get(["githubOwner", "githubRepo", "githubToken", "lastCommit"], function (result) {
      var owner = result.githubOwner;
      var repo = result.githubRepo;
      var token = result.githubToken;
      if (!owner || !repo || !token) {
        showToast("LeetHub: connect GitHub in the extension options first.", true);
        return;
      }

      var slug = details.titleSlug || getSlugFromUrl();
      var lastCommit = result.lastCommit || {};
      if (lastCommit[slug] && lastCommit[slug].content === details.code) {
        showToast("LeetHub: solution unchanged, skipped.");
        return;
      }

      var folder = (details.frontendId ? details.frontendId + "-" : "") + slug;
      var ext = mapLanguageToExtension(details.language);
      var solutionPath = folder + "/solution" + ext;
      var questionPath = folder + "/question.md";
      var notesPath = folder + "/notes.md";
      var commitMessage = (details.title || slug) + " - " + new Date().toISOString();

      var solutionContent = details.code || "";
      if (details.runtime || details.memory) {
        var statsLine = [details.runtime, details.memory].filter(Boolean).join(" | ");
        solutionContent = "// " + statsLine + "\n" + solutionContent;
      }

      commitFile({
        owner: owner,
        repo: repo,
        path: solutionPath,
        content: btoa(unescape(encodeURIComponent(solutionContent))),
        message: commitMessage,
        token: token,
      })
        .then(function () {
          return Promise.all([
            ensureQuestionFile(owner, repo, token, folder, questionPath, details),
            commitFileIfAbsent({
              owner: owner,
              repo: repo,
              path: notesPath,
              content: btoa(unescape(encodeURIComponent(NOTES_TEMPLATE))),
              message: "Add notes scaffold for " + (details.title || slug),
              token: token,
            }),
          ]);
        })
        .then(function () {
          lastCommit[slug] = {
            content: details.code,
            language: details.language,
            frontendId: details.frontendId || null,
            folder: folder,
            title: details.title || slug,
            difficulty: details.difficulty || "Unknown",
          };
          chrome.storage.local.set({ lastCommit: lastCommit });
          updateRootReadme(owner, repo, token, lastCommit);
          showToast("LeetHub: committed " + (details.title || slug) + "!");
          chrome.runtime.sendMessage({ type: "COMMIT_SUCCESS" });
        })
        .catch(function (err) {
          console.error("LeetHub commit failed:", err);
          showToast("LeetHub: commit failed (" + (err && err.message) + ")", true);
        });
    });
  }

  // question.md is created once and never rewritten, so only fetch the
  // (larger) full statement when it isn't already there.
  function ensureQuestionFile(owner, repo, token, folder, questionPath, details) {
    var url = buildApiUrl(owner, repo, questionPath);
    return fetch(url, { headers: { Authorization: "Bearer " + token } }).then(function (res) {
      if (res.status !== 404) return { created: false };
      return fetchQuestionContent(details.titleSlug).then(function (content) {
        var problem = Object.assign({}, details, content || {});
        return commitFileIfAbsent({
          owner: owner,
          repo: repo,
          path: questionPath,
          content: btoa(unescape(encodeURIComponent(buildQuestionMd(problem)))),
          message: "Add question statement for " + (details.title || folder),
          token: token,
        });
      });
    });
  }

  function updateRootReadme(owner, repo, token, lastCommit) {
    var rows = Object.keys(lastCommit).map(function (s) {
      var entry = lastCommit[s];
      return {
        title: entry.title || s,
        folder: entry.folder || s,
        frontendId: entry.frontendId || "",
        difficulty: entry.difficulty || "Unknown",
        date: new Date().toISOString().slice(0, 10),
      };
    });
    var url = buildApiUrl(owner, repo, "README.md");
    fetch(url, { headers: { Authorization: "Bearer " + token } })
      .then(function (res) {
        return res.status === 200 ? res.json() : null;
      })
      .then(function (existing) {
        var existingText = existing ? decodeURIComponent(escape(atob(existing.content.replace(/\n/g, "")))) : "";
        var updated = updateProgressTable(existingText, rows);
        return commitFile({
          owner: owner,
          repo: repo,
          path: "README.md",
          content: btoa(unescape(encodeURIComponent(updated))),
          message: "Update progress table",
          token: token,
        });
      })
      .catch(function (err) {
        console.warn("LeetHub: failed to update root README progress table.", err);
      });
  }

  function handleAcceptedResult() {
    var slug = getSlugFromUrl();
    if (!slug || slug === lastHandledPath) return;
    lastHandledPath = slug;
    getSubmissionDetails(slug).then(function (details) {
      if (!details || !details.code) {
        showToast("LeetHub: couldn't read the accepted solution.", true);
        return;
      }
      details.titleSlug = details.titleSlug || slug;
      commitToGitHub(details);
    });
  }

  function checkForAcceptedPanel() {
    var panel = document.querySelector("[data-e2e-locator='submission-result']");
    if (panel && panel.textContent.trim() === "Accepted") {
      handleAcceptedResult();
    }
  }

  var observer = new MutationObserver(function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(checkForAcceptedPanel, DEBOUNCE_MS);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // LeetCode is a client-routed SPA; reset per-problem dedupe guard on navigation.
  var lastPath = window.location.pathname;
  setInterval(function () {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      lastHandledPath = null;
    }
  }, 1000);

  chrome.runtime.onMessage.addListener(function (message) {
    if (message && message.type === "MANUAL_COMMIT") {
      lastHandledPath = null;
      checkForAcceptedPanel();
    }
  });
})();
