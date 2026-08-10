import type { Block } from "@blocknote/core";
import { uuid } from "./utils";

/* ------------------------------------------------------------------ *
 * Inline content helpers
 *
 * BlockNote's inline content types are deeply generic; these helpers
 * accept `unknown` and read the stable shape we store/emit ourselves.
 * ------------------------------------------------------------------ */

interface InlineLike {
  type?: string;
  text?: string;
  styles?: Record<string, unknown>;
  content?: unknown;
  href?: string;
}

/** Flatten inline content into plain text. */
export function inlineToText(content: unknown): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((item) => {
      if (typeof item === "string") return item;
      const t = item as InlineLike;
      if (t?.type === "text") return typeof t.text === "string" ? t.text : "";
      if (t?.type === "link") return inlineToText(t.content);
      return "";
    })
    .join("");
}

/** Render inline content as Markdown (handles bold/italic/strike/code/link). */
export function inlineToMarkdown(content: unknown): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((item) => {
      if (typeof item === "string") return item;
      const t = item as InlineLike;
      if (t?.type === "link") {
        const inner = inlineToMarkdown(t.content);
        return `[${inner}](${t.href ?? ""})`;
      }
      const s = t.styles ?? {};
      let text = typeof t.text === "string" ? t.text : "";
      if (s.code) text = `\`${text}\``;
      if (s.bold) text = `**${text}**`;
      if (s.italic) text = `*${text}*`;
      if (s.strike) text = `~~${text}~~`;
      return text;
    })
    .join("");
}

/* ------------------------------------------------------------------ *
 * Block-level conversions
 * ------------------------------------------------------------------ */

/** Convert a BlockNote document to Markdown. */
export function blocksToMarkdown(blocks: Block[], depth = 0): string {
  const lines: string[] = [];
  for (const block of blocks) {
    lines.push(blockToMarkdown(block, depth));
  }
  return lines.filter((l) => l !== "").join("\n\n");
}

function indent(depth: number): string {
  return "  ".repeat(depth);
}

function blockToMarkdown(block: Block, depth: number): string {
  const type = block.type as string;
  const text = inlineToMarkdown(block.content);
  const children =
    block.children && block.children.length > 0
      ? "\n" + blocksToMarkdown(block.children, depth + 1)
      : "";

  switch (type) {
    case "heading": {
      const level = Math.min(Math.max((block.props as { level?: number }).level ?? 1, 1), 6);
      return `${"#".repeat(level)} ${text}` + children;
    }
    case "bulletListItem":
      return `${indent(depth)}- ${text}` + children;
    case "numberedListItem":
      return `${indent(depth)}1. ${text}` + children;
    case "checkListItem": {
      const checked = (block.props as { checked?: boolean }).checked;
      return `${indent(depth)}- [${checked ? "x" : " "}] ${text}` + children;
    }
    case "quote":
      return text
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n") + children;
    case "codeBlock": {
      const lang = (block.props as { language?: string }).language ?? "";
      const code = inlineToText(block.content);
      return "```" + lang + "\n" + code + "\n```";
    }
    case "divider":
      return "---";
    case "image": {
      const url = (block.props as { url?: string }).url ?? "";
      const caption = text || "image";
      return url ? `![${caption}](${url})` : `![${caption}]()`;
    }
    case "table": {
      // Best-effort pipe table using the first row as a header.
      const rows = (block.children ?? []) as Block[];
      if (rows.length === 0) return "";
      const toCells = (row: Block) =>
        (row.children ?? []).map((cell) => inlineToText((cell as Block).content));
      const header = toCells(rows[0]);
      const out = [
        `| ${header.join(" | ")} |`,
        `| ${header.map(() => "---").join(" | ")} |`,
        ...rows.slice(1).map((r) => `| ${toCells(r).join(" | ")} |`),
      ];
      return out.join("\n");
    }
    default:
      return text + children;
  }
}

