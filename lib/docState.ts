"use client";

import { useSyncExternalStore } from "react";

/**
 * Document-level typography state shared between the Inspector (which cycles
 * the values) and the EditorView (which applies them as CSS variables on the
 * document surface). Kept outside the settings store because these are
 * per-session, in-editor tweaks rather than persisted preferences.
 */

export const DOC_SIZE_STEPS = [1, 1.12, 1.24] as const;
export const DOC_SIZE_LABELS = ["Small", "Normal", "Large"] as const;

export const DOC_SPACING_STEPS = [1.6, 1.85, 2.1] as const;
export const DOC_SPACING_LABELS = ["Compact", "Normal", "Airy"] as const;

let sizeIndex = 1; // "Normal"
let spacingIndex = 1; // "Normal"

const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Single number snapshot so useSyncExternalStore only re-renders on change. */
function snapshot(): number {
  return sizeIndex * 100 + spacingIndex;
}

export function getDocSize(): number {
  return DOC_SIZE_STEPS[sizeIndex];
}

export function getDocSpacing(): number {
  return DOC_SPACING_STEPS[spacingIndex];
}

export function cycleDocSize(): void {
  sizeIndex = (sizeIndex + 1) % DOC_SIZE_STEPS.length;
  emit();
}

export function cycleDocSpacing(): void {
  spacingIndex = (spacingIndex + 1) % DOC_SPACING_STEPS.length;
  emit();
}

export interface DocState {
  size: number;
  spacing: number;
  sizeLabel: string;
  spacingLabel: string;
}

export function useDocState(): DocState {
  useSyncExternalStore(subscribe, snapshot, snapshot);
  return {
    size: getDocSize(),
    spacing: getDocSpacing(),
    sizeLabel: DOC_SIZE_LABELS[sizeIndex],
    spacingLabel: DOC_SPACING_LABELS[spacingIndex],
  };
}
