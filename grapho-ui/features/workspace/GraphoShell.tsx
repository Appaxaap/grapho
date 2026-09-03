"use client";

/* The workspace uses refs for undo history and native-window capability detection by design. */
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability, react-hooks/refs */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { AnimatePresence, motion } from "motion/react";

import {
  AlignLeft, Archive, Check, ChevronDown, ChevronRight, CircleHelp, FileCode, FileDown, FileJson, FileText, Folder, FolderOpen, FolderPlus, GripVertical, Hash, Image as ImageIcon, Link2, List, Menu, Minus, MoreHorizontal,
  Plus, Quote, Search, Settings2, Sparkles, Trash2,
  Sun, Moon, SlidersHorizontal, Table2, Type, Undo2, Redo2, X,
} from "lucide-react";
import "../../styles/grapho.css";
import { clearGraphoStorage, defaultGraphoPreferences, getGraphoStorageDiagnostics, loadGraphoStorage, saveGraphoStorage, type GraphoPreferences } from "../../persistence/storage";
import { exportNativePdf, isNativePersistenceAvailable, loadNativeWorkspace, saveNativeWorkspace } from "../../persistence/native";
import { initialDocuments, WORKSPACE_FOLDERS, type Block, type DocumentItem, type InlineText, type TextMark } from "../../domain/model";
import { analyzeDocument } from "../../domain/documentIntelligence";
import { SHORTCUTS } from "../../domain/shortcuts";
import { ToolbarButton } from "../editor/ToolbarButton";
import { MobileActionBar } from "../mobile/MobileActionBar";
import { blockInlineContent, documentBacklinks, mergeInlineContent, moveBlock, plainInlineText, visibleBlocks } from "../../domain/operations";

type Theme = "dark" | "light";

const defaultFolders = [...WORKSPACE_FOLDERS];

