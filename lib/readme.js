// Plain global script, see lib/extract.js for the loading rationale.
// Pure string manipulation — no DOM/chrome APIs — testable via node:test.

// In the browser, htmlToMarkdown is already a global from lib/htmlToMd.js
// (loaded first in manifest.json). In Node this `var` stays unassigned, so
// pull it in via require below without clobbering the browser global.
var htmlToMarkdown;
if (typeof module !== "undefined") {
  htmlToMarkdown = require("./htmlToMd.js").htmlToMarkdown;
}

var TABLE_START = "<!-- LEETHUB:TABLE:START -->";
var TABLE_END = "<!-- LEETHUB:TABLE:END -->";

var NOTES_TEMPLATE = "## Approach\n\n## Complexity\n\n## Notes\n";

function buildQuestionMd(problem) {
  var lines = [
    "# " + (problem.frontendId ? problem.frontendId + ". " : "") + problem.title,
    "",
    "**Difficulty:** " + (problem.difficulty || "Unknown"),
  ];
  if (problem.tags && problem.tags.length) {
    lines.push("**Tags:** " + problem.tags.join(", "));
  }
  if (problem.titleSlug) {
    lines.push("**Link:** https://leetcode.com/problems/" + problem.titleSlug + "/");
  }
  lines.push("", "---", "");
  if (problem.contentHtml) {
    lines.push(htmlToMarkdown(problem.contentHtml));
  }
  return lines.join("\n") + "\n";
}

function buildProgressTable(rows) {
  var byDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
  rows.forEach(function (r) {
    if (byDifficulty[r.difficulty] !== undefined) byDifficulty[r.difficulty]++;
  });
  var header = "| # | Problem | Difficulty | Solved |\n|---|---|---|---|\n";
  var body = rows
    .map(function (r) {
      return "| " + (r.frontendId || "") + " | [" + r.title + "](" + r.folder + "/) | " + r.difficulty + " | " + r.date + " |";
    })
    .join("\n");
  var summary =
    "Solved: " +
    rows.length +
    " (Easy: " +
    byDifficulty.Easy +
    ", Medium: " +
    byDifficulty.Medium +
    ", Hard: " +
    byDifficulty.Hard +
    ")\n\n";
  return TABLE_START + "\n" + summary + header + body + "\n" + TABLE_END;
}

// Replaces the marker-delimited section if present, otherwise appends it.
function updateProgressTable(existingReadmeText, rows) {
  var table = buildProgressTable(rows);
  var text = existingReadmeText || "# Solutions\n\n";
  var startIdx = text.indexOf(TABLE_START);
  var endIdx = text.indexOf(TABLE_END);
  if (startIdx !== -1 && endIdx !== -1) {
    return text.slice(0, startIdx) + table + text.slice(endIdx + TABLE_END.length);
  }
  return text.replace(/\n*$/, "\n\n") + table + "\n";
}

if (typeof module !== "undefined") {
  module.exports = { buildQuestionMd, buildProgressTable, updateProgressTable, NOTES_TEMPLATE, TABLE_START, TABLE_END };
}
