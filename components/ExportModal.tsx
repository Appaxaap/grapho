"use client";

import { useState } from "react";
import { Check, FileDown, Loader2 } from "lucide-react";
import { Modal } from "./Modal";
import { useStore } from "@/lib/store";
import { cn, downloadBlob, safeFilename } from "@/lib/utils";
import {
  MARGIN_PRESETS,
  ORIENTATIONS,
  PAGE_SIZES,
  TEMPLATES,
} from "@/lib/constants";
import { blocksToMarkdown, deriveTitle } from "@/lib/markdown";
import { renderNoteToPdfBlob } from "@/lib/pdf";

function Option<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-faint">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-[14px] border border-border bg-control px-3 py-2 text-[12px] outline-none transition-all focus:border-accent/45 focus:bg-panel-solid focus:ring-4 focus:ring-accent-soft"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ExportModal() {
  const { exportOpen, setExportOpen, activeNote, settings, setSettings } = useStore();
  const [busy, setBusy] = useState<"pdf" | "md" | null>(null);
  const [done, setDone] = useState(false);
  const exp = settings.export;

  const update = (patch: Partial<typeof exp>) =>
    setSettings({ export: { ...exp, ...patch } });

  const exportPdf = async () => {
    if (!activeNote) return;
    setBusy("pdf");
    try {
      const blob = await renderNoteToPdfBlob(activeNote, settings.export);
      downloadBlob(blob, `${safeFilename(activeNote.title)}.pdf`);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } finally {
      setBusy(null);
    }
  };

  const exportMarkdown = () => {
    if (!activeNote) return;
    const md = blocksToMarkdown(activeNote.content);
    downloadBlob(new Blob([md], { type: "text/markdown" }), `${safeFilename(activeNote.title)}.md`);
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  };

  const margin = MARGIN_PRESETS.find((m) => m.id === exp.margins)?.points ?? 72;
  const template = TEMPLATES.find((t) => t.id === exp.template) ?? TEMPLATES[0];
  const previewTitle = activeNote ? activeNote.title : "Untitled";
  const previewSnippet = activeNote ? deriveTitle(activeNote.content) : "";

  return (
    <Modal
      open={exportOpen}
      onClose={() => setExportOpen(false)}
      title="Export"
      description="Turn this note into a shareable document."
      width="max-w-2xl"
    >
      {!activeNote ? (
        <div className="px-5 pb-5 text-sm text-muted">
          Open a note first — there is nothing to export yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 px-5 pb-5 md:grid-cols-[1fr_220px]">
          {/* Settings */}
          <div className="space-y-3">
            <Option
              label="Page Size"
              value={exp.pageSize}
              options={PAGE_SIZES}
              onChange={(pageSize) => update({ pageSize })}
            />
            <Option
              label="Orientation"
              value={exp.orientation}
              options={ORIENTATIONS}
              onChange={(orientation) => update({ orientation })}
            />
            <Option
              label="Margins"
              value={exp.margins}
              options={MARGIN_PRESETS.map((m) => ({ id: m.id, label: `${m.label} (${m.points}pt)` }))}
              onChange={(margins) => update({ margins })}
            />
            <Option
              label="Template"
              value={exp.template}
              options={TEMPLATES}
              onChange={(template) => update({ template })}
            />

            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-[11px] text-muted">
                <input
                  type="checkbox"
                  checked={exp.header}
                  onChange={(e) => update({ header: e.target.checked })}
                  className="size-4 accent-accent"
                />
                Header
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-[11px] text-muted">
                <input
                  type="checkbox"
                  checked={exp.footer}
                  onChange={(e) => update({ footer: e.target.checked })}
                  className="size-4 accent-accent"
                />
                Footer
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => void exportPdf()}
                disabled={busy !== null}
                className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-[12px] font-semibold text-background shadow-sm transition-all hover:opacity-85 active:scale-[0.97] disabled:opacity-60"
              >
                {busy === "pdf" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : done ? (
                  <Check className="size-4" />
                ) : (
                  <FileDown className="size-4" />
                )}
                {busy === "pdf" ? "Exporting…" : done ? "Downloaded" : "Export PDF"}
              </button>
              <button
                onClick={exportMarkdown}
                disabled={busy !== null}
                className="rounded-xl border border-border bg-panel-solid px-4 py-2.5 text-[12px] font-medium transition-colors hover:bg-control disabled:opacity-60"
              >
                Export Markdown
              </button>
            </div>
            <p className="text-[10px] text-faint">
              PDFs render fully offline — no network needed. Everything is generated on your
              device.
            </p>
          </div>

          {/* Live preview */}
          <div className="flex flex-col">
            <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.14em] text-faint">
              Preview · {template.label}
            </span>
            <div
              className="flex-1 overflow-hidden rounded-lg border border-border bg-white text-stone-900 shadow-inner"
              style={{ padding: `${Math.round(margin / 6)}px` }}
            >
              <div
                className={cn(
                  "h-full overflow-hidden rounded-sm",
                  exp.template === "academic"
                    ? "font-serif"
                    : "font-[ui-sans-serif,system-ui,sans-serif]"
                )}
              >
                {exp.header && (
                  <div className="mb-2 flex items-center justify-between border-b-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                    <span className="truncate">{previewTitle}</span>
                    <span className="shrink-0 text-stone-400">Today</span>
                  </div>
                )}
                <div className="space-y-1.5 text-[11px] leading-relaxed">
                  <div className="text-base font-bold">{previewTitle || "Untitled"}</div>
                  <div className="h-1.5 w-11/12 rounded bg-stone-200" />
                  <div className="h-1.5 w-full rounded bg-stone-200" />
                  <div className="h-1.5 w-10/12 rounded bg-stone-200" />
                  {previewSnippet && (
                    <p className="pt-1 text-stone-500 italic">
                      “{previewSnippet.slice(0, 60)}…”
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
