"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { ACCENTS, THEMES } from "@/lib/constants";

/**
 * True when BlockNote/Radix floating chrome is open — Escape belongs to it
 * (it closes itself), so higher-priority modal/menu behavior wins.
 */
function blocknoteChromeOpen(): boolean {
  const selectors = [
    ".bn-suggestion-menu",
    ".bn-grid-suggestion-menu",
    ".bn-formatting-toolbar",
    ".bn-link-toolbar",
    '[data-slot="select-content"]',
    '[data-slot="dropdown-menu-content"]',
  ];
  for (const selector of selectors) {
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return true;
    }
  }
  return false;
}

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
    toggleFocusMode,
    focusMode,
    navDrawerOpen,
    setNavDrawerOpen,
  } = useStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const modalOpen = historyOpen || exportOpen || settingsOpen || importOpen;
      const tag = (e.target as HTMLElement | null)?.tagName;

      // Escape closes things first: app modals, the emoji picker, the
      // narrow-window nav drawer, then BlockNote chrome (which closes
      // itself — don't steal its Escape), then focus mode.
      if (e.key === "Escape") {
        if (importOpen) setImportOpen(false);
        else if (exportOpen) setExportOpen(false);
        else if (settingsOpen) setSettingsOpen(false);
        else if (historyOpen) setHistoryOpen(false);
        else if (emojiOpen) setEmojiOpen(false);
        else if (navDrawerOpen) setNavDrawerOpen(false);
        else if (blocknoteChromeOpen()) return;
        else if (focusMode) toggleFocusMode();
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
          // Cmd+Shift+F = focus mode; Cmd+F = search when not typing.
          if (e.shiftKey) {
            e.preventDefault();
            toggleFocusMode();
            break;
          }
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
        case "l": {
          // Cmd+Shift+L cycles the app theme (system → light → dark).
          if (e.shiftKey) {
            e.preventDefault();
            const next = THEMES[(THEMES.findIndex((t) => t.id === settings.theme) + 1) % THEMES.length];
            setSettings({ theme: next.id });
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
    settings.theme,
    setSettings,
    openHistory,
    emojiOpen,
    setEmojiOpen,
    toggleFocusMode,
    focusMode,
    navDrawerOpen,
    setNavDrawerOpen,
  ]);
}

/** Request focus of the sidebar search input. */
export function focusSearch(): void {
  window.dispatchEvent(new CustomEvent("grapho:focus-search"));
}
