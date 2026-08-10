"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { ACCENTS } from "@/lib/constants";

/**
 * Global keyboard shortcuts (Cmd on macOS, Ctrl elsewhere).
 * Editor-level formatting shortcuts (Cmd+B/I/U/K…) are handled by BlockNote.
 */
export function useKeyboardShortcuts(): void {
  const {
    activeNoteId,
    view,
    setView,
    setHistoryOpen,
    setExportOpen,
    setSettingsOpen,
    setImportOpen,
    setSearchQuery,
    createNote,
    trashNote,
    historyOpen,
    exportOpen,
    settingsOpen,
    importOpen,
    settings,
    setSettings,
    openHistory,
    emojiOpen,
    setEmojiOpen,
  } = useStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const modalOpen = historyOpen || exportOpen || settingsOpen || importOpen;
      const tag = (e.target as HTMLElement | null)?.tagName;

      // Escape closes things first.
      if (e.key === "Escape") {
        if (importOpen) setImportOpen(false);
        else if (exportOpen) setExportOpen(false);
        else if (settingsOpen) setSettingsOpen(false);
        else if (historyOpen) setHistoryOpen(false);
        else if (emojiOpen) setEmojiOpen(false);
        return;
      }

      if (!mod) return;

      const key = e.key.toLowerCase();

      // While a modal is open, only allow accent cycling to avoid surprises.
      if (modalOpen) {
        if (key === "t" && e.shiftKey) {
          e.preventDefault();
          const next =
            ACCENTS[(ACCENTS.findIndex((a) => a.id === settings.accent) + 1) % ACCENTS.length];
          setSettings({ accent: next.id });
        }
        return;
      }

      switch (key) {
        case "n": {
          e.preventDefault();
          createNote();
          break;
        }
        case "e": {
          e.preventDefault();
          if (e.shiftKey) setEmojiOpen(!emojiOpen);
          else setExportOpen(true);
          break;
        }
        case "f": {
          // Only hijack Cmd+F when not typing inside an input/textarea.
          if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("grapho:focus-search"));
          break;
        }
        case "h": {
          e.preventDefault();
          if (historyOpen) setHistoryOpen(false);
          else openHistory();
          break;
        }
        case "t": {
          if (e.shiftKey) {
            e.preventDefault();
            const next =
              ACCENTS[(ACCENTS.findIndex((a) => a.id === settings.accent) + 1) % ACCENTS.length];
            setSettings({ accent: next.id });
          }
          break;
        }
        case "delete":
        case "backspace": {
          e.preventDefault();
          if (activeNoteId) trashNote(activeNoteId);
          break;
        }
        case "1": {
          e.preventDefault();
          setView("notes");
          break;
        }
        case "2": {
          e.preventDefault();
          setView("trash");
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeNoteId,
    view,
    setView,
    setHistoryOpen,
    setExportOpen,
    setSettingsOpen,
    setImportOpen,
    setSearchQuery,
    createNote,
    trashNote,
    historyOpen,
    exportOpen,
    settingsOpen,
    importOpen,
    settings.accent,
    setSettings,
    openHistory,
    emojiOpen,
    setEmojiOpen,
  ]);
}

/** Request focus of the sidebar search input. */
export function focusSearch(): void {
  window.dispatchEvent(new CustomEvent("grapho:focus-search"));
}
