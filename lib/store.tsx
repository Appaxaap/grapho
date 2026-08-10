"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Block } from "@blocknote/core";
import type { AppSettings, Note, ViewMode, Version } from "./types";
import * as db from "./db";
import { DEFAULT_SETTINGS, SAVE_DEBOUNCE_MS } from "./constants";
import { blocksToPlainText } from "./markdown";
import { blurActiveElement, uuid } from "./utils";

interface StoreValue {
  ready: boolean;
  notes: Note[];
  activeNoteId: string | null;
  activeNote: Note | null;
  view: ViewMode;
  searchQuery: string;
  visibleNotes: Note[];
  settings: AppSettings;
  historyOpen: boolean;
  exportOpen: boolean;
  settingsOpen: boolean;
  importOpen: boolean;
  focusMode: boolean;
  emojiOpen: boolean;
  inspectorOpen: boolean;
  versions: Version[] | null;
  versionsLoading: boolean;

  setActiveNote: (id: string | null) => void;
  createNote: (content?: Block[], title?: string) => string;
  updateNote: (id: string, patch: { title?: string; content?: Block[] }) => void;
  trashNote: (id: string) => void;
  restoreNote: (id: string) => void;
  deleteNote: (id: string) => void;
  restoreVersion: (pageId: string, versionId: string) => Promise<void>;
  setView: (v: ViewMode) => void;
  setSearchQuery: (q: string) => void;
  setSettings: (patch: Partial<AppSettings>) => void;
  setHistoryOpen: (open: boolean) => void;
  openHistory: () => void;
  setExportOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setImportOpen: (open: boolean) => void;
  toggleFocusMode: () => void;
  setEmojiOpen: (open: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within NotesProvider");
  return ctx;
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("notes");
  const [searchQuery, setSearchQuery] = useState("");
  const [settings, setSettingsState] = useState<AppSettings>({ ...DEFAULT_SETTINGS });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  /**
   * Versions of the active note. `null` means "loading" (history just opened).
   */
  const [versions, setVersions] = useState<Version[] | null>(null);

  /* Refs that survive closures for debounced work */
  const dirtyRef = useRef<Map<string, Note>>(new Map());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ------------------------------------------------------------------ *
   * Persistence
   * ------------------------------------------------------------------ */

  const flush = useCallback(async () => {
    const dirty = Array.from(dirtyRef.current.values());
    dirtyRef.current.clear();
    if (dirty.length === 0) return;
    const now = Date.now();
    for (const note of dirty) {
      await db.savePage(note);
    }
    await db.flushDatabase();
    const ids = new Set(dirty.map((n) => n.id));
    setNotes((prev) =>
      prev.map((n) => (ids.has(n.id) ? { ...n, lastSavedAt: now } : n))
    );
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      void flush();
    }, SAVE_DEBOUNCE_MS);
  }, [flush]);

  const flushNow = useCallback(async () => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    await flush();
  }, [flush]);

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await db.openDatabase();
        const purged = await db.purgeOldTrash();
        const [loadedNotes, loadedSettings] = await Promise.all([
          db.loadAllNotes(),
          db.loadSettings(),
        ]);
        if (cancelled) return;
        setNotes(
          loadedNotes.map((n) => ({ ...n, lastSavedAt: n.updatedAt }))
        );
        setSettingsState(loadedSettings);
        setActiveNoteId(loadedNotes[0]?.id ?? null);
        if (purged > 0) await db.flushDatabase();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------------------------------------------------------ *
   * Notes CRUD
   * ------------------------------------------------------------------ */

  const updateNote = useCallback(
    (id: string, patch: { title?: string; content?: Block[] }) => {
      setNotes((prev) => {
        let changed = false;
        const next = prev.map((n) => {
          if (n.id !== id) return n;
          changed = true;
          return { ...n, ...patch, updatedAt: Date.now() };
        });
        if (changed) {
          const fresh = next.find((n) => n.id === id)!;
          dirtyRef.current.set(id, { ...dirtyRef.current.get(id), ...fresh });
          scheduleFlush();
        }
        return next;
      });
    },
    [scheduleFlush]
  );

  const createNote = useCallback(
    (content?: Block[], title?: string): string => {
      // Release focus before swapping the editor out (Cmd/Ctrl+N while typing).
      blurActiveElement();
      const id = uuid();
      const now = Date.now();
      const note: Note = {
        id,
        title: title ?? "Untitled",
        content: content ?? [],
        createdAt: now,
        updatedAt: now,
        trashedAt: null,
        isShared: false,
        lastSavedAt: 0,
      };
      setNotes((prev) => [note, ...prev]);
      dirtyRef.current.set(id, { ...dirtyRef.current.get(id), ...note });
      setActiveNoteId(id);
      setView("notes");
      setSearchQuery("");
      scheduleFlush();
      return id;
    },
    [scheduleFlush]
  );

  const trashNote = useCallback(
    (id: string) => {
      // Release focus before the active editor is torn down.
      blurActiveElement();
      const now = Date.now();
      setNotes((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, trashedAt: now, updatedAt: now } : n));
        const note = next.find((n) => n.id === id);
        if (note) {
          dirtyRef.current.set(id, { ...dirtyRef.current.get(id), ...note });
          scheduleFlush();
          void db.trashPage(id, now).then(() => void flushNow());
        }
        return next;
      });
      setActiveNoteId((cur) => (cur === id ? null : cur));
    },
    [scheduleFlush, flushNow]
  );

  const restoreNote = useCallback(
    (id: string) => {
      // Release focus before any editor remount.
      blurActiveElement();
      const now = Date.now();
      setNotes((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, trashedAt: null, updatedAt: now } : n));
        const note = next.find((n) => n.id === id);
        if (note) {
          dirtyRef.current.set(id, { ...dirtyRef.current.get(id), ...note });
          scheduleFlush();
          void db.restorePage(id).then(() => void flushNow());
        }
        return next;
      });
    },
    [scheduleFlush, flushNow]
  );

  const deleteNote = useCallback(
    (id: string) => {
      // Release focus before the active editor is torn down.
      blurActiveElement();
      setNotes((prev) => prev.filter((n) => n.id !== id));
      dirtyRef.current.delete(id);
      setActiveNoteId((cur) => (cur === id ? null : cur));
      void db.deletePage(id).then(() => void flushNow());
    },
    [flushNow]
  );

  const restoreVersion = useCallback(
    async (pageId: string, versionId: string) => {
      // Release focus before the restored content lands in the store.
      blurActiveElement();
      const version = await db.getVersion(versionId);
      if (!version) return;
      updateNote(pageId, { title: version.title, content: version.content });
      setHistoryOpen(false);
      await flushNow();
    },
    [updateNote, flushNow]
  );

  /* ------------------------------------------------------------------ *
   * Settings
   * ------------------------------------------------------------------ */

  const setSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = {
        ...prev,
        ...patch,
        export: patch.export ? { ...prev.export, ...patch.export } : prev.export,
      };
      void db.saveSettings(next).then(() => void db.flushDatabase());
      return next;
    });
  }, []);

  /* ------------------------------------------------------------------ *
   * Versions
   * ------------------------------------------------------------------ */

  useEffect(() => {
    if (!historyOpen || !activeNoteId) return;
    let cancelled = false;
    void db.loadVersions(activeNoteId).then((v) => {
      if (!cancelled) setVersions(v);
    });
    return () => {
      cancelled = true;
    };
  }, [historyOpen, activeNoteId]);

  /* ------------------------------------------------------------------ *
   * Derived
   * ------------------------------------------------------------------ */

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) ?? null,
    [notes, activeNoteId]
  );

  const visibleNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notes.filter((n) => {
      const inView = view === "trash" ? n.trashedAt != null : n.trashedAt == null;
      if (!inView) return false;
      if (!q) return true;
      return (n.title + " " + blocksToPlainText(n.content)).toLowerCase().includes(q);
    });
  }, [notes, view, searchQuery]);

  const toggleFocusMode = useCallback(() => {
    // Release focus first so the editor is never torn down while focused.
    blurActiveElement();
    setFocusMode((f) => !f);
  }, []);

  /** Select a note; blurs first so the outgoing editor tears down cleanly. */
  const setActiveNote = useCallback((id: string | null) => {
    blurActiveElement();
    setActiveNoteId(id);
  }, []);

  const openHistory = useCallback(() => {
    setVersions(null);
    setHistoryOpen(true);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      notes,
      activeNoteId,
      activeNote,
      view,
      searchQuery,
      visibleNotes,
      settings,
      historyOpen,
      exportOpen,
      settingsOpen,
      importOpen,
      focusMode,
      emojiOpen,
      inspectorOpen,
      versions,
      versionsLoading: versions === null,
      setActiveNote,
      createNote,
      updateNote,
      trashNote,
      restoreNote,
      deleteNote,
      restoreVersion,
      setView,
      setSearchQuery,
      setSettings,
      setHistoryOpen,
      setExportOpen,
      setSettingsOpen,
      setImportOpen,
      toggleFocusMode,
      openHistory,
      setEmojiOpen,
      setInspectorOpen,
    }),
    [
      ready,
      notes,
      activeNoteId,
      activeNote,
      view,
      searchQuery,
      visibleNotes,
      settings,
      historyOpen,
      exportOpen,
      settingsOpen,
      importOpen,
      focusMode,
      emojiOpen,
      inspectorOpen,
      versions,
      setActiveNote,
      createNote,
      updateNote,
      trashNote,
      restoreNote,
      deleteNote,
      restoreVersion,
      setSettings,
      toggleFocusMode,
      openHistory,
      setInspectorOpen,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
