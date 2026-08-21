"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { AnimatePresence, motion } from "motion/react";

import {
  AlignLeft, Archive, ArrowDown, ChevronDown, ChevronRight, CircleHelp, FileText, Folder, FolderOpen, GripVertical, Hash, Image as ImageIcon, Link2, List, Menu, Minus, MoreHorizontal,
  Plus, Quote, Search, Settings2, Sparkles, Trash2,
  Sun, Moon, SlidersHorizontal, Table2, Type, Undo2, Redo2, X,
} from "lucide-react";
import "../grapho.css";
import { clearGraphoStorage, loadGraphoStorage, saveGraphoStorage } from "../storage";

type Theme = "dark" | "light";
type Block = { id: string; type: "paragraph" | "heading" | "quote" | "list" | "ordered-list" | "callout" | "table" | "code" | "divider"; text: string };

export type DocumentItem = { id: string; title: string; folder: string; updated: string; blocks: Block[] };

const initialDocuments: DocumentItem[] = [
  { id: "product-notes", title: "Product notes", folder: "Projects", updated: "Just now", blocks: [
    { id: "p1", type: "heading", text: "Product notes" },
    { id: "p2", type: "paragraph", text: "A quiet place to think, write, and keep useful work close." },
    { id: "p3", type: "quote", text: "The document is more important than the interface." },
    { id: "p4", type: "heading", text: "Principles" },
    { id: "p5", type: "list", text: "Local by default\nUnlimited writing\nBeautiful export" },
  ] },
  { id: "research", title: "Research brief", folder: "Projects", updated: "Yesterday", blocks: [{ id: "r1", type: "heading", text: "Research brief" }, { id: "r2", type: "paragraph", text: "Capture references, questions, and decisions in one durable document." }] },
  { id: "journal", title: "Morning journal", folder: "Personal", updated: "Monday", blocks: [{ id: "j1", type: "heading", text: "Morning journal" }, { id: "j2", type: "paragraph", text: "Write without opening another tab." }] },
];

const folders = ["Projects", "Personal", "Archive"];

