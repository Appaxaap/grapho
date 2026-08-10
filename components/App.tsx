"use client";

import { useEffect, useRef, useState } from "react";
import { PanelLeft, Redo2, SlidersHorizontal, Undo2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useActiveEditor } from "@/lib/editorRegistry";
import { resolveTheme, useSystemDark } from "@/lib/useSystemTheme";
import { cn } from "@/lib/utils";
import { Rail } from "./Rail";
import { Sidebar } from "./Sidebar";
import { EditorView } from "./EditorView";
import { Inspector } from "./Inspector";
import { WelcomeScreen } from "./WelcomeScreen";
import { ExportModal } from "./ExportModal";
import { ImportModal } from "./ImportModal";
import { HistoryPanel } from "./HistoryPanel";
import { SettingsMenu } from "./SettingsMenu";

function TopBar({
  sidebarCollapsed,
  onToggleSidebar,
  navVisible,
  isNarrow,
  navToggleRef,
}: {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  navVisible: boolean;
  isNarrow: boolean;
  navToggleRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const { activeNote, view, inspectorOpen, setInspectorOpen, focusMode } = useStore();
  const editor = useActiveEditor();

  return (
    <header className="top-bar">
      <button
        ref={navToggleRef}
        className="icon-btn"
        onClick={onToggleSidebar}
        aria-label="Toggle notes panel"
        title="Toggle notes panel"
        aria-expanded={isNarrow ? navVisible : undefined}
        aria-pressed={isNarrow ? navVisible : !sidebarCollapsed}
      >
        <PanelLeft size={15} strokeWidth={1.9} />
      </button>

      <div className="flex min-w-0 items-center gap-3">
        <span className="brand-mark" aria-hidden>G</span>
        <span className="top-title">Grapho</span>
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <span>{view === "trash" ? "Trash" : "Notes"}</span>
          <span className="crumb-sep" aria-hidden>/</span>
          <span className="crumb-active max-w-[240px] truncate">{activeNote?.title || "Untitled"}</span>
        </nav>
      </div>

      <div className={cn("ml-auto flex items-center gap-1", focusMode && "pointer-events-none opacity-0")}>
        <button className="icon-btn" onClick={() => editor?.undo()} disabled={!editor} aria-label="Undo" title="Undo">
          <Undo2 size={15} strokeWidth={1.9} />
        </button>
        <button className="icon-btn" onClick={() => editor?.redo()} disabled={!editor} aria-label="Redo" title="Redo">
          <Redo2 size={15} strokeWidth={1.9} />
        </button>
        <span className="mx-2 h-4 w-px bg-border" aria-hidden />
        <button
          className={
            "inspector-toggle " + (inspectorOpen ? "icon-btn is-active" : "icon-btn")
          }
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
  const {
    ready,
    settings,
    activeNote,
    activeNoteId,
    inspectorOpen,
    focusMode,
    navDrawerOpen,
    setNavDrawerOpen,
  } = useStore();
  useKeyboardShortcuts();
  const systemDark = useSystemDark();
  const resolvedTheme = resolveTheme(settings.theme, systemDark);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /* Apply the resolved theme to the document root. */
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  /* ≤900px: the notes panel becomes a temporary overlay drawer. Track the
     breakpoint so the floating sidebar unmounts and the drawer takes over. */
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => {
      const narrow = mq.matches;
      setIsNarrow(narrow);
      if (!narrow) setNavDrawerOpen(false);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [setNavDrawerOpen]);

  /* The top-bar toggle is width-aware: wide windows collapse the floating
     sidebar; narrow windows open/close the navigation drawer. */
  const navToggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const onToggleSidebar = () => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      setNavDrawerOpen(!navDrawerOpen);
    } else {
      setSidebarCollapsed((c) => !c);
    }
  };

  /* Focus moves into the drawer (search) when it opens… */
  useEffect(() => {
    if (!navDrawerOpen) return;
    const id = requestAnimationFrame(() => {
      drawerRef.current
        ?.querySelector<HTMLInputElement>(".side-search input")
        ?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [navDrawerOpen]);

  /* …and returns to the trigger when it closes (Escape, backdrop, selection). */
  const wasDrawerOpenRef = useRef(false);
  useEffect(() => {
    if (wasDrawerOpenRef.current && !navDrawerOpen) {
      navToggleRef.current?.focus();
    }
    wasDrawerOpenRef.current = navDrawerOpen;
  }, [navDrawerOpen]);

  /* Selecting a note from the drawer dismisses it. */
  const prevNoteIdRef = useRef(activeNoteId);
  useEffect(() => {
    if (navDrawerOpen && prevNoteIdRef.current !== activeNoteId) {
      setNavDrawerOpen(false);
    }
    prevNoteIdRef.current = activeNoteId;
  }, [activeNoteId, navDrawerOpen, setNavDrawerOpen]);

  /* Cmd/Ctrl+F at narrow widths opens the drawer so search is reachable. */
  useEffect(() => {
    const onFocusSearch = () => {
      if (window.matchMedia("(max-width: 900px)").matches && !navDrawerOpen) {
        setNavDrawerOpen(true);
      }
    };
    window.addEventListener("grapho:focus-search", onFocusSearch);
    return () => window.removeEventListener("grapho:focus-search", onFocusSearch);
  }, [navDrawerOpen, setNavDrawerOpen]);

  const showSidebar = !sidebarCollapsed && !focusMode && !isNarrow;
  const showInspector = inspectorOpen && !focusMode;

  return (
    <div data-accent={settings.accent} className="app-shell bg-background text-foreground antialiased">
      {!ready ? (
        <Splash />
      ) : (
        <>
          <TopBar
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={onToggleSidebar}
            navVisible={isNarrow ? navDrawerOpen : !sidebarCollapsed}
            isNarrow={isNarrow}
            navToggleRef={navToggleRef}
          />
          <div className="flex min-h-0 flex-1">
            <Rail />
            <div className={cn("stage-grid relative flex min-w-0 flex-1 flex-col overflow-hidden", focusMode && "stage-grid-hidden")}>
              {/* Floating notes panel */}
              {showSidebar && (
                <div className="absolute bottom-4 left-4 top-4 z-20">
                  <Sidebar />
                </div>
              )}

              {/* The document stage */}
              <main className="editor-stage">
                {activeNote ? (
                  <EditorView key={activeNote.id} note={activeNote} theme={resolvedTheme} />
                ) : (
                  <WelcomeScreen />
                )}
              </main>

              {/* Floating style panel */}
              {showInspector && (
                <div className="absolute bottom-4 right-4 top-4 z-30 w-[272px] animate-slide-left">
                  <Inspector />
                </div>
              )}

              {/* Narrow-window navigation drawer — temporary overlay so note
                  switching, search, trash/history/export stay reachable. */}
              {isNarrow && navDrawerOpen && !focusMode && (
                <div className="nav-drawer-layer" ref={drawerRef}>
                  <div
                    className="nav-drawer-backdrop"
                    onClick={() => setNavDrawerOpen(false)}
                    aria-hidden="true"
                  />
                  <div
                    className="nav-drawer"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Notes navigation"
                  >
                    <Rail />
                    <Sidebar />
                  </div>
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
