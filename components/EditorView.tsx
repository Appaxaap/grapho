"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import type { Block } from "@blocknote/core";
import { useStore } from "@/lib/store";
import type { Note } from "@/lib/types";
import { cn, formatRelativeTime, pluralize } from "@/lib/utils";
import { EDITOR_SYNC_THROTTLE_MS } from "@/lib/constants";
import { blocksToPlainText, deriveTitle } from "@/lib/markdown";
import { sanitizeBlocks } from "@/lib/sanitize";
import { publishActiveEditor } from "@/lib/editorRegistry";
import { useDocState } from "@/lib/docState";
import { EmojiPicker, type EmojiSelectEvent } from "./EmojiPicker";

interface EditorViewProps {
  note: Note;
  theme: "light" | "dark";
}

/**
 * The writing surface — a quiet, typography-led document on the dark stage.
 * No card, no chrome: the text sits directly on the canvas. Contextual
 * formatting floats near the selection; metadata stays beneath the title.
 */
export function EditorView({ note, theme }: EditorViewProps) {
  const { updateNote, settings, emojiOpen, setEmojiOpen } = useStore();
  const [initialContent] = useState(() => sanitizeBlocks(note.content));
  const editor = useCreateBlockNote({ initialContent });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDocRef = useRef<Block[]>(initialContent);
  const pendingRef = useRef(false);

  /* Save-state feedback: "Saving…" until the store confirms the flush. */
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const fontClass =
    settings.font === "inter"
      ? "font-editor-inter"
      : settings.font === "georgia"
        ? "font-editor-georgia"
        : settings.font === "merriweather"
          ? "font-editor-serif"
          : "font-editor-mono";

  const doc = useDocState();

  /* Publish this editor so the top bar and inspector can reach it. */
  useEffect(() => {
    publishActiveEditor(editor);
    return () => publishActiveEditor(null);
  }, [editor]);

  /* Throttled sync of editor changes into app state + SQLite. */
  const handleChange = (doc: Block[]) => {
    lastDocRef.current = doc;
    pendingRef.current = true;
    setSaveState("saving");
    if (timerRef.current) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      updateNote(note.id, { content: lastDocRef.current });
    }, EDITOR_SYNC_THROTTLE_MS);
  };

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  /* Watch for the flush landing; the confirmation state is scheduled (not
     synchronous) so the effect never sets state during the render phase. */
  useEffect(() => {
    if (!pendingRef.current) return;
    if (note.lastSavedAt >= note.updatedAt) {
      pendingRef.current = false;
      const t = setTimeout(() => {
        /* A new edit may have started while we waited — don't claim a save. */
        if (!pendingRef.current) setSaveState("saved");
      }, 0);
      return () => clearTimeout(t);
    }
  }, [note.lastSavedAt, note.updatedAt]);

  /* "Saved locally" fades back to "Stored locally" after a beat. */
  useEffect(() => {
    if (saveState !== "saved") return;
    const t = setTimeout(() => setSaveState("idle"), 2200);
    return () => clearTimeout(t);
  }, [saveState]);

  /* Auto-derive the title from the first block until the user names it. */
  useEffect(() => {
    if (!note.title || note.title === "Untitled") {
      const t = deriveTitle(note.content);
      if (t && t !== note.title) updateNote(note.id, { title: t });
    }
  }, [note.content, note.title, note.id, updateNote]);

  const onEmoji = (event: EmojiSelectEvent) => {
    editor.insertInlineContent(`${event.native} `);
    editor.focus();
    setEmojiOpen(false);
  };

  /* Word count is a pure derivation of the block document. */
  const wordCount = useMemo(() => {
    const text = blocksToPlainText(note.content);
    return text.split(/\s+/).filter(Boolean).length;
  }, [note.content]);

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      {/* Document — centered on the stage, generous type, quiet canvas. */}
      <div
        className="grapho-doc flex h-full items-start justify-center overflow-hidden"
        style={{ "--doc-font-scale": doc.size, "--doc-line-height": doc.spacing } as React.CSSProperties}
      >
        <article className="doc-col-panels h-full">
          <div className="doc-scroll">
            <input
              value={note.title}
              onChange={(e) => updateNote(note.id, { title: e.target.value })}
              placeholder="Untitled"
              spellCheck={false}
              className={cn(fontClass, "doc-title-input")}
              aria-label="Note title"
            />

            {/* Quiet metadata — never competes with the title. */}
            <div className="doc-meta" aria-live="polite">
              <span className={cn("save-state", saveState === "saving" ? "is-saving" : saveState === "saved" && "is-saved")}>
                {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved locally" : "Stored locally"}
              </span>
              <span className="sep" aria-hidden>·</span>
              <span>{wordCount.toLocaleString()} {pluralize(wordCount, "word")}</span>
              <span className="sep" aria-hidden>·</span>
              <span>Edited {formatRelativeTime(note.updatedAt)}</span>
            </div>

            <div className={cn("grapho-editor-host mt-10", fontClass)}>
              <BlockNoteView
                editor={editor}
                theme={theme}
                onChange={(ed) => handleChange(ed.document)}
                className="bn-shadcn"
                formattingToolbar={true}
                linkToolbar={true}
                slashMenu={true}
                sideMenu={true}
                filePanel={true}
                tableHandles={true}
              />
            </div>
          </div>
        </article>
      </div>

      {emojiOpen && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" onClick={() => setEmojiOpen(false)} aria-label="Close emoji picker" />
          <div className="animate-pop absolute left-1/2 top-[76px] z-50 overflow-hidden rounded-xl border border-border bg-panel-solid shadow-(--shadow-floating)">
            <EmojiPicker theme={theme} onEmojiSelect={onEmoji} />
          </div>
        </>
      )}
    </div>
  );
}
