// Loaded as a plain global script (no ES module syntax — MV3 content_scripts
// declared in manifest.json don't support `import`). Functions attach to the
// shared global scope for content.js, and export via module.exports for node:test.

var LANGUAGE_EXTENSIONS = {
  python: ".py",
  python3: ".py",
  java: ".java",
  cpp: ".cpp",
  c: ".c",
  csharp: ".cs",
  cs: ".cs",
  javascript: ".js",
  js: ".js",
  typescript: ".ts",
  ts: ".ts",
  php: ".php",
  swift: ".swift",
  kotlin: ".kt",
  scala: ".scala",
  rust: ".rs",
  golang: ".go",
  go: ".go",
  ruby: ".rb",
  racket: ".rkt",
  erlang: ".erl",
  elixir: ".ex",
  dart: ".dart",
};

function mapLanguageToExtension(lang) {
  if (!lang) return ".txt";
  var key = String(lang).trim().toLowerCase();
  return LANGUAGE_EXTENSIONS[key] || ".txt";
}

function sanitizeFilename(title) {
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

if (typeof module !== "undefined") {
  module.exports = { mapLanguageToExtension, sanitizeFilename, LANGUAGE_EXTENSIONS };
}
