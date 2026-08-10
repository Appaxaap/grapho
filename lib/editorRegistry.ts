"use client";

import { useSyncExternalStore } from "react";
import type { BlockNoteEditor } from "@blocknote/core";

/**
 * Module-level reference to the currently mounted editor.
 *
 * Grapho renders exactly one editor at a time (keyed by active note), so a
 * single slot is enough. UI outside `EditorView` (top bar undo/redo, the
 * inspector, the selection context menu) uses this to reach the editor.
 */
export const activeEditorRef: { current: BlockNoteEditor | null } = {
  current: null,
};

/* Tiny pub/sub so components can react when the active editor changes. */
const subscribers = new Set<() => void>();

function emit(): void {
  for (const s of subscribers) s();
}

function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

/** Publish the active editor (call from EditorView on mount/unmount). */
export function publishActiveEditor(editor: BlockNoteEditor | null): void {
  activeEditorRef.current = editor;
  emit();
}

/** Reactive handle to the currently mounted editor (null when none). */
export function useActiveEditor(): BlockNoteEditor | null {
  return useSyncExternalStore(subscribe, () => activeEditorRef.current, () => null);
}

/** Insert a string at the active editor's cursor, if one is mounted. */
export function insertIntoActiveEditor(content: string): boolean {
  const editor = activeEditorRef.current;
  if (!editor) return false;
  editor.insertInlineContent(content);
  editor.focus();
  return true;
}