export default function GraphoShell() {
  const [theme, setTheme] = useState<Theme>(() => typeof window !== "undefined" && window.localStorage.getItem("grapho-theme") === "light" ? "light" : "dark");
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [selectedId, setSelectedId] = useState("product-notes");
  const [query, setQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState("Projects");
  const [folders, setFolders] = useState<string[]>(defaultFolders);
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [workspaceDraft, setWorkspaceDraft] = useState("");
  const [workspaceRenameTarget, setWorkspaceRenameTarget] = useState<string | null>(null);
  const [workspaceRenameDraft, setWorkspaceRenameDraft] = useState("");
  const [focusedDocumentId, setFocusedDocumentId] = useState<string | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === "undefined" || window.innerWidth > 700);
  const [styleOpen, setStyleOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [editorWidth, setEditorWidth] = useState<"Readable" | "Wide">("Readable");
  const [editorSpacing, setEditorSpacing] = useState<"Relaxed" | "Compact">("Relaxed");
  const [editorFont, setEditorFont] = useState<"Sans" | "Mono" | "Serif">("Sans");
  const [editorSize, setEditorSize] = useState<"Standard" | "Large">("Standard");
    const [pageSurface, setPageSurface] = useState<"Warm white" | "Soft gray">("Warm white");
    const [accentStyle, setAccentStyle] = useState<"Forest Green" | "Muted Ink">("Forest Green");
    const [gridStyle, setGridStyle] = useState<"Subtle" | "Off">("Subtle");
  const [accountView, setAccountView] = useState<"document" | "register">("register");
    const [accountFilter, setAccountFilter] = useState<"all" | "created" | "proposed">("all");
    const [accountQuery, setAccountQuery] = useState("");
    const [intelligenceOpen, setIntelligenceOpen] = useState(false);
    const [productionOpen, setProductionOpen] = useState(false);
  const [commandBlockId, setCommandBlockId] = useState<string | null>(null);
  const [selectionToolbar, setSelectionToolbar] = useState<{ top: number; left: number } | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(() => new Set());
  const blockSelectionAnchor = useRef<string | null>(null);
  const blockSelectionDragging = useRef(false);
  const blockSelectionPending = useRef<{ id: string; x: number; y: number; additive: boolean } | null>(null);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [dropTargetBlockId, setDropTargetBlockId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
    const [helpTab, setHelpTab] = useState<"tools" | "shortcuts">("tools");
    const [firstRunGuideOpen, setFirstRunGuideOpen] = useState(false);
      const [desktopOnboardingOpen, setDesktopOnboardingOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DocumentItem | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(() => new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [bulkDeleteTargets, setBulkDeleteTargets] = useState<DocumentItem[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyAction, setBusyAction] = useState<"importing" | "resetting" | "exporting" | "renaming" | null>(null);
  const [isNativeWindow, setIsNativeWindow] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!toast || busyAction) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast, busyAction]);

  useEffect(() => {
    if (!selectionMode) return;
    const handleSelectionClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-grapho-document-id]");
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      const isSelected = selectedDocumentIds.has(target.dataset.graphoDocumentId!);
      target.dataset.selectionChecked = String(!isSelected);
      target.setAttribute("aria-pressed", String(!isSelected));
      toggleDocumentSelection(target.dataset.graphoDocumentId!);
    };
    document.addEventListener("click", handleSelectionClick, true);
    return () => document.removeEventListener("click", handleSelectionClick, true);
  }, [selectionMode, selectedDocumentIds]);

  useEffect(() => {
    if (selectedDocumentIds.size > 0) setSelectionMode(true);
  }, [selectedDocumentIds]);

  useEffect(() => {
    window.localStorage.setItem("grapho-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!isHydrated || window.localStorage.getItem("grapho-workspace-guide-seen")) return;
    if (isNativeWindow) { setFirstRunGuideOpen(false); setDesktopOnboardingOpen(true); return; }
    setFirstRunGuideOpen(true);
  }, [isHydrated, isNativeWindow]);

  const finishDesktopOnboarding = () => {
    window.localStorage.setItem("grapho-workspace-guide-seen", "true");
    setDesktopOnboardingOpen(false);
  };

  const dismissFirstRunGuide = () => {
    window.localStorage.setItem("grapho-workspace-guide-seen", "true");
    setFirstRunGuideOpen(false);
  };
  const blockSequence = useRef(0);
  const hydrated = useRef(false);
  const history = useRef<{ past: DocumentItem[][]; future: DocumentItem[][] }>({ past: [], future: [] });
  const previousDocuments = useRef<DocumentItem[]>(initialDocuments);
  const nativeWindow = useRef<ReturnType<typeof getCurrentWindow> | null>(null);
  const latestWorkspace = useRef<{ documents: DocumentItem[]; selectedId: string; activeFolder: string; folders: string[]; preferences: GraphoPreferences }>({ documents, selectedId, activeFolder, folders: defaultFolders, preferences: defaultGraphoPreferences });
  const backupInput = useRef<HTMLInputElement>(null);
  const markdownInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = loadGraphoStorage();
    const hydrate = async () => {
      const nativeStored = isNativePersistenceAvailable() ? await loadNativeWorkspace() : null;
      const source = nativeStored ?? stored;
      if (source) {
        const stored = source;
        setDocuments(stored.documents.map((document) => {
                  const blocks = normalizeTableBlocks(document.blocks.map((block) => block.type === "paragraph" && block.text === "Start writing…" ? { ...block, text: "" } : block));
                  return blocks.length && ["todo", "toggle"].includes(blocks[blocks.length - 1].type) ? { ...document, blocks: [...blocks, { id: `block-${document.id}-writing`, type: "paragraph" as const, text: "" }] } : { ...document, blocks };
                }));
        setSelectedId(stored.documents.some((document) => document.id === stored.selectedId) ? stored.selectedId : stored.documents[0]?.id ?? "product-notes");
        setActiveFolder(stored.activeFolder);
        setFolders(stored.folders?.length ? Array.from(new Set([...defaultFolders, ...stored.folders])) : defaultFolders);
        const preferences = { ...defaultGraphoPreferences, ...(stored.preferences ?? {}) };
        setEditorWidth(preferences.editorWidth);
        setEditorSpacing(preferences.editorSpacing);
        setEditorFont(preferences.editorFont);
        setEditorSize(preferences.editorSize);
      }
      hydrated.current = true;
      setIsHydrated(true);
    };
    const timer = window.setTimeout(() => void hydrate(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const saveNow = useCallback(() => {
    if (!hydrated.current) return;
    try {
      const payload = { version: 1, ...latestWorkspace.current };
      if (isNativePersistenceAvailable()) void saveNativeWorkspace(payload);
      saveGraphoStorage(payload);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, []);

  useEffect(() => {
    latestWorkspace.current = { documents, selectedId, activeFolder, folders, preferences: { editorWidth, editorSpacing, editorFont, editorSize } };
    if (!hydrated.current) return;
    setSaveState("saving");
    const timer = window.setTimeout(saveNow, 350);
    return () => window.clearTimeout(timer);
  }, [documents, selectedId, activeFolder, folders, editorWidth, editorSpacing, editorFont, editorSize, saveNow]);

  useEffect(() => {
    const flushSave = () => saveNow();
    window.addEventListener("beforeunload", flushSave);
    window.addEventListener("pagehide", flushSave);
    return () => {
      window.removeEventListener("beforeunload", flushSave);
      window.removeEventListener("pagehide", flushSave);
    };
  }, [saveNow]);

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
  const closeWindow = () => {
    saveNow();
    void nativeWindow.current?.close();
  };

  const selected = documents.find((document) => document.id === selectedId) ?? documents[0];
  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const results = new Map<string, { categories: string[]; preview: string }>();
    for (const document of documents) {
      if (!normalizedQuery) continue;
      const matchedBlocks = document.blocks.filter((block) => block.text.toLowerCase().includes(normalizedQuery));
      const categories = new Set<string>();
      if (document.title.toLowerCase().includes(normalizedQuery)) categories.add("title");
      if (document.folder.toLowerCase().includes(normalizedQuery)) categories.add("folder");
      if (matchedBlocks.some((block) => block.type === "heading")) categories.add("heading");
      if (matchedBlocks.some((block) => block.type === "code")) categories.add("code");
      if (matchedBlocks.some((block) => !["heading", "code"].includes(block.type))) categories.add("content");
      if (categories.size) results.set(document.id, { categories: [...categories], preview: matchedBlocks[0]?.text.trim().slice(0, 88) ?? document.title });
    }
    return results;
  }, [documents, query]);

  const visibleDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return documents.filter((document) => {
      if (trashOpen) {
        if (!document.trashed) return false;
      } else if (document.trashed || document.folder !== activeFolder) return false;
      if (!normalizedQuery) return true;
      return searchResults.has(document.id);
    });
  }, [activeFolder, documents, query, searchResults, trashOpen]);

  const renameDocument = (documentId: string) => {
    const current = documents.find((document) => document.id === documentId);
    if (!current) return;
    setRenameTarget(current);
    setRenameDraft(current.title);
  };

  const commitRename = () => {
    if (!renameTarget || busyAction) return;
    const title = renameDraft.trim();
    if (!title) return;
    if (title === renameTarget.title) { setRenameTarget(null); return; }
    const targetId = renameTarget.id;
    const previousTitle = renameTarget.title;
    setBusyAction("renaming");
    setToast("Saving name…");
    window.setTimeout(() => {
      setDocuments((items) => items.map((document) => document.id === targetId ? { ...document, title, updated: "Just now", blocks: document.blocks.map((block, index) => index === 0 && block.type === "heading" && block.text === previousTitle ? { ...block, text: title } : block) } : document));
      setRenameTarget(null);
      setBusyAction(null);
      setToast("Name saved");
    }, 320);
  };

  const deleteDocument = (documentId: string) => {
    if (documents.length <= 1) { setToast("Keep at least one document in your workspace."); return; }
    const target = documents.find((document) => document.id === documentId);
    if (target) setDeleteTarget(target);
  };

  const requestBulkDelete = () => {
    const targets = visibleDocuments.filter((document) => selectedDocumentIds.has(document.id));
    if (!targets.length) return;
    if (documents.length - targets.length < 1) { setToast("Keep at least one document in your workspace."); return; }
    setBulkDeleteTargets(targets);
    setDeleteTarget(targets[0]);
  };

  const toggleDocumentSelection = (documentId: string) => setSelectedDocumentIds((current) => { const next = new Set(current); if (next.has(documentId)) next.delete(documentId); else next.add(documentId); return next; });

  const commitDelete = () => {
    const targets = bulkDeleteTargets ?? (deleteTarget ? [deleteTarget] : []);
    if (!targets.length || deleting) return;
    setDeleting(true);
    const targetIds = new Set(targets.map((target) => target.id));
    window.setTimeout(() => {
      setDocuments((current) => current.map((document) => targetIds.has(document.id) ? { ...document, trashed: true, deletedAt: new Date().toISOString() } : document));
      if (targetIds.has(selectedId)) {
        const remaining = documents.filter((document) => !targetIds.has(document.id) && !document.trashed);
        setSelectedId(remaining[0]?.id ?? "product-notes");
      }
      setDeleteTarget(null);
      setBulkDeleteTargets(null);
      setSelectedDocumentIds(new Set());
      setSelectionMode(false);
      setDeleting(false);
      setToast(targets.length === 1 ? "Document moved to Trash" : `${targets.length} documents moved to Trash`);
    }, 420);
  };


  const restoreDocument = (documentId: string) => {
    setDocuments((current) => current.map((document) => document.id === documentId ? { ...document, trashed: false, deletedAt: undefined, updated: "Just now" } : document));
    setToast("Document restored");
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

  const updateBlock = (id: string, text: string, content?: InlineText[]) => {
    setDocuments((current) => current.map((document) => document.id !== selected.id ? document : { ...document, updated: "Just now", blocks: document.blocks.map((block) => block.id === id ? { ...block, text, content } : block) }));
  };

  useEffect(() => {
    const handleDocumentNavigation = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const visibleIds = visibleDocuments.map((document) => document.id);
      if (!visibleIds.length) return;
      const currentIndex = Math.max(0, visibleIds.indexOf(focusedDocumentId ?? selectedId));
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const nextIndex = event.key === "ArrowDown" ? Math.min(currentIndex + 1, visibleIds.length - 1) : Math.max(currentIndex - 1, 0);
        const nextId = visibleIds[nextIndex];
        setFocusedDocumentId(nextId);
        setSelectedId(nextId);
        window.setTimeout(() => document.querySelector<HTMLElement>(`[data-grapho-document-id="${nextId}"]`)?.focus(), 0);
        return;
      }
      if (event.key === "F2") {
        event.preventDefault();
        if (focusedDocumentId === null && folders.includes(activeFolder)) renameWorkspace(activeFolder);
        else renameDocument(focusedDocumentId ?? selectedId);
        return;
      }
      if (event.key === "Delete") {
        event.preventDefault();
        deleteDocument(focusedDocumentId ?? selectedId);
      }
    };
    window.addEventListener("keydown", handleDocumentNavigation);
    return () => window.removeEventListener("keydown", handleDocumentNavigation);
  }, [documents, focusedDocumentId, selectedId, visibleDocuments]);

  const renameWorkspace = (workspace: string) => {
    setWorkspaceRenameTarget(workspace);
    setWorkspaceRenameDraft(workspace);
  };

  const commitWorkspaceRename = () => {
    if (!workspaceRenameTarget) return;
    const name = workspaceRenameDraft.trim().replace(/\s+/g, " ");
    if (!name) return;
    if (folders.some((folder) => folder !== workspaceRenameTarget && folder.toLowerCase() === name.toLowerCase())) {
      setToast("That workspace already exists");
      return;
    }
    setFolders((current) => current.map((folder) => folder === workspaceRenameTarget ? name : folder));
    setDocuments((current) => current.map((document) => document.folder === workspaceRenameTarget ? { ...document, folder: name } : document));
    if (activeFolder === workspaceRenameTarget) setActiveFolder(name);
    setWorkspaceRenameTarget(null);
    setWorkspaceRenameDraft("");
  };

  const createWorkspace = () => {
    const name = workspaceDraft.trim().replace(/\s+/g, " ");
    if (!name) return;
    if (folders.some((folder) => folder.toLowerCase() === name.toLowerCase())) {
      setToast("That workspace already exists");
      return;
    }
    setFolders((current) => [...current, name]);
    setActiveFolder(name);
    setWorkspaceDraft("");
    setWorkspaceDialogOpen(false);
  };

  const createDocument = (parentDocumentId: string | null = null) => {
    const id = `document-${Date.now()}`;
    const document = { id, title: parentDocumentId ? "Untitled subdocument" : "Untitled document", folder: activeFolder, parentDocumentId, updated: "Just now", blocks: [{ id: `${id}-heading`, type: "heading" as const, text: parentDocumentId ? "Untitled subdocument" : "Untitled document" }, { id: `${id}-paragraph`, type: "paragraph" as const, text: "" }] };
    setDocuments((current) => [document, ...current]);
    setSelectedId(id);
  };

  const documentDepth = (document: DocumentItem) => {
    let depth = 0;
    let parentId = document.parentDocumentId;
    const visited = new Set<string>();
    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      depth += 1;
      parentId = documents.find((item) => item.id === parentId)?.parentDocumentId;
    }
    return Math.min(depth, 4);
  };

  const backlinks = useMemo(() => documentBacklinks(documents, selected.id), [documents, selected.id]);
  const accountRegister = useMemo(() => detectAccountRegister(selected), [selected]);
  const intelligence = useMemo(() => analyzeDocument(selected, documents), [selected, documents]);

  const insertDocumentLink = () => {
    const choices = documents.filter((document) => document.id !== selected.id && !document.trashed);
    if (!choices.length) { setToast("Create another document before adding a document link"); return; }
    const requested = window.prompt(`Link to document:\n${choices.map((document) => document.title).join("\n")}`, choices[0].title);
    if (!requested) return;
    const target = choices.find((document) => document.title.toLowerCase() === requested.trim().toLowerCase()) ?? choices.find((document) => document.title.toLowerCase().includes(requested.trim().toLowerCase()));
    if (!target) { setToast("Document not found"); return; }
    const block = selected.blocks[selected.blocks.length - 1];
    if (!block) return;
    updateBlock(block.id, `${block.text}${block.text ? " " : ""}[[${target.title}]]`, block.content);
    setToast(`Linked to ${target.title}`);
  };

  const documentPath = (document: DocumentItem) => {
    const path: string[] = [];
    let current: DocumentItem | undefined = document;
    const visited = new Set<string>();
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      path.unshift(current.title);
      current = current.parentDocumentId ? documents.find((item) => item.id === current?.parentDocumentId) : undefined;
    }
    return path;
  };

  const addBlockAfter = (blockId: string, type: Block["type"] = "paragraph", text = "") => {
    const newBlock: Block = { id: `block-${selected.id}-${blockSequence.current++}`, type, text };
    setDocuments((current) => current.map((document) => {
      if (document.id !== selected.id) return document;
      const index = document.blocks.findIndex((block) => block.id === blockId);
      return { ...document, updated: "Just now", blocks: [...document.blocks.slice(0, index + 1), newBlock, ...document.blocks.slice(index + 1)] };
    }));
    setCommandBlockId(null);
    window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(`[data-grapho-block-id="${newBlock.id}"]`);
      target?.focus();
      if (target) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(target);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 0);
  };

  const exportPdf = async () => {
    if (busyAction) return;
    setBusyAction("exporting");
    try {
      if (isNativeWindow) {
        const saved = await exportNativePdf(selected);
        setBusyAction(null);
        setToast(saved ? "PDF exported" : "PDF export cancelled");
        return;
      }
      // Browser export remains the native print flow, since browsers own the destination dialog.
      window.print();
      window.setTimeout(() => {
        setBusyAction(null);
        setToast("PDF export ready");
      }, 450);
    } catch (error) {
      setBusyAction(null);
      setToast(`PDF export failed: ${error instanceof Error ? error.message : "Could not write the file"}`);
    }
  };

  const downloadFile = (filename: string, content: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => {
    setBusyAction("exporting");
    downloadFile(`${selected.title || "grapho-document"}.md`, documentToMarkdown(selected), "text/markdown");
    window.setTimeout(() => {
      setBusyAction(null);
      setToast("Markdown export ready");
    }, 450);
  };

  const exportHtml = () => {
    setBusyAction("exporting");
    downloadFile(`${selected.title || "grapho-document"}.html`, documentToHtml(selected), "text/html");
    window.setTimeout(() => { setBusyAction(null); setToast("HTML export ready"); }, 450);
  };

  const exportPlainText = () => {
    setBusyAction("exporting");
    downloadFile(`${selected.title || "grapho-document"}.txt`, documentToPlainText(selected), "text/plain");
    window.setTimeout(() => { setBusyAction(null); setToast("Plain text export ready"); }, 450);
  };

  const exportBackup = () => {
    const payload = JSON.stringify({ version: 1, documents, selectedId, activeFolder }, null, 2);
    downloadFile("grapho-backup.json", payload, "application/json");
  };

  const importMarkdown = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusyAction("importing");
    setToast("Importing Markdown…");
    const reader = new FileReader();
    reader.onload = () => {
      const title = file.name.replace(/\\.md$/i, "").trim() || "Imported document";
      const blocks = parseMarkdownBlocks(String(reader.result), () => `imported-${Date.now()}-${blockSequence.current++}`);
      const imported: DocumentItem = {
        id: `document-${Date.now()}`,
        title,
        folder: activeFolder,
        updated: "Just now",
        blocks: blocks.length ? blocks : [{ id: `imported-${Date.now()}`, type: "paragraph", text: "" }],
      };
      setDocuments((current) => [imported, ...current]);
      setSelectedId(imported.id);
      setBusyAction(null);
      setToast("Markdown imported");
    };
    reader.onerror = () => {
      setBusyAction(null);
      setToast("Could not read Markdown file");
    };
    reader.readAsText(file);
  };

  const importMarkdownFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".md") && file.type !== "text/markdown") {
      setToast("Drop a Markdown file to import");
      return;
    }
    setBusyAction("importing");
    setToast("Importing Markdown…");
    const reader = new FileReader();
    reader.onload = () => {
      const title = file.name.replace(/\\.md$/i, "").trim() || "Imported document";
      const blocks = parseMarkdownBlocks(String(reader.result), () => `imported-${Date.now()}-${blockSequence.current++}`);
      const imported: DocumentItem = { id: `document-${Date.now()}`, title, folder: activeFolder, updated: "Just now", blocks: blocks.length ? blocks : [{ id: `imported-${Date.now()}`, type: "paragraph", text: "" }] };
      setDocuments((current) => [imported, ...current]);
      setSelectedId(imported.id);
      setBusyAction(null);
      setToast("Markdown imported");
    };
    reader.onerror = () => { setBusyAction(null); setToast("Could not read Markdown file"); };
    reader.readAsText(file);
  };

  const handleMarkdownDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) importMarkdownFile(file);
  };

  const importBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusyAction("importing");
    setToast("Importing backup…");
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
        setBusyAction(null);
        setToast("Backup imported");
      } catch {
        setBusyAction(null);
        setToast("Backup is invalid or unsupported");
      }
    };
    reader.onerror = () => {
      setBusyAction(null);
      setToast("Could not read backup file");
    };
    reader.readAsText(file);
  };

  const resetLocalData = () => {
    if (busyAction) return;
    if (!window.confirm("Reset all local Grapho documents? This cannot be undone.")) return;
    setBusyAction("resetting");
    setToast("Resetting local data…");
    window.setTimeout(() => {
      clearGraphoStorage();
      history.current = { past: [], future: [] };
      previousDocuments.current = initialDocuments;
      setDocuments(initialDocuments);
      setSelectedId("product-notes");
      setActiveFolder("Projects");
      setBusyAction(null);
      setToast("Local data reset");
    }, 420);
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

  const removeSelectedBlocks = useCallback(() => {
    if (!selectedBlockIds.size || selected.blocks.length <= 1) return;
    setDocuments((current) => current.map((document) => {
      if (document.id !== selected.id) return document;
      const blocks = document.blocks.filter((block) => !selectedBlockIds.has(block.id));
      return { ...document, blocks: blocks.length ? blocks : [{ id: `empty-${selected.id}`, type: "paragraph", text: "" }], updated: "Just now" };
    }));
    setSelectedBlockIds(new Set());
    setSelectedBlockId(null);
  }, [selected.blocks.length, selected.id, selectedBlockIds]);

  const paintBlockSelection = (ids: Set<string>) => {
    document.querySelectorAll<HTMLElement>("[data-grapho-block-id]").forEach((editor) => {
      const wrapper = editor.closest<HTMLElement>("[data-grapho-block-wrapper]");
      if (wrapper) wrapper.dataset.blockSelected = String(ids.has(editor.dataset.graphoBlockId ?? ""));
    });
  };

  const selectBlockRange = (targetId: string, additive = false) => {
    const anchorId = blockSelectionAnchor.current ?? targetId;
    const anchor = selected.blocks.findIndex((block) => block.id === anchorId);
    const target = selected.blocks.findIndex((block) => block.id === targetId);
    if (anchor < 0 || target < 0) return;
    const [start, end] = anchor < target ? [anchor, target] : [target, anchor];
    const range = new Set(selected.blocks.slice(start, end + 1).map((block) => block.id));
    const next = additive ? new Set([...selectedBlockIds, ...range]) : range;
    blockSelectionAnchor.current = anchorId;
    setSelectedBlockIds(next);
    paintBlockSelection(next);
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const definition = SHORTCUTS.find((shortcut) => shortcut.key.toLowerCase() === event.key.toLowerCase() && Boolean(shortcut.mod) === (event.metaKey || event.ctrlKey) && Boolean(shortcut.shift) === event.shiftKey);
      if (!definition) return;
      event.preventDefault();
      if (definition.action === "new-document") createDocument();
      if (definition.action === "new-workspace") { setWorkspaceDraft(""); setWorkspaceDialogOpen(true); }
      if (definition.action === "search") setPaletteOpen(true);
      if (definition.action === "focus-mode") setFocusMode((value) => !value);
      if (definition.action === "sidebar") setSidebarOpen((value) => !value);
      if (definition.action === "theme") setTheme((value) => value === "dark" ? "light" : "dark");
      if (definition.action === "help") setHelpOpen(true);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [createDocument]);

  useEffect(() => {
    if (!paletteOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setPaletteOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [paletteOpen]);

  useEffect(() => {
    if (!helpOpen && !workspaceDialogOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (workspaceDialogOpen) setWorkspaceDialogOpen(false);
      else setHelpOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [helpOpen, workspaceDialogOpen]);

  useEffect(() => {
    const startCanvasSelection = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const margin = target.closest<HTMLElement>("[data-grapho-block-margin]");
      const wrapper = margin?.closest<HTMLElement>("[data-grapho-block-wrapper]") ?? target.closest<HTMLElement>("[data-grapho-block-wrapper]");
      const editor = wrapper?.querySelector<HTMLElement>("[data-grapho-block-id]");
      if (!editor?.dataset.graphoBlockId) return;
      if (!margin && (target.closest("button") || target.closest("a"))) return;
      blockSelectionPending.current = { id: editor.dataset.graphoBlockId, x: event.clientX, y: event.clientY, additive: event.shiftKey };
    };
    const extendCanvasSelection = (event: MouseEvent) => {
      const pending = blockSelectionPending.current;
      if (!blockSelectionDragging.current && pending) {
        const moved = Math.hypot(event.clientX - pending.x, event.clientY - pending.y) >= 6;
        if (!moved) return;
        blockSelectionPending.current = null;
        blockSelectionDragging.current = true;
        blockSelectionAnchor.current = pending.id;
        event.preventDefault();
        window.getSelection()?.removeAllRanges();
        selectBlockRange(pending.id, pending.additive);
      }
      if (!blockSelectionDragging.current) return;
      const editor = (event.target as HTMLElement).closest<HTMLElement>("[data-grapho-block-id]");
      if (editor?.dataset.graphoBlockId) selectBlockRange(editor.dataset.graphoBlockId);
    };
    const stopBlockSelection = () => {
      blockSelectionPending.current = null;
      blockSelectionDragging.current = false;
    };
    document.addEventListener("mousedown", startCanvasSelection);
    document.addEventListener("mouseover", extendCanvasSelection);
    document.addEventListener("mousemove", extendCanvasSelection);
    document.addEventListener("mouseup", stopBlockSelection);
    return () => {
      document.removeEventListener("mousedown", startCanvasSelection);
      document.removeEventListener("mouseover", extendCanvasSelection);
      document.removeEventListener("mousemove", extendCanvasSelection);
      document.removeEventListener("mouseup", stopBlockSelection);
    };
  }, [selected.blocks, selectedBlockIds, selectBlockRange]);

  useEffect(() => {
    const handleBlockDelete = (event: KeyboardEvent) => {
      if (selectedBlockIds.size > 0 && (event.key === "Backspace" || event.key === "Delete")) {
        const target = event.target as HTMLElement;
        if (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        event.preventDefault();
        removeSelectedBlocks();
        return;
      }
      if (!selectedBlockId || (event.key !== "Backspace" && event.key !== "Delete")) return;
      const target = event.target as HTMLElement;
      if (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      event.preventDefault();
      removeBlock(selectedBlockId);
    };
    window.addEventListener("keydown", handleBlockDelete);
    return () => window.removeEventListener("keydown", handleBlockDelete);
  }, [removeBlock, removeSelectedBlocks, selectedBlockId, selectedBlockIds.size]);

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
    setDocuments((current) => current.map((document) => {
      if (document.id !== selected.id) return document;
      const blocks = document.blocks.map((block) => block.id === blockId ? { ...block, type, checked: type === "todo" ? Boolean(block.checked) : undefined, collapsed: type === "toggle" ? Boolean(block.collapsed) : undefined, text: block.text.replace(/^(?:#{1,6}|>|[-*+]|\d+[.)]|\[\s?[xX]?\]|```)+\s*/, "") } : block);
      const changedIndex = blocks.findIndex((block) => block.id === blockId);
      const changed = blocks[changedIndex];
      if (changed && (type === "todo" || type === "toggle") && changedIndex === blocks.length - 1) blocks.push({ id: `block-${selected.id}-${blockSequence.current++}`, type: "paragraph", text: "" });
      return { ...document, blocks, updated: "Just now" };
    }));
    setCommandBlockId(null);
    window.setTimeout(() => document.querySelector<HTMLElement>(`[data-grapho-block-id="${blockId}"]`)?.focus(), 0);
  };

  const setBlockChecked = (blockId: string, checked: boolean) => {
    setDocuments((current) => current.map((document) => document.id !== selected.id ? document : { ...document, updated: "Just now", blocks: document.blocks.map((block) => block.id === blockId ? { ...block, checked } : block) }));
  };

  const setBlockCollapsed = (blockId: string, collapsed: boolean) => {
    setDocuments((current) => current.map((document) => document.id !== selected.id ? document : { ...document, updated: "Just now", blocks: document.blocks.map((block) => block.id === blockId ? { ...block, collapsed } : block) }));
  };

  const indentBlock = (blockId: string) => {
    const index = selected.blocks.findIndex((block) => block.id === blockId);
    const previous = selected.blocks[index - 1];
    if (!previous) return;
    setDocuments((current) => current.map((document) => document.id !== selected.id ? document : { ...document, updated: "Just now", blocks: document.blocks.map((block) => block.id === blockId ? { ...block, parentId: previous.id } : block) }));
  };

  const outdentBlock = (blockId: string) => {
    const block = selected.blocks.find((item) => item.id === blockId);
    if (!block?.parentId) return;
    const parent = selected.blocks.find((item) => item.id === block.parentId);
    setDocuments((current) => current.map((document) => document.id !== selected.id ? document : { ...document, updated: "Just now", blocks: document.blocks.map((item) => item.id === blockId ? { ...item, parentId: parent?.parentId ?? null } : item) }));
  };

  const moveBlockByOffset = (blockId: string, offset: number) => {
    const index = selected.blocks.findIndex((block) => block.id === blockId);
    const targetIndex = index + offset;
    if (index < 0 || targetIndex < 0 || targetIndex >= selected.blocks.length) return;
    setDocuments((current) => current.map((document) => document.id !== selected.id ? document : moveBlock(document, blockId, null, targetIndex)));
    setSelectedBlockId(blockId);
  };

  const dropBlock = (targetId: string) => {
    if (!draggingBlockId || draggingBlockId === targetId) return;
    const from = selected.blocks.findIndex((block) => block.id === draggingBlockId);
    const target = selected.blocks.findIndex((block) => block.id === targetId);
    if (from < 0 || target < 0) return;
    moveBlockByOffset(draggingBlockId, target - from);
    setDraggingBlockId(null);
    setDropTargetBlockId(null);
  };

  const handleBlockKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, block: Block) => {
    if ((event.metaKey || event.ctrlKey) && ["b", "i", "u"].includes(event.key.toLowerCase())) {
      event.preventDefault();
      const command = event.key.toLowerCase() === "b" ? "bold" : event.key.toLowerCase() === "i" ? "italic" : "underline";
      applySelectionFormat(command);
      return;
    }
    if (event.key === "/") {
      event.preventDefault();
      setCommandBlockId(block.id);
    }
    // Leave undo/redo to the browser's native contentEditable history. React
    // receives the resulting input event and persists the reverted text.
    if (event.key === "Escape") setCommandBlockId(null);
    if (event.key === "Tab" && !event.shiftKey) { event.preventDefault(); indentBlock(block.id); return; }
    if (event.key === "Tab" && event.shiftKey) { event.preventDefault(); outdentBlock(block.id); return; }
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      moveBlockByOffset(block.id, event.key === "ArrowUp" ? -1 : 1);
      return;
    }
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
      const types: Record<string, Block["type"]> = { "#": "heading", "##": "heading", "###": "heading", ">": "quote", "-": "list", "*": "list", "+": "list", "[]": "todo", "[ ]": "todo", "[x]": "todo", "[X]": "todo" };
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

  const modalOpen = Boolean(deleteTarget || bulkDeleteTargets || renameTarget || paletteOpen || helpOpen || workspaceDialogOpen || workspaceRenameTarget);

  return (
    <div style={{ "--grapho-accent": accentStyle === "Muted Ink" ? "#7B8792" : undefined, "--grapho-accent-soft": accentStyle === "Muted Ink" ? "rgba(123,135,146,.16)" : undefined } as CSSProperties} className={`grapho-ui ${theme === "dark" ? "grapho-dark" : ""} ${pageSurface === "Soft gray" ? "grapho-soft-surface" : ""} grapho-no-grid ${isNativeWindow ? "is-native-window" : ""} ${modalOpen ? "grapho-modal-open" : ""} relative min-h-screen overflow-hidden`}>
      {isNativeWindow && <div className="grapho-native-titlebar" data-tauri-drag-region>
        <div className="grapho-native-brand" data-tauri-drag-region><span className="grapho-brand-mark"><img src={theme === "dark" ? "/Branding/black-logo.png" : "/Branding/png-logo.png"} alt="" aria-hidden="true" /></span><b>Grapho</b></div>
        <div className="grapho-native-context" data-tauri-drag-region>{selected.title}</div>
        <div className="grapho-native-window-controls">
          <button className="is-close" type="button" onClick={closeWindow} aria-label="Close window" title="Close"><span aria-hidden="true" /></button>
          <button className="is-minimize" type="button" onClick={minimizeWindow} aria-label="Minimize window" title="Minimize"><span aria-hidden="true" /></button>
          <button className="is-maximize" type="button" onClick={toggleMaximizeWindow} aria-label="Maximize window" title="Maximize"><span aria-hidden="true" /></button>
        </div>
      </div>}

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

      <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 360, damping: 28 }} className="grapho-app-toolbar grapho-workspace-layer fixed right-4 top-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-1 overflow-x-auto rounded-2xl border border-[var(--grapho-border)] bg-[var(--grapho-panel)] p-1.5 shadow-xl backdrop-blur-xl [scrollbar-width:none]">
        <ToolbarButton label={sidebarOpen ? "Hide sidebar" : "Show sidebar"} icon={<Menu size={16} />} onClick={() => setSidebarOpen((value) => !value)} />
        <div className="mx-1 flex items-center gap-2 border-r border-[var(--grapho-border)] px-2 pr-3"><span className="grapho-brand-mark grid size-8 place-items-center overflow-hidden rounded-xl"><img src={theme === "dark" ? "/Branding/black-logo.png" : "/Branding/png-logo.png"} alt="" aria-hidden="true" /></span><span className="hidden text-[11px] font-semibold tracking-[-.04em] sm:block">Grapho</span></div>
        
        <ToolbarButton label="Workspace tools" icon={<SlidersHorizontal size={16} />} onClick={() => setStyleOpen((value) => !value)} />
                <ToolbarButton label="Tool guide" icon={<CircleHelp size={16} />} onClick={() => { setHelpTab("tools"); setHelpOpen(true); }} />

        <span className="mx-1 h-5 w-px bg-[var(--grapho-border)]" />
        <ToolbarButton label="Undo" icon={<Undo2 size={16} />} onClick={undo} disabled={isHydrated && history.current.past.length === 0} />
        <ToolbarButton label="Redo" icon={<Redo2 size={16} />} onClick={redo} disabled={isHydrated && history.current.future.length === 0} />
        <ToolbarButton label="Export Markdown" icon={<FileText size={16} />} onClick={exportMarkdown} disabled={busyAction !== null} />
        <ToolbarButton label="Export HTML" icon={<FileCode size={16} />} onClick={exportHtml} disabled={busyAction !== null} />
        <ToolbarButton label="Export plain text" icon={<AlignLeft size={16} />} onClick={exportPlainText} disabled={busyAction !== null} />
        <ToolbarButton label="Export PDF" icon={<FileDown size={16} />} onClick={exportPdf} disabled={busyAction !== null} />
        <span className="mx-1 h-5 w-px bg-[var(--grapho-border)]" />
        <ToolbarButton label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} icon={theme === "dark" ? <Moon size={16} /> : <Sun size={16} />} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} />

      </motion.div>

      <div className="grapho-workspace-layer relative z-10 flex min-h-screen">
        {(sidebarOpen || styleOpen) && <button type="button" className="grapho-mobile-surface-dismiss" aria-label={sidebarOpen ? "Close library" : "Close document style"} onClick={() => { setSidebarOpen(false); setStyleOpen(false); }} />}
        <AnimatePresence initial={false}>
          {sidebarOpen && <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="grapho-sidebar hidden h-[calc(100vh-2rem)] shrink-0 overflow-hidden rounded-2xl border border-[var(--grapho-border)] bg-[var(--grapho-panel)] shadow-xl backdrop-blur-xl lg:sticky lg:top-4 lg:my-4 lg:ml-4 lg:block">
            <div className="flex h-full w-[280px] flex-col overflow-y-auto p-3 [scrollbar-width:none]">
              <div className="flex h-11 items-center gap-2 px-1">
                <span className="grid size-8 place-items-center rounded-xl border border-[var(--grapho-border)] bg-[var(--grapho-control)] text-[var(--grapho-foreground)]"><FolderOpen size={14} /></span>
                <span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold tracking-[-.04em]">Library</span><span className="mt-0.5 block text-[8px] text-[var(--grapho-faint)]">Local documents</span></span>
                <button type="button" onClick={() => createDocument()} aria-label="New document" title="New document" className="grid size-8 place-items-center rounded-xl bg-[var(--grapho-foreground)] text-[var(--grapho-background)] transition-transform hover:-translate-y-0.5 active:scale-95"><Plus size={14} /></button>
              </div>
              <label className="mt-3 flex h-10 items-center gap-2 rounded-xl bg-[var(--grapho-control)] px-3 text-[10px] text-[var(--grapho-muted)] focus-within:bg-[var(--grapho-control-hover)]"><Search size={13} className="shrink-0 text-[var(--grapho-faint)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search documents" placeholder="Search documents" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--grapho-faint)]" /><kbd className="text-[8px] text-[var(--grapho-faint)]">⌘ K</kbd></label>
              <div className="mt-7 flex items-center justify-between px-2 text-[8px] uppercase tracking-[.16em] text-[var(--grapho-faint)]"><span>Workspace</span><button type="button" onClick={() => { setWorkspaceDraft(""); setWorkspaceDialogOpen(true); }} aria-label="Create workspace" title="Create workspace" className="hover:text-[var(--grapho-foreground)]"><Plus size={12} /></button></div>
              <div className="grapho-project-list mt-2 space-y-1">{folders.map((folder) => <div key={folder} className={`group flex h-9 items-center rounded-lg transition-colors ${activeFolder === folder ? "bg-[var(--grapho-control)] text-[var(--grapho-foreground)]" : "text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]"}`}><button type="button" onClick={() => { saveNow(); setActiveFolder(folder); setFocusedDocumentId(null); }} className="flex min-w-0 flex-1 items-center gap-2 px-2.5 text-left text-[10px]">{activeFolder === folder ? <FolderOpen size={14} /> : <Folder size={14} />}<span className="flex-1 truncate">{folder}</span><span className="text-[8px] text-[var(--grapho-faint)]">{documents.filter((item) => item.folder === folder).length}</span></button><button type="button" onClick={() => renameWorkspace(folder)} aria-label={`Rename workspace ${folder}`} title="Rename workspace" className="mr-1 grid size-7 place-items-center rounded-md text-[var(--grapho-faint)] opacity-0 hover:bg-[var(--grapho-control-hover)] hover:text-[var(--grapho-foreground)] group-hover:opacity-100 group-focus-within:opacity-100"><MoreHorizontal size={13} /></button></div>)}</div>
              <div className="mt-7 flex items-center justify-between px-2 text-[8px] uppercase tracking-[.16em] text-[var(--grapho-faint)]"><span>{activeFolder}</span><div className="flex items-center gap-2"><span>{visibleDocuments.length}</span>{visibleDocuments.length > 0 && <button type="button" onClick={() => { setSelectionMode((current) => !current); setSelectedDocumentIds(new Set()); if (!selectionMode) setToast("Selection mode: click projects to select"); }} className={`rounded-lg border px-2.5 py-1.5 normal-case tracking-normal transition-colors ${selectionMode ? "border-[var(--grapho-accent)] bg-[var(--grapho-accent-soft)] text-[var(--grapho-foreground)]" : "border-[var(--grapho-border)] bg-[var(--grapho-control)] text-[var(--grapho-accent)] hover:bg-[var(--grapho-control-hover)]"}`} aria-label={selectionMode ? "Exit project selection" : "Select projects"}>{selectionMode ? "Cancel" : "Select projects"}</button>}</div></div>
              {selectedDocumentIds.size > 0 && <div className="mt-2 flex items-center justify-between rounded-xl border border-[var(--grapho-border)] bg-[var(--grapho-accent-soft)] px-2.5 py-2" role="toolbar" aria-label="Bulk project actions"><span className="text-[9px] text-[var(--grapho-foreground)]">{selectedDocumentIds.size} selected</span><button type="button" onClick={requestBulkDelete} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] text-red-400 hover:bg-red-500/10" aria-label="Delete selected projects"><Trash2 size={12} /> Delete</button></div>}
              {selectionMode && selectedDocumentIds.size === 0 && <p className="mt-2 px-2 text-[9px] text-[var(--grapho-muted)]" role="status">Click projects to select them</p>}
              <div className="grapho-document-list mt-2 space-y-1">{visibleDocuments.length === 0 && <div className="rounded-xl border border-dashed border-[var(--grapho-border)] px-3 py-5 text-center" role="status"><Search size={16} className="mx-auto text-[var(--grapho-faint)]" /><p className="mt-2 text-[10px] text-[var(--grapho-muted)]">{query.trim() ? "No documents found" : "No documents in this folder"}</p>{query.trim() ? <button type="button" onClick={() => setQuery("")} className="mt-2 text-[9px] text-[var(--grapho-accent)] hover:underline">Clear search</button> : <button type="button" onClick={() => createDocument()} className="grapho-empty-action mt-2 inline-flex min-h-0 items-center rounded-md px-1 py-1 text-[9px] text-[var(--grapho-accent)] hover:bg-[var(--grapho-control)] hover:no-underline">Create a document</button>}</div>}{visibleDocuments.map((document) => <div key={document.id} style={{ marginLeft: `${documentDepth(document) * 14}px` }} className={`group flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors ${selectedId === document.id ? "border-[var(--grapho-border)] bg-[var(--grapho-control-hover)] text-[var(--grapho-foreground)]" : "border-transparent text-[var(--grapho-muted)] hover:border-[var(--grapho-border)] hover:bg-[var(--grapho-control)]"}`}><button type="button" onClick={() => { saveNow(); setFocusedDocumentId(document.id); setSelectedId(document.id); }} data-grapho-document-id={document.id} aria-label={`Open ${document.title}`} className="flex min-w-0 flex-1 items-center gap-2.5 text-left"><span className={`grid size-7 shrink-0 place-items-center rounded-lg ${selectedId === document.id ? "bg-[var(--grapho-foreground)] text-[var(--grapho-background)]" : "bg-[var(--grapho-control)] text-[var(--grapho-faint)]"}`}><FileText size={12} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-medium">{document.title}</span><span className="mt-0.5 block text-[8px] text-[var(--grapho-faint)]">{document.updated} · {document.blocks.length} blocks</span>{searchResults.has(document.id) && <span className="mt-1 block truncate text-[8px] text-[var(--grapho-accent)]">{searchResults.get(document.id)?.categories.join(" · ")} · {searchResults.get(document.id)?.preview}</span>}</span></button><div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"><button type="button" onClick={() => createDocument(document.id)} aria-label={`Create subdocument inside ${document.title}`} title="New subdocument" className="grid size-7 place-items-center rounded-lg text-[var(--grapho-faint)] hover:bg-[var(--grapho-control-hover)] hover:text-[var(--grapho-foreground)]"><FolderPlus size={13} /></button><button type="button" onClick={() => renameDocument(document.id)} aria-label={`Rename ${document.title}`} title="Rename document" className="grid size-7 place-items-center rounded-lg text-[var(--grapho-faint)] hover:bg-[var(--grapho-control-hover)] hover:text-[var(--grapho-foreground)]"><MoreHorizontal size={13} /></button>{trashOpen ? <button type="button" onClick={() => restoreDocument(document.id)} aria-label={`Restore ${document.title}`} title="Restore document" className="grid size-7 place-items-center rounded-lg text-[var(--grapho-faint)] hover:bg-[var(--grapho-control-hover)] hover:text-[var(--grapho-foreground)]"><Archive size={12} /></button> : <button type="button" onClick={() => deleteDocument(document.id)} aria-label={`Move ${document.title} to Trash`} title="Move to Trash" className="grid size-7 place-items-center rounded-lg text-[var(--grapho-faint)] hover:bg-red-500/10 hover:text-red-400"><Trash2 size={12} /></button>}</div></div>)}</div>
              <div className="mt-auto border-t border-[var(--grapho-border)] pt-3"><button type="button" onClick={() => setTrashOpen((value) => !value)} aria-pressed={trashOpen} className={`flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-[9px] text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)] ${trashOpen ? "bg-[var(--grapho-control)] text-[var(--grapho-foreground)]" : ""}`}><Trash2 size={13} /> Trash<span className="ml-auto text-[8px] text-[var(--grapho-faint)]">{documents.filter((document) => document.trashed).length}</span></button><button type="button" onClick={() => setHelpOpen(true)} className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-[9px] text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]"><CircleHelp size={13} /> Help & shortcuts<span className="ml-auto rounded border border-[var(--grapho-border)] px-1.5 py-0.5 text-[7px] text-[var(--grapho-faint)]">?</span></button></div>
            </div>
          </motion.aside>}
        </AnimatePresence>

        <main className="grapho-editor-scroll min-w-0 flex-1" aria-label="Writing canvas" onMouseDown={(event) => { const handle = (event.target as HTMLElement).closest<HTMLButtonElement>('button[aria-label="Drag or select block"]'); if (!handle) return; const editor = handle.closest("div.group")?.querySelector<HTMLElement>("[data-grapho-block-id]"); if (!editor?.dataset.graphoBlockId) return; event.preventDefault(); blockSelectionDragging.current = true; blockSelectionAnchor.current = editor.dataset.graphoBlockId; selectBlockRange(editor.dataset.graphoBlockId, event.shiftKey); }} onMouseOver={(event) => { if (!blockSelectionDragging.current) return; const editor = (event.target as HTMLElement).closest<HTMLElement>("[data-grapho-block-id]"); if (editor?.dataset.graphoBlockId) selectBlockRange(editor.dataset.graphoBlockId); }} onKeyDown={(event) => { if (event.key !== "Escape") return; if (selectedBlockIds.size) { event.preventDefault(); setSelectedBlockIds(new Set()); paintBlockSelection(new Set()); } }}>
          <div style={{ ...(editorFont === "Mono" ? { fontFamily: "var(--grapho-font-mono)" } : editorFont === "Serif" ? { fontFamily: "Georgia, serif" } : {}), ...(editorSize === "Large" ? { fontSize: "18px" } : {}) }} className={`mx-auto ${editorWidth === "Wide" ? "max-w-6xl" : "max-w-4xl"} px-5 pb-32 pt-10 sm:px-12 sm:pt-14 lg:px-20 lg:pt-16 ${editorSpacing === "Compact" ? "[--grapho-leading-body:1.55]" : "[--grapho-leading-body:1.9]"}`}>
            <div className="grapho-document-meta mb-8 flex items-center justify-between text-[9px] text-[var(--grapho-faint)]"><div className="flex min-w-0 items-center gap-2"><span>{activeFolder}</span>{documentPath(selected).map((item, index) => <span key={`${item}-${index}`} className="flex min-w-0 items-center gap-2"><ChevronRight size={11} /><span className={index === documentPath(selected).length - 1 ? "truncate text-[var(--grapho-muted)]" : "truncate"}>{item}</span></span>)}</div><div className="grapho-document-stats flex items-center gap-2"><span>{selected.blocks.reduce((count, block) => count + block.text.trim().split(/\s+/).filter(Boolean).length, 0)} words</span><i /> <span>{visibleBlocks(selected).length} blocks</span><i /> <span>{selected.updated}</span></div></div>{backlinks.length > 0 && <div className="mb-8 rounded-xl border border-[var(--grapho-border)] bg-[var(--grapho-control)]/40 px-3 py-2.5"><div className="flex items-center gap-2 text-[8px] uppercase tracking-[.14em] text-[var(--grapho-faint)]"><Link2 size={12} /> Referenced by</div><div className="mt-2 flex flex-wrap gap-1.5">{backlinks.map((backlink) => <button key={`${backlink.documentId}-${backlink.blockId}`} type="button" onClick={() => setSelectedId(backlink.documentId)} className="rounded-lg bg-[var(--grapho-control)] px-2.5 py-1.5 text-[9px] text-[var(--grapho-muted)] hover:bg-[var(--grapho-control-hover)] hover:text-[var(--grapho-foreground)]">{documents.find((document) => document.id === backlink.documentId)?.title ?? "Document"}</button>)}</div></div>}
            {false && productionOpen && <ProductionView blocks={selected.blocks} title={selected.title} onClose={() => setProductionOpen(false)} />}
            {false && intelligenceOpen && <DocumentIntelligencePanel result={intelligence} onShowProposed={() => { setAccountFilter("proposed"); setAccountView("register"); setIntelligenceOpen(false); }} onDuplicateCheck={() => setToast("Duplicate check: no duplicate account addresses found")} onOpenProduction={() => { setProductionOpen(true); setIntelligenceOpen(false); }} onCopyEmails={() => { const emails = [...selected.blocks].flatMap((block) => block.text.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g) ?? []); navigator.clipboard?.writeText([...new Set(emails)].join("\n")); setToast(`${new Set(emails).size} email addresses copied`); }} />}
            <article className="relative min-h-[620px]" onDragOver={(event) => event.preventDefault()} onDrop={handleMarkdownDrop} onMouseUp={handleCanvasSelection} onClick={(event) => { if (event.target === event.currentTarget) { const last = event.currentTarget.querySelector<HTMLElement>("[data-grapho-block]:last-of-type"); last?.focus(); } }}>
              <div className="mb-10"><div className="grapho-label grapho-print-hide mb-3 text-[9px] uppercase text-[var(--grapho-faint)]">Document · Markdown compatible</div><EditableDocumentTitle value={selected.title} onChange={updateTitle} /><p className="grapho-print-hide mt-4 text-[10px] leading-5 text-[var(--grapho-muted)]">A calm, local-first place for ideas, notes, and long-form writing.</p></div>
              {false && accountRegister && <div className="grapho-account-context grapho-print-hide"><span>{accountRegister!.total} accounts</span><i /> <span>{accountRegister!.created} created</span><i /> <span>{accountRegister!.proposed} proposed</span><div className="grapho-account-view-toggle" role="group" aria-label="Account register view"><button type="button" className={accountView === "document" ? "is-active" : ""} onClick={() => setAccountView("document")}>Document</button><button type="button" className={accountView === "register" ? "is-active" : ""} onClick={() => setAccountView("register")}>Register</button></div></div>}

              {false && accountRegister && accountView === "register" ? <AccountRegisterView blocks={selected.blocks} filter={accountFilter} query={accountQuery} onFilterChange={setAccountFilter} onQueryChange={setAccountQuery} /> : <div className="space-y-4">{normalizeTableBlocks(visibleBlocks(selected)).filter((block, index) => !(index === 0 && block.type === "heading" && block.text.trim() === selected.title.trim())).map((block, blockIndex) => <div key={block.id} data-grapho-block-wrapper draggable={false} onDragOver={(event) => { event.preventDefault(); setDropTargetBlockId(block.id); }} onDrop={(event) => { event.preventDefault(); dropBlock(block.id); }} className={`group relative rounded-lg border-t-2 transition-colors ${dropTargetBlockId === block.id ? "border-[var(--grapho-accent)]" : "border-transparent"} ${selectedBlockId === block.id ? "bg-[var(--grapho-accent-soft)] ring-1 ring-[var(--grapho-accent)]/30" : ""}`}><EditorBlock block={block} orderedIndex={block.type === "ordered-list" ? selected.blocks.slice(0, blockIndex).filter((item) => item.type === "ordered-list").length + 1 : undefined} onChange={(text, content) => updateBlock(block.id, text, content)} onToggle={() => setBlockChecked(block.id, !block.checked)} onCollapse={(collapsed) => setBlockCollapsed(block.id, collapsed)} onKeyDown={(event) => handleBlockKeyDown(event, block)} onPaste={(event) => { event.preventDefault(); pasteBlocks(block.id, event.clipboardData.getData("text/plain")); }} /><div data-grapho-block-margin aria-hidden="true" className="absolute -left-10 top-0 h-full w-8 cursor-default" /><div className="pointer-events-none absolute -left-10 top-1 hidden items-center gap-1 text-[var(--grapho-faint)] group-hover:flex group-focus-within:flex"><button type="button" draggable onDragStart={(event) => { event.stopPropagation(); setDraggingBlockId(block.id); setSelectedBlockId(block.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", block.id); }} onDragEnd={() => { setDraggingBlockId(null); setDropTargetBlockId(null); }} onClick={(event) => { event.stopPropagation(); setSelectedBlockId(block.id); setSelectionToolbar(null); }} aria-label="Drag or select block" title="Drag block to reorder" className="pointer-events-auto grid size-6 cursor-grab place-items-center rounded-md hover:bg-[var(--grapho-control)] active:cursor-grabbing"><GripVertical size={13} /></button><button type="button" onClick={() => setCommandBlockId(block.id)} aria-label="Open block menu" className="pointer-events-auto grid size-6 place-items-center rounded-md hover:bg-[var(--grapho-control)]"><Plus size={13} /></button></div>{commandBlockId === block.id && <BlockCommandMenu onSelect={(type) => changeBlockType(block.id, type)} onDismiss={() => setCommandBlockId(null)} />}</div>)}</div>}

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

        <motion.div initial={{ opacity: 0, y: 18, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 360, damping: 28 }} className="grapho-editor-insert-toolbar grapho-workspace-layer fixed bottom-4 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl border border-[var(--grapho-border)] bg-[var(--grapho-panel)] p-1.5 shadow-2xl backdrop-blur-xl [scrollbar-width:none]">
          <span className="mx-2 flex shrink-0 items-center gap-1.5 text-[8px] text-[var(--grapho-faint)]" role="status" aria-live="polite"><span className={`size-1.5 rounded-full ${saveState === "saved" ? "bg-emerald-500" : saveState === "saving" ? "bg-amber-500" : "bg-red-500"}`} />{saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving…" : <><span>Could not save</span><button type="button" onClick={saveNow} className="ml-1 text-[var(--grapho-accent)] hover:underline">Retry</button></>}</span>
          <span className="mx-1 h-5 w-px shrink-0 bg-[var(--grapho-border)]" />
          <ToolbarButton label="Heading" icon={<Hash size={16} />} onClick={() => addBlockAfter(selected.blocks[selected.blocks.length - 1].id, "heading")} />
          <ToolbarButton label="Quote" icon={<Quote size={16} />} onClick={() => addBlockAfter(selected.blocks[selected.blocks.length - 1].id, "quote")} />
          <ToolbarButton label="Code block" icon={<Type size={16} />} onClick={() => addBlockAfter(selected.blocks[selected.blocks.length - 1].id, "code")} />
          <ToolbarButton label="Bulleted list" icon={<List size={16} />} onClick={() => addBlockAfter(selected.blocks[selected.blocks.length - 1].id, "list")} />
          <span className="mx-1 h-5 w-px shrink-0 bg-[var(--grapho-border)]" />
          <ToolbarButton label="Insert document link" icon={<Link2 size={16} />} onClick={insertDocumentLink} />
          <ToolbarButton label="Insert image" icon={<ImageIcon size={16} />} />
          <ToolbarButton label="Insert table" icon={<Table2 size={16} />} onClick={() => addBlockAfter(selected.blocks[selected.blocks.length - 1].id, "table", "| Column 1 | Column 2 |\n| --- | --- |\n| | |\n")} />

          <ToolbarButton label="Clear document" icon={<Trash2 size={16} />} onClick={clearDocument} danger />

          <ToolbarButton label="Export JSON backup" icon={<FileJson size={16} />} onClick={exportBackup} />
          <ToolbarButton label="Import Markdown" icon={<FileText size={16} />} onClick={() => markdownInput.current?.click()} disabled={busyAction !== null} />
                    <ToolbarButton label="Import JSON backup" icon={<FolderOpen size={16} />} onClick={() => backupInput.current?.click()} disabled={busyAction !== null} />
          <ToolbarButton label="Reset local data" icon={<X size={16} />} onClick={resetLocalData} danger disabled={busyAction !== null} />
        </motion.div>

        <AnimatePresence>{desktopOnboardingOpen && <motion.div className="grapho-modal-backdrop fixed inset-0 z-[110] grid place-items-center bg-black/35 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.section role="dialog" aria-modal="true" aria-labelledby="desktop-onboarding-title" className="grapho-dialog grapho-glass w-full max-w-xl overflow-hidden rounded-3xl p-2" initial={{ opacity: 0, y: 14, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }}><header className="border-b border-[var(--grapho-border)] px-5 py-5"><div className="text-[9px] uppercase tracking-[.18em] text-[var(--grapho-faint)]">Grapho desktop</div><h2 id="desktop-onboarding-title" className="mt-2 text-2xl font-semibold tracking-[-.06em]">A quiet place to finish documents.</h2><p className="mt-2 max-w-md text-[11px] leading-5 text-[var(--grapho-muted)]">Everything stays close to the writing: your library, your canvas, and the tools that help a document leave well.</p></header><div className="grid gap-2 px-5 py-5 sm:grid-cols-3"><OnboardingStep number="01" title="Library" text="Keep projects, folders, and documents in one local workspace." /><OnboardingStep number="02" title="Canvas" text="Write in blocks. Press / to choose structure as you go." /><OnboardingStep number="03" title="Finish" text="Use the rail to style, export, and switch themes." /></div><footer className="-mx-2 -mb-2 flex items-center justify-between rounded-b-3xl border-t border-[var(--grapho-border)] bg-[var(--grapho-control)] px-7 py-3"><span className="text-[8px] text-[var(--grapho-faint)]">You can reopen the guide from the ? icon.</span><button type="button" onClick={finishDesktopOnboarding} className="rounded-xl bg-[var(--grapho-foreground)] px-3.5 py-2.5 text-[10px] text-[var(--grapho-background)]">Start writing</button></footer></motion.section></motion.div>}</AnimatePresence>

        <AnimatePresence>{firstRunGuideOpen && <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="grapho-first-run-guide fixed right-20 top-4 z-[70] w-[min(280px,calc(100vw-6rem))] rounded-2xl border border-[var(--grapho-accent)]/40 bg-[var(--grapho-panel-solid)] p-4 shadow-2xl" role="status"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--grapho-accent)] text-[var(--grapho-background)]"><CircleHelp size={15} /></span><div><strong className="block text-[10px] text-[var(--grapho-foreground)]">Welcome to Grapho</strong><p className="mt-1.5 text-[9px] leading-4 text-[var(--grapho-muted)]">Use the rail to shape your document. Hover any icon for its name, or open the tool guide for the complete map.</p></div></div><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => { dismissFirstRunGuide(); setHelpOpen(true); }} className="rounded-lg bg-[var(--grapho-control)] px-2.5 py-1.5 text-[9px] text-[var(--grapho-muted)] hover:bg-[var(--grapho-control-hover)]">Open guide</button><button type="button" onClick={dismissFirstRunGuide} className="rounded-lg bg-[var(--grapho-foreground)] px-2.5 py-1.5 text-[9px] text-[var(--grapho-background)]">Got it</button></div></motion.div>}</AnimatePresence>

        <AnimatePresence>{styleOpen && <motion.aside initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="grapho-style-panel fixed right-4 top-20 z-[60] hidden max-h-[calc(100vh-6rem)] w-[min(280px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[var(--grapho-border)] bg-[var(--grapho-panel)] shadow-2xl backdrop-blur-xl xl:block"><div className="h-full w-full overflow-y-auto p-4 [scrollbar-width:none]"><div className="flex items-center justify-between text-[9px] uppercase tracking-[.16em] text-[var(--grapho-faint)]"><span>Document style</span><button type="button" onClick={() => setStyleOpen(false)} aria-label="Close style panel"><X size={13} /></button></div><div className="mt-5 text-[8px] uppercase tracking-[.16em] text-[var(--grapho-faint)]">Typography</div><StyleOption label="Body font" value={editorFont} onClick={() => setEditorFont((value) => value === "Sans" ? "Mono" : value === "Mono" ? "Serif" : "Sans")} /><StyleOption label="Body size" value={editorSize} onClick={() => setEditorSize((value) => value === "Standard" ? "Large" : "Standard")} /><StyleOption label="Width" value={editorWidth} onClick={() => setEditorWidth((value) => value === "Readable" ? "Wide" : "Readable")} /><StyleOption label="Spacing" value={editorSpacing} onClick={() => setEditorSpacing((value) => value === "Relaxed" ? "Compact" : "Relaxed")} /><div className="mt-5 text-[8px] uppercase tracking-[.16em] text-[var(--grapho-faint)]">Appearance</div><StyleOption label="Page" value={pageSurface} onClick={() => setPageSurface((value) => value === "Warm white" ? "Soft gray" : "Warm white")} /><StyleOption label="Accent" value={accentStyle} onClick={() => setAccentStyle((value) => value === "Forest Green" ? "Muted Ink" : "Forest Green")} /><StyleOption label="Grid" value={gridStyle} onClick={() => setGridStyle((value) => value === "Subtle" ? "Off" : "Subtle")} /><div className="mt-5 border-t border-[var(--grapho-border)] pt-4"><div className="text-[8px] uppercase tracking-[.16em] text-[var(--grapho-faint)]">Document</div><div className="mt-3 grid grid-cols-2 gap-2"><InfoStat label="Blocks" value={String(selected.blocks.length)} /><InfoStat label="Words" value={String(selected.blocks.reduce((count, block) => count + block.text.trim().split(/\\s+/).filter(Boolean).length, 0))} /><InfoStat label="Storage" value={`${Math.round(getGraphoStorageDiagnostics().bytes / 1024)} KB`} /></div></div><div className="mt-5 border-t border-[var(--grapho-border)] pt-4"><div className="text-[8px] uppercase tracking-[.16em] text-[var(--grapho-faint)]">Export</div><button type="button" onClick={exportPdf} className="mt-3 flex h-10 w-full items-center justify-between rounded-xl bg-[var(--grapho-control)] px-3 text-[10px] text-[var(--grapho-muted)] hover:bg-[var(--grapho-control-hover)]"><span className="flex items-center gap-2"><FileDown size={13} /> Export PDF</span><ChevronDown size={12} /></button><button type="button" onClick={exportMarkdown} disabled={busyAction !== null} className="mt-2 flex h-10 w-full items-center justify-between rounded-xl bg-[var(--grapho-control)] px-3 text-[10px] text-[var(--grapho-muted)] hover:bg-[var(--grapho-control-hover)] disabled:cursor-not-allowed disabled:opacity-40"><span className="flex items-center gap-2"><FileText size={13} /> Export Markdown</span><ChevronDown size={12} /></button></div></div></motion.aside>}</AnimatePresence>
      </div>
      <MobileActionBar sidebarOpen={sidebarOpen} onToggleSidebar={() => { setStyleOpen(false); setSidebarOpen((value) => !value); }} onNewDocument={() => { createDocument(); setSidebarOpen(false); setStyleOpen(false); }} onFocusEditor={() => { setSidebarOpen(false); setStyleOpen(false); }} onExportPdf={exportPdf} onOpenStyle={() => { setSidebarOpen(false); setStyleOpen(true); }} disabled={busyAction !== null} />
      <AnimatePresence>
        {workspaceDialogOpen && <motion.div className="grapho-modal-backdrop fixed inset-0 z-[120] grid place-items-center bg-black/35 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setWorkspaceDialogOpen(false); }}><motion.section role="dialog" aria-modal="true" aria-labelledby="create-workspace-title" className="grapho-dialog grapho-glass w-full max-w-lg overflow-hidden rounded-2xl p-2" initial={{ opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}><div className="flex items-start justify-between border-b border-[var(--grapho-border)] px-3 py-3"><div><div className="text-[9px] uppercase tracking-[.18em] text-[var(--grapho-faint)]">Workspace</div><h2 id="create-workspace-title" className="mt-1 text-base font-semibold tracking-[-.03em]">New workspace</h2></div><button type="button" onClick={() => setWorkspaceDialogOpen(false)} aria-label="Close create workspace dialog" className="grid size-8 place-items-center rounded-xl text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]"><X size={15} /></button></div><input autoFocus value={workspaceDraft} onChange={(event) => setWorkspaceDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") createWorkspace(); if (event.key === "Escape") setWorkspaceDialogOpen(false); }} aria-label="Workspace name" placeholder="Workspace name" className="mx-3 mt-4 h-10 w-[calc(100%-1.5rem)] rounded-xl border border-[var(--grapho-border)] bg-[var(--grapho-control)] px-3 text-[11px] text-[var(--grapho-foreground)] outline-none focus:border-[var(--grapho-accent)]" /><div className="flex justify-end gap-2 px-3 py-3"><button type="button" onClick={() => setWorkspaceDialogOpen(false)} className="rounded-xl px-4 py-2.5 text-[11px] text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]">Cancel</button><button type="button" onClick={createWorkspace} disabled={!workspaceDraft.trim()} className="rounded-xl bg-[var(--grapho-foreground)] px-4 py-2.5 text-[11px] text-[var(--grapho-background)] disabled:cursor-not-allowed disabled:opacity-40">Create workspace</button></div></motion.section></motion.div>}
        {workspaceRenameTarget && <motion.div className="grapho-modal-backdrop fixed inset-0 z-[120] grid place-items-center bg-black/35 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setWorkspaceRenameTarget(null); }}><motion.section role="dialog" aria-modal="true" aria-labelledby="rename-workspace-title" className="grapho-dialog grapho-glass w-full max-w-lg overflow-hidden rounded-2xl p-2" initial={{ opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}><div className="flex items-start justify-between border-b border-[var(--grapho-border)] px-3 py-3"><div><div className="text-[9px] uppercase tracking-[.18em] text-[var(--grapho-faint)]">Workspace</div><h2 id="rename-workspace-title" className="mt-1 text-base font-semibold tracking-[-.03em]">Rename workspace</h2></div><button type="button" onClick={() => setWorkspaceRenameTarget(null)} aria-label="Close rename workspace dialog" className="grid size-8 place-items-center rounded-xl text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]"><X size={15} /></button></div><input autoFocus value={workspaceRenameDraft} onChange={(event) => setWorkspaceRenameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") commitWorkspaceRename(); if (event.key === "Escape") setWorkspaceRenameTarget(null); }} aria-label="Workspace name" className="grapho-rename-input mx-3 mt-4 h-10 w-[calc(100%-1.5rem)] rounded-xl border border-[var(--grapho-border)] bg-[var(--grapho-control)] px-3 text-[11px] text-[var(--grapho-foreground)] outline-none" /><div className="flex justify-end gap-2 px-3 py-3"><button type="button" onClick={() => setWorkspaceRenameTarget(null)} className="rounded-xl px-4 py-2.5 text-[11px] text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]">Cancel</button><button type="button" onClick={commitWorkspaceRename} disabled={!workspaceRenameDraft.trim()} className="rounded-xl bg-[var(--grapho-foreground)] px-4 py-2.5 text-[11px] text-[var(--grapho-background)] disabled:cursor-not-allowed disabled:opacity-40">Save name</button></div></motion.section></motion.div>}
        {toast && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="fixed bottom-20 left-1/2 z-[130] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-[var(--grapho-border)] bg-[var(--grapho-panel-solid)] px-4 py-2.5 text-[10px] text-[var(--grapho-foreground)] shadow-xl" role="status" aria-live="polite"><span className={busyAction ? "size-3 animate-spin rounded-full border-2 border-[var(--grapho-faint)] border-t-[var(--grapho-foreground)]" : "hidden"} aria-hidden="true" />{toast}{!busyAction && <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification" className="ml-1 text-[var(--grapho-faint)]">×</button>}</motion.div>}
        {deleteTarget && <motion.div className="grapho-modal-backdrop fixed inset-0 z-[120] grid place-items-center bg-black/35 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (!deleting && event.target === event.currentTarget) setDeleteTarget(null); }}><motion.section role="dialog" aria-modal="true" aria-labelledby="delete-document-title" aria-busy={deleting} className="grapho-dialog grapho-glass w-full max-w-lg overflow-hidden rounded-2xl p-2"><div className="px-3 py-3 text-[9px] uppercase tracking-[.18em] text-[var(--grapho-faint)]">Workspace</div><h2 id="delete-document-title" className="border-t border-[var(--grapho-border)] px-3 pt-4 text-base font-semibold tracking-[-.03em]">Delete document?</h2><p className="px-3 pt-2 text-[10px] leading-5 text-[var(--grapho-muted)]">“{deleteTarget.title}” will be removed from this workspace.</p><div className="flex justify-end gap-2 px-3 py-3"><button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-xl px-4 py-2.5 text-[11px] text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)] disabled:cursor-not-allowed disabled:opacity-40">Cancel</button><button type="button" onClick={commitDelete} disabled={deleting} className="flex min-w-[132px] items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-[11px] text-white transition-opacity disabled:cursor-wait disabled:opacity-70"><span className={deleting ? "size-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" : "hidden"} aria-hidden="true" />{deleting ? "Deleting…" : "Delete document"}</button></div></motion.section></motion.div>}
        {renameTarget && <motion.div className="grapho-modal-backdrop fixed inset-0 z-[120] grid place-items-center bg-black/35 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setRenameTarget(null); }}>
          <motion.section role="dialog" aria-modal="true" aria-labelledby="rename-document-title" initial={{ opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="grapho-dialog grapho-glass w-full max-w-lg overflow-hidden rounded-2xl p-2">
            <div className="flex items-start justify-between border-b border-[var(--grapho-border)] px-3 py-3"><div><div className="text-[9px] uppercase tracking-[.18em] text-[var(--grapho-faint)]">Document</div><h2 id="rename-document-title" className="mt-1 text-base font-semibold tracking-[-.03em]">Rename document</h2></div><button type="button" onClick={() => setRenameTarget(null)} aria-label="Close rename dialog" className="grid size-8 place-items-center rounded-xl text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]"><X size={15} /></button></div>
            <input autoFocus value={renameDraft} onChange={(event) => setRenameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") commitRename(); if (event.key === "Escape") setRenameTarget(null); }} aria-label="Document name" className="grapho-rename-input mx-3 mt-4 h-10 w-[calc(100%-1.5rem)] rounded-xl border border-[var(--grapho-border)] bg-[var(--grapho-control)] px-3 text-[11px] text-[var(--grapho-foreground)] outline-none" />
            <div className="flex justify-end gap-2 px-3 py-3"><button type="button" onClick={() => setRenameTarget(null)} className="rounded-xl px-4 py-2.5 text-[11px] text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]">Cancel</button><button type="button" onClick={commitRename} className="rounded-xl bg-[var(--grapho-foreground)] px-4 py-2.5 text-[11px] text-[var(--grapho-background)]">Save name</button></div>
          </motion.section>
        </motion.div>}
        {paletteOpen && <motion.div className="grapho-modal-backdrop fixed inset-0 z-[110] grid place-items-center bg-black/35 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setPaletteOpen(false); }}>
          <motion.section role="dialog" aria-modal="true" aria-label="Command palette" initial={{ opacity: 0, y: 14, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .98 }} className="grapho-glass w-full max-w-lg overflow-hidden rounded-2xl p-2">
            <div className="flex items-center gap-3 border-b border-[var(--grapho-border)] px-3 py-3"><Search size={16} className="text-[var(--grapho-faint)]" /><input autoFocus aria-label="Command palette search" placeholder="Search commands…" className="grapho-command-input min-w-0 flex-1 border-0 bg-transparent text-sm text-[var(--grapho-foreground)] outline-none ring-0 placeholder:text-[var(--grapho-faint)]" /><kbd className="rounded-md border border-[var(--grapho-border)] px-1.5 py-1 text-[9px] text-[var(--grapho-faint)]">ESC</kbd></div>
            <div className="p-2"><PaletteAction icon={<Plus size={15} />} label="New document" hint="Create a document in the current folder" onClick={() => { createDocument(); setPaletteOpen(false); }} /><PaletteAction icon={<Search size={15} />} label="Search documents" hint="Find documents and content" onClick={() => { setSidebarOpen(true); setPaletteOpen(false); }} /><PaletteAction icon={<SlidersHorizontal size={15} />} label="Workspace tools" hint="Open document and export tools" onClick={() => { setStyleOpen(true); setPaletteOpen(false); }} /><PaletteAction icon={<Sun size={15} />} label="Toggle theme" hint="Switch between light and dark mode" onClick={() => { setTheme((value) => value === "dark" ? "light" : "dark"); setPaletteOpen(false); }} /><PaletteAction icon={<CircleHelp size={15} />} label="Help and shortcuts" hint="View keyboard shortcuts" onClick={() => { setHelpTab("shortcuts"); setHelpOpen(true); setPaletteOpen(false); }} /></div>
          </motion.section>
        </motion.div>}
        {helpOpen && <motion.div className="grapho-modal-backdrop fixed inset-0 z-[100] grid place-items-center bg-black/35 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setHelpOpen(false); }}>
          <motion.section role="dialog" aria-modal="true" aria-labelledby="grapho-help-title" initial={{ opacity: 0, y: 18, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .97 }} transition={{ type: "spring", stiffness: 360, damping: 28 }} className="grapho-dialog grapho-glass w-full max-w-lg overflow-hidden rounded-2xl p-2">
            <header className="flex items-start justify-between border-b border-[var(--grapho-border)] px-3 py-3"><div><div className="text-[9px] uppercase tracking-[.18em] text-[var(--grapho-faint)]">Grapho workspace</div><h2 id="grapho-help-title" className="mt-1 text-base font-semibold tracking-[-.03em]">Workspace guide</h2><p className="mt-2 text-[12px] leading-5 text-[var(--grapho-muted)]">A quick reference for the tools around your writing canvas.</p></div><button type="button" onClick={() => setHelpOpen(false)} aria-label="Close help" className="grid size-9 place-items-center rounded-xl text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]"><X size={15} /></button></header>
            <div className="flex gap-1 border-b border-[var(--grapho-border)] px-3 py-2" role="tablist" aria-label="Guide sections"><button type="button" role="tab" aria-selected={helpTab === "tools"} onClick={() => setHelpTab("tools")} className={`rounded-lg px-3 py-2 text-[9px] ${helpTab === "tools" ? "bg-[var(--grapho-control-hover)] text-[var(--grapho-foreground)]" : "text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]"}`}>Tool guide</button><button type="button" role="tab" aria-selected={helpTab === "shortcuts"} onClick={() => setHelpTab("shortcuts")} className={`rounded-lg px-3 py-2 text-[9px] ${helpTab === "shortcuts" ? "bg-[var(--grapho-control-hover)] text-[var(--grapho-foreground)]" : "text-[var(--grapho-muted)] hover:bg-[var(--grapho-control)]"}`}>Shortcuts</button></div>
            <div className="max-h-[min(62vh,520px)] overflow-y-auto"><div className={helpTab === "tools" ? "grapho-tool-guide-list grid gap-2 px-3 py-4" : "hidden"}><ToolGuideItem icon={<Menu size={14} />} name="Library rail" use="Show or hide your document library." /><ToolGuideItem icon={<SlidersHorizontal size={14} />} name="Workspace tools" use="Adjust document style and export." /><ToolGuideItem icon={<Undo2 size={14} />} name="Undo / Redo" use="Move backward or forward through edits." /><ToolGuideItem icon={<FileText size={14} />} name="Document export" use="Save Markdown, HTML, or plain text." /><ToolGuideItem icon={<Sun size={14} />} name="Theme" use="Switch between light and dark mode." /></div><div className={helpTab === "shortcuts" ? "grid gap-5 px-3 py-5 sm:grid-cols-2" : "hidden"}><ShortcutGroup title="Writing" items={[["Enter", "New block"], ["Backspace", "Remove empty block"], ["/", "Open block menu"], ["Shift + Enter", "New line"]]} /><ShortcutGroup title="Formatting" items={[["Select text", "Open formatting toolbar"], ["⌘ / Ctrl + B", "Bold selection"], ["⌘ / Ctrl + I", "Italic selection"], ["Delete", "Delete selected block"]]} /><ShortcutGroup title="Markdown" items={[["# + Space", "Heading"], ["> + Space", "Quote"], ["- + Space", "Bulleted list"], ["1. + Space", "Numbered list"]]} /><ShortcutGroup title="Workspace" items={[["Click handle", "Select a block"], ["PDF", "Print canvas to PDF"], ["T", "Open document style"], ["Mod + Shift + W", "New workspace"], ["Esc", "Close menus"]]} /></div></div>
            <footer className="flex items-center justify-between border-t border-[var(--grapho-border)] bg-[var(--grapho-control)] px-3 py-3 text-[8px] text-[var(--grapho-faint)]"><span className="flex items-center gap-3"><span>Local-first · no account required</span><span className="flex gap-2"><a href="/documentation" className="underline underline-offset-2">Docs</a><a href="/privacy" className="underline underline-offset-2">Privacy</a><a href="/terms" className="underline underline-offset-2">Terms</a></span></span><button type="button" onClick={() => setHelpOpen(false)} className="rounded-lg px-2.5 py-1.5 text-[var(--grapho-muted)] hover:bg-[var(--grapho-control-hover)]">Done</button></footer>
          </motion.section>
        </motion.div>}
      </AnimatePresence>
      <input ref={markdownInput} type="file" accept="text/markdown,.md,text/plain" onChange={importMarkdown} className="hidden" aria-label="Import Markdown file" />
      <input ref={backupInput} type="file" accept="application/json,.json" onChange={importBackup} className="hidden" aria-label="Import JSON backup" />
      <div className="grapho-print-header" aria-hidden="true"><span>Grapho</span><strong>{selected.title}</strong></div>
      <div className="grapho-print-footer" aria-hidden="true"><span>{activeFolder}</span><span>Grapho document</span></div>
      <div className="grapho-print-page-number" aria-hidden="true">Page <span /></div>
      <div className="grapho-print-branding" aria-hidden="true">Grapho</div>
    </div>
  );
}

function normalizeTableBlocks(blocks: Block[]): Block[] {
  const normalized: Block[] = [];
  let index = 0;
  while (index < blocks.length) {
    const first = blocks[index];
    const second = blocks[index + 1];
    const isRow = (block?: Block) => Boolean(block && block.type === "paragraph" && /^\s*\|/.test(block.text));
    const isSeparator = (block?: Block) => Boolean(block && isRow(block) && block!.text.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").every((cell) => /^\s*:?-{3,}:?\s*$/.test(cell)));
    if (isRow(first) && isSeparator(second)) {
      const rows: Block[] = [];
      while (isRow(blocks[index])) rows.push(blocks[index++]);
      normalized.push({ id: first.id, type: "table", text: rows.filter((row) => !isSeparator(row)).map((row) => row.text.trim()).join("\n") });
      continue;
    }
    normalized.push(first);
    index += 1;
  }
  return normalized;
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
    const isTableRow = (value: string) => /^\s*\|/.test(value.trim());
    const isTableSeparator = (value: string) => isTableRow(value) && value.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").every((cell) => /^\s*:?-{3,}:?\s*$/.test(cell));
    if (index + 1 < lines.length && isTableRow(line) && isTableSeparator(lines[index + 1])) {
      const rows: string[] = [];
      while (index < lines.length && isTableRow(lines[index])) {
        const row = lines[index].trim();
        if (!isTableSeparator(row)) rows.push(row);
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
  const title = document.title.trim() || "Untitled document";
  const blocks = document.blocks.length ? document.blocks : [{ id: "empty", type: "paragraph" as const, text: "" }];
  return [`# ${title}`, "", ...blocks.map((block) => {
    if (block.type === "heading") return `## ${block.text}`;
    if (block.type === "quote") return `> ${block.text}`;
    if (block.type === "list") return block.text.split("\\n").map((line) => `- ${line}`).join("\\n");
    if (block.type === "ordered-list") return block.text.split("\\n").map((line, index) => `${index + 1}. ${line}`).join("\\n");
    if (block.type === "code") return "```\\n" + block.text + "\\n```";
    if (block.type === "divider") return "---";
    if (block.type === "page-break") return "\\n<!-- page break -->\\n";
    return block.text;
  })].join("\\n\\n");
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

function documentToPlainText(document: DocumentItem) {
  return [document.title.trim() || "Untitled document", ...document.blocks.map((block) => {
    if (block.type === "divider") return "--------------------";
    if (block.type === "page-break") return "\\n[Page break]\\n";
    if (block.type === "todo") return `${block.checked ? "[x]" : "[ ]"} ${block.text}`;
    if (block.type === "list") return block.text.split("\\n").map((line) => `• ${line}`).join("\\n");
    if (block.type === "ordered-list") return block.text.split("\\n").map((line, index) => `${index + 1}. ${line}`).join("\\n");
    return block.text;
  })].join("\\n\\n");
}

function documentToHtml(document: DocumentItem) {
  const title = escapeHtml(document.title.trim() || "Untitled document");
  const body = document.blocks.map((block) => {
    const text = escapeHtml(block.text).replace(/\\n/g, "<br>");
    if (block.type === "heading") return `<h2>${text}</h2>`;
    if (block.type === "quote") return `<blockquote>${text}</blockquote>`;
    if (block.type === "list") return `<ul>${block.text.split("\\n").map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`;
    if (block.type === "ordered-list") return `<ol>${block.text.split("\\n").map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ol>`;
    if (block.type === "todo") return `<p class=\"todo\">${block.checked ? "☑" : "☐"} ${text}</p>`;
    if (block.type === "toggle") return `<details${block.collapsed ? "" : " open"}><summary>${text}</summary></details>`;
    if (block.type === "callout") return `<aside>${text}</aside>`;
    if (block.type === "code") return `<pre><code>${text}</code></pre>`;
    if (block.type === "divider") return "<hr>";
    if (block.type === "page-break") return `<div class=\"grapho-page-break\" aria-label=\"Page break\"></div>`;
    if (block.type === "table") return markdownTableToHtml(block.text);
    return `<p>${text}</p>`;
  }).join("\\n");
  return `<!doctype html><html><head><meta charset=\"utf-8\"><title>${title}</title><style>body{max-width:760px;margin:48px auto;padding:0 24px;font:16px/1.7 system-ui,sans-serif;color:#1d232a}h1{line-height:1.15}blockquote,aside{border-left:3px solid #6ba587;padding:8px 16px;background:#f0f6f2}pre{padding:16px;background:#f3f4f6;overflow:auto}table{width:100%;border-collapse:collapse;margin:20px 0;font-size:13px}th,td{border:1px solid #d4d4d8;padding:8px 10px;text-align:left;vertical-align:top}th{background:#f3f4f6;font-weight:600}li{margin:4px 0}</style></head><body><h1>${title}</h1>${body}</body></html>`;
}

type AccountRegisterStats = { total: number; created: number; proposed: number };

function detectAccountRegister(document: DocumentItem): AccountRegisterStats | null {
  const text = document.blocks.map((block) => block.text).join("\n");
  if (!/(?:mailbox|account)/i.test(document.title + "\n" + text) || !/Division:/i.test(text) || !/Status:/i.test(text) || !/Purpose:/i.test(text)) return null;
  const total = (text.match(/^\s*\d+[.)]\s+/gm) ?? []).length;
  if (!total) return null;
  return { total, created: (text.match(/Status:\s*Created/gi) ?? []).length, proposed: (text.match(/Status:\s*Proposed/gi) ?? []).length };
}

function cleanMarkdown(value: string) {
  return value.replace(/\[([^\]]+)\]\((?:mailto:)?[^)]+\)/gi, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/__([^_]+)__/g, "$1").replace(/_([^_]+)_/g, "$1");
}

function ProductionView({ blocks, title, onClose }: { blocks: Block[]; title: string; onClose: () => void }) {
  const lines = blocks.flatMap((block) => blockTextForProduction(block).split("\n")).filter(Boolean);
  const words = lines.join(" ").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 145));
  return <section className="grapho-production-view" aria-label="Production view"><div className="grapho-production-head"><div><span className="grapho-label">Production view</span><h2>{title}</h2><p>{words} words · approximately {minutes} min at documentary pace</p></div><button type="button" onClick={onClose} aria-label="Close production view">Close</button></div><div className="grapho-production-script">{lines.map((line, index) => <p key={`${line}-${index}`} className={index === 0 ? "is-opening" : ""}>{line}</p>)}</div></section>;
}

function blockTextForProduction(block: Block) { return block.content?.length ? block.content.map((span) => span.text).join("") : block.text; }

function DocumentIntelligencePanel({ result, onShowProposed, onCopyEmails, onDuplicateCheck, onOpenProduction }: { result: ReturnType<typeof analyzeDocument>; onShowProposed: () => void; onCopyEmails: () => void; onDuplicateCheck: () => void; onOpenProduction: () => void }) {
  const typeLabel = result.type === "generic" ? "Document actions" : `${result.type.replace(/-/g, " ")} actions`;
  const isAccount = result.type === "account-register";
  const isVoiceover = result.type === "voiceover-script";
  const wordCount = result.recognizedFields.length;
  return <aside className="grapho-intelligence-panel" aria-label="Smart document actions"><div className="grapho-intelligence-head"><div><span className="grapho-label">Smart document actions</span><strong>{typeLabel}</strong></div><span>{result.recognizedFields.length} fields found</span></div><div className="grapho-action-list">{isAccount && <><button type="button" onClick={onCopyEmails}>Copy all email addresses</button><button type="button" onClick={onShowProposed}>Show only proposed accounts</button><button type="button" onClick={onDuplicateCheck}>Check for duplicates</button></>}{isVoiceover && <><div className="grapho-production-stat"><b>{wordCount}</b><span>recognized fields</span></div><div className="grapho-production-stat"><b>{Math.max(1, Math.ceil(wordCount / 2.3))} min</b><span>estimated runtime</span></div><button type="button" onClick={onOpenProduction}>Open production view</button></>}{!isAccount && !isVoiceover && <p className="grapho-intelligence-clear">No specific actions available for this document yet.</p>}</div>{result.issues.length > 0 && <div className="grapho-intelligence-warning"><span>Needs attention</span><p>{result.issues.map((issue) => issue.title).join(" · ")}</p></div>}</aside>;
}

function AccountRegisterView({ blocks, filter, query, onFilterChange, onQueryChange }: { blocks: Block[]; filter: "all" | "created" | "proposed"; query: string; onFilterChange: (value: "all" | "created" | "proposed") => void; onQueryChange: (value: string) => void }) {
  const entries = blocks.map((block) => block.text).join("\n").split(/(?=^\s*\d+[.)]\s+)/m).filter((entry) => /^\s*\d+[.)]\s+/.test(entry));
  const visibleEntries = entries.filter((entry) => { const lower = entry.toLowerCase(); return (filter === "all" || lower.includes(`status: ${filter}`)) && (!query.trim() || lower.includes(query.toLowerCase().trim())); });
  return <div className="grapho-account-register-view"><div className="grapho-register-tools"><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search accounts" aria-label="Search accounts" /><div>{(["all", "created", "proposed"] as const).map((value) => <button type="button" key={value} className={filter === value ? "is-active" : ""} onClick={() => onFilterChange(value)}>{value}</button>)}</div></div>{visibleEntries.map((entry, index) => { const lines = entry.trim().split("\n"); const heading = lines.shift()?.replace(/^\d+[.)]\s+/, "") ?? "Account"; const fields = lines.join("\n"); const email = heading.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0]; const status = fields.match(/Status:\s*([^\n]+)/i)?.[1]?.trim() ?? ""; return <section className="grapho-account-record" key={`${heading}-${index}`}><div className="grapho-account-record-top"><span className="grapho-account-record-number">{String(index + 1).padStart(2, "0")}</span><strong>{heading.replace(/\s*\/\s*\[[^\]]+\]\([^)]*\)/, "")}</strong>{status && <span className={`grapho-account-status ${status.toLowerCase()}`}>{status}</span>}</div>{email && <a className="grapho-email-link" href={`mailto:${email}`}>{email}</a>}<div className="grapho-account-record-fields">{fields.split("\n").filter((line) => line.trim()).map((line) => <p key={line}>{renderInlineMarkdown(line)}</p>)}</div></section>;})}</div>;
}

