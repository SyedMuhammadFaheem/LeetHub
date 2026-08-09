// Plain global script, see lib/extract.js for the loading rationale.

function buildApiUrl(owner, repo, path) {
  return (
    "https://api.github.com/repos/" +
    encodeURIComponent(owner) +
    "/" +
    encodeURIComponent(repo) +
    "/contents/" +
    path
      .split("/")
      .map(encodeURIComponent)
      .join("/")
  );
}

function GitHubApiError(status, body) {
  var err = new Error("GitHub API error " + status);
  err.name = "GitHubApiError";
  err.status = status;
  err.body = body;
  return err;
}

// Returns a promise resolving to the PUT response JSON.
// Explicit branches, every branch returns its promise — fixes the original
// content.js chain where the create-PUT wasn't returned and the update path
// raced against it.
function commitFile(opts) {
  var owner = opts.owner;
  var repo = opts.repo;
  var path = opts.path;
  var content = opts.content;
  var message = opts.message;
  var token = opts.token;

  var url = buildApiUrl(owner, repo, path);
  var headers = {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
  };

  return fetch(url, { method: "GET", headers: headers }).then(function (getRes) {
    if (getRes.status === 200) {
      return getRes.json().then(function (existing) {
        return putFile(url, headers, { message: message, content: content, sha: existing.sha });
      });
    }
    if (getRes.status === 404) {
      return putFile(url, headers, { message: message, content: content });
    }
    return getRes.json().catch(function () {
      return null;
    }).then(function (body) {
      throw GitHubApiError(getRes.status, body);
    });
  });
}

function putFile(url, headers, body) {
  var putHeaders = Object.assign({}, headers, { "Content-Type": "application/json" });
  return fetch(url, {
    method: "PUT",
    headers: putHeaders,
    body: JSON.stringify(body),
  }).then(function (putRes) {
    if (!putRes.ok) {
      return putRes.json().catch(function () {
        return null;
      }).then(function (errBody) {
        throw GitHubApiError(putRes.status, errBody);
      });
    }
    return putRes.json();
  });
}

if (typeof module !== "undefined") {
  module.exports = { buildApiUrl, commitFile, GitHubApiError };
}
