// Plain global script, see lib/extract.js for the loading rationale.
// Pure — no DOM/chrome APIs — testable via node:test.
//
// ponytail: regex-based HTML->Markdown, not a full parser — tables/images in
// harder problems may need manual cleanup; swap in a real parser if fidelity
// becomes a recurring complaint.

var HTML_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  apos: "'",
  nbsp: " ",
};

function decodeEntities(str) {
  return str.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, function (match, entity) {
    if (entity[0] === "#") {
      var code = entity[1] === "x" || entity[1] === "X" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return isNaN(code) ? match : String.fromCodePoint(code);
    }
    return Object.prototype.hasOwnProperty.call(HTML_ENTITIES, entity) ? HTML_ENTITIES[entity] : match;
  });
}

function htmlToMarkdown(html) {
  if (!html) return "";
  var text = html;

  text = text.replace(/<pre>([\s\S]*?)<\/pre>/gi, function (_, inner) {
    var code = inner.replace(/<[^>]+>/g, "");
    return "\n```\n" + decodeEntities(code).trim() + "\n```\n";
  });

  text = text.replace(/<code>([\s\S]*?)<\/code>/gi, function (_, inner) {
    return "`" + decodeEntities(inner.replace(/<[^>]+>/g, "")) + "`";
  });

  text = text.replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, "**$2**");
  text = text.replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, "*$2*");
  text = text.replace(/<sup>([\s\S]*?)<\/sup>/gi, "^$1");

  text = text.replace(/<li>([\s\S]*?)<\/li>/gi, "- $1\n");
  text = text.replace(/<\/(ul|ol)>/gi, "\n");
  text = text.replace(/<(ul|ol)[^>]*>/gi, "\n");

  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<p[^>]*>/gi, "");

  text = text.replace(/<img[^>]*>/gi, "[image omitted]");

  text = text.replace(/<[^>]+>/g, "");
  text = decodeEntities(text);

  text = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  return text + "\n";
}

if (typeof module !== "undefined") {
  module.exports = { htmlToMarkdown, decodeEntities };
}