function AccountRegisterSummary({ stats }: { stats: AccountRegisterStats }) {
  const progress = stats.total ? Math.round((stats.created / stats.total) * 100) : 0;
  return <aside className="grapho-account-summary grapho-print-hide" aria-label="Account register summary">
    <div className="grapho-account-summary-heading"><div><span className="grapho-label">Detected structure</span><strong>Account register</strong></div><span className="grapho-account-summary-count">{stats.total} records</span></div>
    <div className="grapho-account-summary-stats"><span><b>{stats.created}</b> created</span><span><b>{stats.proposed}</b> proposed</span><span><b>{progress}%</b> setup</span></div>
    <div className="grapho-account-progress" role="progressbar" aria-label={`${progress}% of accounts created`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div>
  </aside>;
}

function MarkdownTableBlock({ text }: { text: string }) {
  const rows = text.split("\n").filter(Boolean).map((row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()));
  const normalizedRows = rows.length ? rows : [["Column 1", "Column 2"], ["", ""]];
  const columns = Math.max(...normalizedRows.map((row) => row.length), 2);
  const paddedRows = normalizedRows.map((row) => [...row, ...Array.from({ length: columns - row.length }, () => "")]);
  const [widths, setWidths] = useState<number[]>(() => columns === 3 ? [36, 18, 46] : Array.from({ length: columns }, () => 100 / columns));
  const resizeColumn = (index: number, event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const table = event.currentTarget.closest("table");
    if (!table) return;
    const startX = event.clientX;
    const startWidths = widths;
    const tableWidth = table.getBoundingClientRect().width;
    const onMove = (moveEvent: PointerEvent) => {
      const delta = ((moveEvent.clientX - startX) / tableWidth) * 100;
      const next = [...startWidths];
      const minimum = 12;
      const left = Math.max(minimum, startWidths[index] + delta);
      const right = index + 1 < columns ? Math.max(minimum, startWidths[index + 1] - delta) : left;
      if (index + 1 < columns && left + right <= startWidths[index] + startWidths[index + 1]) { next[index] = left; next[index + 1] = right; setWidths(next); }
    };
    const onEnd = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onEnd); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd, { once: true });
  };
  return <div className="grapho-markdown-table my-4 overflow-x-auto rounded-2xl border border-[var(--grapho-border)] bg-[var(--grapho-control)]"><div className="grapho-table-heading"><div><span className="grapho-table-kicker">Structured table</span><strong>{paddedRows.length - 1} rows · {columns} columns</strong></div><span className="grapho-table-hint">Drag column dividers to resize</span></div><table className="w-full min-w-full table-fixed border-collapse text-left text-[11px] leading-5"><colgroup>{widths.map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup><thead><tr>{paddedRows[0].map((cell, index) => <th key={`${cell}-${index}`} className="relative border-b border-r border-[var(--grapho-border)] px-4 py-3 align-top font-semibold text-[var(--grapho-foreground)] break-words last:border-r-0">{renderInlineMarkdown(cell || `Column ${index + 1}`)}{index < columns - 1 && <button type="button" aria-label={`Resize column ${index + 1}`} title="Drag to resize column" onPointerDown={(event) => resizeColumn(index, event)} className="grapho-table-resize-handle absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize touch-none" />}</th>)}</tr></thead><tbody>{paddedRows.slice(1).map((row, rowIndex) => <tr key={rowIndex} className="border-b border-[var(--grapho-border)] last:border-0">{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className="break-words border-r border-[var(--grapho-border)] px-4 py-3 align-top text-[var(--grapho-muted)] last:border-r-0">{renderInlineMarkdown(cell || " ")}</td>)}</tr>)}</tbody></table></div>;
}

