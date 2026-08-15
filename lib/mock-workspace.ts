import type { Document, Folder, Workspace } from "@/domain/types";

export type WorkspaceSectionKey =
  | "home"
  | "recent"
  | "favorites"
  | "all-documents"
  | "folders"
  | "trash";

export type FolderNode = Folder & {
  children: FolderNode[];
};

export type WorkspaceState = {
  workspace: Workspace;
  folders: Folder[];
  documents: Document[];
  rootFolders: FolderNode[];
};

export const workspaceSections: Array<{
  key: WorkspaceSectionKey;
  label: string;
}> = [
  { key: "home", label: "Home" },
  { key: "recent", label: "Recent" },
  { key: "favorites", label: "Favorites" },
  { key: "all-documents", label: "All Documents" },
  { key: "trash", label: "Trash" },
];

const now = new Date().toISOString();

const workspace: Workspace = {
  id: "workspace_grapho",
  name: "Grapho",
  rootFolderId: "folder_work",
  createdAt: now,
  updatedAt: now,
};

const folders: Folder[] = [
  {
    id: "folder_work",
    workspaceId: workspace.id,
    parentFolderId: null,
    name: "Work",
    order: 0,
    isFavorite: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "folder_codecx",
    workspaceId: workspace.id,
    parentFolderId: "folder_work",
    name: "Codecx",
    order: 0,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "folder_products",
    workspaceId: workspace.id,
    parentFolderId: "folder_codecx",
    name: "Products",
    order: 0,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "folder_personal",
    workspaceId: workspace.id,
    parentFolderId: null,
    name: "Personal",
    order: 1,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  },
];

const documents: Document[] = [
  {
    id: "doc_grapho_spec",
    workspaceId: workspace.id,
    folderId: "folder_products",
    title: "Product Specification",
    status: "active",
    isFavorite: true,
    createdAt: now,
    updatedAt: now,
    blocks: [],
  },
  {
    id: "doc_architecture",
    workspaceId: workspace.id,
    folderId: "folder_products",
    title: "Architecture Document",
    status: "draft",
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
    blocks: [],
  },
  {
    id: "doc_meeting_notes",
    workspaceId: workspace.id,
    folderId: "folder_personal",
    title: "Meeting Notes",
    status: "draft",
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
    blocks: [],
  },
  {
    id: "doc_research",
    workspaceId: workspace.id,
    folderId: null,
    title: "Research Notes",
    status: "archived",
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
    blocks: [],
  },
];

function buildFolderTree(parentFolderId: string | null): FolderNode[] {
  return folders
    .filter((folder) => folder.parentFolderId === parentFolderId)
    .sort((left, right) => left.order - right.order)
    .map((folder) => ({
      ...folder,
      children: buildFolderTree(folder.id),
    }));
}

export const workspaceState: WorkspaceState = {
  workspace,
  folders,
  documents,
  rootFolders: buildFolderTree(null),
};
