"use client";

import { History, Loader2, RotateCcw, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn, formatDateTime, truncate } from "@/lib/utils";
import { deriveTitle } from "@/lib/markdown";

export function HistoryPanel() {
  const {
    historyOpen,
    setHistoryOpen,
    versions,
    versionsLoading,
    activeNote,
    restoreVersion,
  } = useStore();

  if (!historyOpen) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="animate-fade absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={() => setHistoryOpen(false)}
      />
      <div className="animate-slide-left absolute inset-y-0 right-0 flex w-80 flex-col border-l border-border bg-panel-solid shadow-(--shadow)">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <History className="size-4 text-faint" />
            <h2 className="text-[13px] font-semibold tracking-tight">Version History</h2>
          </div>
          <button
            onClick={() => setHistoryOpen(false)}
            className="rounded-[10px] p-1.5 text-muted transition-colors hover:bg-control hover:text-foreground"
            aria-label="Close history"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {activeNote && (
            <p className="mb-3 truncate px-1 text-[10px] text-faint">
              <span className="font-medium text-foreground/70">Current:</span>{" "}
              {activeNote.title || "Untitled"}
            </p>
          )}

          {versionsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted" />
            </div>
          ) : !versions || versions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-center text-[10px] leading-relaxed text-muted">
              No versions yet.
              <span className="mt-1 block">
                Start writing — every change is captured automatically.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((v, i) => (
                <div
                  key={v.id}
                  className={cn(
                    "group rounded-xl border border-border bg-panel-solid p-3 transition-colors hover:border-accent/40",
                    i === 0 && "border-accent/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[9px] font-semibold",
                        i === 0 ? "bg-accent-soft text-accent" : "bg-control text-muted"
                      )}
                    >
                      v{v.version}
                      {i === 0 && " · current"}
                    </span>
                    <button
                      onClick={() => void restoreVersion(v.pageId, v.id)}
                      className="flex items-center gap-1 rounded-[10px] px-2 py-1 text-[10px] font-medium text-muted opacity-0 transition-all hover:bg-control hover:text-foreground group-hover:opacity-100"
                      title="Restore this version"
                    >
                      <RotateCcw className="size-3" />
                      Restore
                    </button>
                  </div>
                  <p className="mt-1.5 truncate text-[12px] font-medium">
                    {v.title || "Untitled"}
                  </p>
                  <p className="truncate text-[10px] text-muted">
                    {truncate(deriveTitle(v.content), 60) || "Empty"}
                  </p>
                  <p className="mt-1 text-[9px] tabular-nums text-faint">
                    {formatDateTime(v.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
