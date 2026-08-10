"use client";

import { useEffect, useRef } from "react";
import type { Block } from "@blocknote/core";
import {
  FilePlus2,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { blocksToPlainText } from "@/lib/markdown";
import { cn, formatRelativeTime } from "@/lib/utils";

function useSearchFocusShortcut(ref: React.RefObject<HTMLInputElement | null>) {
  const { setView } = useStore();
  useEffect(() => {
    const focus = () => {
      setView("notes");
      ref.current?.focus();
      ref.current?.select();
    };
    window.addEventListener("grapho:focus-search", focus);
    return () => window.removeEventListener("grapho:focus-search", focus);
  }, [ref, setView]);
}

/**
 * The notes list — a quiet Notion-style sidebar floating over the workspace.
 * Search, recent notes, trash; the row chrome (actions) reveals on hover.
 */
function notePreview(noteContent: unknown): string {
  const text = typeof noteContent === "string" ? noteContent : blocksToPlainText(noteContent as Block[]);
  return text.replace(/\s+/g, " ").trim();
}

function formatNoteStamp(updatedAt: number): string {
  return formatRelativeTime(updatedAt);
}

export function Sidebar() {
  const {
    visibleNotes,
    activeNoteId,
    view,
    searchQuery,
    setSearchQuery,
    setActiveNote,
    createNote,
    trashNote,
    restoreNote,
    deleteNote,
  } = useStore();
  const searchRef = useRef<HTMLInputElement>(null);
  useSearchFocusShortcut(searchRef);

  const hasResults = visibleNotes.length > 0;

  return (
    <aside className="side-panel flex h-full w-[250px] shrink-0 animate-slide-left flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <span className="side-heading">{view === "trash" ? "Trash" : "Notes"}</span>
        <button
          onClick={() => createNote()}
          className="notes-compose"
          aria-label="New note"
          title="New note"
        >
          <FilePlus2 size={14} strokeWidth={1.9} />
          <span>New</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-2 pt-1">
        <label className="side-search" aria-label="Search notes">
          <Search size={13} strokeWidth={1.9} className="shrink-0 text-faint" />
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search notes"
            aria-label="Search notes"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="shrink-0 text-faint transition-colors hover:text-foreground"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </label>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-3 pt-1">
        <p className="side-section-label">
          {view === "trash" ? "Recently deleted" : searchQuery ? "Results" : "Recent notes"}
        </p>

        {!hasResults && (
          <div className="px-3 py-3">
            <p className="text-[12px] font-medium tracking-[-0.01em] text-foreground">
              {view === "trash" ? "Trash is empty." : searchQuery ? "No notes found." : "No notes yet."}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-faint">
              {view === "trash"
                ? "Deleted notes stay here until you restore or remove them forever."
                : searchQuery
                  ? "Try another search or clear the current query."
                  : "Create your first note and start writing."}
            </p>
            {view !== "trash" && !searchQuery && (
              <button onClick={() => createNote()} className="notes-empty-cta" aria-label="Create first note">
                <FilePlus2 size={14} strokeWidth={1.9} />
                <span>New note</span>
              </button>
            )}
          </div>
        )}

        <div className="space-y-1">
          {visibleNotes.map((note) => {
            if (view === "trash") {
              return (
                <div key={note.id} className={cn("note-row note-row-trash group", activeNoteId === note.id && "is-active")}>
                  <span className="min-w-0 flex-1">
                    <span className="note-row-title block truncate">{note.title || "Untitled"}</span>
                    <span className="note-row-meta block">Trashed {formatNoteStamp(note.updatedAt)}</span>
                  </span>
                  <button onClick={() => restoreNote(note.id)} className="row-action" aria-label="Restore">
                    <RotateCcw size={13} />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="row-action hover:!text-red-400"
                    aria-label="Delete forever"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            }

            const preview = notePreview(note.content).slice(0, 180);

            return (
              <div
                key={note.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveNote(note.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveNote(note.id);
                  }
                }}
                className={cn("note-row group", activeNoteId === note.id && "is-active")}
                aria-pressed={activeNoteId === note.id}
                aria-label={note.title || "Untitled note"}
              >
                <span className="note-row-main min-w-0 flex-1">
                  <span className="note-row-title block truncate">{note.title || "Untitled"}</span>
                  <span className="note-row-preview block">{preview || "Start writing…"}</span>
                  <span className="note-row-meta block">{formatNoteStamp(note.updatedAt)}</span>
                </span>
                <span className="note-row-side flex items-center gap-1">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      trashNote(note.id);
                    }}
                    className="row-action"
                    aria-label="Move to trash"
                  >
                    <Trash2 size={13} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