export default function GraphoShell() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [selectedId, setSelectedId] = useState("product-notes");
  const [query, setQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState("Projects");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [styleOpen, setStyleOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [commandBlockId, setCommandBlockId] = useState<string | null>(null);
  const [selectionToolbar, setSelectionToolbar] = useState<{ top: number; left: number } | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DocumentItem | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isNativeWindow, setIsNativeWindow] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const blockSequence = useRef(0);
  const hydrated = useRef(false);
  const history = useRef<{ past: DocumentItem[][]; future: DocumentItem[][] }>({ past: [], future: [] });
  const previousDocuments = useRef<DocumentItem[]>(initialDocuments);
  const nativeWindow = useRef<ReturnType<typeof getCurrentWindow> | null>(null);
  const backupInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = loadGraphoStorage();
    const hydrate = () => {
      if (stored) {
        setDocuments(stored.documents);
        setSelectedId(stored.documents.some((document) => document.id === stored.selectedId) ? stored.selectedId : stored.documents[0]?.id ?? "product-notes");
        setActiveFolder(stored.activeFolder);
      }
      hydrated.current = true;
    };
    const timer = window.setTimeout(hydrate, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      try {
        saveGraphoStorage({ version: 1, documents, selectedId, activeFolder });
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [documents, selectedId, activeFolder]);

  useEffect(() => {
    if (!hydrated.current) return;
    const previous = previousDocuments.current;
    if (previous !== documents) {
      history.current.past.push(previous);
      history.current.future = [];
      if (history.current.past.length > 100) history.current.past.shift();
      previousDocuments.current = documents;
    }
  }, [documents]);

  useEffect(() => {
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      nativeWindow.current = getCurrentWindow();
      setIsNativeWindow(true);
    } else {
      nativeWindow.current = null;
      setIsNativeWindow(false);
    }
  }, []);

  const minimizeWindow = () => void nativeWindow.current?.minimize();
  const toggleMaximizeWindow = () => void nativeWindow.current?.toggleMaximize();
  const closeWindow = () => void nativeWindow.current?.close();

  const selected = documents.find((document) => document.id === selectedId) ?? documents[0];
  const visibleDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return documents.filter((document) => {
      if (document.folder !== activeFolder) return false;
      if (!normalizedQuery) return true;
      const searchableText = [document.title, document.folder, ...document.blocks.map((block) => `${block.type} ${block.text}`)].join(" ").toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [activeFolder, documents, query]);

  const renameDocument = (documentId: string) => {
    const current = documents.find((document) => document.id === documentId);
    if (!current) return;
    setRenameTarget(current);
    setRenameDraft(current.title);
  };

  const commitRename = () => {
    if (!renameTarget) return;
    const title = renameDraft.trim();
    if (title && title !== renameTarget.title) setDocuments((items) => items.map((document) => document.id === renameTarget.id ? { ...document, title, updated: "Just now", blocks: document.blocks.map((block, index) => index === 0 && block.type === "heading" && block.text === renameTarget.title ? { ...block, text: title } : block) } : document));
    setRenameTarget(null);
  };

  const deleteDocument = (documentId: string) => {
    if (documents.length <= 1) { setToast("Keep at least one document in your workspace."); return; }
    const target = documents.find((document) => document.id === documentId);
    if (target) setDeleteTarget(target);
  };

  const commitDelete = () => {
    if (!deleteTarget) return;
    const remaining = documents.filter((document) => document.id !== deleteTarget.id);
    setDocuments(remaining);
    if (selectedId === deleteTarget.id) setSelectedId(remaining[0].id);
    setDeleteTarget(null);
    setToast("Document deleted");
  };

  const updateTitle = (title: string) => {
    setDocuments((current) => current.map((document) => {
      if (document.id !== selected.id) return document;
      const firstBlock = document.blocks[0];
      const blocks = firstBlock?.type === "heading" && firstBlock.text === document.title
        ? document.blocks.map((block, index) => index === 0 ? { ...block, text: title } : block)
        : document.blocks;
      return { ...document, title, blocks, updated: "Just now" };
    }));
  };

  const updateBlock = (id: string, text: string) => {
    setDocuments((current) => current.map((document) => document.id !== selected.id ? document : { ...document, updated: "Just now", blocks: document.blocks.map((block) => block.id === id ? { ...block, text } : block) }));
  };

  const createDocument = () => {
    const id = `document-${Date.now()}`;
    const document = { id, title: "Untitled document", folder: activeFolder, updated: "Just now", blocks: [{ id: `${id}-heading`, type: "heading" as const, text: "Untitled document" }, { id: `${id}-paragraph`, type: "paragraph" as const, text: "Start writing…" }] };
    setDocuments((current) => [document, ...current]);
    setSelectedId(id);
  };

  const addBlockAfter = (blockId: string, type: Block["type"] = "paragraph", text = "") => {
    const newBlock: Block = { id: `block-${selected.id}-${blockSequence.current++}`, type, text };
    setDocuments((current) => current.map((document) => {
      if (document.id !== selected.id) return document;
      const index = document.blocks.findIndex((block) => block.id === blockId);
      return { ...document, updated: "Just now", blocks: [...document.blocks.slice(0, index + 1), newBlock, ...document.blocks.slice(index + 1)] };
    }));
    setCommandBlockId(null);
  };

  const exportPdf = () => {
    // Print the actual canvas so the browser preserves the same visual layout.
    window.print();
  };

  const downloadFile = (filename: string, content: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => downloadFile(`${selected.title || "grapho-document"}.md`, documentToMarkdown(selected), "text/markdown");

  const exportBackup = () => {
    const payload = JSON.stringify({ version: 1, documents, selectedId, activeFolder }, null, 2);
    downloadFile("grapho-backup.json", payload, "application/json");
  };

  const importBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const value = JSON.parse(String(reader.result)) as { version?: number; documents?: DocumentItem[]; selectedId?: string; activeFolder?: string };
        if (value.version !== 1 || !Array.isArray(value.documents) || !value.documents.length || value.documents.some((item) => !item.id || !item.title || !Array.isArray(item.blocks))) throw new Error("Invalid backup");
        setDocuments(value.documents);
        setSelectedId(value.documents.some((item) => item.id === value.selectedId) ? value.selectedId! : value.documents[0].id);
        setActiveFolder(value.activeFolder ?? value.documents[0].folder);
        history.current = { past: [], future: [] };
        previousDocuments.current = value.documents;
      } catch {
        window.alert("This backup file is invalid or unsupported.");
      }
    };
    reader.readAsText(file);
  };

  const resetLocalData = () => {
    if (!window.confirm("Reset all local Grapho documents? This cannot be undone.")) return;
    clearGraphoStorage();
    history.current = { past: [], future: [] };
    previousDocuments.current = initialDocuments;
    setDocuments(initialDocuments);
    setSelectedId("product-notes");
    setActiveFolder("Projects");
  };

  const clearDocument = () => {
    setDocuments((current) => current.map((document) => document.id !== selected.id ? document : { ...document, updated: "Just now", blocks: [{ id: `empty-${selected.id}`, type: "paragraph", text: "" }] }));
    setCommandBlockId(null);
  };

  const removeBlock = useCallback((blockId: string) => {
    if (selected.blocks.length <= 1) return;
    setDocuments((current) => current.map((document) => document.id !== selected.id ? document : { ...document, blocks: document.blocks.filter((block) => block.id !== blockId), updated: "Just now" }));
    setSelectedBlockId(null);
  }, [selected.blocks.length, selected.id]);

  useEffect(() => {
    const handlePaletteShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handlePaletteShortcut);
    return () => window.removeEventListener("keydown", handlePaletteShortcut);
  }, []);

  useEffect(() => {
    if (!paletteOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setPaletteOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [paletteOpen]);

  useEffect(() => {
    if (!helpOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setHelpOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [helpOpen]);

  useEffect(() => {
    const handleBlockDelete = (event: KeyboardEvent) => {
      if (!selectedBlockId || (event.key !== "Backspace" && event.key !== "Delete")) return;
      const target = event.target as HTMLElement;
      if (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      event.preventDefault();
      removeBlock(selectedBlockId);
    };
    window.addEventListener("keydown", handleBlockDelete);
    return () => window.removeEventListener("keydown", handleBlockDelete);
  }, [removeBlock, selectedBlockId]);

  const pasteBlocks = (blockId: string, rawText: string) => {
    const parsed = parseMarkdownBlocks(rawText, () => `pasted-${blockSequence.current++}`);
    if (!parsed.length) return;
    setDocuments((current) => current.map((document) => {
      if (document.id !== selected.id) return document;
      const index = document.blocks.findIndex((block) => block.id === blockId);
      return { ...document, updated: "Just now", blocks: [...document.blocks.slice(0, index), ...parsed, ...document.blocks.slice(index + 1)] };
    }));
    setCommandBlockId(null);
  };

  const changeBlockType = (blockId: string, type: Block["type"]) => {
    setDocuments((current) => current.map((document) => document.id !== selected.id ? document : { ...document, blocks: document.blocks.map((block) => block.id === blockId ? { ...block, type, text: block.text.replace(/^(?:#{1,6}|>|[-*+]|\d+[.)]|```)+\s*/, "") } : block), updated: "Just now" }));
    setCommandBlockId(null);
    window.setTimeout(() => document.querySelector<HTMLElement>(`[data-grapho-block-id="${blockId}"]`)?.focus(), 0);
  };

  const handleBlockKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, block: Block) => {
    if (event.key === "/") {
      event.preventDefault();
      setCommandBlockId(block.id);
    }
    // Leave undo/redo to the browser's native contentEditable history. React
    // receives the resulting input event and persists the reverted text.
    if (event.key === "Escape") setCommandBlockId(null);
    if (event.key === "Enter" && !event.shiftKey) {
      if (block.type === "paragraph" && /^[-*_]{3,}$/.test(block.text.trim())) {
        event.preventDefault();
        changeBlockType(block.id, "divider");
        return;
      }
      event.preventDefault();
      addBlockAfter(block.id);
    }
    if (event.key === "Backspace" && !block.text) {
      event.preventDefault();
      if (block.type === "list" || block.type === "ordered-list") {
        changeBlockType(block.id, "paragraph");
      } else if (selected.blocks.length > 1) {
        removeBlock(block.id);
      }
    }
    if (event.key === " " && block.type === "paragraph") {
      const shortcut = block.text.trim();
      const types: Record<string, Block["type"]> = { "#": "heading", "##": "heading", "###": "heading", ">": "quote", "-": "list", "*": "list", "+": "list" };
      if (types[shortcut]) changeBlockType(block.id, types[shortcut]);
      else if (/^\d+[.)]$/.test(shortcut)) changeBlockType(block.id, "ordered-list");
      else if (shortcut === "```") changeBlockType(block.id, "code");
    }
  };

  const handleCanvasSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) { setSelectionToolbar(null); return; }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectionToolbar({ top: Math.max(8, rect.top - 48), left: Math.max(120, rect.left + rect.width / 2) });
  };

  const applySelectionFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    setSelectionToolbar(null);
  };

  const undo = useCallback(() => {
    const previous = history.current.past.pop();
    if (!previous) return;
    history.current.future.push(documents);
    previousDocuments.current = previous;
    setDocuments(previous);
  }, [documents]);

  const redo = useCallback(() => {
    const next = history.current.future.pop();
    if (!next) return;
    history.current.past.push(documents);
    previousDocuments.current = next;
    setDocuments(next);
  }, [documents]);

  useEffect(() => {
    const handleEditorHistory = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key !== "z" && key !== "y") return;
      event.preventDefault();
      if (key === "y" || (key === "z" && event.shiftKey)) redo();
      else undo();
    };
    window.addEventListener("keydown", handleEditorHistory);
    return () => window.removeEventListener("keydown", handleEditorHistory);
  }, [redo, undo]);

  return (
    <div className={`grapho-ui ${theme === "dark" ? "grapho-dark" : ""} ${isNativeWindow ? "is-native-window" : ""} relative min-h-screen overflow-hidden`}>
      {isNativeWindow && <div className="grapho-native-titlebar" data-tauri-drag-region>
        <div className="grapho-native-brand" data-tauri-drag-region><span><Hash size={11} /></span><b>Grapho</b></div>
        <div className="grapho-native-context" data-tauri-drag-region>{selected.title}</div>
        <div className="grapho-native-window-controls">
          <button onClick={minimizeWindow} aria-label="Minimize window">−</button>
          <button onClick={toggleMaximizeWindow} aria-label="Maximize window">□</button>
          <button className="is-close" onClick={closeWindow} aria-label="Close window">×</button>
        </div>
      </div>}
      <div className="grapho-canvas-grid pointer-events-none absolute inset-0 -z-0" aria-hidden="true" />
      <header className="hidden">
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={() => setSidebarOpen((value) => !value)} aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"} className="grid size-9 place-items-center rounded-xl text-[var(--grapho-muted)] transition-colors hover:bg-[var(--grapho-control)] hover:text-[var(--grapho-foreground)]"><Menu size={16} /></button>
          <div className="grid size-8 place-items-center rounded-xl bg-[var(--grapho-foreground)] text-[var(--grapho-background)]"><Hash size={15} /></div>
          <div><div className="text-sm font-semibold tracking-[-.06em]">Grapho</div><div className="text-[8px] uppercase tracking-[.2em] text-[var(--grapho-faint)]">Local workspace</div></div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="hidden items-center gap-1.5 rounded-full bg-[var(--grapho-control)] px-3 py-1.5 text-[8px] text-[var(--grapho-muted)] sm:flex"><span className="size-1.5 rounded-full bg-emerald-500" /> Saved locally</span>
          <button type="button" onClick={() => setFocusMode((value) => !value)} aria-pressed={focusMode} className={`hidden h-9 items-center gap-2 rounded-xl px-3 text-[9px] transition-colors sm:flex ${focusMode ? "bg-[var(--grapho-foreground)] text-[var(--grapho-background)]" : "text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]"}`}><AlignLeft size={13} /> Focus</button>
          <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} className="grid size-9 place-items-center rounded-full border border-[var(--grapho-border)] bg-[var(--grapho-control)] text-[var(--grapho-muted)] hover:text-[var(--grapho-foreground)]">{theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}</button>
          <button type="button" aria-label="Open settings" className="grid size-9 place-items-center rounded-full text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]"><Settings2 size={15} /></button>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 360, damping: 28 }} className="fixed right-4 top-4 z-50 flex items-center gap-1 rounded-2xl border border-[var(--grapho-border)] bg-[var(--grapho-panel)] p-1.5 shadow-xl backdrop-blur-xl">
        <ToolbarButton label={sidebarOpen ? "Hide sidebar" : "Show sidebar"} icon={<Menu size={16} />} onClick={() => setSidebarOpen((value) => !value)} />
        <div className="mx-1 flex items-center gap-2 border-r border-[var(--grapho-border)] px-2 pr-3"><span className="grid size-8 place-items-center rounded-xl bg-[var(--grapho-foreground)] text-[var(--grapho-background)]"><Hash size={15} /></span><span className="hidden text-[11px] font-semibold tracking-[-.04em] sm:block">Grapho</span></div>
        
        <ToolbarButton label="Workspace tools" icon={<SlidersHorizontal size={16} />} onClick={() => setStyleOpen((value) => !value)} />
        <ToolbarButton label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} icon={theme === "dark" ? <Moon size={16} /> : <Sun size={16} />} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} />

      </motion.div>

      <div className="relative z-10 flex min-h-screen">
        <AnimatePresence initial={false}>
          {sidebarOpen && <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="hidden h-[calc(100vh-2rem)] shrink-0 overflow-hidden rounded-2xl border border-[var(--grapho-border)] bg-[var(--grapho-panel)] shadow-xl backdrop-blur-xl lg:sticky lg:top-4 lg:my-4 lg:ml-4 lg:block">
            <div className="flex h-full w-[280px] flex-col overflow-y-auto p-3 [scrollbar-width:none]">
              <div className="flex h-11 items-center gap-2 px-1">
                <span className="grid size-8 place-items-center rounded-xl border border-[var(--grapho-border)] bg-[var(--grapho-control)] text-[var(--grapho-foreground)]"><FolderOpen size={14} /></span>
                <span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold tracking-[-.04em]">Library</span><span className="mt-0.5 block text-[8px] text-[var(--grapho-faint)]">Local documents</span></span>
                <button type="button" onClick={createDocument} aria-label="New document" title="New document" className="grid size-8 place-items-center rounded-xl bg-[var(--grapho-foreground)] text-[var(--grapho-background)] transition-transform hover:-translate-y-0.5 active:scale-95"><Plus size={14} /></button>
              </div>
              <label className="mt-3 flex h-10 items-center gap-2 rounded-xl bg-[var(--grapho-control)] px-3 text-[10px] text-[var(--grapho-muted)] focus-within:bg-[var(--grapho-control-hover)]"><Search size={13} className="shrink-0 text-[var(--grapho-faint)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search documents" placeholder="Search documents" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--grapho-faint)]" /><kbd className="text-[8px] text-[var(--grapho-faint)]">⌘ K</kbd></label>
              <div className="mt-7 flex items-center justify-between px-2 text-[8px] uppercase tracking-[.16em] text-[var(--grapho-faint)]"><span>Workspace</span><button type="button" aria-label="Add folder" className="hover:text-[var(--grapho-foreground)]"><Plus size={12} /></button></div>
              <div className="grapho-project-list mt-2 space-y-1">{folders.map((folder) => <button key={folder} type="button" onClick={() => setActiveFolder(folder)} className={`flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[10px] transition-colors ${activeFolder === folder ? "bg-[var(--grapho-control)] text-[var(--grapho-foreground)]" : "text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]"}`}>{activeFolder === folder ? <FolderOpen size={14} /> : <Folder size={14} />}<span className="flex-1">{folder}</span><span className="text-[8px] text-[var(--grapho-faint)]">{documents.filter((item) => item.folder === folder).length}</span></button>)}</div>
              <div className="mt-7 flex items-center justify-between px-2 text-[8px] uppercase tracking-[.16em] text-[var(--grapho-faint)]"><span>{activeFolder}</span><span>{visibleDocuments.length}</span></div>
              <div className="grapho-document-list mt-2 space-y-1">{visibleDocuments.map((document) => <div key={document.id} className={`group flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors ${selectedId === document.id ? "border-[var(--grapho-border)] bg-[var(--grapho-control-hover)] text-[var(--grapho-foreground)]" : "border-transparent text-[var(--grapho-muted)] hover:border-[var(--grapho-border)] hover:bg-[var(--grapho-control)]"}`}><button type="button" onClick={() => setSelectedId(document.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left"><span className={`grid size-7 shrink-0 place-items-center rounded-lg ${selectedId === document.id ? "bg-[var(--grapho-foreground)] text-[var(--grapho-background)]" : "bg-[var(--grapho-control)] text-[var(--grapho-faint)]"}`}><FileText size={12} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-medium">{document.title}</span><span className="mt-0.5 block text-[8px] text-[var(--grapho-faint)]">{document.updated} · {document.blocks.length} blocks</span></span></button><div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"><button type="button" onClick={() => renameDocument(document.id)} aria-label={`Rename ${document.title}`} title="Rename document" className="grid size-7 place-items-center rounded-lg text-[var(--grapho-faint)] hover:bg-[var(--grapho-control-hover)] hover:text-[var(--grapho-foreground)]"><MoreHorizontal size={13} /></button><button type="button" onClick={() => deleteDocument(document.id)} aria-label={`Delete ${document.title}`} title="Delete document" className="grid size-7 place-items-center rounded-lg text-[var(--grapho-faint)] hover:bg-red-500/10 hover:text-red-400"><Trash2 size={12} /></button></div></div>)}</div>
              <div className="mt-auto border-t border-[var(--grapho-border)] pt-3"><button type="button" className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-[9px] text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]"><Archive size={13} /> Archive<span className="ml-auto text-[8px] text-[var(--grapho-faint)]">0</span></button><button type="button" onClick={() => setHelpOpen(true)} className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-[9px] text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]"><CircleHelp size={13} /> Help & shortcuts<span className="ml-auto rounded border border-[var(--grapho-border)] px-1.5 py-0.5 text-[7px] text-[var(--grapho-faint)]">?</span></button></div>
            </div>
          </motion.aside>}
        </AnimatePresence>

        <main className="grapho-editor-scroll min-w-0 flex-1" aria-label="Writing canvas">
          <div className="mx-auto max-w-4xl px-5 pb-32 pt-3 sm:px-12 sm:pt-6 lg:px-20">
            <div className="grapho-document-meta mb-8 flex items-center justify-between text-[9px] text-[var(--grapho-faint)]"><div className="flex items-center gap-2"><span>{activeFolder}</span><ChevronRight size={11} /><span className="text-[var(--grapho-muted)]">{selected.title}</span></div><div className="flex items-center gap-2"></div></div>
            <article className="relative min-h-[620px]" onMouseUp={handleCanvasSelection} onClick={(event) => { if (event.target === event.currentTarget) { const last = event.currentTarget.querySelector<HTMLElement>("[data-grapho-block]:last-of-type"); last?.focus(); } }}>
              <div className="mb-10"><div className="grapho-label grapho-print-hide mb-3 text-[9px] uppercase text-[var(--grapho-faint)]">Document · Markdown compatible</div><EditableDocumentTitle value={selected.title} onChange={updateTitle} /><p className="grapho-print-hide mt-4 text-[10px] leading-5 text-[var(--grapho-muted)]">A calm, local-first place for ideas, notes, and long-form writing.</p></div>

              <div className="space-y-4">{selected.blocks.filter((block, index) => !(index === 0 && block.type === "heading" && block.text.trim() === selected.title.trim())).map((block, blockIndex) => <div key={block.id} className={`group relative rounded-lg transition-colors ${selectedBlockId === block.id ? "bg-[var(--grapho-accent-soft)] ring-1 ring-[var(--grapho-accent)]/30" : ""}`}><EditorBlock block={block} orderedIndex={block.type === "ordered-list" ? selected.blocks.slice(0, blockIndex).filter((item) => item.type === "ordered-list").length + 1 : undefined} onChange={(text) => updateBlock(block.id, text)} onKeyDown={(event) => handleBlockKeyDown(event, block)} onPaste={(event) => { event.preventDefault(); pasteBlocks(block.id, event.clipboardData.getData("text/plain")); }} /><div className="pointer-events-none absolute -left-14 top-1 hidden items-center gap-1 text-[var(--grapho-faint)] group-hover:flex group-focus-within:flex"><button type="button" onClick={(event) => { event.stopPropagation(); setSelectedBlockId(block.id); setSelectionToolbar(null); }} aria-label="Select block" title="Select block" className="pointer-events-auto grid size-6 place-items-center rounded-md hover:bg-[var(--grapho-control)]"><GripVertical size={13} /></button><button type="button" onClick={() => setCommandBlockId(block.id)} aria-label="Open block menu" className="pointer-events-auto grid size-6 place-items-center rounded-md hover:bg-[var(--grapho-control)]"><Plus size={13} /></button></div>{commandBlockId === block.id && <BlockCommandMenu onSelect={(type) => changeBlockType(block.id, type)} onDismiss={() => setCommandBlockId(null)} />}</div>)}</div>
              <button type="button" onClick={() => addBlockAfter(selected.blocks[selected.blocks.length - 1].id)} className="mt-6 flex items-center gap-2 text-[10px] text-[var(--grapho-faint)] hover:text-[var(--grapho-muted)]"><Plus size={13} /> Add block</button>
            </article>
          </div>
        </main>

        {selectionToolbar && <div className="grapho-selection-toolbar fixed z-50 flex w-max max-w-[calc(100vw-1rem)] -translate-x-1/2 flex-nowrap items-center gap-1.5 overflow-x-auto rounded-2xl border border-[var(--grapho-border)] bg-[var(--grapho-panel-solid)] p-2 text-[13px] shadow-2xl" style={{ top: selectionToolbar.top, left: selectionToolbar.left }} onMouseDown={(event) => event.preventDefault()}>
                  <button type="button" onClick={() => applySelectionFormat("bold")} className="grid size-9 shrink-0 place-items-center rounded-lg text-[15px] font-bold hover:bg-[var(--grapho-control)]">B</button>
                  <button type="button" onClick={() => applySelectionFormat("italic")} className="grid size-9 shrink-0 place-items-center rounded-lg text-[15px] italic hover:bg-[var(--grapho-control)]">I</button>
                  <button type="button" onClick={() => applySelectionFormat("underline")} className="grid size-9 shrink-0 place-items-center rounded-lg text-[15px] underline hover:bg-[var(--grapho-control)]">U</button>
                  <button type="button" onClick={() => applySelectionFormat("strikeThrough")} className="grid size-9 shrink-0 place-items-center rounded-lg text-[15px] line-through hover:bg-[var(--grapho-control)]">S</button>
                  <span className="mx-1 h-6 w-px bg-[var(--grapho-border)]" />
                  <button type="button" onClick={() => applySelectionFormat("formatBlock", "<h2>")} className="grid size-9 shrink-0 place-items-center rounded-lg text-[14px] font-semibold hover:bg-[var(--grapho-control)]">H2</button>
                  <button type="button" onClick={() => applySelectionFormat("formatBlock", "<blockquote>")} className="grid size-9 shrink-0 place-items-center rounded-lg text-[20px] font-serif hover:bg-[var(--grapho-control)]">❝</button>
                  <button type="button" onClick={() => applySelectionFormat("formatBlock", "<pre>")} className="grid size-9 shrink-0 place-items-center rounded-lg text-[14px] font-mono hover:bg-[var(--grapho-control)]">&lt;/&gt;</button>
                  <button type="button" onClick={() => { const url = window.prompt("Link URL"); if (url) applySelectionFormat("createLink", url); }} className="grid size-9 shrink-0 place-items-center rounded-lg hover:bg-[var(--grapho-control)]"><Link2 size={18} /></button>
                  <button type="button" onClick={() => applySelectionFormat("hiliteColor", "#dbeafe")} className="grid size-9 place-items-center rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"><span className="rounded bg-blue-200 px-1.5 py-0.5 text-[13px] font-semibold">A</span></button>
                  <span className="mx-1 h-6 w-px bg-[var(--grapho-border)]" />
                  <button type="button" onClick={() => applySelectionFormat("justifyLeft")} className="grid size-9 shrink-0 place-items-center rounded-lg text-[14px] hover:bg-[var(--grapho-control)]">≡</button>
                  <button type="button" onClick={() => applySelectionFormat("justifyCenter")} className="grid size-9 shrink-0 place-items-center rounded-lg text-[14px] hover:bg-[var(--grapho-control)]">≡</button>
                  <button type="button" onClick={() => applySelectionFormat("removeFormat")} className="grid size-9 shrink-0 place-items-center rounded-lg text-[13px] hover:bg-[var(--grapho-control)]">Tx</button>
                  <button type="button" onClick={() => { document.execCommand("delete"); setSelectionToolbar(null); }} aria-label="Delete selected text" title="Delete selected text" className="grid size-9 place-items-center rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 size={18} /></button>
                </div>}

        <motion.div initial={{ opacity: 0, y: 18, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 360, damping: 28 }} className="fixed bottom-4 left-1/2 z-40 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl border border-[var(--grapho-border)] bg-[var(--grapho-panel)] p-1.5 shadow-2xl backdrop-blur-xl [scrollbar-width:none]">
          <span className="mx-2 flex shrink-0 items-center gap-1.5 text-[8px] text-[var(--grapho-faint)]"><span className={`size-1.5 rounded-full ${saveState === "saved" ? "bg-emerald-500" : saveState === "saving" ? "bg-amber-500" : "bg-red-500"}`} />{saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving…" : "Could not save"}</span>
          <ToolbarButton label="Undo" icon={<Undo2 size={16} />} onClick={undo} />
          <ToolbarButton label="Redo" icon={<Redo2 size={16} />} onClick={redo} />
          <span className="mx-1 h-5 w-px shrink-0 bg-[var(--grapho-border)]" />
          <ToolbarButton label="Heading" icon={<Hash size={16} />} onClick={() => addBlockAfter(selected.blocks[selected.blocks.length - 1].id, "heading")} />
          <ToolbarButton label="Quote" icon={<Quote size={16} />} onClick={() => addBlockAfter(selected.blocks[selected.blocks.length - 1].id, "quote")} />
          <ToolbarButton label="Code block" icon={<Type size={16} />} onClick={() => addBlockAfter(selected.blocks[selected.blocks.length - 1].id, "code")} />
          <ToolbarButton label="Bulleted list" icon={<List size={16} />} onClick={() => addBlockAfter(selected.blocks[selected.blocks.length - 1].id, "list")} />
          <span className="mx-1 h-5 w-px shrink-0 bg-[var(--grapho-border)]" />
          <ToolbarButton label="Insert link" icon={<Link2 size={16} />} />
          <ToolbarButton label="Insert image" icon={<ImageIcon size={16} />} />
          <ToolbarButton label="Insert table" icon={<Table2 size={16} />} onClick={() => addBlockAfter(selected.blocks[selected.blocks.length - 1].id, "table", "| Column 1 | Column 2 |\n| --- | --- |\n| | |\n")} />
          <motion.button type="button" onClick={exportPdf} whileHover={{ y: -2 }} whileTap={{ scale: .94 }} className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-[var(--grapho-foreground)] px-3 text-[10px] text-[var(--grapho-background)] hover:opacity-80"><ArrowDown size={14} /> <span>PDF</span></motion.button>
          <ToolbarButton label="Clear document" icon={<Trash2 size={16} />} onClick={clearDocument} danger />
          <ToolbarButton label="Export Markdown" icon={<FileText size={16} />} onClick={exportMarkdown} />
          <ToolbarButton label="Export JSON backup" icon={<ArrowDown size={16} />} onClick={exportBackup} />
          <ToolbarButton label="Import JSON backup" icon={<FolderOpen size={16} />} onClick={() => backupInput.current?.click()} />
          <ToolbarButton label="Reset local data" icon={<X size={16} />} onClick={resetLocalData} danger />
        </motion.div>

        <AnimatePresence>{styleOpen && <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="fixed right-4 top-20 z-40 hidden max-h-[calc(100vh-6rem)] w-[280px] overflow-hidden rounded-2xl border border-[var(--grapho-border)] bg-[var(--grapho-panel)] shadow-2xl backdrop-blur-xl xl:block"><div className="h-full w-[240px] overflow-y-auto p-4 [scrollbar-width:none]"><div className="flex items-center justify-between text-[9px] uppercase tracking-[.16em] text-[var(--grapho-faint)]"><span>Document style</span><button type="button" onClick={() => setStyleOpen(false)} aria-label="Close style panel"><X size={13} /></button></div><div className="mt-5 text-[8px] uppercase tracking-[.16em] text-[var(--grapho-faint)]">Typography</div><StyleOption label="Body" value="Geist Mono" /><StyleOption label="Width" value="Readable" /><StyleOption label="Spacing" value="Relaxed" /><div className="mt-5 text-[8px] uppercase tracking-[.16em] text-[var(--grapho-faint)]">Appearance</div><StyleOption label="Page" value="Warm white" /><StyleOption label="Accent" value="Blue" /><StyleOption label="Grid" value="Subtle" /><div className="mt-5 border-t border-[var(--grapho-border)] pt-4"><div className="text-[8px] uppercase tracking-[.16em] text-[var(--grapho-faint)]">Document</div><div className="mt-3 grid grid-cols-2 gap-2"><InfoStat label="Blocks" value={String(selected.blocks.length)} /><InfoStat label="Words" value={String(selected.blocks.reduce((count, block) => count + block.text.trim().split(/\\s+/).filter(Boolean).length, 0))} /></div></div><div className="mt-5 border-t border-[var(--grapho-border)] pt-4"><div className="text-[8px] uppercase tracking-[.16em] text-[var(--grapho-faint)]">Export</div><button type="button" onClick={exportPdf} className="mt-3 flex h-10 w-full items-center justify-between rounded-xl bg-[var(--grapho-control)] px-3 text-[10px] text-[var(--grapho-muted)] hover:bg-[var(--grapho-control-hover)]"><span className="flex items-center gap-2"><ArrowDown size={13} /> Export PDF</span><ChevronDown size={12} /></button><button type="button" className="mt-2 flex h-10 w-full items-center justify-between rounded-xl bg-[var(--grapho-control)] px-3 text-[10px] text-[var(--grapho-muted)] hover:bg-[var(--grapho-control-hover)]"><span className="flex items-center gap-2"><FileText size={13} /> Export Markdown</span><ChevronDown size={12} /></button></div></div></motion.aside>}</AnimatePresence>
      </div>
      <AnimatePresence>
        {toast && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="fixed bottom-20 left-1/2 z-[130] -translate-x-1/2 rounded-xl border border-[var(--grapho-border)] bg-[var(--grapho-panel-solid)] px-4 py-2.5 text-[10px] text-[var(--grapho-foreground)] shadow-xl" role="status">{toast}<button type="button" onClick={() => setToast(null)} className="ml-3 text-[var(--grapho-faint)]">×</button></motion.div>}
        {deleteTarget && <motion.div className="fixed inset-0 z-[120] grid place-items-center bg-black/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null); }}><motion.section role="dialog" aria-modal="true" aria-labelledby="delete-document-title" className="w-full max-w-md rounded-3xl border border-[var(--grapho-border)] bg-[var(--grapho-panel-solid)] p-6 shadow-2xl"><div className="text-[9px] uppercase tracking-[.18em] text-[var(--grapho-faint)]">Workspace</div><h2 id="delete-document-title" className="mt-2 text-xl font-semibold">Delete document?</h2><p className="mt-3 text-[11px] leading-5 text-[var(--grapho-muted)]">“{deleteTarget.title}” will be removed from this workspace.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl px-4 py-2.5 text-[11px] text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]">Cancel</button><button type="button" onClick={commitDelete} className="rounded-xl bg-red-500 px-4 py-2.5 text-[11px] text-white">Delete document</button></div></motion.section></motion.div>}
        {renameTarget && <motion.div className="fixed inset-0 z-[120] grid place-items-center bg-black/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setRenameTarget(null); }}>
          <motion.section role="dialog" aria-modal="true" aria-labelledby="rename-document-title" initial={{ opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-md rounded-3xl border border-[var(--grapho-border)] bg-[var(--grapho-panel-solid)] p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><div className="text-[9px] uppercase tracking-[.18em] text-[var(--grapho-faint)]">Document</div><h2 id="rename-document-title" className="mt-2 text-xl font-semibold tracking-[-.04em]">Rename document</h2></div><button type="button" onClick={() => setRenameTarget(null)} aria-label="Close rename dialog" className="grid size-8 place-items-center rounded-xl text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]"><X size={15} /></button></div>
            <input autoFocus value={renameDraft} onChange={(event) => setRenameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") commitRename(); if (event.key === "Escape") setRenameTarget(null); }} aria-label="Document name" className="mt-6 h-11 w-full rounded-xl border border-[var(--grapho-border)] bg-[var(--grapho-control)] px-3 text-sm text-[var(--grapho-foreground)] outline-none focus:border-[var(--grapho-accent)]" />
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setRenameTarget(null)} className="rounded-xl px-4 py-2.5 text-[11px] text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]">Cancel</button><button type="button" onClick={commitRename} className="rounded-xl bg-[var(--grapho-foreground)] px-4 py-2.5 text-[11px] text-[var(--grapho-background)]">Save name</button></div>
          </motion.section>
        </motion.div>}
        {paletteOpen && <motion.div className="fixed inset-0 z-[110] grid place-items-center bg-black/35 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setPaletteOpen(false); }}>
          <motion.section role="dialog" aria-modal="true" aria-label="Command palette" initial={{ opacity: 0, y: 14, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .98 }} className="grapho-glass w-full max-w-lg overflow-hidden rounded-3xl p-2">
            <div className="flex items-center gap-3 border-b border-[var(--grapho-border)] px-3 py-3"><Search size={16} className="text-[var(--grapho-faint)]" /><input autoFocus aria-label="Command palette search" placeholder="Search commands…" className="grapho-command-input min-w-0 flex-1 border-0 bg-transparent text-sm text-[var(--grapho-foreground)] outline-none ring-0 placeholder:text-[var(--grapho-faint)]" /><kbd className="rounded-md border border-[var(--grapho-border)] px-1.5 py-1 text-[9px] text-[var(--grapho-faint)]">ESC</kbd></div>
            <div className="p-2"><PaletteAction icon={<Plus size={15} />} label="New document" hint="Create a document in the current folder" onClick={() => { createDocument(); setPaletteOpen(false); }} /><PaletteAction icon={<Search size={15} />} label="Search documents" hint="Find documents and content" onClick={() => { setSidebarOpen(true); setPaletteOpen(false); }} /><PaletteAction icon={<SlidersHorizontal size={15} />} label="Workspace tools" hint="Open document and export tools" onClick={() => { setStyleOpen(true); setPaletteOpen(false); }} /><PaletteAction icon={<Sun size={15} />} label="Toggle theme" hint="Switch between light and dark mode" onClick={() => { setTheme((value) => value === "dark" ? "light" : "dark"); setPaletteOpen(false); }} /><PaletteAction icon={<CircleHelp size={15} />} label="Help and shortcuts" hint="View keyboard shortcuts" onClick={() => { setHelpOpen(true); setPaletteOpen(false); }} /></div>
          </motion.section>
        </motion.div>}
        {helpOpen && <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-black/20 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setHelpOpen(false); }}>
          <motion.section role="dialog" aria-modal="true" aria-labelledby="grapho-help-title" initial={{ opacity: 0, y: 18, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .97 }} transition={{ type: "spring", stiffness: 360, damping: 28 }} className="grapho-glass w-full max-w-xl overflow-hidden rounded-3xl">
            <header className="flex items-start justify-between border-b border-[var(--grapho-border)] px-5 py-5 sm:px-7"><div><div className="text-[9px] uppercase tracking-[.18em] text-[var(--grapho-faint)]">Grapho workspace</div><h2 id="grapho-help-title" className="mt-2 text-2xl font-semibold tracking-[-.06em]">Help & shortcuts</h2><p className="mt-2 text-[12px] leading-5 text-[var(--grapho-muted)]">Write naturally. Grapho keeps the structure out of your way.</p></div><button type="button" onClick={() => setHelpOpen(false)} aria-label="Close help" className="grid size-9 place-items-center rounded-xl text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]"><X size={15} /></button></header>
            <div className="grid gap-6 px-5 py-6 sm:grid-cols-2 sm:px-7"><ShortcutGroup title="Writing" items={[["Enter", "New block"], ["Backspace", "Remove empty block"], ["/", "Open block menu"], ["Shift + Enter", "New line"]]} /><ShortcutGroup title="Formatting" items={[["Select text", "Open formatting toolbar"], ["⌘ / Ctrl + B", "Bold selection"], ["⌘ / Ctrl + I", "Italic selection"], ["Delete", "Delete selected block"]]} /><ShortcutGroup title="Markdown" items={[["# + Space", "Heading"], ["> + Space", "Quote"], ["- + Space", "Bulleted list"], ["1. + Space", "Numbered list"]]} /><ShortcutGroup title="Workspace" items={[["Click handle", "Select a block"], ["PDF", "Print canvas to PDF"], ["T", "Open document style"], ["Esc", "Close menus"]]} /></div>
            <footer className="flex items-center justify-between border-t border-[var(--grapho-border)] bg-[var(--grapho-control)] px-5 py-3 text-[8px] text-[var(--grapho-faint)] sm:px-7"><span>Local-first · no account required</span><button type="button" onClick={() => setHelpOpen(false)} className="rounded-lg px-2.5 py-1.5 text-[var(--grapho-muted)] hover:bg-[var(--grapho-control-hover)]">Done</button></footer>
          </motion.section>
        </motion.div>}
      </AnimatePresence>
      <input ref={backupInput} type="file" accept="application/json,.json" onChange={importBackup} className="hidden" aria-label="Import JSON backup" />
      <div className="grapho-print-page-number" aria-hidden="true">Page <span /></div>
      <div className="grapho-print-branding" aria-hidden="true">Grapho</div>
    </div>
  );
}

function parseMarkdownBlocks(rawText: string, makeId: () => string): Block[] {
  const lines = rawText.replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) { codeLines.push(lines[index]); index += 1; }
      if (index < lines.length) index += 1;
      blocks.push({ id: makeId(), type: "code", text: codeLines.join("\n") });
      continue;
    }
    if (index + 1 < lines.length && /^\s*\|/.test(line) && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) {
      const rows: string[] = [];
      while (index < lines.length && /^\s*\|/.test(lines[index].trim())) {
        const row = lines[index].trim();
        if (!/^\s*\|?\s*:?-{3,}/.test(row)) rows.push(row);
        index += 1;
      }
      blocks.push({ id: makeId(), type: "table", text: rows.join("\n") });
      continue;
    }
    if (/^#{1,6}\s+/.test(line)) blocks.push({ id: makeId(), type: "heading", text: cleanMarkdown(line.replace(/^#{1,6}\s+/, "")) });
    else if (/^[-*_]{3,}$/.test(line)) blocks.push({ id: makeId(), type: "divider", text: "" });
    else if (/^>\s?/.test(line)) blocks.push({ id: makeId(), type: "quote", text: cleanMarkdown(line.replace(/^>\s?/, "")) });
    else if (/^[-*+]\s+/.test(line)) blocks.push({ id: makeId(), type: "list", text: cleanMarkdown(line.replace(/^[-*+]\s+/, "")) });
    else if (/^\d+[.)]\s+/.test(line)) blocks.push({ id: makeId(), type: "ordered-list", text: cleanMarkdown(line.replace(/^\d+[.)]\s+/, "")) });
    else blocks.push({ id: makeId(), type: "paragraph", text: cleanMarkdown(line) });
    index += 1;
  }
  return blocks;
}

