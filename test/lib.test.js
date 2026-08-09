const test = require("node:test");
const assert = require("node:assert/strict");

const { mapLanguageToExtension, sanitizeFilename } = require("../lib/extract.js");
const { buildApiUrl } = require("../lib/github.js");
const { parseSubmissionDetails } = require("../lib/graphql.js");
const { buildProblemReadme, updateProgressTable, TABLE_START, TABLE_END } = require("../lib/readme.js");

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

test("parseSubmissionDetails extracts fields", () => {
  const raw = {
    data: {
      submissionDetails: {
        code: "print(1)",
        lang: { name: "python3" },
        runtimeDisplay: "10 ms",
        memoryDisplay: "14 MB",
        statusCode: 10,
        question: { title: "Two Sum", titleSlug: "two-sum", difficulty: "Easy", topicTags: [{ name: "Array" }] },
      },
    },
  };
  const parsed = parseSubmissionDetails(raw);
  assert.equal(parsed.code, "print(1)");
  assert.equal(parsed.accepted, true);
  assert.deepEqual(parsed.tags, ["Array"]);
});

test("parseSubmissionDetails handles missing data", () => {
  assert.equal(parseSubmissionDetails({}), null);
});

test("buildProblemReadme includes title and difficulty", () => {
  const md = buildProblemReadme({ title: "Two Sum", difficulty: "Easy", tags: ["Array"] });
  assert.match(md, /# Two Sum/);
  assert.match(md, /Easy/);
  assert.match(md, /Array/);
});

test("updateProgressTable appends marker section when absent", () => {
  const result = updateProgressTable("# My Solutions\n", [{ title: "Two Sum", titleSlug: "two-sum", difficulty: "Easy", date: "2026-01-01" }]);
  assert.match(result, new RegExp(TABLE_START));
  assert.match(result, new RegExp(TABLE_END));
  assert.match(result, /Two Sum/);
});

test("updateProgressTable replaces existing marker section only", () => {
  const before = "# My Solutions\n\nsome intro text\n\n" + TABLE_START + "\nold\n" + TABLE_END + "\n\nfooter text";
  const result = updateProgressTable(before, [{ title: "Two Sum", titleSlug: "two-sum", difficulty: "Easy", date: "2026-01-01" }]);
  assert.match(result, /some intro text/);
  assert.match(result, /footer text/);
  assert.doesNotMatch(result, /old/);
});
