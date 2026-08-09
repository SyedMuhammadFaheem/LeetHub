// Plain global script, see lib/extract.js for the loading rationale.
// Queries LeetCode's same-origin GraphQL endpoint. Content scripts run in the
// page's origin, so the session cookie is sent automatically — no CORS/auth setup needed.

var LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

var SUBMISSION_DETAILS_QUERY =
  "query submissionDetails($submissionId: Int!) {\n" +
  "  submissionDetails(submissionId: $submissionId) {\n" +
  "    code\n" +
  "    lang { name }\n" +
  "    runtimeDisplay\n" +
  "    memoryDisplay\n" +
  "    statusCode\n" +
  "    question { title titleSlug difficulty questionFrontendId topicTags { name } }\n" +
  "  }\n" +
  "}";

var LATEST_SUBMISSION_QUERY =
  "query submissionList($questionSlug: String!) {\n" +
  "  questionSubmissionList(questionSlug: $questionSlug, offset: 0, limit: 1) {\n" +
  "    submissions { id statusDisplay }\n" +
  "  }\n" +
  "}";

var QUESTION_CONTENT_QUERY =
  "query questionContent($titleSlug: String!) {\n" +
  "  question(titleSlug: $titleSlug) {\n" +
  "    content\n" +
  "    questionFrontendId\n" +
  "  }\n" +
  "}";

function fetchGraphQL(query, variables) {
  return fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: query, variables: variables }),
  }).then(function (res) {
    if (!res.ok) throw new Error("LeetCode GraphQL error " + res.status);
    return res.json();
  });
}

function fetchLatestSubmissionId(questionSlug) {
  return fetchGraphQL(LATEST_SUBMISSION_QUERY, { questionSlug: questionSlug }).then(function (json) {
    var subs = json && json.data && json.data.questionSubmissionList && json.data.questionSubmissionList.submissions;
    if (!subs || !subs.length) throw new Error("No submissions found for " + questionSlug);
    return subs[0].id;
  });
}

function fetchSubmissionDetails(submissionId) {
  return fetchGraphQL(SUBMISSION_DETAILS_QUERY, { submissionId: submissionId }).then(function (json) {
    return parseSubmissionDetails(json);
  });
}

// Only called when question.md doesn't exist yet — the statement is static per
// problem, so there's no reason to re-fetch it on every resubmission.
function fetchQuestionContent(titleSlug) {
  return fetchGraphQL(QUESTION_CONTENT_QUERY, { titleSlug: titleSlug }).then(function (json) {
    return parseQuestionContent(json);
  });
}

// Pure — separated from the network call so it's testable without mocking fetch.
function parseSubmissionDetails(rawResponse) {
  var d = rawResponse && rawResponse.data && rawResponse.data.submissionDetails;
  if (!d) return null;
  return {
    code: d.code,
    language: d.lang && d.lang.name,
    runtime: d.runtimeDisplay,
    memory: d.memoryDisplay,
    accepted: d.statusCode === 10,
    title: d.question && d.question.title,
    titleSlug: d.question && d.question.titleSlug,
    difficulty: d.question && d.question.difficulty,
    frontendId: d.question && d.question.questionFrontendId,
    tags: (d.question && d.question.topicTags || []).map(function (t) {
      return t.name;
    }),
  };
}

function parseQuestionContent(rawResponse) {
  var q = rawResponse && rawResponse.data && rawResponse.data.question;
  if (!q) return null;
  return {
    contentHtml: q.content,
    frontendId: q.questionFrontendId,
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    parseSubmissionDetails,
    parseQuestionContent,
    fetchGraphQL,
    fetchLatestSubmissionId,
    fetchSubmissionDetails,
    fetchQuestionContent,
  };
}
