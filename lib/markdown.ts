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
  type: "text" | "link";
  text?: string;
  href?: string;
  content?: ParsedInline[];
  styles?: Record<string, boolean>;
}

/* ------------------------------------------------------------------ *
 * Inline Markdown parsing
 *
 * A small delimiter-stack parser (CommonMark-flavoured) that supports
 * nesting and the strong/emphasis combinations ChatGPT emits, e.g.
 *   **bold**, *italic*, ***bold italic***, **bold *nested* bold**,
 *   __bold__, _italic_, ~~strike~~, `code`, and [links](https://...).
 * Unmatched delimiters (e.g. a stray "**") are rendered literally rather
 * than leaving orphan asterisks behind.
 * ------------------------------------------------------------------ */

const INLINE_ALNUM = (c: string | undefined): boolean =>
  c !== undefined && /[A-Za-z0-9]/.test(c);
const INLINE_WS = (c: string | undefined): boolean =>
  c === undefined || c === " " || c === "\t" || c === "\n" || c === "\r";

/** Parse a plain (code/link-free) segment for emphasis, applying `inherited`
 *  styles to every leaf so nested runs merge correctly when emitted. */
function parseEmphasis(seg: string, inherited: Record<string, boolean>): ParsedInline[] {
  // 1. Tokenise into text runs and delimiter markers.
  const items: Array<
    | { text: string }
    | { delim: true; ch: string; len: number; canOpen: boolean; canClose: boolean; matched: boolean }
    | { group: true; styles: Record<string, boolean>; inner: Array<{ text: string } | { delim: true; ch: string; len: number; canOpen: boolean; canClose: boolean; matched: boolean }> }
  > = [];
  let buf = "";
  let i = 0;
  const n = seg.length;
  while (i < n) {
    const c = seg[i];
    if (c === "*" || c === "_" || c === "~") {
      let j = i;
      while (j < n && seg[j] === c) j++;
      const len = j - i;
      const prev = seg[i - 1];
      const next = seg[j];
      let canOpen = false;
      let canClose = false;
      if (c === "_") {
        // Underscores only emphasise when not pinned inside a word (snake_case).
        const intra = INLINE_ALNUM(prev) && INLINE_ALNUM(next);
        canOpen = !INLINE_WS(next) && !intra;
        canClose = !INLINE_WS(prev) && !intra;
      } else {
        canOpen = !INLINE_WS(next);
        canClose = !INLINE_WS(prev);
      }
      // A delimiter that can neither open nor close is just literal text.
      if (!canOpen && !canClose) {
        buf += seg.slice(i, j);
        i = j;
        continue;
      }
      // Strikethrough requires a run of at least two tildes.
      if (c === "~" && len < 2) {
        buf += seg.slice(i, j);
        i = j;
        continue;
      }
      if (buf) {
        items.push({ text: buf });
        buf = "";
      }
      items.push({ delim: true, ch: c, len, canOpen, canClose, matched: false });
      i = j;
    } else {
      buf += c;
      i++;
    }
  }
  if (buf) items.push({ text: buf });

  // 2. Match delimiter pairs (innermost first), folding matched spans into groups.
  let changed = true;
  while (changed) {
    changed = false;
    for (let k = 0; k < items.length; k++) {
      const it = items[k];
      if (!(it as { delim?: boolean }).delim || !(it as { canClose?: boolean }).canClose || (it as { matched?: boolean }).matched) continue;
      for (let m = k - 1; m >= 0; m--) {
        const op = items[m];
        if (!(op as { delim?: boolean }).delim || (op as { ch?: string }).ch !== (it as { ch?: string }).ch || !(op as { canOpen?: boolean }).canOpen || (op as { matched?: boolean }).matched) continue;
        const openLen = (op as { len: number }).len;
        const closeLen = (it as { len: number }).len;
        const strong = openLen >= 2 && closeLen >= 2;
        const emphasis = (openLen + closeLen) % 3 === 0;
        const inner = items.slice(m + 1, k);
        if (inner.length === 0) continue; // empty content is not emphasis
        const styles: Record<string, boolean> = {};
        const ch = (it as { ch: string }).ch;
        if (ch === "~") {
          if (strong) styles.strike = true;
        } else {
          if (strong) styles.bold = true;
          if (!strong || emphasis) styles.italic = true;
        }
        (op as { matched: boolean }).matched = true;
        (it as { matched: boolean }).matched = true;
        items.splice(m, k - m + 1, { group: true, styles, inner } as never);
        changed = true;
        break;
      }
    }
  }

  // 3. Flatten groups, merging styles down onto leaf text nodes.
  const flatten = (
    arr: Array<
      | { text: string }
      | { delim: true; ch: string; len: number; matched: boolean }
      | { group: true; styles: Record<string, boolean>; inner: Array<{ text: string } | { delim: true; ch: string; len: number; matched: boolean }> }
    >,
    inh: Record<string, boolean>
  ): ParsedInline[] => {
    const out: ParsedInline[] = [];
    for (const x of arr) {
      if ((x as { group?: boolean }).group) {
        out.push(...flatten((x as { inner: typeof arr }).inner, { ...inh, ...(x as { styles: Record<string, boolean> }).styles }));
      } else if ((x as { delim?: boolean }).delim) {
        out.push({ type: "text", text: (x as { ch: string }).ch.repeat((x as { len: number }).len), styles: { ...inh } });
      } else {
        out.push({ type: "text", text: (x as { text: string }).text, styles: { ...inh } });
      }
    }
    return out;
  };
  return flatten(items, inherited);
}

/** Parse inline Markdown into BlockNote inline content (text + link nodes). */
export function parseInline(raw: string, inherited: Record<string, boolean> = {}): ParsedInline[] {
  const out: ParsedInline[] = [];
  const n = raw.length;
  let i = 0;
  while (i < n) {
    const c = raw[i];
    // Code spans are verbatim and take precedence over everything else.
    if (c === "`") {
      const end = raw.indexOf("`", i + 1);
      if (end !== -1) {
        out.push({ type: "text", text: raw.slice(i + 1, end), styles: { ...inherited, code: true } });
        i = end + 1;
        continue;
      }
    }
    // Inline links: [text](url)
    if (c === "[") {
      const m = /^\[([^\]]*)\]\(([^)\s]+)\)/.exec(raw.slice(i));
      if (m) {
        out.push({ type: "link", href: m[2], content: parseInline(m[1], inherited) });
        i += m[0].length;
        continue;
      }
    }
    // Otherwise collect a run up to the next code span or link, then emphasise it.
    let j = i;
    while (j < n && raw[j] !== "`" && raw[j] !== "[") j++;
    out.push(...parseEmphasis(raw.slice(i, j), inherited));
    i = j;
  }
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
