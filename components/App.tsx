"use client";

import { Redo2, SlidersHorizontal, Undo2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useActiveEditor } from "@/lib/editorRegistry";
import { Rail } from "./Rail";
import { Sidebar } from "./Sidebar";
import { EditorView } from "./EditorView";
import { Inspector } from "./Inspector";
import { WelcomeScreen } from "./WelcomeScreen";
import { ExportModal } from "./ExportModal";
import { ImportModal } from "./ImportModal";
import { HistoryPanel } from "./HistoryPanel";
import { SettingsMenu } from "./SettingsMenu";

function TopBar() {
  const { activeNote, view, inspectorOpen, setInspectorOpen } = useStore();
  const editor = useActiveEditor();

  return (
    <header className="top-bar">
      <div className="flex min-w-0 items-center gap-3">
        <span className="brand-mark" aria-hidden>G</span>
        <span className="top-title">Grapho</span>
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <span>{view === "trash" ? "Trash" : "Notes"}</span>
          <span className="crumb-sep" aria-hidden>/</span>
          <span className="crumb-active max-w-[280px] truncate">{activeNote?.title || "Untitled"}</span>
        </nav>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button className="icon-btn" onClick={() => editor?.undo()} disabled={!editor} aria-label="Undo" title="Undo">
          <Undo2 size={15} strokeWidth={1.9} />
        </button>
        <button className="icon-btn" onClick={() => editor?.redo()} disabled={!editor} aria-label="Redo" title="Redo">
          <Redo2 size={15} strokeWidth={1.9} />
        </button>
        <span className="mx-2 h-4 w-px bg-border" aria-hidden />
        <button
          className={inspectorOpen ? "icon-btn is-active" : "icon-btn"}
          onClick={() => setInspectorOpen(!inspectorOpen)}
          aria-label="Toggle style panel"
          title="Style panel"
          aria-pressed={inspectorOpen}
        >
          <SlidersHorizontal size={15} strokeWidth={1.9} />
        </button>
      </div>
    </header>
  );
}

function Splash() {
  return (
    <div className="flex h-full w-full items-center justify-center text-[13px] text-faint">
      Opening your notes…
    </div>
  );
}

export default function App() {
  const { ready, settings, activeNote, inspectorOpen } = useStore();
  useKeyboardShortcuts();

  return (
    <div data-accent={settings.accent} className="app-shell bg-background text-foreground antialiased">
      {!ready ? (
        <Splash />
      ) : (
        <>
          <TopBar />
          <div className="flex min-h-0 flex-1">
            <Rail />
            <div className="stage-grid relative flex min-w-0 flex-1 flex-col overflow-hidden">
              {/* Floating notes panel */}
              <div className="absolute bottom-4 left-4 top-4 z-20">
                <Sidebar />
              </div>

              {/* The document stage */}
              <main className="editor-stage">
                {activeNote ? <EditorView key={activeNote.id} note={activeNote} /> : <WelcomeScreen />}
              </main>

              {/* Floating style panel */}
              {inspectorOpen && (
                <div className="absolute bottom-4 right-4 top-4 z-30 w-[252px] animate-slide-left">
                  <Inspector />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <HistoryPanel />
      <ExportModal />
      <ImportModal />
      <SettingsMenu />
    </div>
  );
}
