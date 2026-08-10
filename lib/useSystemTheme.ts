"use client";

import { useSyncExternalStore } from "react";
import type { ThemeMode } from "./types";

const QUERY = "(prefers-color-scheme: dark)";

function subscribe(callback: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

/** True when the OS prefers dark. SSR-safe (returns false on the server). */
export function useSystemDark(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/**
 * Resolve the effective theme ("light" | "dark") from the user's preference
 * and the OS setting. SSR-safe: defaults to "dark" until mounted.
 */
export function resolveTheme(mode: ThemeMode, systemDark: boolean): "light" | "dark" {
  if (mode === "system") return systemDark ? "dark" : "light";
  return mode;
}
