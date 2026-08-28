export type BlockType =
  | "paragraph"
  | "heading"
  | "quote"
  | "list"
  | "ordered-list"
  | "todo"
  | "toggle"
  | "callout"
  | "table"
  | "code"
  | "divider"
  | "page-break";

export type TextMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "underline" }
  | { type: "strike" }
  | { type: "code" }
  | { type: "highlight"; color?: string }
  | { type: "link"; href: string; documentId?: string; blockId?: string };

export type InlineText = {
  text: string;
  marks?: TextMark[];
};

/**
 * Blocks intentionally remain flat in storage. `parentId` gives us a stable,
 * cycle-safe hierarchy without coupling persistence to a recursive React tree.
 * `text` remains supported while the rich-text editor is migrated incrementally.
 */
export type Block = {
  id: string;
  type: BlockType;
  text: string;
  content?: InlineText[];
  parentId?: string | null;
  position?: string;
  checked?: boolean;
  collapsed?: boolean;
  level?: number;
};

export type DocumentType = "generic" | "account-register" | "project-brief" | "meeting-notes" | "research-brief" | "checklist";
export type DocumentTypeConfidence = "low" | "medium" | "high";
export type RecognizedField = { key: string; label: string; value: string; blockId: string; confidence: DocumentTypeConfidence };
export type DocumentIntelligenceIssue = { id: string; category: "completeness" | "consistency"; severity: "info" | "warning" | "error"; title: string; detail: string; blockId?: string; fieldKey?: string };
export type DocumentIntelligenceResult = { version: 1; documentId: string; type: DocumentType; typeConfidence: DocumentTypeConfidence; recognizedFields: RecognizedField[]; completeness: { complete: boolean; score: number; missingFields: string[] }; issues: DocumentIntelligenceIssue[]; suggestedView: "document" | "account-register" | "table" | "checklist" | "outline" };

export type DocumentItem = {
  id: string;
  title: string;
  folder: string;
  parentDocumentId?: string | null;
  updated: string;
  blocks: Block[];
  slug?: string;
  aliases?: string[];
  createdAt?: string;
  updatedAt?: string;
  trashed?: boolean;
  deletedAt?: string;
};

export const WORKSPACE_FOLDERS = ["Projects", "Personal", "Archive"] as const;

export const initialDocuments: DocumentItem[] = [
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
