"use client";

import { useStore } from "@/lib/store";
import { APP_TAGLINE } from "@/lib/constants";

/**
 * Quiet empty state — shown only when no note is active (e.g. everything is
 * in the trash). Understated per the reference: no hero, no big buttons.
 */
export function WelcomeScreen() {
  const { createNote, setImportOpen } = useStore();

  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <h1 className="text-[15px] font-medium tracking-tight text-foreground">Grapho</h1>
      <p className="mt-2 max-w-[240px] text-[11px] leading-relaxed text-muted">{APP_TAGLINE}</p>
      <p className="mt-6 text-[10px] leading-relaxed text-faint">
        Start a new note, or import text from ChatGPT
        <br />
        and Grapho will format it automatically.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => createNote()}
          className="text-[11px] text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          New note
        </button>
        <span className="text-faint" aria-hidden>
          ·
        </span>
        <button
          onClick={() => setImportOpen(true)}
          className="text-[11px] text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Import
        </button>
      </div>
    </div>
  );
}
