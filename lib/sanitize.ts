import { defaultBlockSpecs } from "@blocknote/core";
import type { Block } from "@blocknote/core";
import { uuid } from "./utils";

/* ------------------------------------------------------------------ *
 * Content sanitizer
 *
 * Blocks come out of SQLite as plain JSON. BlockNote throws
 * "Error creating document from blocks passed as `initialContent`" when
 * stored content no longer matches its schema — e.g. notes written by an
 * older build, hand-edited data, or a BlockNote major bump. This module
 * repairs what it can (unknown types → paragraph, bad props/styles
 * dropped, ids regenerated) so a damaged note can never take the editor
 * down.
 * ------------------------------------------------------------------ */

type ContentKind = "inline" | "none" | "plain" | "table";

interface SpecInfo {
  content: ContentKind;
  props: Set<string>;
}

const SPECS = new Map<string, SpecInfo>();
for (const [type, spec] of Object.entries(defaultBlockSpecs)) {
  SPECS.set(type, {
    content: spec.config.content as ContentKind,
    props: new Set(Object.keys(spec.config.propSchema)),
  });
}

/** Style keys BlockNote's default style schema knows about. */
const STYLE_KEYS = new Set([
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "textColor",
  "backgroundColor",
]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Rebuild an inline content array, dropping anything BlockNote can't parse. */
function sanitizeInline(content: unknown): unknown {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const out: unknown[] = [];
  for (const item of content) {
    if (typeof item === "string") {
      out.push(item);
      continue;
    }
    if (!isRecord(item)) continue;
    if (item.type === "text") {
      const text = typeof item.text === "string" ? item.text : "";
      const styles: Record<string, boolean | string> = {};
      if (isRecord(item.styles)) {
        for (const [k, v] of Object.entries(item.styles)) {
          if (STYLE_KEYS.has(k) && (typeof v === "boolean" || typeof v === "string")) {
            styles[k] = v;
          }
        }
      }
      out.push({ type: "text", text, styles });
    } else if (item.type === "link") {
      out.push({
        type: "link",
        href: typeof item.href === "string" ? item.href : "",
        content: sanitizeInline(item.content),
      });
    }
    // Unknown inline types (e.g. a custom inline schema) are dropped.
  }
  return out;
}

/** Best-effort plain text from any content shape (for lossless fallbacks). */
function textFromContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((item) => {
      if (typeof item === "string") return item;
      if (!isRecord(item)) return "";
      if (item.type === "link") return textFromContent(item.content);
      if (item.type === "text") return typeof item.text === "string" ? item.text : "";
      return "";
    })
    .join("");
}

/** Sanitize a table's `tableContent` value, or return null to fall back. */
function sanitizeTableContent(content: unknown): unknown | null {
  if (!isRecord(content) || content.type !== "tableContent") return null;
  const rows = Array.isArray(content.rows) ? content.rows : [];
  const out: unknown[] = [];
  for (const row of rows) {
    if (!isRecord(row) || !Array.isArray(row.cells)) continue;
    out.push({
      type: "tableRow",
      cells: row.cells
        .filter(isRecord)
        .map((cell) => ({
          type: "tableCell",
          colspan: typeof cell.colspan === "number" ? cell.colspan : 1,
          rowspan: typeof cell.rowspan === "number" ? cell.rowspan : 1,
          content: sanitizeInline(cell.content),
        })),
    });
  }
  return {
    type: "tableContent",
    columnWidths: Array.isArray(content.columnWidths) ? content.columnWidths : [],
    headerCols: typeof content.headerCols === "number" ? content.headerCols : 0,
    headerRows: typeof content.headerRows === "number" ? content.headerRows : 0,
    rows: out,
  };
}

/** Validate `props` against the block type's prop schema. */
function sanitizeProps(type: string, props: unknown): Record<string, unknown> {
  const spec = SPECS.get(type);
  const allowed = spec?.props;
  if (!isRecord(props) || !allowed) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!allowed.has(key)) continue;
    if (value === null || value === undefined) continue;
    // Level must be 1–6 for headings; keep everything else as-is (BlockNote
    // validates enums/colors at runtime, and any string/boolean/number is
    // structurally safe for createChecked).
    if (key === "level" && (typeof value !== "number" || value < 1 || value > 6)) {
      continue;
    }
    if (typeof value === "object") continue;
    out[key] = value;
  }
  return out;
}

/**
 * Sanitize a JSON block array into blocks BlockNote can definitely load.
 * Never throws. Unknown block types are downgraded to paragraphs so no
 * content is lost.
 */
export function sanitizeBlocks(input: unknown): Block[] {
  const seenIds = new Set<string>();
  const nextId = (): string => {
    for (let i = 0; i < 8; i++) {
      const id = uuid();
      if (!seenIds.has(id)) {
        seenIds.add(id);
        return id;
      }
    }
    // Last resort — uuid() collision is astronomically unlikely, but be safe.
    const id = `bn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    seenIds.add(id);
    return id;
  };

  const sanitizeBlock = (raw: unknown): Block | null => {
    if (!isRecord(raw)) return null;
    let type = typeof raw.type === "string" ? raw.type : "";
    let props: Record<string, unknown> = {};
    let content: unknown = raw.content;
    let children: Block[] = [];

    const known = SPECS.has(type);
    const spec = known ? SPECS.get(type)! : null;

    if (!known) {
      // Downgrade unknown/removed block types to a paragraph, keeping text
      // and any recognizable child blocks.
      type = "paragraph";
      children = sanitizeBlocks(raw.children);
      content = sanitizeInline(content);
    } else {
      props = sanitizeProps(type, raw.props);
      children = sanitizeBlocks(raw.children);

      switch (spec!.content) {
        case "inline":
          content = sanitizeInline(content);
          break;
        case "plain":
          content = typeof content === "string" ? content : textFromContent(content);
          break;
        case "none":
          content = "";
          break;
        case "table": {
          const table = sanitizeTableContent(content);
          if (table !== null) {
            content = table;
          } else {
            // Broken table → keep the text in a paragraph.
            type = "paragraph";
            content = sanitizeInline(raw.content);
          }
          break;
        }
      }
    }

    const id = typeof raw.id === "string" && raw.id.length > 0 ? raw.id : nextId();
    if (seenIds.has(id)) {
      return { id: nextId(), type, props, content, children } as unknown as Block;
    }
    seenIds.add(id);

    return { id, type, props, content, children } as unknown as Block;
  };

  const out: Block[] = [];
  if (!Array.isArray(input)) return [emptyParagraph()];
  for (const raw of input) {
    const block = sanitizeBlock(raw);
    if (block) out.push(block);
  }
  // BlockNote rejects an empty `initialContent` array outright (its default
  // only applies when the option is undefined), so an empty document must be
  // represented as a single empty paragraph.
  return out.length > 0 ? out : [emptyParagraph()];

  function emptyParagraph(): Block {
    return {
      id: nextId(),
      type: "paragraph",
      props: {},
      content: "",
      children: [],
    } as unknown as Block;
  }
}