function documentToMarkdown(document: DocumentItem) {
  return [`# ${document.title}`, "", ...document.blocks.map((block) => {
    if (block.type === "heading") return `## ${block.text}`;
    if (block.type === "quote") return `> ${block.text}`;
    if (block.type === "list") return block.text.split("\\n").map((line) => `- ${line}`).join("\\n");
    if (block.type === "ordered-list") return block.text.split("\\n").map((line, index) => `${index + 1}. ${line}`).join("\\n");
    if (block.type === "code") return "```\\n" + block.text + "\\n```";
    if (block.type === "divider") return "---";
    return block.text;
  })].join("\\n\\n");
}

function cleanMarkdown(value: string) {
  return value.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/__([^_]+)__/g, "$1").replace(/_([^_]+)_/g, "$1");
}

function MarkdownTableBlock({ text }: { text: string }) {
  const rows = text.split("\n").map((row) => row.split("|").slice(1, -1).map((cell) => cell.trim()));
  if (!rows.length) return null;
  return <div className="my-4 overflow-x-auto rounded-xl border border-[var(--grapho-border)]"><table className="w-full min-w-[520px] border-collapse text-left text-[12px] leading-6"><thead className="bg-[var(--grapho-control)]"><tr>{rows[0].map((cell, index) => <th key={`${cell}-${index}`} className="border-b border-[var(--grapho-border)] px-3 py-2 font-semibold text-[var(--grapho-foreground)]">{renderInlineMarkdown(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, rowIndex) => <tr key={rowIndex} className="border-b border-[var(--grapho-border)] last:border-0">{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className="px-3 py-2 text-[var(--grapho-muted)]">{renderInlineMarkdown(cell)}</td>)}</tr>)}</tbody></table></div>;
}

