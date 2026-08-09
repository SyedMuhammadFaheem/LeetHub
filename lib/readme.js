// Plain global script, see lib/extract.js for the loading rationale.
// Pure string manipulation — no DOM/chrome APIs — testable via node:test.

var TABLE_START = "<!-- LEETHUB:TABLE:START -->";
var TABLE_END = "<!-- LEETHUB:TABLE:END -->";

function buildProblemReadme(problem) {
  var lines = [
    "# " + problem.title,
    "",
    "**Difficulty:** " + (problem.difficulty || "Unknown"),
  ];
  if (problem.tags && problem.tags.length) {
    lines.push("**Tags:** " + problem.tags.join(", "));
  }
  if (problem.runtime) lines.push("**Runtime:** " + problem.runtime);
  if (problem.memory) lines.push("**Memory:** " + problem.memory);
  lines.push("", "Solved on " + new Date().toISOString().slice(0, 10) + ".");
  return lines.join("\n") + "\n";
}

function buildProgressTable(rows) {
  var byDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
  rows.forEach(function (r) {
    if (byDifficulty[r.difficulty] !== undefined) byDifficulty[r.difficulty]++;
  });
  var header =
    "| Problem | Difficulty | Solved |\n|---|---|---|\n";
  var body = rows
    .map(function (r) {
      return "| [" + r.title + "](" + r.titleSlug + "/) | " + r.difficulty + " | " + r.date + " |";
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
  module.exports = { buildProblemReadme, buildProgressTable, updateProgressTable, TABLE_START, TABLE_END };
}
