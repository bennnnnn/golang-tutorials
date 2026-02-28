// Lightweight client-side Go syntax highlighter
// Returns HTML with <span> tags for coloring

const GO_KEYWORDS =
  /\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/g;

const GO_TYPES =
  /\b(bool|byte|complex64|complex128|error|float32|float64|int|int8|int16|int32|int64|rune|string|uint|uint8|uint16|uint32|uint64|uintptr|nil|true|false|iota)\b/g;

const GO_BUILTINS =
  /\b(append|cap|close|copy|delete|len|make|new|panic|print|println|recover)\b/g;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function highlightGo(code: string): string {
  // First, identify strings, comments, and protect them from keyword replacement
  const tokens: { type: string; value: string; start: number; end: number }[] = [];

  // Match block comments
  const blockCommentRegex = /\/\*[\s\S]*?\*\//g;
  let match;
  while ((match = blockCommentRegex.exec(code)) !== null) {
    tokens.push({ type: "comment", value: match[0], start: match.index, end: match.index + match[0].length });
  }

  // Match line comments
  const lineCommentRegex = /\/\/.*$/gm;
  while ((match = lineCommentRegex.exec(code)) !== null) {
    // Don't overlap with block comments
    const overlaps = tokens.some((t) => match!.index >= t.start && match!.index < t.end);
    if (!overlaps) {
      tokens.push({ type: "comment", value: match[0], start: match.index, end: match.index + match[0].length });
    }
  }

  // Match strings (double-quoted and backtick)
  const stringRegex = /"(?:[^"\\]|\\.)*"|`[^`]*`/g;
  while ((match = stringRegex.exec(code)) !== null) {
    const overlaps = tokens.some((t) => match!.index >= t.start && match!.index < t.end);
    if (!overlaps) {
      tokens.push({ type: "string", value: match[0], start: match.index, end: match.index + match[0].length });
    }
  }

  // Match rune literals
  const runeRegex = /'(?:[^'\\]|\\.)'/g;
  while ((match = runeRegex.exec(code)) !== null) {
    const overlaps = tokens.some((t) => match!.index >= t.start && match!.index < t.end);
    if (!overlaps) {
      tokens.push({ type: "string", value: match[0], start: match.index, end: match.index + match[0].length });
    }
  }

  // Sort tokens by start position
  tokens.sort((a, b) => a.start - b.start);

  // Build the highlighted HTML
  let result = "";
  let lastIndex = 0;

  for (const token of tokens) {
    // Process the gap between tokens (apply keyword highlighting)
    if (token.start > lastIndex) {
      const gap = code.substring(lastIndex, token.start);
      result += highlightKeywords(gap);
    }

    // Add the token with its color
    const escaped = escapeHtml(token.value);
    if (token.type === "comment") {
      result += `<span style="color:#6a9955">${escaped}</span>`;
    } else if (token.type === "string") {
      result += `<span style="color:#ce9178">${escaped}</span>`;
    }

    lastIndex = token.end;
  }

  // Process remaining code after last token
  if (lastIndex < code.length) {
    result += highlightKeywords(code.substring(lastIndex));
  }

  return result;
}

function highlightKeywords(text: string): string {
  let html = escapeHtml(text);

  // Numbers (before keywords to avoid conflicts)
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#b5cea8">$1</span>');

  // Keywords (bright purple)
  html = html.replace(GO_KEYWORDS, '<span style="color:#c586c0">$1</span>');

  // Types and constants (bright yellow)
  html = html.replace(GO_TYPES, '<span style="color:#4ec9b0">$1</span>');

  // Builtins (bright blue)
  html = html.replace(GO_BUILTINS, '<span style="color:#dcdcaa">$1</span>');

  // Function calls: word followed by (
  html = html.replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g, (match, name) => {
    if (match.includes("</span>")) return match;
    return `<span style="color:#dcdcaa">${name}</span>`;
  });

  // Package.Method: like fmt.Println (bright cyan for package, yellow for method)
  html = html.replace(
    /\b([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)/g,
    (full, pkg, method) => {
      if (full.includes("</span>")) return full;
      return `<span style="color:#9cdcfe">${pkg}</span>.<span style="color:#dcdcaa">${method}</span>`;
    }
  );

  return html;
}