function markdownTableToHtml(value: string) {
  const rows = value.split("\n").filter(Boolean).map((row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()));
  if (!rows.length) return "";
  const header = rows[0].map((cell) => `<th>${escapeHtml(cell)}</th>`).join("");
  const body = rows.slice(1).filter((row) => !row.every((cell) => /^:?-{3,}:?$/.test(cell))).map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderInlineMarkdown(value: string) {
  const parts = value.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : part);
}

function EditorBlock({ block, orderedIndex, onChange, onToggle, onCollapse, onKeyDown, onPaste }: { block: Block; orderedIndex?: number; onChange: (text: string, content?: InlineText[]) => void; onToggle: () => void; onCollapse: (collapsed: boolean) => void; onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void; onPaste: (event: React.ClipboardEvent<HTMLDivElement>) => void }) {
  const editable = (className: string, label: string) => <EditableContent blockId={block.id} value={block.text} content={blockInlineContent(block)} label={label} className={className} onChange={onChange} onKeyDown={onKeyDown} onPaste={onPaste} />;

  if (block.type === "heading") return editable("text-3xl font-semibold leading-tight tracking-[-.06em] sm:text-4xl", "Heading block");
  if (block.type === "quote") return <div className="flex gap-3 border-l-2 border-[var(--grapho-accent)] bg-[var(--grapho-accent-soft)] px-4 py-3"><Quote size={15} className="mt-1 shrink-0 text-[var(--grapho-accent)]" />{editable("text-[15px] italic leading-7 text-[var(--grapho-muted)]", "Quote block")}</div>;
  if (block.type === "list") return <div className="flex gap-3"><div className="w-5 shrink-0 pt-1 text-[var(--grapho-faint)]">•</div>{editable("whitespace-pre-wrap text-[15px] leading-8 text-[var(--grapho-muted)]", "Bulleted list block")}</div>;
  if (block.type === "ordered-list") return <div className="flex gap-3"><div className="w-5 shrink-0 pt-1 text-right text-[var(--grapho-faint)]">{orderedIndex ?? 1}.</div>{editable("whitespace-pre-wrap text-[15px] leading-8 text-[var(--grapho-muted)]", "Numbered list block")}</div>;
  if (block.type === "todo") return <div className="flex items-start gap-3 py-0.5"><button type="button" onClick={onToggle} aria-label={block.checked ? "Mark todo incomplete" : "Mark todo complete"} aria-pressed={block.checked} className={`mt-[7px] grid size-5 shrink-0 place-items-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--grapho-accent)]/50 ${block.checked ? "border-[var(--grapho-accent)] bg-[var(--grapho-accent)] text-[var(--grapho-background)]" : "border-[var(--grapho-border)] bg-transparent text-transparent hover:border-[var(--grapho-accent)]"}`}>{block.checked && <Check size={13} strokeWidth={3} aria-hidden="true" />}</button>{editable(`text-[15px] leading-8 ${block.checked ? "text-[var(--grapho-faint)] line-through decoration-[var(--grapho-faint)]/70" : "text-[var(--grapho-muted)]"}`, "To-do block")}</div>;
  if (block.type === "toggle") return <div className="rounded-xl border border-[var(--grapho-border)] bg-[var(--grapho-control)]/40"><div className="flex items-start gap-2 px-3 py-2"><button type="button" onClick={() => onCollapse(!block.collapsed)} aria-label={block.collapsed ? "Expand toggle" : "Collapse toggle"} aria-expanded={!block.collapsed} className="mt-2 grid size-5 shrink-0 place-items-center rounded-md text-xs text-[var(--grapho-faint)] hover:bg-[var(--grapho-control-hover)]">{block.collapsed ? "›" : "⌄"}</button>{editable("text-[15px] font-medium leading-8 text-[var(--grapho-foreground)]", "Toggle block")}</div></div>;
  if (block.type === "code") return <pre className="my-3 overflow-x-auto rounded-xl border border-[var(--grapho-border)] bg-[var(--grapho-control)] p-4 text-[13px] leading-6 text-[var(--grapho-muted)]"><code>{block.text}</code></pre>;
  if (block.type === "divider") return <hr className="my-5 border-0 border-t border-[var(--grapho-border)]" />;
  if (block.type === "page-break") return <div className="grapho-page-break my-6 flex items-center justify-center text-[8px] uppercase tracking-[.16em] text-[var(--grapho-faint)]">Page break</div>;
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

function EditableContent({ blockId, value, content, label, className, onChange, onKeyDown, onPaste }: { blockId: string; value: string; content: InlineText[]; label: string; className: string; onChange: (value: string, content?: InlineText[]) => void; onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void; onPaste: (event: React.ClipboardEvent<HTMLDivElement>) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValue = useRef(value);

  useEffect(() => {
    if (!ref.current || document.activeElement === ref.current) return;
    ref.current.replaceChildren(...content.map((span, index) => inlineSpanNode(span, index)));
    lastValue.current = value;
  }, [content, value]);

  return <div ref={ref} data-grapho-block data-grapho-block-id={blockId} data-placeholder="Start writing…" contentEditable suppressContentEditableWarning role="textbox" aria-label={label} spellCheck onInput={(event) => { const nextContent = readInlineContent(event.currentTarget); const nextValue = plainInlineText(nextContent); lastValue.current = nextValue; onChange(nextValue, nextContent); }} onKeyDown={(event) => {
    const selection = window.getSelection();
    const hasSelection = Boolean(selection && !selection.isCollapsed && ref.current?.contains(selection.anchorNode) && ref.current.contains(selection.focusNode));
    if (hasSelection && (event.key === "Backspace" || event.key === "Delete")) {
      event.preventDefault();
      selection?.deleteFromDocument();
      const editor = ref.current;
      if (editor) editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: event.key === "Backspace" ? "deleteContentBackward" : "deleteContentForward" }));
      return;
    }
    onKeyDown(event);
  }} onPaste={onPaste} className={`min-h-[1.5em] w-full cursor-text border-0 bg-transparent outline-none ${className}`} />;
}

