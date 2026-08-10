"use client";

import { useEffect, useRef } from "react";
import { FileDown, FilePlus2, History, Import, RotateCcw, Search, Settings, Trash2, X } from "lucide-react";
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

export function Sidebar() {
  const {
    visibleNotes,
    activeNoteId,
    view,
    searchQuery,
    setSearchQuery,
    setView,
    setActiveNote,
    createNote,
    trashNote,
    restoreNote,
    deleteNote,
    openHistory,
    setExportOpen,
    setImportOpen,
    setSettingsOpen,
  } = useStore();
  const searchRef = useRef<HTMLInputElement>(null);
  useSearchFocusShortcut(searchRef);

  return (
    <aside className="floating-panel flex h-full min-h-0 flex-col overflow-hidden">
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center justify-between rounded-[14px] border border-border bg-panel-solid px-3 py-2.5 shadow-sm">
          <h2 className="text-[13px] font-semibold tracking-[-0.02em]">Notes Editor</h2>
          <button onClick={() => createNote()} className="sidebar-compose" aria-label="New note" title="New note">
            <FilePlus2 className="size-3.5" />
          </button>
        </div>

        <nav className="mt-4 space-y-1">
          <button onClick={() => setView("notes")} className={cn("sidebar-nav", view === "notes" && "is-active")}>My Notes</button>
          <button disabled className="sidebar-nav">Shared Notes <span className="ml-auto text-[8px] text-faint">Soon</span></button>
          <div className="my-3 h-px bg-border" />
          <button onClick={() => setView("trash")} className={cn("sidebar-nav", view === "trash" && "is-active")}>Trash</button>
        </nav>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-faint" />
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="sidebar-search h-8 w-full pl-7 pr-7 text-[10px] outline-none"
            placeholder="Search notes"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-faint hover:text-foreground" aria-label="Clear search">
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-3 pb-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-faint">
          {view === "trash" ? "Recently deleted" : searchQuery ? "Results" : "Recent notes"}
        </p>

        {visibleNotes.length === 0 && (
          <p className="px-3 py-3 text-[10px] leading-relaxed text-faint">
            {view === "trash" ? "Trash is empty." : searchQuery ? "No matching notes." : "No notes yet."}
          </p>
        )}

        <div className="space-y-0.5">
          {visibleNotes.map((note) => {
            if (view === "trash") {
              return (
                <div key={note.id} className="group note-list-row">
                  <span className="min-w-0 flex-1 truncate">{note.title || "Untitled"}</span>
                  <button onClick={() => restoreNote(note.id)} className="row-action" aria-label="Restore"><RotateCcw className="size-3" /></button>
                  <button onClick={() => deleteNote(note.id)} className="row-action hover:text-red-500" aria-label="Delete forever"><Trash2 className="size-3" /></button>
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
                className={cn("group note-list-row cursor-pointer", activeNoteId === note.id && "is-active")}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-medium">{note.title || "Untitled"}</span>
                  <span className="block text-[8px] text-faint">{formatRelativeTime(note.updatedAt)}</span>
                </span>
                <button
                  onClick={(event) => { event.stopPropagation(); trashNote(note.id); }}
                  className="row-action opacity-0 group-hover:opacity-100"
                  aria-label="Move to trash"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="mx-3 mb-3 flex items-center justify-between rounded-[14px] border border-border bg-panel-solid px-3 py-2.5">
        {[
          { icon: History, label: "History", action: openHistory },
          { icon: FileDown, label: "Export", action: () => setExportOpen(true) },
          { icon: Import, label: "Import", action: () => setImportOpen(true) },
          { icon: Settings, label: "Settings", action: () => setSettingsOpen(true) },
        ].map(({ icon: Icon, label, action }) => (
          <button key={label} onClick={action} className="sidebar-utility" title={label} aria-label={label}>
            <Icon className="size-3.5" />
          </button>
        ))}
      </footer>
    </aside>
  );
}
