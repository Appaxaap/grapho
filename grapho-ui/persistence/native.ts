import { invoke } from "@tauri-apps/api/core";
import type { GraphoStoragePayload } from "./storage";

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