function renderInlineMarkdown(value: string) {
  const parts = value.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : part);
}

function EditorBlock({ block, orderedIndex, onChange, onKeyDown, onPaste }: { block: Block; orderedIndex?: number; onChange: (text: string) => void; onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void; onPaste: (event: React.ClipboardEvent<HTMLDivElement>) => void }) {
  const editable = (className: string, label: string) => <EditableContent blockId={block.id} value={block.text} label={label} className={className} onChange={onChange} onKeyDown={onKeyDown} onPaste={onPaste} />;

  if (block.type === "heading") return editable("text-3xl font-semibold leading-tight tracking-[-.06em] sm:text-4xl", "Heading block");
  if (block.type === "quote") return <div className="flex gap-3 border-l-2 border-[var(--grapho-accent)] bg-[var(--grapho-accent-soft)] px-4 py-3"><Quote size={15} className="mt-1 shrink-0 text-[var(--grapho-accent)]" />{editable("text-[15px] italic leading-7 text-[var(--grapho-muted)]", "Quote block")}</div>;
  if (block.type === "list") return <div className="flex gap-3"><div className="w-5 shrink-0 pt-1 text-[var(--grapho-faint)]">•</div>{editable("whitespace-pre-wrap text-[15px] leading-8 text-[var(--grapho-muted)]", "Bulleted list block")}</div>;
  if (block.type === "ordered-list") return <div className="flex gap-3"><div className="w-5 shrink-0 pt-1 text-right text-[var(--grapho-faint)]">{orderedIndex ?? 1}.</div>{editable("whitespace-pre-wrap text-[15px] leading-8 text-[var(--grapho-muted)]", "Numbered list block")}</div>;
  if (block.type === "code") return <pre className="my-3 overflow-x-auto rounded-xl border border-[var(--grapho-border)] bg-[var(--grapho-control)] p-4 text-[13px] leading-6 text-[var(--grapho-muted)]"><code>{block.text}</code></pre>;
  if (block.type === "divider") return <hr className="my-5 border-0 border-t border-[var(--grapho-border)]" />;
  if (block.type === "table") return <MarkdownTableBlock text={block.text} />;
  return editable("text-[15px] leading-8 text-[var(--grapho-muted)] sm:text-[17px]", "Paragraph block");
}

