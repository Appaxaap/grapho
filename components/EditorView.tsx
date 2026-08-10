"use client";

import { useEffect, useRef, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import type { Block } from "@blocknote/core";
import { useStore } from "@/lib/store";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EDITOR_SYNC_THROTTLE_MS } from "@/lib/constants";
import { deriveTitle, inlineToText } from "@/lib/markdown";
import { sanitizeBlocks } from "@/lib/sanitize";
import { publishActiveEditor } from "@/lib/editorRegistry";
import { useDocState } from "@/lib/docState";
import { ContextMenu } from "./ContextMenu";

interface EditorViewProps {
  note: Note;
}

/**
 * The document surface — a centered dark editorial canvas sitting on the
 * near-black editor column. The reference's floating BlockNote chrome
 * (formatting toolbar, slash menu, side menu, …) is disabled: formatting
 * lives in the inspector, and the selection context menu is our own.
 */
export function EditorView({ note }: EditorViewProps) {
  const { updateNote, settings } = useStore();
  // Sanitize once per mount (EditorView is keyed by note id). Guard so a
  // damaged document can never crash the editor here — db.ts also sanitizes
  // on load; this catches any other content source.
  const [initialContent] = useState(() => sanitizeBlocks(note.content));
  const editor = useCreateBlockNote({ initialContent });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDocRef = useRef<Block[]>(initialContent);

  /* Selection context menu state (right-click on the document surface). */
  const [menu, setMenu] = useState<{ x: number; y: number; text: string } | null>(null);

  const fontClass =
    settings.font === "inter"
      ? "font-editor-inter"
      : settings.font === "georgia"
        ? "font-editor-georgia"
        : settings.font === "merriweather"
          ? "font-editor-serif"
          : "font-editor-mono";

  const doc = useDocState();

  /* Publish this editor so out-of-tree UI (top bar, inspector, menus) can
     reach the cursor/selection. Exactly one editor is mounted at a time. */
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

  const onContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    let text = "";
    try {
      text = editor.getSelectedText() ?? "";
    } catch {
      /* non-fatal */
    }
    if (!text.trim()) {
      try {
        const block = editor.getTextCursorPosition().block;
        text = inlineToText(block.content).trim();
      } catch {
        /* non-fatal */
      }
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 8), Math.max(rect.width - 238, 8));
    const y = Math.min(Math.max(e.clientY - rect.top, 8), Math.max(rect.height - 252, 8));
    setMenu({ x, y, text });
  };

  return (
    <div
      className="relative h-full min-h-0 overflow-hidden"
      onContextMenu={onContextMenu}
    >
      {/* Document surface — fixed proportions, internally scrollable. */}
      <div
        className="grapho-doc flex h-full items-start justify-center overflow-hidden px-8 py-6"
        style={{ "--doc-font-scale": doc.size, "--doc-line-height": doc.spacing } as React.CSSProperties}
      >
        <article className="document-card flex h-full w-full max-w-[920px] flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto px-12 pb-14 pt-10">
            <input
              value={note.title}
              onChange={(e) => updateNote(note.id, { title: e.target.value })}
              placeholder="Untitled"
              spellCheck={false}
              className={cn(
                fontClass,
                "w-full bg-transparent text-[34px] font-semibold leading-[1.05] tracking-[-0.05em] text-foreground outline-none placeholder:text-faint/60"
              )}
              aria-label="Note title"
            />
            <div className={cn("grapho-editor-host mt-8", fontClass)}>
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

      <ContextMenu
        editor={editor}
        open={menu !== null}
        x={menu?.x ?? 0}
        y={menu?.y ?? 0}
        text={menu?.text ?? ""}
        onClose={() => setMenu(null)}
      />
    </div>
  );
}
