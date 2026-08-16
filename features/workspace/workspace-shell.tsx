"use client";

import { useMemo, useState } from "react";
import type { Document, Folder } from "@/domain/types";
import { DocumentEditor } from "@/features/editor/document-editor";
import {
  type FolderNode,
  type WorkspaceSectionKey,
  workspaceSections,
  workspaceState,
} from "@/lib/mock-workspace";

type IconName =
  | "plus"
  | "search"
  | "note"
  | "star"
  | "clock"
  | "users"
  | "trash"
  | "folder"
  | "chevron"
  | "sun"
  | "moon"
  | "settings"
  | "undo"
  | "redo"
  | "bell"
  | "check"
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "code"
  | "link"
  | "align-left"
  | "align-center"
  | "align-right"
  | "justify"
  | "image"
  | "table"
  | "quote"
  | "divider"
  | "bullets"
  | "numbered"
  | "sparkle"
  | "focus";

const iconPaths: Record<IconName, string> = {
  plus: "M12 5v14M5 12h14",
  search: "m21 21-4.35-4.35M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z",
  note: "M6 3.8h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.8a1 1 0 0 1 1-1ZM14 4v4h4",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2",
  users: "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20m6-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm5.5-5.8a3 3 0 0 1 0 5.6M17 15.2a3.5 3.5 0 0 1 3 3.3V20",
  trash: "M4 7h16m-10 4v6m4-6v6M9 7V4h6v3m-9 0 1 13h10l1-13",
  folder: "M3.5 6.5a2 2 0 0 1 2-2h4l2 2h6.5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2v-8Z",
  chevron: "m9 6 6 6-6 6",
  sun: "M12 3v2m0 14v2M3 12h2m14 0h2m-3.4-6.6-1.4 1.4M6.8 17.2l-1.4 1.4m0-13.2 1.4 1.4m10.4 10.4 1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  moon: "M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5 8.5 8.5 0 1 0 20.5 14.3Z",
  settings: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm0-12.2 1 .2.7 2.1 1.8.8 2-.8.8.7-1.3 1.4.5 1.9-.9 1.7.9 1.9-1.3 1.4-.8 2 .8 1.8-.7 2.1-1 .2-1.7-.9-1.8.9-.7 2.1-1-.2-.7-2.1-1.8-.8-2 .8-.8-.7 1.3-1.4-.5-1.9.9-1.7-.9-1.9 1.3-1.4.8-2-.8-1.8.7-2.1Z",
  undo: "M9 7 4 12l5 5m-5-5h10a6 6 0 0 1 6 6",
  redo: "m15 7 5 5-5 5m5-5H10a6 6 0 0 0-6 6",
  bell: "M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 13h4",
  check: "m5 12 4 4L19 6",
  bold: "M7 5h5a3 3 0 0 1 0 6H7m5 0a3 3 0 0 1 0 6H7V5",
  italic: "M10 5h7M7 19h7M14 5 10 19",
  underline: "M6 5v6a6 6 0 0 0 12 0V5M5 20h14",
  strike: "M5 12h14M8 7.5c.8-2.5 7-2.5 8 0 .7 1.8-1.1 3-4 3.9-3 .9-4.7 2.1-4 4.1 1 2.5 7.4 2.5 8.2-.2",
  code: "m8 9-4 3 4 3m8-6 4 3-4 3m-3-8-2 10",
  link: "M10 13a5 5 0 0 0 7.1.1l1.4-1.4a5 5 0 0 0-7.1-7.1L10.6 5.4m3.4 5.6a5 5 0 0 0-7.1-.1l-1.4 1.4a5 5 0 0 0 7.1 7.1l.8-.8",
  "align-left": "M4 6h16M4 10h11M4 14h16M4 18h11",
  "align-center": "M4 6h16M7 10h10M4 14h16M7 18h10",
  "align-right": "M4 6h16M9 10h11M4 14h16M9 18h11",
  justify: "M4 6h16M4 10h16M4 14h16M4 18h16",
  image: "M4 5h16v14H4zM7 15l3-3 2 2 2-2 3 3M8 9h.01",
  table: "M4 5h16v14H4zM4 10h16M10 5v14M16 5v14",
  quote: "M9 9H5v5h4v-5Zm10 0h-4v5h4V9ZM5 14c0 3 1.5 4.5 4 5M15 14c0 3 1.5 4.5 4 5",
  divider: "M5 12h14",
  bullets: "M9 6h11M9 12h11M9 18h11M5 6h.01M5 12h.01M5 18h.01",
  numbered: "M4 6h2M4 12h2M4 18h2M9 6h11M9 12h11M9 18h11",
  sparkle: "m12 3 1.2 5.8L19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2L12 3Zm6 11 .5 2.5L21 17l-2.5.5L18 20l-.5-2.5L15 17l2.5-.5L18 14Z",
  focus: "M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3m13 5h3a2 2 0 0 0 2-2v-3",
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <path d={iconPaths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}


function getFolderDocuments(folderId: string | null, documents: Document[]) {
  return documents.filter((document) => document.folderId === folderId).sort((a, b) => a.title.localeCompare(b.title));
}

function getFolderChildren(folderId: string, folders: Folder[]) {
  return folders.filter((folder) => folder.parentFolderId === folderId).sort((a, b) => a.order - b.order);
}

function FolderTreeItem({ node, depth = 0, selectedFolderId, expandedFolders, onSelectFolder, onToggleFolder }: { node: FolderNode; depth?: number; selectedFolderId: string | null; expandedFolders: Set<string>; onSelectFolder: (id: string) => void; onToggleFolder: (id: string) => void }) {
  const expanded = expandedFolders.has(node.id);
  const selected = selectedFolderId === node.id;
  return (
    <li>
      <button className={`folder-row ${selected ? "is-selected" : ""}`} onClick={() => onSelectFolder(node.id)} style={{ paddingLeft: `${depth * 16 + 10}px` }} type="button">
        <span className={`folder-chevron ${node.children.length ? "has-children" : ""}`} onClick={(event) => { event.stopPropagation(); if (node.children.length) onToggleFolder(node.id); }}>
          {node.children.length ? <Icon name="chevron" size={14} /> : null}
        </span>
        <Icon name="folder" size={17} />
        <span>{node.name}</span>
      </button>
      {expanded && node.children.length ? <ul>{node.children.map((child) => <FolderTreeItem key={child.id} node={child} depth={depth + 1} selectedFolderId={selectedFolderId} expandedFolders={expandedFolders} onSelectFolder={onSelectFolder} onToggleFolder={onToggleFolder} />)}</ul> : null}
    </li>
  );
}

function ToolButton({ icon, label, active = false, onClick }: { icon: IconName; label: string; active?: boolean; onClick?: () => void }) {
  return <button aria-label={label} className={`tool-button ${active ? "is-active" : ""}`} onClick={onClick} title={label} type="button"><Icon name={icon} size={18} /></button>;
}

export function WorkspaceShell() {
  const [documents, setDocuments] = useState<Document[]>(workspaceState.documents);
  const [selectedSection, setSelectedSection] = useState<WorkspaceSectionKey>("home");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>("folder_products");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>("doc_grapho_spec");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => new Set(["folder_work", "folder_codecx", "folder_products"]));
  const [query, setQuery] = useState("");
  const [showStylePanel, setShowStylePanel] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [title, setTitle] = useState("Product Specification");
  const [activeTool, setActiveTool] = useState<IconName | null>(null);
  const [documentTheme, setDocumentTheme] = useState<"default" | "blue" | "green" | "warm" | "night">("default");

  const selectedDocument = useMemo(() => documents.find((document) => document.id === selectedDocumentId) ?? null, [documents, selectedDocumentId]);
  const selectedFolder = useMemo(() => workspaceState.folders.find((folder) => folder.id === selectedFolderId) ?? null, [selectedFolderId]);

  const visibleDocuments = useMemo(() => {
    let result = selectedSection === "all-documents" ? documents : selectedSection === "favorites" ? documents.filter((document) => document.isFavorite) : selectedSection === "trash" ? documents.filter((document) => document.status === "trashed") : selectedSection === "recent" ? documents.slice(0, 3) : getFolderDocuments(selectedFolderId, documents);
    if (query.trim()) result = result.filter((document) => document.title.toLowerCase().includes(query.toLowerCase()));
    return result;
  }, [documents, query, selectedFolderId, selectedSection]);

  function selectDocument(documentId: string) {
    const document = documents.find((item) => item.id === documentId);
    if (!document) return;
    setSelectedDocumentId(documentId);
    setSelectedFolderId(document.folderId);
    setTitle(document.title);
  }

  function createDocument() {
    const id = `doc_${Date.now()}`;
    const document: Document = { id, workspaceId: workspaceState.workspace.id, folderId: selectedFolderId, title: "Untitled Note", status: "draft", isFavorite: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), blocks: [] };
    setDocuments((current) => [document, ...current]);
    selectDocument(id);
    setSelectedSection("all-documents");
  }

  function updateTitle(value: string) {
    setTitle(value);
    setDocuments((current) => current.map((document) => document.id === selectedDocumentId ? { ...document, title: value || "Untitled Note", updatedAt: new Date().toISOString() } : document));
  }

  function toggleFolder(id: string) {
    setExpandedFolders((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const sectionLabel = workspaceSections.find((section) => section.key === selectedSection)?.label ?? "All Notes";
  const folderChildren = selectedFolderId ? getFolderChildren(selectedFolderId, workspaceState.folders) : [];

  return (
    <div className={`grapho-app ${darkMode ? "theme-dark" : ""} ${focusMode ? "focus-mode" : ""}`}>
      {!focusMode ? <aside className="grapho-sidebar">
        <div className="brand-row"><div className="brand-mark">G</div><div className="brand-name">Grapho</div><button className="icon-button brand-action" onClick={createDocument} type="button"><Icon name="note" size={17} /></button></div>
        <button className="new-note-button" onClick={createDocument} type="button"><span className="new-note-icon"><Icon name="plus" size={19} /></span><span>New Note</span><kbd>⌘N</kbd></button>
        <label className="search-box"><Icon name="search" size={18} /><input aria-label="Search notes" onChange={(event) => setQuery(event.target.value)} placeholder="Search notes..." value={query} /><kbd>⌘K</kbd></label>
        <nav className="primary-nav">
          {workspaceSections.filter((section) => section.key !== "folders").map((section) => <button className={`nav-row ${selectedSection === section.key ? "is-selected" : ""}`} key={section.key} onClick={() => setSelectedSection(section.key)} type="button"><Icon name={section.key === "home" || section.key === "all-documents" ? "note" : section.key === "favorites" ? "star" : section.key === "recent" ? "clock" : "trash"} size={18} /><span>{section.label === "Home" ? "All Notes" : section.label}</span></button>)}
        </nav>
        <div className="sidebar-divider" />
        <div className="folder-heading"><span>Folders</span><button className="small-icon-button" onClick={createDocument} type="button"><Icon name="plus" size={16} /></button></div>
        <ul className="folder-tree">{workspaceState.rootFolders.map((folder) => <FolderTreeItem key={folder.id} node={folder} expandedFolders={expandedFolders} onSelectFolder={(id) => { setSelectedFolderId(id); setSelectedSection("folders"); setSelectedDocumentId(null); }} onToggleFolder={toggleFolder} selectedFolderId={selectedFolderId} />)}</ul>
        <div className="sidebar-bottom"><div className="profile-card"><div className="profile-avatar">B</div><div><strong>Basim Basheer</strong><span>basim@grapho.co</span></div><Icon name="chevron" size={15} /></div><div className="appearance-row"><button className="small-icon-button" onClick={() => setDarkMode(false)} type="button"><Icon name="sun" size={18} /></button><button className="small-icon-button" onClick={() => setDarkMode(true)} type="button"><Icon name="moon" size={18} /></button><button className="small-icon-button" type="button"><Icon name="settings" size={18} /></button></div></div>
      </aside> : null}

      <main className="grapho-workspace">
        <header className="workspace-header"><div className="breadcrumbs"><span>{sectionLabel}</span><b>/</b><span>{selectedFolder?.name ?? "Work"}</span><b>/</b><strong>{selectedDocument?.title ?? title}</strong></div><div className="header-actions"><div className="history-group"><ToolButton icon="undo" label="Undo" /><ToolButton icon="redo" label="Redo" /></div><span className="save-status"><Icon name="check" size={16} /> Saved just now</span><ToolButton icon="bell" label="Notifications" /><button className="profile-chip" type="button"><span>B</span><Icon name="chevron" size={14} /></button></div></header>
        <div className="workspace-body">
          {!focusMode ? <aside className="document-rail"><div className="rail-heading"><span>{selectedFolder?.name ?? sectionLabel}</span><span>{visibleDocuments.length}</span></div><div className="document-list">{visibleDocuments.map((document) => <button className={`document-list-item ${selectedDocumentId === document.id ? "is-selected" : ""}`} key={document.id} onClick={() => selectDocument(document.id)} type="button"><span>{document.title}</span><small>{document.isFavorite ? "Favorite" : "Draft"}</small></button>)}</div>{selectedFolder ? <div className="folder-summary"><strong>{selectedFolder.name}</strong><span>{folderChildren.length} subfolder{folderChildren.length === 1 ? "" : "s"}</span></div> : null}</aside> : null}
          <section className="canvas-wrap"><article className={`document-canvas document-theme-${documentTheme}`}><div className="document-meta"><span>{selectedDocument?.isFavorite ? "Favorite" : "Local document"}</span><span>Updated just now</span></div><input aria-label="Document title" className="document-title" onChange={(event) => updateTitle(event.target.value)} value={title} /><p className="slash-placeholder">Start writing, or type <strong>/</strong> for commands</p><DocumentEditor documentId={selectedDocumentId ?? "new-document"} onDirtyChange={() => undefined} /></article></section>
          {!focusMode && showStylePanel ? <aside className="style-panel"><div className="panel-handle" /><div className="panel-section"><h3>Style</h3><div className="style-swatches"><button aria-label="Default document style" className="style-swatch is-active" onClick={() => setDocumentTheme("default")} type="button">Aa</button><button aria-label="Blue document style" className="style-swatch blue" onClick={() => setDocumentTheme("blue")} type="button">Aa</button><button aria-label="Green document style" className="style-swatch green" onClick={() => setDocumentTheme("green")} type="button">Aa</button><button aria-label="Warm document style" className="style-swatch yellow" onClick={() => setDocumentTheme("warm")} type="button">Aa</button><button aria-label="Night document style" className="style-swatch dark" onClick={() => setDocumentTheme("night")} type="button">Aa</button></div></div><div className="panel-section"><h3>Text</h3><div className="font-card"><span>Aa</span><div><strong>Inter</strong><small>Medium</small></div><Icon name="chevron" size={14} /></div><div className="tool-grid text-tools"><ToolButton active={activeTool === "bold"} icon="bold" label="Bold" onClick={() => setActiveTool("bold")} /><ToolButton icon="italic" label="Italic" /><ToolButton icon="underline" label="Underline" /><ToolButton icon="strike" label="Strikethrough" /></div><div className="alignment-control"><ToolButton active icon="align-left" label="Align left" /><ToolButton icon="align-center" label="Align center" /><ToolButton icon="align-right" label="Align right" /><ToolButton icon="justify" label="Justify" /></div><div className="stepper-row"><div><label>Size</label><div className="stepper"><button type="button">−</button><span>16</span><button type="button">+</button></div></div><div><label>Line height</label><div className="stepper"><button type="button">−</button><span>1.6</span><button type="button">+</button></div></div></div></div><div className="panel-section insert-section"><h3>Insert</h3><div className="insert-grid">{([["image", "Image"], ["link", "Link"], ["table", "Table"], ["code", "Code"], ["quote", "Quote"], ["divider", "Divider"], ["bullets", "Bullets"], ["numbered", "Numbered"]] as Array<[IconName, string]>).map(([icon, label]) => <button key={label} onClick={() => setActiveTool(icon)} type="button"><span><Icon name={icon} size={18} /></span><small>{label}</small></button>)}</div></div></aside> : null}
        </div>
        <div className="bottom-actions"><button className="focus-toggle" onClick={() => setFocusMode((value) => !value)} type="button"><Icon name="focus" size={17} /> {focusMode ? "Exit focus" : "Focus mode"}</button>{!focusMode ? <button className="panel-toggle" onClick={() => setShowStylePanel((value) => !value)} type="button">{showStylePanel ? "Hide style" : "Show style"}</button> : null}</div>
      </main>
    </div>
  );
}
