"use client";

import { useEffect, useState } from "react";
import type { BlockNoteEditor } from "@blocknote/core";
import {
  CircleCheck,
  Copy,
  Languages,
  Search,
  SpellCheck,
  Wand2,
  Zap,
} from "lucide-react";
import { truncate } from "@/lib/utils";

interface ContextMenuProps {
  editor: BlockNoteEditor | null;
  open: boolean;
  /** Position relative to the editor column (already clamped to its bounds). */
  x: number;
  y: number;
  /** The selected text (or current block text) the actions operate on. */
  text: string;
  onClose: () => void;
}

/**
 * The selection context menu — the reference's centerpiece. Opens on
 * right-click inside the document surface, floats over the lower-middle of
 * the document, and offers selection actions. Fully offline: translate and
 * copy put the selection on the clipboard; search opens Google; the AI
 * rewrites are honest placeholders (no network on device).
 */
export function ContextMenu({ editor, open, x, y, text, onClose }: ContextMenuProps) {
  /* Transient status line under the menu (auto-dismisses). */
  const [notice, setNotice] = useState<{ msg: string; id: number } | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 1800);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotice(null);
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const flash = (msg: string) => setNotice({ msg, id: Date.now() });

  const copySelection = async (): Promise<boolean> => {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Clipboard API can be unavailable (permissions); fall back silently.
      return false;
    }
  };

  if (!open || !editor) return null;

  const actions: {
    icon: React.ElementType;
    label: string;
    badge?: string;
    onClick: () => void;
  }[] = [
    {
      icon: Languages,
      label: "Translate it",
      onClick: () => {
        void copySelection().then((ok) => flash(ok ? "Copied — paste into any translator" : "Nothing to copy"));
      },
    },
    {
      icon: Copy,
      label: "Copy the text",
      onClick: () => {
        void copySelection().then((ok) => flash(ok ? "Copied to clipboard" : "Nothing to copy"));
      },
    },
    {
      icon: Search,
      label: `Search Google for “${truncate(text, 24) || "…"}”`,
      onClick: () => {
        if (!text) return flash("Select some text first");
        window.open(`https://www.google.com/search?q=${encodeURIComponent(text)}`, "_blank");
      },
    },
  ];

  const aiActions: { icon: React.ElementType; label: string }[] = [
    { icon: Wand2, label: "Rewrite" },
    { icon: SpellCheck, label: "Fix Grammer" },
    { icon: CircleCheck, label: "Rewrite in Positive tone" },
    { icon: Zap, label: "Make it punchier" },
  ];

  const row =
    "flex h-7 w-full items-center gap-2.5 rounded-[7px] px-2 text-left text-[11px] text-muted transition-colors hover:bg-control hover:text-foreground";

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={() => { setNotice(null); onClose(); }} aria-hidden />
      <div
        role="menu"
        aria-label="Selection actions"
        className="animate-menu absolute z-30 w-[230px] rounded-[11px] border border-border bg-panel-solid p-1.5 shadow-(--shadow)"
        style={{ left: x, top: y }}
      >
        <div className="px-2 pb-1 pt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-faint">
          Actions
        </div>

        <div className="space-y-px">
          {actions.map((a) => (
            <button key={a.label} role="menuitem" onClick={a.onClick} className={row}>
              <a.icon className="size-3.5 shrink-0 text-faint" />
              <span className="truncate">{a.label}</span>
            </button>
          ))}
        </div>

        <div className="mx-2 my-1.5 h-px bg-border" />

        <div className="space-y-px">
          {aiActions.map((a, i) => (
            <button
              key={a.label}
              role="menuitem"
              onClick={() => flash("AI rewriting is offline — coming soon")}
              className={row}
            >
              <a.icon className="size-3.5 shrink-0 text-faint" />
              <span className="truncate">{a.label}</span>
              {i === 0 && (
                <span className="ml-auto shrink-0 rounded bg-accent-soft px-1 py-px text-[8px] font-semibold text-accent">
                  AI
                </span>
              )}
            </button>
          ))}
        </div>

        {notice && (
          <div className="mt-1 border-t border-border px-2 pb-0.5 pt-1.5 text-[9px] text-faint">
            {notice.msg}
          </div>
        )}
      </div>
    </>
  );
}
