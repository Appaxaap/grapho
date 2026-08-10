"use client";

import { FilePlus2, Import } from "lucide-react";
import { useStore } from "@/lib/store";

/**
 * Quiet empty state — a centered wordmark and two quiet actions. Nothing
 * shouts; the canvas stays calm until you write.
 */
export function WelcomeScreen() {
  const { createNote, setImportOpen } = useStore();

  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <span className="brand-mark mb-5" aria-hidden>G</span>
      <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-foreground">Grapho</h1>
      <p className="mt-2 text-[13px] text-muted">Write freely.</p>

      <div className="mt-7 flex items-center gap-2">
        <button onClick={() => createNote()} className="primary-btn">
          <FilePlus2 size={14} strokeWidth={1.9} />
          New note
        </button>
        <button onClick={() => setImportOpen(true)} className="chip-btn">
          <Import size={14} strokeWidth={1.9} />
          Import
        </button>
      </div>

      <p className="mt-5 text-[11px] text-faint">
        Start a new note, or import text from ChatGPT and Grapho formats it automatically.
      </p>
    </div>
  );
}