function EditableDocumentTitle({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) ref.current.textContent = value;
  }, [value]);
  return <h1
    ref={ref}
    contentEditable
    suppressContentEditableWarning
    role="textbox"
    aria-label="Document title"
    spellCheck
    onInput={(event) => onChange(event.currentTarget.textContent ?? "")}
    onKeyDown={(event) => {
      if (event.key === "Enter") event.preventDefault();
    }}
    className="grapho-title min-h-[1.1em] cursor-text text-4xl font-semibold leading-[1.05] outline-none sm:text-6xl"
  />;
}

function EditableContent({ blockId, value, label, className, onChange, onKeyDown, onPaste }:  { blockId: string; value: string; label: string; className: string; onChange: (value: string) => void; onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void; onPaste: (event: React.ClipboardEvent<HTMLDivElement>) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValue = useRef(value);

  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.textContent !== value) ref.current.textContent = value;
    lastValue.current = value;
  }, [value]);

  return <div ref={ref} data-grapho-block data-grapho-block-id={blockId} contentEditable suppressContentEditableWarning role="textbox" aria-label={label} spellCheck onInput={(event) => { lastValue.current = event.currentTarget.textContent ?? ""; onChange(lastValue.current); }} onKeyDown={onKeyDown} onPaste={onPaste} className={`min-h-[1.5em] w-full cursor-text border-0 bg-transparent outline-none ${className}`} />;
}

