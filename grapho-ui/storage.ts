import type { DocumentItem } from "./components/GraphoShell";

export const GRAPHO_STORAGE_KEY = "grapho.workspace.v1";
export const GRAPHO_STORAGE_VERSION = 1;

export type GraphoStoragePayload = {
  version: number;
  documents: DocumentItem[];
  selectedId: string;
  activeFolder: string;
};

function isDocument(value: unknown): value is DocumentItem {
  if (!value || typeof value !== "object") return false;
  const document = value as Record<string, unknown>;
  return typeof document.id === "string" && typeof document.title === "string" && typeof document.folder === "string" && Array.isArray(document.blocks);
}

export function loadGraphoStorage(): GraphoStoragePayload | null {
  try {
    const raw = window.localStorage.getItem(GRAPHO_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<GraphoStoragePayload>;
    if (value.version !== GRAPHO_STORAGE_VERSION || !Array.isArray(value.documents) || !value.documents.every(isDocument) || typeof value.selectedId !== "string" || typeof value.activeFolder !== "string") return null;
    return value as GraphoStoragePayload;
  } catch {
    return null;
  }
}

export function saveGraphoStorage(payload: GraphoStoragePayload) {
  window.localStorage.setItem(GRAPHO_STORAGE_KEY, JSON.stringify(payload));
}

export function clearGraphoStorage() {
  window.localStorage.removeItem(GRAPHO_STORAGE_KEY);
}
