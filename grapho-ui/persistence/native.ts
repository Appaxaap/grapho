import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import type { GraphoStoragePayload } from "./storage";
import type { DocumentItem } from "../domain/model";

export function isNativePersistenceAvailable() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function loadNativeWorkspace(): Promise<GraphoStoragePayload | null> {
  const raw = await invoke<string | null>("load_native_workspace");
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as GraphoStoragePayload;
    return value.version === 1 && Array.isArray(value.documents) ? value : null;
  } catch {
    return null;
  }
}

export async function saveNativeWorkspace(payload: GraphoStoragePayload) {
  await invoke("save_native_workspace", { payload: JSON.stringify(payload) });
}

export async function exportNativePdf(document: DocumentItem, options: { font?: "Sans" | "Mono" | "Serif" } = {}) {
  const path = await save({
    defaultPath: `${document.title || "grapho-document"}.pdf`,
    filters: [{ name: "PDF document", extensions: ["pdf"] }],
  });
  if (!path) return false;
  await invoke("export_pdf", { path, document: { ...document, font: options.font ?? "Sans" } });
  return true;
}
