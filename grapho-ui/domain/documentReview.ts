import type { DocumentItem } from "./model";

export type ReviewSeverity = "info" | "warning" | "error";

export type DocumentReviewIssue = {
  id: string;
  severity: ReviewSeverity;
  title: string;
  detail: string;
  blockId?: string;
};

export type DocumentReview = {
  ready: boolean;
  issues: DocumentReviewIssue[];
  wordCount: number;
  headingCount: number;
  linkCount: number;
};

const headingPattern = /^#{1,6}\s+/;
const documentLinkPattern = /\[\[([^\]#]+)(?:#[^\]]+)?\]\]/g;

export function reviewDocument(document: DocumentItem, documents: DocumentItem[] = [document]): DocumentReview {
  const issues: DocumentReviewIssue[] = [];
  const title = document.title.trim();
  if (!title || /^untitled document$/i.test(title)) {
    issues.push({ id: "missing-title", severity: "warning", title: "Add a document title", detail: "A descriptive title makes the exported document easier to identify." });
  }

  let headingCount = 0;
  let previousHeadingLevel = 0;
  let wordCount = 0;
  let linkCount = 0;
  const knownTitles = new Set(documents.filter((item) => !item.trashed).flatMap((item) => [item.id.toLowerCase(), item.title.toLowerCase(), item.slug?.toLowerCase()].filter(Boolean) as string[]));

  for (const block of document.blocks) {
    const words = block.text.trim().split(/\s+/).filter(Boolean);
    wordCount += words.length;
    const headingMatch = block.type === "heading" || headingPattern.test(block.text.trim());
    if (headingMatch) {
      headingCount += 1;
      const level = block.level ?? Math.min((block.text.match(/^#+/)?.[0].length ?? 1), 6);
      if (previousHeadingLevel && level > previousHeadingLevel + 1) {
        issues.push({ id: `heading-jump-${block.id}`, severity: "warning", title: "Heading hierarchy jumps", detail: `Heading level ${level} follows level ${previousHeadingLevel}. Consider adding the missing section level.`, blockId: block.id });
      }
      if (!block.text.replace(/^#+\s*/, "").trim()) {
        issues.push({ id: `empty-heading-${block.id}`, severity: "warning", title: "Empty heading", detail: "Give this section a title or remove the heading before exporting.", blockId: block.id });
      }
      previousHeadingLevel = level;
    }

    if (block.type === "table") {
      const widestRow = Math.max(...block.text.split("\n").map((row) => row.split("|").map((cell) => cell.trim()).join(" ").length), 0);
      if (widestRow > 110 || block.text.split("\n").some((row) => row.split("|").length > 7)) {
        issues.push({ id: `table-overflow-${block.id}`, severity: "warning", title: "Table may overflow the page", detail: "Consider shortening cells, reducing columns, or using a wider page layout.", blockId: block.id });
      }
    }

    let linkMatch: RegExpExecArray | null;
    documentLinkPattern.lastIndex = 0;
    while ((linkMatch = documentLinkPattern.exec(block.text)) !== null) {
      linkCount += 1;
      const target = linkMatch[1].trim().toLowerCase();
      if (!knownTitles.has(target)) issues.push({ id: `unresolved-link-${block.id}-${linkMatch.index}`, severity: "warning", title: "Unresolved document link", detail: `“${linkMatch[1].trim()}” does not match a document in this workspace.`, blockId: block.id });
    }
  }

  if (wordCount === 0) issues.push({ id: "empty-document", severity: "info", title: "Document is empty", detail: "Add writing before exporting or sharing this document." });
  return { ready: !issues.some((issue) => issue.severity === "error"), issues, wordCount, headingCount, linkCount };
}
