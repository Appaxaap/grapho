"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BlockType, DocumentBlock } from "@/domain/types";
import { createStableId } from "@/lib/ids";
import { localDocumentService } from "@/services/document-service";

type EditorBlock = DocumentBlock & {
  checked?: boolean;
  language?: string;
};

type Command = { type: BlockType; label: string; shortcut?: string };

const commands: Command[] = [
  { type: "paragraph", label: "Text" },
  { type: "heading-1", label: "Heading 1", shortcut: "#" },
  { type: "heading-2", label: "Heading 2", shortcut: "##" },
  { type: "heading-3", label: "Heading 3", shortcut: "###" },
  { type: "bullet-list", label: "Bullet List", shortcut: "-" },
  { type: "numbered-list", label: "Numbered List", shortcut: "1." },
  { type: "checklist", label: "Checklist", shortcut: "[]" },
  { type: "quote", label: "Quote", shortcut: ">" },
  { type: "callout", label: "Callout" },
  { type: "divider", label: "Divider" },
  { type: "code", label: "Code", shortcut: "```" },
  { type: "image", label: "Image" },
  { type: "link", label: "Link" },
  { type: "table", label: "Table" },
];

const initialBlocks: EditorBlock[] = [
  { id: "block_intro_heading", type: "heading-2", content: "Introduction", attributes: {}, order: 0, parentBlockId: null },
  { id: "block_intro", type: "paragraph", content: "Grapho is a local-first notes and document workspace designed for unlimited writing, organization, and professional document creation.", attributes: {}, order: 1, parentBlockId: null },
  { id: "block_callout", type: "callout", content: "The writing surface stays calm and expressive, so ideas can take shape without getting lost in the interface.", attributes: { variant: "info" }, order: 2, parentBlockId: null },
  { id: "block_routine_heading", type: "heading-3", content: "Daily Routine", attributes: {}, order: 3, parentBlockId: null },
  { id: "block_routine", type: "paragraph", content: "The document should feel ready for the next thought: fast to edit, easy to structure, and quiet when you are simply reading.", attributes: {}, order: 4, parentBlockId: null },
  { id: "block_list", type: "bullet-list", content: "Capture thoughts quickly", attributes: {}, order: 5, parentBlockId: null },
  { id: "block_list_2", type: "bullet-list", content: "Organize them naturally", attributes: {}, order: 6, parentBlockId: null },
  { id: "block_list_3", type: "bullet-list", content: "Refine the document when ready", attributes: {}, order: 7, parentBlockId: null },
];

function blockForType(type: BlockType, content = ""): EditorBlock {
  return { id: createStableId("block"), type, content, attributes: {}, order: 0, parentBlockId: null };
}

function normalizeBlocks(blocks: EditorBlock[]) {
  return blocks.map((block, index) => ({ ...block, order: index }));
}

function blockTag(type: BlockType) {
  if (type === "heading-1" || type === "heading-2" || type === "heading-3" || type === "heading-4") return type.replace("heading-", "h") as "h1" | "h2" | "h3" | "h4";
  return "p";
}

function createDefaultBlocks(): EditorBlock[] {
  return initialBlocks.map((block) => ({ ...block, attributes: { ...block.attributes } }));
}

function normalizeEmptyBlocks(blocks: EditorBlock[]) {
  const hasContent = blocks.some((block) => block.content.trim());
  const normalized: EditorBlock[] = [];
  let keptEmptyParagraph = false;

  blocks.forEach((block) => {
    const isEmptyParagraph = block.type === "paragraph" && !block.content.trim();
    if (!isEmptyParagraph) {
      normalized.push(block);
      return;
    }
    if (!hasContent && !keptEmptyParagraph) {
      normalized.push(block);
      keptEmptyParagraph = true;
    }
  });

  if (normalized.length === 0) {
    normalized.push(blockForType("paragraph"));
  }
  return normalizeBlocks(normalized);
}

