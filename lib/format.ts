"use client";

import type { BlockNoteEditor } from "@blocknote/core";

/** Shared editor formatting operations used by the inspector + format bar. */

export function toggleStyle(
  editor: BlockNoteEditor,
  style: "bold" | "italic" | "underline" | "strike"
): void {
  editor.toggleStyles({ [style]: true } as never);
  editor.focus();
}

export function cycleTextAlignment(editor: BlockNoteEditor): void {
  const block = editor.getTextCursorPosition().block;
  const current = (block.props as { textAlignment?: string }).textAlignment ?? "left";
  const order = ["left", "center", "right"] as const;
  const next = order[(order.indexOf(current as (typeof order)[number]) + 1) % order.length];
  editor.updateBlock(block, { props: { textAlignment: next } } as never);
  editor.focus();
}

export function toggleBlockType(
  editor: BlockNoteEditor,
  type: "bulletListItem" | "numberedListItem" | "checkListItem" | "paragraph"
): void {
  const block = editor.getTextCursorPosition().block;
  editor.updateBlock(block, { type: block.type === type ? "paragraph" : type } as never);
  editor.focus();
}

export function insertLink(editor: BlockNoteEditor): void {
  const url = window.prompt("Link URL", editor.getSelectedLinkUrl() ?? "https://");
  if (!url) return;
  const selected = editor.getSelectedText().trim();
  if (selected) {
    editor.createLink(url);
  } else {
    const text = window.prompt("Link text", "Link");
    if (text) editor.createLink(url, text);
  }
  editor.focus();
}

export function insertImage(editor: BlockNoteEditor): void {
  const url = window.prompt("Image URL");
  if (!url) return;
  editor.insertBlocks([{ type: "image", props: { url } } as never], editor.getTextCursorPosition().block, "after");
  editor.focus();
}
