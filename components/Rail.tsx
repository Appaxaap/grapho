"use client";

import {
  FileDown,
  History,
  Import,
  NotebookPen,
  Settings,
  Trash2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Slim icon rail — the app's fixed chrome. Adobe-style: navigation and
 * tools live in a quiet vertical strip; the panels float beside it.
 */
export function Rail() {
  const { view, setView, openHistory, setExportOpen, setImportOpen, setSettingsOpen } = useStore();

  return (
    <nav className="rail" aria-label="Primary">
      <button className="icon-btn" onClick={() => setView("notes")} title="My Notes" aria-label="My Notes">
        <NotebookPen size={16} strokeWidth={1.9} />
      </button>
      <button className={cn("icon-btn", view === "trash" && "is-active")} onClick={() => setView("trash")} title="Trash" aria-label="Trash">
        <Trash2 size={16} strokeWidth={1.9} />
      </button>

      <span className="rail-divider" aria-hidden />

      <button className="icon-btn" onClick={openHistory} title="Version history" aria-label="Version history">
        <History size={16} strokeWidth={1.9} />
      </button>
      <button className="icon-btn" onClick={() => setExportOpen(true)} title="Export" aria-label="Export">
        <FileDown size={16} strokeWidth={1.9} />
      </button>
      <button className="icon-btn" onClick={() => setImportOpen(true)} title="Import" aria-label="Import">
        <Import size={16} strokeWidth={1.9} />
      </button>

      <span className="rail-divider" aria-hidden />

      <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Settings" aria-label="Settings">
        <Settings size={16} strokeWidth={1.9} />
      </button>
    </nav>
  );
}
