"use client";

import { useEffect, useRef, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import type { Block } from "@blocknote/core";
import { useStore } from "@/lib/store";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EDITOR_SYNC_THROTTLE_MS } from "@/lib/constants";
import { deriveTitle } from "@/lib/markdown";
import { sanitizeBlocks } from "@/lib/sanitize";
import { publishActiveEditor } from "@/lib/editorRegistry";
import { useDocState } from "@/lib/docState";
import { FormatBar } from "./FormatBar";
import { EmojiPicker, type EmojiSelectEvent } from "./EmojiPicker";

interface EditorViewProps {
  note: Note;
}

/**
 * The writing surface — a quiet, typography-led document on the dark stage.
 * No card, no chrome: text sits directly on the canvas, Notion-style. The
 * contextual format bar floats over the top while the note is open.
 */
export function EditorView({ note }: EditorViewProps) {
  const { updateNote, settings, emojiOpen, setEmojiOpen } = useStore();
  const [initialContent] = useState(() => sanitizeBlocks(note.content));
  const editor = useCreateBlockNote({ initialContent });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDocRef = useRef<Block[]>(initialContent);

  const fontClass =
    settings.font === "inter"
      ? "font-editor-inter"
      : settings.font === "georgia"
        ? "font-editor-georgia"
        : settings.font === "merriweather"
          ? "font-editor-serif"
          : "font-editor-mono";

  const doc = useDocState();

  /* Publish this editor so the top bar + format bar can reach it. */
  useEffect(() => {
    publishActiveEditor(editor);
    return () => publishActiveEditor(null);
  }, [editor]);

  /* Throttled sync of editor changes into app state + SQLite. */
  const handleChange = (doc: Block[]) => {
    lastDocRef.current = doc;
    if (timerRef.current) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      updateNote(note.id, { content: lastDocRef.current });
    }, EDITOR_SYNC_THROTTLE_MS);
  };

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

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

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      {/* Contextual floating format bar */}
      <FormatBar />

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
            <div className={cn("grapho-editor-host mt-10", fontClass)}>
              <BlockNoteView
                editor={editor}
                theme="light"
                onChange={(ed) => handleChange(ed.document)}
                className="bn-shadcn"
                formattingToolbar={false}
                linkToolbar={false}
                slashMenu={false}
                sideMenu={false}
                filePanel={false}
                tableHandles={false}
              />
            </div>
          </div>
        </article>
      </div>

      {emojiOpen && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" onClick={() => setEmojiOpen(false)} aria-label="Close emoji picker" />
          <div className="animate-pop absolute left-1/2 top-[76px] z-50 overflow-hidden rounded-xl border border-border bg-panel-solid shadow-(--shadow-floating)">
            <EmojiPicker theme="dark" onEmojiSelect={onEmoji} />
          </div>
        </>
      )}
    </div>
  );
}