function inlineSpanNode(span: InlineText, key: number): Node {
  if (!span.marks?.length && /^\s*Priority:\s+/i.test(span.text)) {
    const match = span.text.match(/^(\s*Priority:\s*)(.+)$/i);
    if (match) { const fragment = document.createDocumentFragment(); fragment.appendChild(document.createTextNode(match[1])); const priority = document.createElement("span"); priority.className = `grapho-priority-value ${match[2].trim().toLowerCase()}`; priority.textContent = match[2].trim(); fragment.appendChild(priority); return fragment; }
  }
  if (!span.marks?.length && /^\s*Status:\s+/i.test(span.text)) {
    const match = span.text.match(/^(\s*Status:\s*)(.+)$/i);
    if (match) {
      const fragment = document.createDocumentFragment();
      fragment.appendChild(document.createTextNode(match[1]));
      const status = document.createElement("span");
      status.className = `grapho-status-badge ${match[2].trim().toLowerCase().replace(/\s+/g, "-")}`;
      status.textContent = match[2].trim();
      fragment.appendChild(status);
      return fragment;
    }
  }
  if (!span.marks?.length && /^\s*(Type|Division|Purpose|Owner|Priority|Date|Category|Description):\s+/i.test(span.text)) {
    const match = span.text.match(/^(\s*)([A-Za-z][\w /-]{1,30})(:\s+)/);
    if (match) {
      const fragment = document.createDocumentFragment();
      fragment.appendChild(document.createTextNode(match[1]));
      const label = document.createElement("span");
      label.className = "grapho-field-label";
      label.textContent = match[2] + match[3];
      fragment.appendChild(label);
      fragment.appendChild(document.createTextNode(span.text.slice(match[0].length)));
      return fragment;
    }
  }
  if (!span.marks?.length && /(?:https?:\/\/|www\.)[^\s]+/i.test(span.text)) {
    const fragment = document.createDocumentFragment(); const urlPattern = /(?:https?:\/\/|www\.)[^\s]+/gi; let cursor = 0;
    for (const match of span.text.matchAll(urlPattern)) { const start = match.index ?? 0; if (start > cursor) fragment.appendChild(document.createTextNode(span.text.slice(cursor, start))); const label = match[0]; const link = document.createElement("a"); link.className = "grapho-smart-link"; link.href = label.startsWith("www.") ? `https://${label}` : label; link.target = "_blank"; link.rel = "noreferrer"; link.textContent = label; fragment.appendChild(link); cursor = start + label.length; }
    if (cursor < span.text.length) fragment.appendChild(document.createTextNode(span.text.slice(cursor))); return fragment;
  }
  if (!span.marks?.length && /(?:\[[^\]]+\]\(mailto:[^)]+\)|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/i.test(span.text)) {
    const displayText = span.text.replace(/\[([^\]]+)\]\((?:mailto:)?[^)]+\)/gi, "$1");
    const fragment = document.createDocumentFragment();
    const emailPattern = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
    let cursor = 0;
    for (const match of displayText.matchAll(emailPattern)) {
      const start = match.index ?? 0;
      if (start > cursor) fragment.appendChild(document.createTextNode(displayText.slice(cursor, start)));
      const email = match[0];
      const link = document.createElement("a");
      link.className = "grapho-email-link";
      link.href = `mailto:${email}`;
      link.textContent = email;
      link.setAttribute("aria-label", `Email ${email}`);
      fragment.appendChild(link);
      cursor = start + email.length;
    }
    if (cursor < displayText.length) fragment.appendChild(document.createTextNode(displayText.slice(cursor)));
    return fragment;
  }
  let node: Node = document.createTextNode(span.text);
  for (const mark of span.marks ?? []) {
    const element = document.createElement(mark.type === "bold" ? "strong" : mark.type === "italic" ? "em" : mark.type === "underline" ? "u" : mark.type === "strike" ? "s" : mark.type === "code" ? "code" : mark.type === "highlight" ? "mark" : "a");
    if (mark.type === "highlight" && mark.color) element.style.backgroundColor = mark.color;
    if (mark.type === "link") { element.setAttribute("href", mark.href); element.setAttribute("target", mark.href.startsWith("mailto:") ? "_self" : "_blank"); element.setAttribute("rel", "noreferrer"); if (mark.href.startsWith("mailto:")) element.className = "grapho-email-link"; }
    element.appendChild(node);
    node = element;
  }
  return node;
}

