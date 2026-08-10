"use client";

import { useState } from "react";
import { Import, Loader2 } from "lucide-react";
import { Modal } from "./Modal";
import { useStore } from "@/lib/store";
import { deriveTitle, markdownToBlocks } from "@/lib/markdown";

export function ImportModal() {
  const { importOpen, setImportOpen, createNote } = useStore();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => {
    setImportOpen(false);
    setText("");
  };

  const doImport = () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    // Yield so the button state paints before parsing.
    setTimeout(() => {
      const blocks = markdownToBlocks(text);
      const title = deriveTitle(blocks) || "Imported note";
      createNote(blocks, title);
      setBusy(false);
      close();
    }, 30);
  };

  return (
    <Modal
      open={importOpen}
      onClose={close}
      title="Import from ChatGPT"
      description="Paste anything — headings, bullets, bold text are converted automatically."
      width="max-w-xl"
    >
      <div className="px-5 pb-5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") doImport();
          }}
          placeholder={
            "Paste your text here…\n\n# Heading\n- bullet point\n**bold** and *italic* text\n1. numbered items\n> quotes\n\n(Cmd/Ctrl + Enter to import)"
          }
          autoFocus
          className="h-52 w-full resize-none rounded-[14px] border border-border bg-control p-3.5 text-[12px] leading-relaxed outline-none transition-all placeholder:text-faint focus:border-accent/45 focus:bg-panel-solid focus:ring-4 focus:ring-accent-soft"
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[10px] text-faint">
            Markdown like <code className="rounded bg-control px-1">#</code>,{" "}
            <code className="rounded bg-control px-1">-</code>,{" "}
            <code className="rounded bg-control px-1">**bold**</code> is converted as you import.
          </p>
          <button
            onClick={doImport}
            disabled={!text.trim() || busy}
            className="flex items-center gap-2 rounded-[12px] bg-foreground px-4 py-2 text-[12px] font-semibold text-background shadow-sm transition-all hover:opacity-85 active:scale-[0.97] disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Import className="size-4" />}
            Import
          </button>
        </div>
      </div>
    </Modal>
  );
}
