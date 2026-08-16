/**
 * Node-side smoke test for Grapho's pure logic and the PDF renderer.
 * Run with: `npm run smoke`
 *
 * Covers:
 *  - markdown → BlockNote blocks → markdown round-trip
 *  - title derivation, plain-text extraction, word counts
 *  - PDF generation (react-pdf renders to a Buffer in Node)
 */
import assert from "node:assert/strict";
import {
  blocksToMarkdown,
  blocksToPlainText,
  deriveTitle,
  markdownToBlocks,
  parseInline,
  wordCount,
} from "../lib/markdown";

/** Flatten parsed inline output into a map of style flags → joined text. */
function inlineSummary(input: string) {
  let bold = false;
  let italic = false;
  let strike = false;
  let code = false;
  let link = false;
  let literal = "";
  for (const node of parseInline(input)) {
    if (node.type === "link") link = true;
    const s = node.styles ?? {};
    if (s.bold) bold = true;
    if (s.italic) italic = true;
    if (s.strike) strike = true;
    if (s.code) code = true;
    if (!s.bold && !s.italic && !s.strike && !s.code && node.type !== "link") {
      literal += node.text ?? "";
    }
  }
  return { bold, italic, strike, code, link, literal };
}
import { renderNoteToPdfBuffer } from "../lib/pdf";
import { DEFAULT_EXPORT } from "../lib/constants";
import type { Note } from "../lib/types";

const SAMPLE = `# Project Brief

A quick frog hopped across the **damp grass**, leaving *tiny prints* in the morning dew.

## Daily Routine

- **Translate it** — copy the text
- Write \`blocksToMarkdown\`
- [x] Export to PDF

1. First
2. Second

> "The pen is the tongue of the mind."

\`\`\`ts
const x = 42;
\`\`\`

---

Final paragraph with a [link](https://example.com).`;

async function main() {
let passed = 0;
function ok(name: string, cond: boolean, extra?: string) {
  assert.ok(cond, `${name}${extra ? ` — ${extra}` : ""}`);
  passed++;
  console.log(`  ✓ ${name}`);
}

// 1. Markdown → blocks
const blocks = markdownToBlocks(SAMPLE);
ok("parses into blocks", blocks.length >= 8, `got ${blocks.length}`);
ok("heading level preserved", blocks[0].type === "heading" && (blocks[0].props as { level?: number }).level === 1);
ok("bold inline parsed", JSON.stringify(blocks[1].content).includes("damp grass"));
ok("checkbox state parsed", blocks.some((b) => b.type === "checkListItem" && (b.props as { checked?: boolean }).checked));
ok("code fence parsed", blocks.some((b) => b.type === "codeBlock"));
ok("quote parsed", blocks.some((b) => b.type === "quote"));
ok("divider parsed", blocks.some((b) => b.type === "divider"));

// 2. Round-trip back to markdown
const md = blocksToMarkdown(blocks);
ok("markdown round-trip keeps heading", md.includes("# Project Brief"));
ok("markdown round-trip keeps bold", md.includes("**damp grass**"));
ok("markdown round-trip keeps checkbox", md.includes("- [x] Export to PDF"));
ok("markdown round-trip keeps code", md.includes("const x = 42;"));
ok("markdown round-trip keeps link", md.includes("[link](https://example.com)"));
ok("markdown round-trip keeps quote", md.includes("The pen is the tongue of the mind."));

// 3. Text utilities
ok("title derived from first heading", deriveTitle(blocks) === "Project Brief");
const plain = blocksToPlainText(blocks);
ok("plain text contains content", plain.includes("damp grass") && plain.includes("const x = 42;"));
ok("word count > 20", wordCount(blocks) > 20, `got ${wordCount(blocks)}`);
ok("empty document word count is 0", wordCount([]) === 0);

// 4. Edge cases
ok("empty markdown yields a paragraph block", markdownToBlocks("").length === 1);
ok("empty title", deriveTitle([]) === "");

// 5. Inline emphasis parsing (premium, nested-friendly)
const b = inlineSummary("**Linux-first**");
ok("bold inline parsed", b.bold && !b.italic && !b.literal.includes("*"));
const bi = inlineSummary("***both bold and italic***");
ok("bold+italic inline parsed", bi.bold && bi.italic);
const nested = inlineSummary("**bold *nested* bold**");
ok("nested emphasis parsed", nested.bold && nested.italic);
const it = inlineSummary("*italic **bold** italic*");
ok("italic wrapping bold parsed", it.italic && it.bold);
const lk = inlineSummary("see [the docs](https://example.com) here");
ok("inline link parsed", lk.link);
const st = inlineSummary("a ~~struck~~ word");
ok("inline strike parsed", st.strike);
const sc = inlineSummary("use snake_case naming");
ok("snake_case stays literal", sc.literal.includes("snake_case"));
const un = inlineSummary("an unmatched ** stays literal");
ok("unmatched stars stay literal", un.literal.includes("**"));

// 5. PDF generation
const note: Note = {
  id: "test-1",
  title: "Smoke Test Note",
  content: blocks,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  trashedAt: null,
  isShared: false,
  lastSavedAt: 0,
};

for (const template of ["minimal", "modern", "academic"] as const) {
  const buf = await renderNoteToPdfBuffer(note, { ...DEFAULT_EXPORT, template });
  ok(`PDF renders (${template})`, buf.length > 1000 && buf.subarray(0, 4).toString() === "%PDF", `${buf.length} bytes`);
}

console.log(`\nAll ${passed} checks passed.`);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
