"use client";

import { Bell, CircleUserRound, Feather, Redo2, Undo2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useActiveEditor } from "@/lib/editorRegistry";
import { Sidebar } from "./Sidebar";
import { EditorView } from "./EditorView";
import { Inspector } from "./Inspector";
import { WelcomeScreen } from "./WelcomeScreen";
import { ExportModal } from "./ExportModal";
import { ImportModal } from "./ImportModal";
import { HistoryPanel } from "./HistoryPanel";
import { SettingsMenu } from "./SettingsMenu";

function TopBar() {
  const { activeNote, view } = useStore();
  const editor = useActiveEditor();

  return (
    <header className="flex h-[54px] shrink-0 items-center border-b border-border px-7">
      <div className="flex w-[188px] shrink-0 items-center gap-2.5">
        <span className="flex size-6 items-center justify-center rounded-[7px] bg-foreground text-background">
          <Feather className="size-3.5" strokeWidth={2.4} />
        </span>
        <span className="text-[14px] font-semibold tracking-[-0.025em]">Grapho</span>
      </div>

      <nav className="flex min-w-0 items-center gap-2 text-[10px]" aria-label="Breadcrumb">
        <span className="text-faint">{view === "trash" ? "Trash" : "My Notes"}</span>
        <span className="text-faint">/</span>
        <span className="truncate font-medium text-muted">{activeNote?.title || "Untitled"}</span>
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <button className="top-control" onClick={() => editor?.undo()} disabled={!editor} aria-label="Undo" title="Undo">
          <Undo2 className="size-3.5" />
        </button>
        <button className="top-control" onClick={() => editor?.redo()} disabled={!editor} aria-label="Redo" title="Redo">
          <Redo2 className="size-3.5" />
        </button>
      </div>

      <div className="ml-[238px] flex items-center gap-4">
        <button className="text-muted transition-colors hover:text-foreground" aria-label="Notifications" title="Notifications">
          <Bell className="size-4" />
        </button>
        <button className="text-muted transition-colors hover:text-foreground" aria-label="Profile" title="Profile">
          <CircleUserRound className="size-[18px]" />
        </button>
      </div>
    </header>
  );
}

function Splash() {
  return (
    <div className="flex h-full w-full items-center justify-center text-[11px] text-faint">
      Opening your notes…
    </div>
  );
}

export default function App() {
  const { ready, settings, activeNote } = useStore();
  useKeyboardShortcuts();

  return (
    <div data-accent={settings.accent} className="flex h-dvh w-full bg-background text-foreground antialiased">
      {!ready ? (
        <Splash />
      ) : (
        <div className="app-shell flex h-full w-full flex-col overflow-hidden">
          <TopBar />
          <div className="grid min-h-0 flex-1 grid-cols-[210px_minmax(0,1fr)_290px] gap-3 px-3 pb-3">
            <Sidebar />
            <main className="relative min-w-0 bg-workspace">
              {activeNote ? <EditorView key={activeNote.id} note={activeNote} /> : <WelcomeScreen />}
            </main>
            <Inspector />
          </div>
        </div>
      )}

      <HistoryPanel />
      <ExportModal />
      <ImportModal />
      <SettingsMenu />
    </div>
  );
}
