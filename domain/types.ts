export type ID = string;

export type WorkspaceSection =
  | "home"
  | "recent"
  | "favorites"
  | "all-documents"
  | "folders"
  | "trash";

export type DocumentStatus = "draft" | "active" | "archived" | "trashed";

export type BlockType =
  | "paragraph"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "heading-4"
  | "bullet-list"
  | "numbered-list"
  | "checklist"
  | "quote"
  | "callout"
  | "divider"
  | "code"
  | "table"
  | "image"
  | "link";

export interface Workspace {
  id: ID;
  name: string;
  rootFolderId: ID | null;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: ID;
  workspaceId: ID;
  parentFolderId: ID | null;
  name: string;
  order: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentBlock {
  id: ID;
  type: BlockType;
  content: string;
  attributes: Record<string, unknown>;
  order: number;
  parentBlockId: ID | null;
}

export interface Document {
  id: ID;
  workspaceId: ID;
  folderId: ID | null;
  title: string;
  status: DocumentStatus;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  blocks: DocumentBlock[];
}

export interface Asset {
  id: ID;
  workspaceId: ID;
  documentId: ID | null;
  kind: "image" | "file";
  name: string;
  mimeType: string;
  path: string;
  createdAt: string;
}

export interface Revision {
  id: ID;
  documentId: ID;
  label: string;
  createdAt: string;
}

export interface DocumentTreeNode {
  folder: Folder;
  folders: DocumentTreeNode[];
  documents: Document[];
}

export interface WorkspaceSnapshot {
  workspace: Workspace;
  folders: Folder[];
  documents: Document[];
  assets: Asset[];
  revisions: Revision[];
}
