export type BlockType = "paragraph" | "heading" | "quote" | "list" | "ordered-list" | "callout" | "table" | "code" | "divider";

export type Block = {
  id: string;
  type: BlockType;
  text: string;
};

export type DocumentItem = {
  id: string;
  title: string;
  folder: string;
  updated: string;
  blocks: Block[];
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
