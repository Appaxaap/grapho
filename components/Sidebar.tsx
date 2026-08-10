"use client";

import { useEffect, useRef } from "react";
import {
  FilePlus2,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
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

  return (
    <aside className="floating-panel flex h-full w-[264px] shrink-0 animate-slide-left flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <span className="side-heading">{view === "trash" ? "Trash" : "My Notes"}</span>
        <button
          onClick={() => createNote()}
          className="icon-btn"
          aria-label="New note"
          title="New note"
        >
          <FilePlus2 size={15} strokeWidth={1.9} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3 pt-2">
        <div className="side-search">
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
        </div>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
        <p className="side-section-label">
          {view === "trash" ? "Recently deleted" : searchQuery ? "Results" : "Recent notes"}
        </p>

        {visibleNotes.length === 0 && (
          <p className="px-3 py-2 text-[12px] leading-relaxed text-faint">
            {view === "trash" ? "Trash is empty." : searchQuery ? "No matching notes." : "No notes yet."}
          </p>
        )}

        <div className="space-y-px">
          {visibleNotes.map((note) => {
            if (view === "trash") {
              return (
                <div key={note.id} className="note-row group">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-foreground">
                      {note.title || "Untitled"}
                    </span>
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

            return (
              <div
                key={note.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveNote(note.id)}
                onKeyDown={(event) => event.key === "Enter" && setActiveNote(note.id)}
                className={cn("note-row group cursor-pointer", activeNoteId === note.id && "is-active")}
              >
                <span className="note-dot" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="note-row-title block truncate">{note.title || "Untitled"}</span>
                  <span className="note-row-meta block">{formatRelativeTime(note.updatedAt)}</span>
                </span>
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
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
