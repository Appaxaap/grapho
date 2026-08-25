import type { Block, DocumentItem, InlineText, TextMark } from "./model";

export function blockInlineContent(block: Block): InlineText[] {
  return block.content?.length ? block.content : [{ text: block.text }];
}

export function plainInlineText(content: InlineText[]): string {
  return content.map((span) => span.text).join("");
}

export function normalizeMarks(marks: TextMark[] = []): TextMark[] {
  return [...marks].sort((a, b) => a.type.localeCompare(b.type));
}

export function sameMarks(left: TextMark[] = [], right: TextMark[] = []): boolean {
  return JSON.stringify(normalizeMarks(left)) === JSON.stringify(normalizeMarks(right));
}

export function mergeInlineContent(content: InlineText[]): InlineText[] {
  return content.reduce<InlineText[]>((merged, span) => {
    if (!span.text) return merged;
    const previous = merged[merged.length - 1];
    if (previous && sameMarks(previous.marks, span.marks)) {
      previous.text += span.text;
    } else {
      merged.push({ text: span.text, marks: span.marks?.length ? normalizeMarks(span.marks) : undefined });
    }
    return merged;
  }, []);
}

export function toggleMark(content: InlineText[], from: number, to: number, mark: TextMark): InlineText[] {
  if (from >= to) return content;
  const result: InlineText[] = [];
  let cursor = 0;
  for (const span of content) {
    const start = cursor;
    const end = cursor + span.text.length;
    cursor = end;
    if (end <= from || start >= to) {
      result.push(span);
      continue;
    }
    const pieces = [
      [start, Math.max(start, from)],
      [Math.max(start, from), Math.min(end, to)],
      [Math.min(end, to), end],
    ] as const;
    for (const [pieceStart, pieceEnd] of pieces) {
      if (pieceEnd <= pieceStart) continue;
      const selected = pieceStart >= from && pieceEnd <= to;
      const marks = [...(span.marks ?? [])];
      const existing = marks.findIndex((item) => item.type === mark.type);
      if (selected) {
        if (existing >= 0) marks.splice(existing, 1);
        else marks.push(mark);
      }
      result.push({ text: span.text.slice(pieceStart - start, pieceEnd - start), marks: marks.length ? marks : undefined });
    }
  }
  return mergeInlineContent(result);
}

export function blockPosition(block: Block, index: number): string {
  return block.position ?? String(index).padStart(8, "0");
}

export function visibleBlocks(document: DocumentItem): Block[] {
  const byParent = new Map<string | null, Block[]>();
  for (const block of document.blocks) {
    const parent = block.parentId ?? null;
    const siblings = byParent.get(parent) ?? [];
    siblings.push(block);
    byParent.set(parent, siblings);
  }
  for (const siblings of byParent.values()) siblings.sort((a, b) => blockPosition(a, document.blocks.indexOf(a)).localeCompare(blockPosition(b, document.blocks.indexOf(b))));

  const output: Block[] = [];
  const visit = (parentId: string | null, hidden: boolean) => {
    for (const block of byParent.get(parentId) ?? []) {
      if (!hidden) output.push(block);
      visit(block.id, hidden || (block.type === "toggle" && block.collapsed === true));
    }
  };
  visit(null, false);
  return output;
}

export function moveBlock(document: DocumentItem, blockId: string, targetParentId: string | null, targetIndex: number): DocumentItem {
  const moving = document.blocks.find((block) => block.id === blockId);
  if (!moving || targetParentId === blockId) return document;
  const descendants = new Set<string>();
  const collect = (parentId: string) => document.blocks.filter((block) => block.parentId === parentId).forEach((child) => { descendants.add(child.id); collect(child.id); });
  collect(blockId);
  if (targetParentId && descendants.has(targetParentId)) return document;

  const next = document.blocks.map((block) => block.id === blockId ? { ...block, parentId: targetParentId } : block);
  const siblings = next.filter((block) => (block.parentId ?? null) === targetParentId && block.id !== blockId);
  const clamped = Math.max(0, Math.min(targetIndex, siblings.length));
  siblings.splice(clamped, 0, moving);
  const positions = new Map(siblings.map((block, index) => [block.id, String(index).padStart(8, "0")]));
  return { ...document, blocks: next.map((block) => positions.has(block.id) ? { ...block, position: positions.get(block.id) } : block), updated: "Just now", updatedAt: new Date().toISOString() };
}

export function documentBacklinks(documents: DocumentItem[], targetId: string): { documentId: string; blockId: string; label: string }[] {
  const target = documents.find((document) => document.id === targetId);
  if (!target) return [];
  const names = new Set([target.id, target.title.toLowerCase(), target.slug?.toLowerCase()].filter(Boolean));
  const results: { documentId: string; blockId: string; label: string }[] = [];
  for (const document of documents) {
    if (document.id === targetId) continue;
    for (const block of document.blocks) {
      const text = block.text.toLowerCase();
      if ([...names].some((name) => text.includes(`[[${name}]]`) || text.includes(`[[${name}#`))) results.push({ documentId: document.id, blockId: block.id, label: block.text });
    }
  }
  return results;
}