function readInlineContent(root: HTMLElement): InlineText[] {
  const result: InlineText[] = [];
  const visit = (node: Node, marks: TextMark[]) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text) result.push({ text, marks: marks.length ? marks : undefined });
      return;
    }
    const element = node as HTMLElement;
    const nextMarks = [...marks];
    const tag = element.tagName.toLowerCase();
    if (tag === "strong" || tag === "b") nextMarks.push({ type: "bold" });
    if (tag === "em" || tag === "i") nextMarks.push({ type: "italic" });
    if (tag === "u") nextMarks.push({ type: "underline" });
    if (tag === "s" || tag === "strike") nextMarks.push({ type: "strike" });
    if (tag === "code") nextMarks.push({ type: "code" });
    if (tag === "mark") nextMarks.push({ type: "highlight", color: element.style.backgroundColor || undefined });
    if (tag === "a") nextMarks.push({ type: "link", href: element.getAttribute("href") ?? "" });
    node.childNodes.forEach((child) => visit(child, nextMarks));
  };
  root.childNodes.forEach((child) => visit(child, []));
  return mergeInlineContent(result);
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
    { type: "todo", category: "Lists", label: "To-do", hint: "Track one item", icon: <span>☐</span> },
    { type: "toggle", category: "Lists", label: "Toggle", hint: "Collapsible section", icon: <ChevronRight size={13} /> },
    { type: "quote", category: "Basic", label: "Quote", hint: "Highlight a thought", icon: <Quote size={13} /> },
    { type: "callout", category: "Basic", label: "Callout", hint: "Bring attention", icon: <Sparkles size={13} /> },
    { type: "code", category: "Advanced", label: "Code block", hint: "Monospaced code", icon: <Type size={13} /> },
    { type: "table", category: "Advanced", label: "Table", hint: "Structured rows and columns", icon: <Table2 size={13} /> },
    { type: "divider", category: "Basic", label: "Divider", hint: "Separate sections", icon: <Minus size={13} /> },
    { type: "page-break", category: "Publishing", label: "Page break", hint: "Start a new printed page", icon: <FileDown size={13} /> },
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