function BlockCommandMenu({ onSelect, onDismiss }: { onSelect: (type: Block["type"]) => void; onDismiss: () => void }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const commands: { type: Block["type"]; category: string; label: string; hint: string; icon: React.ReactNode }[] = [
    { type: "paragraph", category: "Basic", label: "Text", hint: "Plain text", icon: <AlignLeft size={13} /> },
    { type: "heading", category: "Basic", label: "Heading 1", hint: "Large section title", icon: <Hash size={13} /> },
    { type: "heading", category: "Basic", label: "Heading 2", hint: "Section title", icon: <Hash size={13} /> },
    { type: "list", category: "Lists", label: "Bulleted list", hint: "Simple list", icon: <List size={13} /> },
    { type: "ordered-list", category: "Lists", label: "Numbered list", hint: "Ordered steps", icon: <List size={13} /> },
    { type: "quote", category: "Basic", label: "Quote", hint: "Highlight a thought", icon: <Quote size={13} /> },
    { type: "callout", category: "Basic", label: "Callout", hint: "Bring attention", icon: <Sparkles size={13} /> },
    { type: "code", category: "Advanced", label: "Code block", hint: "Monospaced code", icon: <Type size={13} /> },
    { type: "table", category: "Advanced", label: "Table", hint: "Structured rows and columns", icon: <Table2 size={13} /> },
    { type: "divider", category: "Basic", label: "Divider", hint: "Separate sections", icon: <Minus size={13} /> },
  ];
  const filtered = commands.filter((command) => `${command.label} ${command.hint} ${command.category}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => { searchRef.current?.focus(); }, []);
  useEffect(() => { setActiveIndex(0); }, [query]);
  const choose = (index: number) => { const command = filtered[index]; if (command) onSelect(command.type); };
  return <div className="absolute left-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-[var(--grapho-border)] bg-[var(--grapho-panel-solid)] p-2 shadow-2xl" onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); onDismiss(); } else if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0))); } else if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); } else if (event.key === "Enter") { event.preventDefault(); choose(activeIndex); } }}>
    <div className="flex items-center justify-between px-2.5 py-2 text-[8px] uppercase tracking-[.16em] text-[var(--grapho-faint)]"><span>Insert block</span><button type="button" onClick={onDismiss} aria-label="Close block menu"><X size={12} /></button></div>
    <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search block commands" placeholder="Filter commands…" className="mb-2 h-9 w-full rounded-xl border border-[var(--grapho-border)] bg-[var(--grapho-control)] px-3 text-[10px] text-[var(--grapho-foreground)] outline-none placeholder:text-[var(--grapho-faint)]" />
    <div className="max-h-64 overflow-y-auto">{filtered.map((command, index) => <button key={`${command.label}-${command.type}`} type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(index)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left ${index === activeIndex ? "bg-[var(--grapho-control-hover)]" : "hover:bg-[var(--grapho-control)]"}`}><span className="grid size-7 place-items-center rounded-lg border border-[var(--grapho-border)] bg-[var(--grapho-control)] text-[var(--grapho-muted)]">{command.icon}</span><span><span className="block text-[9px] text-[var(--grapho-foreground)]">{command.label}</span><span className="block text-[8px] text-[var(--grapho-faint)]">{command.category} · {command.hint}</span></span></button>)}{!filtered.length && <div className="px-2.5 py-4 text-center text-[9px] text-[var(--grapho-faint)]">No matching commands</div>}</div>
  </div>;
}

