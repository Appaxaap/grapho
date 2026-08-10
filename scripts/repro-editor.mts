/**
 * Reproduce "Error creating document from blocks passed as initialContent".
 *
 * Two halves:
 *  1. Markdown samples → markdownToBlocks → BlockNote (clean content must load).
 *  2. Corrupted JSON documents → sanitizeBlocks → BlockNote (damaged content
 *     must be repaired enough to load — this is the user-data crash path).
 */
import { BlockNoteEditor } from "@blocknote/core";
import { markdownToBlocks } from "../lib/markdown";
import { sanitizeBlocks } from "../lib/sanitize";

const welcome = [
  "# Welcome to Grapho ✨",
  "",
  "Write freely.",
  "",
  "Grapho is a lightning-fast, offline-first note-taking app. Everything you write is saved locally on your device — instantly, privately, and forever.",
  "",
  "## Get started",
  "",
  "- **Create a note** — press `Cmd/Ctrl + N` or click \"New Note\" in the sidebar",
  "- **Write with Markdown** — try `#` headings, `-` bullets, `1.` numbered lists, `>` quotes, and `---` dividers",
  "- **Format as you type** — select text for bold, italic, links, and more",
  "- **Never lose a draft** — every change is versioned (`Cmd/Ctrl + H`)",
  "- **Export anytime** — turn any note into a beautiful PDF (`Cmd/Ctrl + E`)",
  "",
  '> "The pen is the tongue of the mind." — Miguel de Cervantes',
  "",
  "_Everything stays on this device. No accounts, no cloud, no tracking._",
].join("\n");

const sample = [
  "# Project Brief",
  "",
  "A quick frog hopped across the **damp grass**, leaving *tiny prints* in the morning dew.",
  "",
  "## Daily Routine",
  "",
  "- **Translate it** — copy the text",
  "- Write `blocksToMarkdown`",
  "- [x] Export to PDF",
  "",
  "1. First",
  "2. Second",
  "",
  '> "The pen is the tongue of the mind."',
  "",
  "```ts",
  "const x = 42;",
  "```",
  "",
  "---",
  "",
  "Final paragraph with a [link](https://example.com).",
].join("\n");

const MARKDOWN_SAMPLES: Record<string, string> = {
  "welcome seed": welcome,
  "smoke test sample": sample,
  "heading level 4": "#### Deep heading",
  "heading level 6": "###### Deepest heading",
  empty: "",
};

/**
 * Damaged documents: shapes BlockNote throws on. Each must survive
 * `sanitizeBlocks` and still load into a fresh editor.
 */
const CORRUPTED_SAMPLES: Record<string, unknown> = {
  "unknown type (columnList)": [
    { id: "a", type: "columnList", props: {}, content: "left column", children: [] },
    { id: "b", type: "columnList", props: {}, content: "right column", children: [] },
  ],
  "table with string content": [
    { id: "c", type: "table", props: {}, content: "not a tableContent object", children: [] },
  ],
  "heading with out-of-range level": [
    { id: "d", type: "heading", props: { level: 9 }, content: [{ type: "text", text: "too deep", styles: {} }], children: [] },
  ],
  "styles with unknown key": [
    { id: "e", type: "paragraph", props: {}, content: [{ type: "text", text: "x", styles: { foo: true, bold: true } }], children: [] },
  ],
  "content as plain object (UnreachableCaseError path)": [
    { id: "f", type: "paragraph", props: {}, content: { type: "nonsense" }, children: [] },
  ],
  "duplicate block ids": [
    { id: "dup", type: "paragraph", props: {}, content: "one", children: [] },
    { id: "dup", type: "paragraph", props: {}, content: "two", children: [] },
  ],
  "non-array document": { id: "g", type: "paragraph", props: {}, content: "x", children: [] },
  "empty array (fresh note)": [],
  "missing id / props / children": [
    { type: "paragraph", content: "no id" },
    { type: "codeBlock", content: "no props" },
    { type: "divider" },
  ],
};

let failed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ok ${name}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL ${name}: ${(e as Error).message}`);
    console.error(`    cause: ${(e as { cause?: Error }).cause?.message ?? "none"}`);
  }
}

/** `new BlockNoteEditor` is protected — use the public factory, like the app. */
function makeEditor(blocks: unknown) {
  return BlockNoteEditor.create({ initialContent: blocks as never });
}

console.log("Markdown → BlockNote (clean path):");
for (const [name, md] of Object.entries(MARKDOWN_SAMPLES)) {
  check(name, () => {
    const blocks = markdownToBlocks(md);
    makeEditor(blocks);
  });
}

console.log("\nCorrupted JSON → sanitizeBlocks → BlockNote:");
for (const [name, raw] of Object.entries(CORRUPTED_SAMPLES)) {
  check(name, () => {
    const blocks = sanitizeBlocks(raw);
    if (!Array.isArray(blocks)) throw new Error("sanitizeBlocks must return an array");
    makeEditor(blocks);
  });
}

// The sanitizer must actually repair: unknown type downgrades to paragraph.
{
  const repaired = sanitizeBlocks(CORRUPTED_SAMPLES["unknown type (columnList)"]);
  const types = repaired.map((b) => b.type);
  check("unknown type downgraded to paragraph", () => {
    if (!types.every((t) => t === "paragraph")) {
      throw new Error(`expected paragraphs, got ${types.join(", ")}`);
    }
  });
}

console.log(
  failed === 0 ? "\nAll samples load into BlockNote." : `\n${failed} sample(s) FAILED.`
);
process.exit(failed === 0 ? 0 : 1);