export function DocumentEditor({ documentId, onDirtyChange }: { documentId: string; onDirtyChange?: (dirty: boolean) => void }) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(createDefaultBlocks);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [query, setQuery] = useState("");
  const [commandIndex, setCommandIndex] = useState(0);
  const [history, setHistory] = useState<EditorBlock[][]>([]);
  const [future, setFuture] = useState<EditorBlock[][]>([]);
  const [menuBlockId, setMenuBlockId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const refs = useRef(new Map<string, HTMLElement>());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


  const filteredCommands = useMemo(() => commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase())), [query]);

  useEffect(() => {
    let cancelled = false;
    void localDocumentService.getDocument(documentId).then((stored) => {
      if (!cancelled && stored?.blocks?.length) {
        setBlocks(normalizeEmptyBlocks(stored.blocks as EditorBlock[]));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  useEffect(() => {
    blocks.forEach((block) => {
      const element = refs.current.get(block.id);
      if (element && element !== document.activeElement && element.innerText !== block.content) {
        element.innerText = block.content;
      }
    });
  }, [blocks]);

  useEffect(() => {
    onDirtyChange?.(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void localDocumentService.updateDocument({ id: documentId, blocks }).then(() => onDirtyChange?.(false));
    }, 650);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [blocks, documentId, onDirtyChange]);

  const commit = useCallback((next: EditorBlock[], focusId?: string) => {
    setHistory((current) => [...current.slice(-49), blocks]);
    setFuture([]);
    setBlocks(normalizeBlocks(next));
    if (focusId) requestAnimationFrame(() => refs.current.get(focusId)?.focus());
  }, [blocks]);

  function updateBlock(id: string, content: string) {
    setBlocks((current) => current.map((block) => block.id === id ? { ...block, content } : block));
  }

  function updateBlockType(id: string, type: BlockType, content: string) {
    commit(blocks.map((block) => block.id === id ? { ...block, type, content } : block));
  }

  function handleInput(id: string, event: React.FormEvent<HTMLElement>) {
    updateBlock(id, event.currentTarget.innerText.replace(/\u00a0/g, " "));
  }

  function handleKeyDown(id: string, event: React.KeyboardEvent<HTMLElement>) {
    const blockIndex = blocks.findIndex((block) => block.id === id);
    const block = blocks[blockIndex];
    if (!block) return;

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") { event.preventDefault(); document.execCommand("bold"); return; }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") { event.preventDefault(); document.execCommand("italic"); return; }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "u") { event.preventDefault(); document.execCommand("underline"); return; }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; }
    if (event.key === "Escape") { setQuery(""); return; }

    const isList = block.type === "bullet-list" || block.type === "numbered-list" || block.type === "checklist";
    if (event.key === "Tab" && isList) {
      event.preventDefault();
      const indent = Number(block.attributes.indent ?? 0);
      const nextIndent = event.shiftKey ? Math.max(0, indent - 1) : Math.min(6, indent + 1);
      commit(blocks.map((item) => item.id === id ? { ...item, attributes: { ...item.attributes, indent: nextIndent } } : item), id);
      return;
    }

    if (event.key === "/" && !block.content.trim()) {
      setActiveBlockId(id);
      setQuery("");
      setCommandIndex(0);
    }

    if (event.key === " " && block.content.trim()) {
      const shortcut = block.content.trim();
      const command = commands.find((item) => item.shortcut === shortcut);
      if (command) {
        event.preventDefault();
        updateBlockType(id, command.type, "");
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (isList && !block.content.trim()) {
        const nextBlock = blocks[blockIndex + 1];
        if (nextBlock && nextBlock.type === "paragraph" && !nextBlock.content.trim()) {
          commit(blocks.filter((item) => item.id !== id), nextBlock.id);
        } else {
          commit(blocks.map((item) => item.id === id ? { ...item, type: "paragraph", content: "", attributes: {} } : item), id);
        }
        return;
      }

      const nextExistingBlock = blocks[blockIndex + 1];
      if (!isList && !block.content.trim() && nextExistingBlock?.type === "paragraph" && !nextExistingBlock.content.trim()) {
        commit(blocks.filter((item) => item.id !== id), nextExistingBlock.id);
        return;
      }

      const next = [...blocks];
      const newBlock = blockForType(isList ? block.type : "paragraph");
      newBlock.attributes = { ...block.attributes };
      next.splice(blockIndex + 1, 0, newBlock);
      commit(next, newBlock.id);
      return;
    }

    if (event.key === "Backspace" && !block.content && blocks.length > 1) {
      event.preventDefault();
      const previous = blocks[blockIndex - 1];
      commit(blocks.filter((item) => item.id !== id), previous?.id);
    }
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((current) => [...current, blocks]);
    setHistory((current) => current.slice(0, -1));
    setBlocks(previous);
  }

  function redo() {
    const next = future.at(-1);
    if (!next) return;
    setHistory((current) => [...current, blocks]);
    setFuture((current) => current.slice(0, -1));
    setBlocks(next);
  }

  function handlePaste(id: string, event: React.ClipboardEvent<HTMLElement>) {
    const text = event.clipboardData.getData("text/plain");
    if (!text.includes("\n")) return;
    event.preventDefault();
    const index = blocks.findIndex((block) => block.id === id);
    if (index < 0) return;
    const pasted = text.split(/\r?\n/).filter((line) => line.trim()).map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("### ")) return blockForType("heading-3", trimmed.slice(4));
      if (trimmed.startsWith("## ")) return blockForType("heading-2", trimmed.slice(3));
      if (trimmed.startsWith("# ")) return blockForType("heading-1", trimmed.slice(2));
      if (trimmed.startsWith("> ")) return blockForType("quote", trimmed.slice(2));
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) return blockForType("bullet-list", trimmed.slice(2));
      if (/^\d+\.\s/.test(trimmed)) return blockForType("numbered-list", trimmed.replace(/^\d+\.\s/, ""));
      return blockForType("paragraph", trimmed);
    });
    const next = [...blocks];
    next.splice(index, 1, ...pasted);
    commit(next, pasted[0]?.id);
  }

  function selectText() {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount) setSelectedRange(selection.getRangeAt(0).cloneRange());
    else setSelectedRange(null);
  }

  function applyFormat(command: "bold" | "italic" | "underline" | "strikeThrough" | "insertCode") {
    if (!selectedRange) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(selectedRange);
    document.execCommand(command === "insertCode" ? "formatBlock" : command, false, command === "insertCode" ? "code" : undefined);
    setSelectedRange(null);
  }

  function moveBlock(id: string, direction: -1 | 1) {
    const index = blocks.findIndex((block) => block.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next, id);
    setMenuBlockId(null);
  }

  function duplicateBlock(id: string) {
    const index = blocks.findIndex((block) => block.id === id);
    const source = blocks[index];
    if (!source) return;
    const copy = { ...source, id: createStableId("block"), attributes: { ...source.attributes } };
    const next = [...blocks];
    next.splice(index + 1, 0, copy);
    commit(next, copy.id);
    setMenuBlockId(null);
  }

  function deleteBlock(id: string) {
    if (blocks.length === 1) return;
    const index = blocks.findIndex((block) => block.id === id);
    const next = blocks.filter((block) => block.id !== id);
    commit(next, next[Math.max(0, index - 1)]?.id);
    setMenuBlockId(null);
  }

  function turnInto(id: string, type: BlockType) {
    commit(blocks.map((block) => block.id === id ? { ...block, type } : block), id);
    setMenuBlockId(null);
  }

  function dropBlock(targetIndex: number) {
    if (!draggingId) return;
    const sourceIndex = blocks.findIndex((block) => block.id === draggingId);
    if (sourceIndex < 0) return;
    const next = [...blocks];
    const [moved] = next.splice(sourceIndex, 1);
    const insertionIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    next.splice(Math.max(0, insertionIndex), 0, moved);
    commit(next, moved.id);
    setDraggingId(null);
    setDropIndex(null);
  }

  function chooseCommand(command: Command) {
    if (!activeBlockId) return;
    if (command.type === "divider") {
      commit(blocks.map((block) => block.id === activeBlockId ? { ...block, type: "divider", content: "" } : block));
    } else {
      updateBlockType(activeBlockId, command.type, "");
    }
    setQuery("");
    setActiveBlockId(null);
  }

  function renderBlock(block: EditorBlock) {
    const common = { contentEditable: true, suppressContentEditableWarning: true, ref: (element: HTMLElement | null) => { if (element) { refs.current.set(block.id, element); if (element.innerText !== block.content && element !== document.activeElement) element.innerText = block.content; } else refs.current.delete(block.id); }, onInput: (event: React.FormEvent<HTMLElement>) => handleInput(block.id, event), onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => handleKeyDown(block.id, event), onPaste: (event: React.ClipboardEvent<HTMLElement>) => handlePaste(block.id, event), onFocus: () => setActiveBlockId(block.id), onMouseUp: selectText };
    if (block.type === "divider") return <div className="editor-divider" key={block.id} onClick={() => setActiveBlockId(block.id)} />;
    if (block.type === "callout") return <div className="editor-callout" key={block.id}><span>✦</span><div {...common} className="editor-callout-content" /></div>;
    if (block.type === "quote") return <blockquote key={block.id}><div {...common} /></blockquote>;
    if (block.type === "code") return <pre className="editor-code" key={block.id}><code {...common} /></pre>;
    const indentStyle = { paddingLeft: `${Number(block.attributes.indent ?? 0) * 28}px` };
    if (block.type === "checklist") return <div className="editor-checklist" key={block.id} style={indentStyle}><input aria-label="Toggle checklist item" checked={Boolean(block.checked)} onChange={() => setBlocks((current) => current.map((item) => item.id === block.id ? { ...item, checked: !item.checked } : item))} type="checkbox" /><div {...common} /></div>;
    if (block.type === "bullet-list" || block.type === "numbered-list") return block.type === "bullet-list" ? <div className="editor-list-item" key={block.id} style={indentStyle}><span>•</span><div {...common} /></div> : <div className="editor-list-item numbered" key={block.id} style={indentStyle}><span>{block.order + 1}.</span><div {...common} /></div>;
    const Tag = blockTag(block.type);
    return <Tag className={`editor-block editor-${block.type}`} key={block.id} {...common} />;
  }

  const showCommands = activeBlockId !== null && (query.length > 0 || blocks.find((block) => block.id === activeBlockId)?.content === "/");
  return <div className="structured-editor" onClick={(event) => { if (event.target === event.currentTarget) refs.current.get(activeBlockId ?? blocks[0]?.id)?.focus(); }} onMouseUp={selectText}>
    {blocks.map((block, index) => <div className={`editor-block-wrap ${activeBlockId === block.id ? "is-active" : ""} ${dropIndex === index ? "drop-target" : ""}`} onDragOver={(event) => { event.preventDefault(); setDropIndex(index); }} onDragEnd={() => { setDraggingId(null); setDropIndex(null); }} onDrop={() => dropBlock(index)} key={block.id}><div className="block-controls"><button aria-label="Add block" onClick={() => { setActiveBlockId(block.id); setQuery(""); }} type="button">+</button><button aria-label="Drag block" className="drag-handle" draggable onDragStart={() => setDraggingId(block.id)} type="button">⠿</button><button aria-label="Block actions" onClick={() => setMenuBlockId(menuBlockId === block.id ? null : block.id)} type="button">⋯</button>{menuBlockId === block.id ? <div className="block-menu"><button onClick={() => duplicateBlock(block.id)} type="button">Duplicate</button><button disabled={index === 0} onClick={() => moveBlock(block.id, -1)} type="button">Move up</button><button disabled={index === blocks.length - 1} onClick={() => moveBlock(block.id, 1)} type="button">Move down</button><div className="block-menu-label">Turn into</div>{commands.slice(0, 9).map((command) => <button key={command.type} onClick={() => turnInto(block.id, command.type)} type="button">{command.label}</button>)}<button className="danger" onClick={() => deleteBlock(block.id)} type="button">Delete</button></div> : null}</div>{renderBlock(block)}</div>)}
    {showCommands ? <div className="slash-menu"><div className="slash-menu-heading">Insert block</div><input autoFocus onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "ArrowDown") setCommandIndex((index) => Math.min(index + 1, filteredCommands.length - 1)); if (event.key === "ArrowUp") setCommandIndex((index) => Math.max(index - 1, 0)); if (event.key === "Enter" && filteredCommands[commandIndex]) chooseCommand(filteredCommands[commandIndex]); if (event.key === "Escape") setQuery(""); }} placeholder="Search commands..." value={query} />{filteredCommands.slice(0, 7).map((command, index) => <button className={index === commandIndex ? "is-highlighted" : ""} key={command.type} onClick={() => chooseCommand(command)} type="button"><span>{command.label}</span><small>{command.shortcut}</small></button>)}</div> : null}
    {selectedRange ? <div className="selection-toolbar"><button aria-label="Bold" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("bold")} type="button"><b>B</b></button><button aria-label="Italic" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("italic")} type="button"><i>I</i></button><button aria-label="Underline" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("underline")} type="button"><u>U</u></button><button aria-label="Strikethrough" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("strikeThrough")} type="button"><s>S</s></button><button aria-label="Inline code" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("insertCode")} type="button">&lt;/&gt;</button></div> : null}
  </div>;
}