function OnboardingStep({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="rounded-2xl border border-[var(--grapho-border)] bg-[var(--grapho-control)] p-4"><span className="text-[8px] text-[var(--grapho-accent)]">{number}</span><strong className="mt-8 block text-[10px] text-[var(--grapho-foreground)]">{title}</strong><p className="mt-2 text-[9px] leading-4 text-[var(--grapho-muted)]">{text}</p></div>;
}

function ToolGuideItem({ icon, name, use }: { icon: ReactNode; name: string; use: string }) {
  return <div className="flex items-center gap-3 rounded-xl bg-[var(--grapho-control)] px-3 py-2.5"><span className="grid size-7 shrink-0 place-items-center rounded-lg border border-[var(--grapho-border)] text-[var(--grapho-accent)]">{icon}</span><span className="min-w-0"><strong className="block text-[9px] text-[var(--grapho-foreground)]">{name}</strong><small className="mt-0.5 block text-[8px] leading-4 text-[var(--grapho-muted)]">{use}</small></span></div>;
}

function ShortcutGroup({ title, items }: { title: string; items: string[][] }) {
  return <section><h3 className="text-[9px] uppercase tracking-[.16em] text-[var(--grapho-faint)]">{title}</h3><div className="mt-3 space-y-2.5">{items.map(([key, description]) => <div key={key} className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-[var(--grapho-control)] px-3.5 py-3"><kbd className="rounded-md border border-[var(--grapho-border)] bg-[var(--grapho-panel-solid)] px-2 py-1.5 text-[10px] text-[var(--grapho-foreground)]">{key}</kbd><span className="text-right text-[10px] leading-4 text-[var(--grapho-muted)]">{description}</span></div>)}</div></section>;
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[var(--grapho-control)] px-3 py-2.5"><div className="text-[8px] text-[var(--grapho-faint)]">{label}</div><div className="mt-1 text-sm font-semibold tracking-[-.04em] text-[var(--grapho-foreground)]">{value}</div></div>;
}



function StyleOption({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="grapho-style-option mt-2 flex w-full items-center justify-between rounded-lg border border-transparent px-2.5 py-2.5 text-left text-[9px] hover:bg-[var(--grapho-control)]"><span className="grapho-style-option-label text-[var(--grapho-muted)]">{label}</span><span className="grapho-style-option-value flex items-center gap-2 text-[var(--grapho-foreground)]"><span>{value}</span><span className="grapho-style-option-arrow" aria-hidden="true">↕</span></span></button>;
}
