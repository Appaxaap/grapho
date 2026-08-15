import type { Document, Folder, Workspace } from "@/domain/types";

export interface WorkspaceRepository {
  getCurrentWorkspace(): Promise<Workspace | null>;
  saveWorkspace(workspace: Workspace): Promise<void>;
}

export interface FolderRepository {
  listFolders(workspaceId: string): Promise<Folder[]>;
  saveFolder(folder: Folder): Promise<void>;
}

export interface DocumentRepository {
  listDocuments(workspaceId: string): Promise<Document[]>;
  saveDocument(document: Document): Promise<void>;
}