function PaletteAction({ icon, label, hint, onClick }: { icon: React.ReactNode; label: string; hint: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[var(--grapho-control-hover)]"><span className="grid size-9 place-items-center rounded-xl border border-[var(--grapho-border)] bg-[var(--grapho-control)] text-[var(--grapho-muted)]">{icon}</span><span className="min-w-0 flex-1"><span className="block text-[11px] text-[var(--grapho-foreground)]">{label}</span><span className="mt-0.5 block text-[9px] text-[var(--grapho-faint)]">{hint}</span></span><ChevronRight size={14} className="text-[var(--grapho-faint)]" /></button>;
}

function ShortcutGroup({ title, items }: { title: string; items: string[][] }) {
  return <section><h3 className="text-[9px] uppercase tracking-[.16em] text-[var(--grapho-faint)]">{title}</h3><div className="mt-3 space-y-2.5">{items.map(([key, description]) => <div key={key} className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-[var(--grapho-control)] px-3.5 py-3"><kbd className="rounded-md border border-[var(--grapho-border)] bg-[var(--grapho-panel-solid)] px-2 py-1.5 text-[10px] text-[var(--grapho-foreground)]">{key}</kbd><span className="text-right text-[10px] leading-4 text-[var(--grapho-muted)]">{description}</span></div>)}</div></section>;
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[var(--grapho-control)] px-3 py-2.5"><div className="text-[8px] text-[var(--grapho-faint)]">{label}</div><div className="mt-1 text-sm font-semibold tracking-[-.04em] text-[var(--grapho-foreground)]">{value}</div></div>;
}

function ToolbarButton({ label, icon, onClick, danger = false }: { label: string; icon: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  return <motion.button type="button" aria-label={label} title={label} onClick={onClick} whileHover={{ y: -2 }} whileTap={{ scale: .92 }} className={`grid size-9 shrink-0 place-items-center rounded-xl transition-colors ${danger ? "text-red-500 hover:bg-red-500/10" : "text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)] hover:text-[var(--grapho-foreground)]"}`}>{icon}</motion.button>;
}

function StyleOption({ label, value }: { label: string; value: string }) {
  return <button type="button" className="mt-2 flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left text-[9px] hover:bg-[var(--grapho-control)]"><span className="text-[var(--grapho-muted)]">{label}</span><span className="text-[var(--grapho-faint)]">{value}</span></button>;
}
