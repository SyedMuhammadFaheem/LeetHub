const test = require("node:test");
const assert = require("node:assert/strict");

const { mapLanguageToExtension, sanitizeFilename } = require("../lib/extract.js");
const { buildApiUrl, commitFileIfAbsent } = require("../lib/github.js");
const { parseSubmissionDetails, parseQuestionContent } = require("../lib/graphql.js");
const { buildQuestionMd, updateProgressTable, NOTES_TEMPLATE, TABLE_START, TABLE_END } = require("../lib/readme.js");
const { htmlToMarkdown, decodeEntities } = require("../lib/htmlToMd.js");

test("mapLanguageToExtension known languages", () => {
  assert.equal(mapLanguageToExtension("python3"), ".py");
  assert.equal(mapLanguageToExtension("Rust"), ".rs");
  assert.equal(mapLanguageToExtension("golang"), ".go");
  assert.equal(mapLanguageToExtension("kotlin"), ".kt");
});

test("mapLanguageToExtension unknown/empty falls back to .txt", () => {
  assert.equal(mapLanguageToExtension("brainfuck"), ".txt");
  assert.equal(mapLanguageToExtension(null), ".txt");
  assert.equal(mapLanguageToExtension(""), ".txt");
});

test("sanitizeFilename normalizes titles", () => {
  assert.equal(sanitizeFilename("Two Sum"), "two-sum");
  assert.equal(sanitizeFilename("  Add Two Numbers!! "), "add-two-numbers");
  assert.equal(sanitizeFilename("3Sum Closest"), "3sum-closest");
});

test("buildApiUrl encodes path segments", () => {
  assert.equal(
    buildApiUrl("me", "my-repo", "two-sum/solution.py"),
    "https://api.github.com/repos/me/my-repo/contents/two-sum/solution.py"
  );
});

test("parseSubmissionDetails extracts fields including frontendId", () => {
  const raw = {
    data: {
      submissionDetails: {
        code: "print(1)",
        lang: { name: "python3" },
        runtimeDisplay: "10 ms",
        memoryDisplay: "14 MB",
        statusCode: 10,
        question: {
          title: "Two Sum",
          titleSlug: "two-sum",
          difficulty: "Easy",
          questionFrontendId: "1",
          topicTags: [{ name: "Array" }],
        },
      },
    },
  };
  const parsed = parseSubmissionDetails(raw);
  assert.equal(parsed.code, "print(1)");
  assert.equal(parsed.accepted, true);
  assert.equal(parsed.frontendId, "1");
  assert.deepEqual(parsed.tags, ["Array"]);
});

test("parseSubmissionDetails handles missing data", () => {
  assert.equal(parseSubmissionDetails({}), null);
});

test("parseQuestionContent extracts html and frontendId", () => {
  const raw = { data: { question: { content: "<p>Hi</p>", questionFrontendId: "42" } } };
  const parsed = parseQuestionContent(raw);
  assert.equal(parsed.contentHtml, "<p>Hi</p>");
  assert.equal(parsed.frontendId, "42");
});

test("htmlToMarkdown converts common LeetCode markup", () => {
  const html =
    "<p>Given an array <code>nums</code>, do &nbsp;this &amp; that.</p>" +
    "<pre>Input: [1,2]\nOutput: 3</pre>" +
    "<strong>Note:</strong> <em>be careful</em><br>" +
    "<ul><li>Item one</li><li>Item two</li></ul>";
  const md = htmlToMarkdown(html);
  assert.match(md, /```\nInput: \[1,2\]\nOutput: 3\n```/);
  assert.match(md, /`nums`/);
  assert.match(md, /\*\*Note:\*\*/);
  assert.match(md, /\*be careful\*/);
  assert.match(md, /- Item one/);
  assert.match(md, /- Item two/);
  assert.doesNotMatch(md, /<[a-z]/);
});

test("decodeEntities handles named and numeric entities", () => {
  assert.equal(decodeEntities("a &amp; b"), "a & b");
  assert.equal(decodeEntities("&#65;&#x42;"), "AB");
});

test("buildQuestionMd includes number, title, difficulty, and statement", () => {
  const md = buildQuestionMd({
    frontendId: "1",
    title: "Two Sum",
    difficulty: "Easy",
    tags: ["Array"],
    titleSlug: "two-sum",
    contentHtml: "<p>Find two numbers.</p>",
  });
  assert.match(md, /# 1\. Two Sum/);
  assert.match(md, /Easy/);
  assert.match(md, /leetcode\.com\/problems\/two-sum/);
  assert.match(md, /Find two numbers\./);
});

test("NOTES_TEMPLATE has the expected scaffold sections", () => {
  assert.match(NOTES_TEMPLATE, /## Approach/);
  assert.match(NOTES_TEMPLATE, /## Complexity/);
});

test("updateProgressTable appends marker section with number column", () => {
  const result = updateProgressTable("# My Solutions\n", [
    { title: "Two Sum", folder: "1-two-sum", frontendId: "1", difficulty: "Easy", date: "2026-01-01" },
  ]);
  assert.match(result, new RegExp(TABLE_START));
  assert.match(result, new RegExp(TABLE_END));
  assert.match(result, /\[Two Sum\]\(1-two-sum\/\)/);
  assert.match(result, /\| 1 \|/);
});

test("updateProgressTable replaces existing marker section only", () => {
  const before = "# My Solutions\n\nsome intro text\n\n" + TABLE_START + "\nold\n" + TABLE_END + "\n\nfooter text";
  const result = updateProgressTable(before, [
    { title: "Two Sum", folder: "1-two-sum", frontendId: "1", difficulty: "Easy", date: "2026-01-01" },
  ]);
  assert.match(result, /some intro text/);
  assert.match(result, /footer text/);
  assert.doesNotMatch(result, /old/);
});

test("commitFileIfAbsent creates the file when it doesn't exist (404)", async () => {
  const calls = [];
  global.fetch = async (url, opts) => {
    calls.push(opts.method);
    if (opts.method === "GET") return { status: 404 };
    return { ok: true, json: async () => ({ content: { sha: "abc" } }) };
  };
  const result = await commitFileIfAbsent({ owner: "me", repo: "r", path: "x/notes.md", content: "Zg==", message: "m", token: "t" });
  assert.equal(result.created, true);
  assert.deepEqual(calls, ["GET", "PUT"]);
});

test("commitFileIfAbsent skips when the file already exists (200)", async () => {
  const calls = [];
  global.fetch = async (url, opts) => {
    calls.push(opts.method);
    return { status: 200 };
  };
  const result = await commitFileIfAbsent({ owner: "me", repo: "r", path: "x/notes.md", content: "Zg==", message: "m", token: "t" });
  assert.equal(result.created, false);
  assert.deepEqual(calls, ["GET"]);
});

test("commitFileIfAbsent throws GitHubApiError on unexpected status", async () => {
  global.fetch = async () => ({ status: 500, json: async () => ({ message: "boom" }) });
  await assert.rejects(
    commitFileIfAbsent({ owner: "me", repo: "r", path: "x/notes.md", content: "Zg==", message: "m", token: "t" }),
    (err) => err.name === "GitHubApiError" && err.status === 500
  );
});