/** Convert a BlockNote document to plain text (for search + word count). */
export function blocksToPlainText(blocks: Block[]): string {
  const parts: string[] = [];
  const walk = (list: Block[]) => {
    for (const b of list) {
      const text = inlineToText(b.content).trim();
      if (text) parts.push(text);
      if (b.children?.length) walk(b.children);
    }
  };
  walk(blocks);
  return parts.join(" ");
}

export function wordCount(blocks: Block[]): number {
  return blocksToPlainText(blocks).split(/\s+/).filter(Boolean).length;
}

/** Derive a title from a document's first meaningful block. */
export function deriveTitle(blocks: Block[]): string {
  const first = blocks.find((b) => {
    const t = inlineToText(b.content).trim();
    return t.length > 0;
  });
  if (!first) return "";
  return inlineToText(first.content).trim().slice(0, 60);
}

/* ------------------------------------------------------------------ *
 * Markdown → BlockNote (for "Import from ChatGPT" pastes)
 * ------------------------------------------------------------------ */

interface ParsedInline {
  type: "text";
  text: string;
  styles: Record<string, boolean>;
}

function parseInline(raw: string): ParsedInline[] {
  // Splits on **bold**, *italic*, and `code` segments.
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const out: ParsedInline[] = [];
  let last = 0;
  for (const match of raw.matchAll(pattern)) {
    const idx = match.index ?? 0;
    if (idx > last) out.push({ type: "text", text: raw.slice(last, idx), styles: {} });
    const token = match[0];
    if (token.startsWith("**")) {
      out.push({ type: "text", text: token.slice(2, -2), styles: { bold: true } });
    } else if (token.startsWith("`")) {
      out.push({ type: "text", text: token.slice(1, -1), styles: { code: true } });
    } else {
      out.push({ type: "text", text: token.slice(1, -1), styles: { italic: true } });
    }
    last = idx + token.length;
  }
  if (last < raw.length) out.push({ type: "text", text: raw.slice(last), styles: {} });
  return out;
}

const newId = (): string => uuid();

/** Parse Markdown text into BlockNote blocks (best-effort). */
export function markdownToBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const push = (partial: Record<string, unknown>) =>
    blocks.push(partial as unknown as Block);

  while (i < lines.length) {
    const line = lines[i];

    // Code fence
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1];
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing fence
      push({
        id: newId(),
        type: "codeBlock",
        props: { language: lang || "plain text" },
        content: codeLines.join("\n"),
        children: [],
      });
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      push({
        id: newId(),
        type: "heading",
        props: { level: heading[1].length },
        content: parseInline(heading[2]),
        children: [],
      });
      i++;
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      push({
        id: newId(),
        type: "quote",
        props: {},
        content: parseInline(quote[1]),
        children: [],
      });
      i++;
      continue;
    }

    const check = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
    if (check) {
      push({
        id: newId(),
        type: "checkListItem",
        props: { checked: check[1].toLowerCase() === "x" },
        content: parseInline(check[2]),
        children: [],
      });
      i++;
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      push({
        id: newId(),
        type: "bulletListItem",
        props: {},
        content: parseInline(bullet[1]),
        children: [],
      });
      i++;
      continue;
    }

    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (numbered) {
      push({
        id: newId(),
        type: "numberedListItem",
        props: {},
        content: parseInline(numbered[1]),
        children: [],
      });
      i++;
      continue;
    }

    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      push({ id: newId(), type: "divider", props: {}, content: [], children: [] });
      i++;
      continue;
    }

    // Blank lines separate paragraphs but collapse to a single block group.
    if (line.trim() === "") {
      i++;
      continue;
    }

    push({
      id: newId(),
      type: "paragraph",
      props: {},
      content: parseInline(line),
      children: [],
    });
    i++;
  }

  if (blocks.length === 0) {
    push({ id: newId(), type: "paragraph", props: {}, content: "", children: [] });
  }
  return blocks;
}
